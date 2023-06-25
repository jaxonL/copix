import { useScaffoldContractWrite, useScaffoldEventHistory, useScaffoldEventSubscriber } from "../scaffold-eth";
import { BigNumber } from "ethers";
import { CONTRACT_NAME, Humanity, PIXEL_UPDATE_EVENT, toHumanity } from "~~/utils/constants";
import { UseScaffoldEventHistoryConfig } from "~~/utils/scaffold-eth/contract";

type BigNumberProof = [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber];

interface WorldIDProof {
  signal: string;
  root: number;
  humanNullifierHash: string;
  proof: [number, number, number, number, number, number, number, number];
}

interface CopixPaintArgs {
  x: number;
  y: number;
  color: string;
  worldIdProof: WorldIDProof;
}

/**
 * hook for paint() function in Copix contract
 */
export const useCopixPaint = ({ x, y, color, worldIdProof }: CopixPaintArgs) => {
  const { signal, root, humanNullifierHash, proof } = worldIdProof;
  if (proof.length !== 8) throw new Error("Proof must be 8 elements long");
  // typescript keeps complaining so sad code
  const proofAsBigNumber: BigNumberProof = [
    BigNumber.from(proof[0]),
    BigNumber.from(proof[1]),
    BigNumber.from(proof[2]),
    BigNumber.from(proof[3]),
    BigNumber.from(proof[4]),
    BigNumber.from(proof[5]),
    BigNumber.from(proof[6]),
    BigNumber.from(proof[7]),
  ];

  return useScaffoldContractWrite({
    contractName: CONTRACT_NAME,
    functionName: "paint",
    args: [
      BigNumber.from(x),
      BigNumber.from(y),
      color,
      signal,
      BigNumber.from(root),
      BigNumber.from(humanNullifierHash),
      proofAsBigNumber,
    ],
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });
};

interface CopixPixelUpdateArgs {
  listener: (painter: string, x: number, y: number, newColor: string, timestamp: Date, editedByHuman: Humanity) => void;
  once?: boolean;
}

/** subscribes to the PixelUpdate event */
export const useCopixPixelUpdateEventSubscriber = ({ listener, once }: CopixPixelUpdateArgs) => {
  return useScaffoldEventSubscriber({
    contractName: CONTRACT_NAME,
    eventName: PIXEL_UPDATE_EVENT,
    listener(...args) {
      const [painter, x, y, newColor, timestamp, editedByHuman] = args;
      listener(
        painter,
        x.toNumber(),
        y.toNumber(),
        newColor,
        new Date(timestamp.toNumber() * 1000),
        toHumanity(editedByHuman),
      );
    },
    once,
  });
};

/** fetches PixelUpdate history */
export const useCopixPixelUpdateHistory = (
  config: Omit<
    UseScaffoldEventHistoryConfig<typeof CONTRACT_NAME, typeof PIXEL_UPDATE_EVENT>,
    "contractName" | "eventName"
  >,
) => {
  return useScaffoldEventHistory({
    contractName: CONTRACT_NAME,
    eventName: PIXEL_UPDATE_EVENT,
    ...config,
  });
};
