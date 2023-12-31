import React, { useContext, useMemo, useRef, useState } from "react";
import Pixel from "./Pixel";
import Modal from "./paint_box";
import SignInPrompt from "./sign_in_prompt";
// import { BigNumber } from "ethers";
import { useAccount } from "wagmi";
import { AuthContext } from "~~/components/copix/AuthContext";
import { useCopixPixelUpdateEventSubscriber } from "~~/hooks/copix/useCopixContract";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { CONTRACT_NAME, Humanity } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";

interface PixelXY {
  x: number;
  y: number;
}

// interface OnChainPixelData {
//   x: BigNumber;
//   y: BigNumber;
//   data: string;
// }

interface PixelMetadata {
  name?: string;
  color: string;
  lastEditedByHuman?: Humanity;
  timestamp?: Date;
}

// interface PixelData extends PixelMetadata {
//   position: PixelXY;
// }

// function convertToDisplayData(onChainPixel: OnChainPixelData): PixelData {
//   const data: any = JSON.parse(onChainPixel.data);
//   return {
//     position: { x: onChainPixel.x.toNumber(), y: onChainPixel.y.toNumber() },
//     name: data.name,
//     color: data.color,
//     lastEditedByHuman: data.lastEditedByHuman,
//     timestamp: new Date(data.timestamp * 1000),
//   };
// }

function createArrayFromCanvasState(canvasState: string[], cols: number, rows: number): PixelMetadata[][] {
  const arr: PixelMetadata[][] = [];
  let index = 0;
  for (let i = 0; i < rows; i++) {
    const row: PixelMetadata[] = [];
    for (let j = 0; j < cols; j++) {
      // const data = convertToDisplayData(canvasState[index]);
      const data = { color: canvasState[index] };
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

  function listener(painter: string, x: number, y: number, newColor: string, timestamp: Date, editedByHuman: Humanity) {
    notification.info(painter + " just painted!");
    console.log(painter, x, y, newColor, timestamp, editedByHuman);
  }

  useCopixPixelUpdateEventSubscriber({
    listener,
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
    const result = createArrayFromCanvasState(canvasState as string[], width.toNumber(), height.toNumber());
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
      <div className="h-full bg-transparent overflow-hidden font-lato select-none flex my-7 items-center justify-center flex flex-col">
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
        {/* width: {width?.toNumber()}, height: {height?.toNumber()} */}
        <ul className="flex items-center justify-center space-x-2 mt-4 text-base-content">
          <li className="flex items-center space-x-2 text-sm bg-primary rounded-md py-2 px-3">
            <span>Reactions</span>
            <span className="block uppercase font-medium text-xs rounded border border-gray-300 px-1">E</span>
          </li>

          <li className="flex items-center space-x-2 text-sm bg-primary rounded-md py-2 px-3">
            <span>Chat</span>
            <span className="block uppercase font-medium text-xs rounded border border-gray-300 px-1">/</span>
          </li>

          <li className="flex items-center space-x-2 text-sm bg-primary rounded-md py-2 px-3 ">
            <span>Escape</span>
            <span className="block uppercase font-medium text-xs  rounded border border-gray-300 px-1">esc</span>
          </li>
        </ul>
      </div>
    </>
  );
};

export default CanvasComponent;
