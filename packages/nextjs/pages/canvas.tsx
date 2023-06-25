import React, { useContext, useMemo, useRef, useState } from "react";
import Pixel from "./Pixel";
import Modal from "./paint_box";
import SignInPrompt from "./sign_in_prompt";
import { useAccount } from "wagmi";
import { AuthContext } from "~~/components/copix/AuthContext";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { CONTRACT_NAME } from "~~/utils/constants";

interface PixelMetadata {
  color: string;
}

interface PixelXY {
  x: number;
  y: number;
}

function create2DArray(cols: number, rows: number): PixelMetadata[][] {
  const arr: PixelMetadata[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: PixelMetadata[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({ color: "#ffffff" });
    }

    arr.push(row);
  }
  return arr;
}

const CanvasComponent = (): JSX.Element => {
  const [showModal, setShowModal] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState<PixelXY | object>({});
  const { currentUser } = useContext(AuthContext);
  const [color, setColor] = useState<string>("#ffffff");
  const { address } = useAccount();
  const { data: width, isLoading: loadingWidth } = useScaffoldContractRead({
    contractName: CONTRACT_NAME,
    functionName: "canvasWidth",
  });
  const { data: height, isLoading: loadingHeight } = useScaffoldContractRead({
    contractName: CONTRACT_NAME,
    functionName: "canvasHeight",
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  // const isDownRef = useRef(false);
  // const zoomedRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pixelSize, setPixelSize] = useState(32);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [grid, setGrid] = useState<{ [key: string]: PixelMetadata }>({
    // Prepopulated pixel data as an example
    "5:5": { color: "#ff0000" },
    "10:7": { color: "#00ff00" },
    // Add more pixels as needed
  });

  /**
   * actual array of pixels to render reading from grid
   */
  const canvasGrid = useMemo(() => {
    if (!width || !height) {
      return [];
    }
    const result = create2DArray(width.toNumber(), height.toNumber());
    for (const pos in grid) {
      const [x, y] = pos.split(":").map(Number);
      result[y][x] = grid[pos];
    }
    return result;
  }, [grid, width, height]);

  function onPixelClicked(x: number, y: number) {
    if (!currentUser || !address) {
      setShowSignIn(true);
    } else {
      setShowModal(true);
      setSelectedPixel({ x, y });
      setColor(canvasGrid[y][x].color);
    }
    console.log("x:", x);
    console.log("y:", y);
    // TODO: show modal for color selection + paint button
  }

  function closeModal() {
    setShowModal(false);
  }

  function closeSignIn() {
    setShowSignIn(false);
  }

  return (
    <>
      <Modal {...selectedPixel} showModal={showModal} closeModal={closeModal} color={color} setColor={setColor} />
      <SignInPrompt showSignIn={showSignIn} closeSignIn={closeSignIn} />
      <div className="h-full bg-gray-300 overflow-hidden font-lato select-none flex items-center justify-center">
        {loadingWidth || loadingHeight || !height || !width ? (
          <div>Loading...</div>
        ) : (
          <div
            id="canvas"
            ref={canvasRef}
            className={"grid"}
            style={{
              gridTemplateColumns: `repeat(${width.toNumber()},${pixelSize}px)`,
              gridTemplateRows: `repeat(${height.toNumber()},${pixelSize}px)`,
              border: "1px solid black",
            }}
          >
            {canvasGrid.map((col, y) => {
              return col.map((pixel, x) => (
                <Pixel key={`${y}:${x}`} color={pixel.color} onClick={onPixelClicked.bind(null, x, y)} />
              ));
            })}
          </div>
        )}

        <div className="controls absolute left-0 right-0 bottom-0 bg-gray-800 p-0 flex items-center justify-between overflow-hidden">
          <div className="face-space w-16">{/* width: {width?.toNumber()}, height: {height?.toNumber()} */}</div>
        </div>
      </div>
    </>
  );
};

export default CanvasComponent;
