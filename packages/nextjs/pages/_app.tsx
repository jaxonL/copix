import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppProps } from "next/app";
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
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { wagmiClient } from "~~/services/web3/wagmiClient";
import { appChains } from "~~/services/web3/wagmiConnectors";
import "~~/styles/globals.css";

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

  return (
    <WagmiConfig client={wagmiClient}>
      <NextNProgress />
      <RainbowKitProvider
        chains={appChains.chains}
        avatar={BlockieAvatar}
        theme={isDarkTheme ? darkTheme() : lightTheme()}
      >
        <AuthContext.Provider value={contextValue}>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="relative flex flex-col flex-1">
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
          <Toaster />
          {showConfetti === true && <Confetti numberOfPieces={70} width={width} height={height} />}
        </AuthContext.Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default ScaffoldEthApp;
