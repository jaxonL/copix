// import Link from "next/link";
import type { NextPage } from "next";
import { useDarkMode } from "usehooks-ts";
// import { BugAntIcon, MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";

const defaultClassName = "my-12 py-8 px-16 max-w-6xl duration-150 rounded-lg hover:shadow-lg";

const Home: NextPage = () => {
  const { isDarkMode } = useDarkMode();

  const bgClass = isDarkMode ? "bg-gray-900" : "bg-white";

  return (
    <>
      <MetaHeader />

      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-6xl mb-2">👨‍🎨</span>
            <span className="block text-6xl font-bold mt-5">CoPix</span>
            <span className="block text-xl mt-10 font-bold">
              A public canvas where anyone can create art one pixel at a time.
              {/* Uniting the Web3 community one pixel at a time. */}
            </span>
          </h1>
          <div className={defaultClassName + " " + bgClass}>
            <p
              style={{
                lineHeight: "3",
              }}
            >
              <div>
                <b>Copix</b> is a public canvas built on Polygon testnet Mumbai, where each pixel is a non-fungible
                token.{" "}
              </div>
              <div>
                {" "}
                Verified World ID holders can modify the metadata, allowing users to create art by changing the colour
                of the pixels.
              </div>
              <div> After choosing a colour, the user now owns the pixel they just edited.</div>
              <div>A 2-minute cooldown period restricts consecutive pixel modifications by the same user.</div>
              <div>
                {" "}
                Additionally, users have access to the complete pixel metadata history, including past colors and
                contributors.
              </div>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
