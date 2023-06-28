import React from "react";
import CanvasComponent from "./canvas";
import { MetaHeader } from "~~/components/MetaHeader";

export default function Home() {
  return (
    <>
      <MetaHeader />
      <CanvasComponent />
    </>
  );
}
