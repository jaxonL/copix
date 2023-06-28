import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { AuthContext } from "../components/copix/AuthContext";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ISuccessResult } from "@worldcoin/idkit";
import NextNProgress from "nextjs-progressbar";
import Confetti from "react-confetti";
import { Toaster } from "react-hot-toast";
import useWindowSize from "react-use/lib/useWindowSize";
import { useDarkMode } from "usehooks-ts";
import { WagmiConfig } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { LiveCursorContainer } from "~~/components/cursor/LiveCursorContainer";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { RoomProvider } from "~~/liveblocks.config";
import { useGlobalState } from "~~/services/store/store";
import { wagmiClient } from "~~/services/web3/wagmiClient";
import { appChains } from "~~/services/web3/wagmiConnectors";
import "~~/styles/globals.css";

/**
 * This function is used when deploying an example on liveblocks.io.
 * You can ignore it completely if you run the example locally.
 */

const ScaffoldEthApp = ({ Component, pageProps }: AppProps) => {
  const price = useNativeCurrencyPrice();
  const setNativeCurrencyPrice = useGlobalState(state => state.setNativeCurrencyPrice);
  // This variable is required for initial client side rendering of correct theme for RainbowKit
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (price > 0) {
      setNativeCurrencyPrice(price);
    }
  }, [setNativeCurrencyPrice, price]);

  useEffect(() => {
    setIsDarkTheme(isDarkMode);
  }, [isDarkMode]);

  const [currentUser, setCurrentUser] = useState<any>(null);

  const login = useCallback((currentUser: ISuccessResult | null) => {
    console.log("new current user", currentUser);
    setCurrentUser(currentUser);
  }, []);

  const [showConfetti, setFirstPaintConfetti] = useState<boolean | undefined>(undefined);

  const setShowConfetti = useCallback((showConfetti: boolean | undefined) => {
    if (showConfetti === undefined) {
      setFirstPaintConfetti(true);

      setTimeout(function () {
        setFirstPaintConfetti(false);
      }, 5000);
    } else if (showConfetti === true) {
      setFirstPaintConfetti(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      currentUser,
      login,
      showConfetti,
      setShowConfetti,
    }),
    [currentUser, login, showConfetti, setShowConfetti],
  );
  const { height, width } = useWindowSize();

  function useOverrideRoomId(roomId: string) {
    const { query } = useRouter();
    const overrideRoomId = useMemo(() => {
      console.log("roomID:", query?.roomId ? `${roomId}-${query.roomId}` : roomId);
      return query?.roomId ? `${roomId}-${query.roomId}` : roomId;
    }, [query, roomId]);

    return overrideRoomId;
  }
  const roomId = useOverrideRoomId("nextjs-live-cursors-chat-copix");

  return (
    <WagmiConfig client={wagmiClient}>
      <NextNProgress />
      <RainbowKitProvider
        chains={appChains.chains}
        avatar={BlockieAvatar}
        theme={isDarkTheme ? darkTheme() : lightTheme()}
      >
        <AuthContext.Provider value={contextValue}>
          {showConfetti === true && <Confetti numberOfPieces={70} width={width} height={height} />}

          <RoomProvider
            id={roomId}
            initialPresence={() => ({
              cursor: null,
              message: "",
            })}
          >
            <div className="flex flex-col min-h-screen">
              <LiveCursorContainer>
                <Header />
                <main className="relative flex flex-col flex-1">
                  <Component {...pageProps} />
                </main>
                <Footer />
              </LiveCursorContainer>
            </div>
            <Toaster />
          </RoomProvider>
        </AuthContext.Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default ScaffoldEthApp;
