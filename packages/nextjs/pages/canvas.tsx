import React, { useContext, useMemo, useRef, useState } from "react";
import Pixel from "./Pixel";
import Modal from "./paint_box";
import SignInPrompt from "./sign_in_prompt";
import { BigNumber } from "ethers";
import { useAccount } from "wagmi";
import { AuthContext } from "~~/components/copix/AuthContext";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { CONTRACT_NAME, Humanity } from "~~/utils/constants";

interface PixelXY {
  x: number;
  y: number;
}

interface OnChainPixelData {
  x: BigNumber;
  y: BigNumber;
  data: string;
}

interface PixelMetadata {
  name?: string;
  color: string;
  lastEditedByHuman?: Humanity;
  timestamp?: Date;
}

interface PixelData extends PixelMetadata {
  position: PixelXY;
}

function convertToDisplayData(onChainPixel: OnChainPixelData): PixelData {
  const data: any = JSON.parse(onChainPixel.data);
  return {
    position: { x: onChainPixel.x.toNumber(), y: onChainPixel.y.toNumber() },
    name: data.name,
    color: data.color,
    lastEditedByHuman: data.lastEditedByHuman,
    timestamp: new Date(data.timestamp * 1000),
  };
}

function createArrayFromCanvasState(canvasState: OnChainPixelData[], cols: number, rows: number): PixelMetadata[][] {
  const arr: PixelMetadata[][] = [];
  let index = 0;
  for (let i = 0; i < rows; i++) {
    const row: PixelMetadata[] = [];
    for (let j = 0; j < cols; j++) {
      const data = convertToDisplayData(canvasState[index]);
      row.push(data);
      index++;
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

  const { data: canvasState, isLoading: loadingCanvasState } = useScaffoldContractRead({
    contractName: CONTRACT_NAME,
    functionName: "currentState",
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  // const isDownRef = useRef(false);
  // const zoomedRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pixelSize, setPixelSize] = useState(32);

  /**
   * actual array of pixels to render reading from grid
   */
  const canvasGrid = useMemo(() => {
    if (!width || !height || !canvasState) {
      return [];
    }
    const result = createArrayFromCanvasState(canvasState as OnChainPixelData[], width.toNumber(), height.toNumber());
    return result;
  }, [width, height, canvasState]);

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
      <div className="h-full bg-transparent overflow-hidden font-lato select-none flex my-7 items-center justify-center">
        {loadingWidth || loadingHeight || loadingCanvasState || !height || !width || !canvasState ? (
          <div>Loading...</div>
        ) : (
          <div
            id="canvas"
            ref={canvasRef}
            className={"grid"}
            style={{
              gridTemplateColumns: `repeat(${width.toNumber()},${pixelSize}px)`,
              gridTemplateRows: `repeat(${height.toNumber()},${pixelSize}px)`,
              border: "1px solid #ccc",
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
