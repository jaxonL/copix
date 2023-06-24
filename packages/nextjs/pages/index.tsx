import CanvasComponent from "./canvas";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />
      <CanvasComponent />
    </>
  );
};

export default Home;
