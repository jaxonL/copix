import React, { useMemo, useRef, useState } from "react";
import Pixel from "./Pixel";

interface PixelMetadata {
  color: string;
}

function create2DArray(rows: number, cols: number): PixelMetadata[][] {
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

const width = 20;
const height = 25;

const CanvasComponent = (): JSX.Element => {
  const colors = [
    "white", // #ffffff
    // "rose-950",
    "gray-200", // #e4e4e4
    "gray-500", // #888888
    "gray-900", // #222222
    "pink-300", // #ffa7d1
    "red-600", // #e50000
    "yellow-600", // #e59500
    "yellow-700", // #a06a42
    "yellow-400", // #e5d900
    "lime-400", // #94e044
    "green-500", // #02be01
    "cyan-400", // #00d3dd
    "blue-500", // #0083c7
    "blue-700", // #0000ea
    "purple-400", // #cf6ee4
    "purple-700", // #820080
  ];

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

  const canvasGrid = useMemo(() => {
    const result = create2DArray(width, height);
    for (const pos in grid) {
      const [x, y] = pos.split(":").map(Number);
      result[y][x] = grid[pos];
    }
    return result;
  }, [grid]);

  function onPixelClicked(x: number, y: number) {
    console.log("x:", x);
    console.log("y:", y);
    // TODO: show modal for color selection + paint button
  }

  return (
    <div className="h-screen bg-gray-300 overflow-hidden font-lato select-none flex items-center justify-center">
      <div
        id="canvas"
        ref={canvasRef}
        className={"grid"}
        style={{
          gridTemplateColumns: `repeat(${height},${pixelSize}px)`,
          gridTemplateRows: `repeat(${width},${pixelSize}px)`,
        }}
      >
        {canvasGrid.map((row, y) => {
          return row.map((pixel, x) => (
            <Pixel key={`${x}:${y}`} color={pixel.color} onClick={onPixelClicked.bind(null, x, y)} />
          ));
        })}
      </div>

      <div className="controls absolute left-0 right-0 bottom-0 bg-gray-800 p-0 flex items-center justify-between overflow-hidden">
        <ul id="colors" className="m-0 p-2 flex-1 text-center transition-transform duration-500 ease-in-out relative">
          {colors.map(color => (
            <li key={color} id={`c-${color}`} className={`w-6 h-6 inline-block list-none m-0 bg-${color} mr-1`}></li>
          ))}
        </ul>

        <div className="face-space w-16"></div>
      </div>
    </div>
  );
};

export default CanvasComponent;
