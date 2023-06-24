import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

// interface PixiAppProps {
//   parentRef: React.RefObject<HTMLDivElement>;
// }

// const PixiApp: React.FC<PixiAppProps> = ({ parentRef }) => {
//   return null;
// };

const CanvasComponent: React.FC = () => {
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
  const appRef = useRef<PIXI.Application | null>(null);
  const zoomContainerRef = useRef<PIXI.Container | null>(null);
  const graphicsRef = useRef<PIXI.Graphics | null>(null);
  const isDownRef = useRef(false);
  const zoomedRef = useRef(false);

  const [grid, setGrid] = useState<{ [key: string]: { color: string } }>({
    // Prepopulated pixel data as an example
    "5:5": { color: "#ff0000" },
    "10:10": { color: "#00ff00" },
    // Add more pixels as needed
  });

  useEffect(() => {
    // PIXI setup
    const app = new PIXI.Application({ backgroundColor: 0xeeeeee });

    const zoomContainer = new PIXI.Container();
    app.stage.addChild(zoomContainer);
    const graphics = new PIXI.Graphics();
    zoomContainer.addChild(graphics);

    // Assign to refs
    appRef.current = app;
    zoomContainerRef.current = zoomContainer;
    graphicsRef.current = graphics;

    // Initialize the color palette
    const colors = ["#ffffff", "#ff0000", "#00ff00", "#0000ff", "#000000"];
    const selectedColor = colors[0];

    // Render initial grid
    for (const pos in grid) {
      renderPixel(pos, grid[pos]);
    }

    // Mouse events
    app.stage.interactive = true;
    app.stage.on("pointerdown", onDown);
    app.stage.on("pointermove", onMove);
    app.stage.on("pointerup", onUp);
    app.stage.on("pointerupoutside", onUp);

    function onDown(e: any) {
      isDownRef.current = true;
      const pos = getGridPos(e.data.global);
      if (e.data.originalEvent.shiftKey) toggleZoom();
      else placePixel(pos);
    }

    function onMove(e: any) {
      if (!isDownRef.current) return;
      const pos = getGridPos(e.data.global);
      if (!e.data.originalEvent.shiftKey) placePixel(pos);
    }

    function onUp() {
      isDownRef.current = false;
    }

    function placePixel(pos: string) {
      const pixel = { color: selectedColor };
      setGrid(prevGrid => ({ ...prevGrid, [pos]: pixel }));
    }

    function renderPixel(pos: string, pixel: { color: string }) {
      const [x, y] = pos.split(":").map(Number);
      graphics.beginFill(parseInt(pixel.color.slice(1), 16));
      graphics.drawRect(x * 10, y * 10, 10, 10);
      graphics.endFill();
    }

    function toggleZoom() {
      zoomedRef.current = !zoomedRef.current;
      zoomContainer.scale.set(zoomedRef.current ? 2 : 1);
    }

    function getGridPos(pos: PIXI.Point) {
      const x = Math.floor(pos.x / 10);
      const y = Math.floor(pos.y / 10);
      return `${x}:${y}`;
    }

    const canvas: any = app.view;
    canvasRef?.current?.appendChild(canvas);

    return () => {
      app.destroy(true, { children: true });
    };
  }, []);

  // useEffect(() => {
  //   if (canvasRef.current) {
  //     <PixiApp parentRef={canvasRef} />;
  //   }
  // }, []);

  return (
    <div className="h-screen bg-gray-300 overflow-hidden font-lato select-none">
      <div id="canvas" ref={canvasRef} className="absolute top-0 bottom-16 left-0 right-0"></div>

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
