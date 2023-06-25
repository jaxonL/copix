import {
  useScaffoldContractRead, // useScaffoldContractWrite,
  useScaffoldEventHistory,
  useScaffoldEventSubscriber,
} from "../scaffold-eth";
import { ISuccessResult } from "@worldcoin/idkit";
import { BigNumber } from "ethers";
import { decodeAbiParameters } from "viem";
import { CONTRACT_NAME, Humanity, PIXEL_UPDATE_EVENT, toHumanity } from "~~/utils/constants";
import { UseScaffoldEventHistoryConfig } from "~~/utils/scaffold-eth/contract";

export type BigNumberProof = [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber];

export interface WorldIDProof {
  // signal: string;
  root: BigNumber;
  humanNullifierHash: BigNumber;
  readonly proof: BigNumberProof;
}
type Tx = Parameters<typeof decodeAbiParameters>[1];

// interface CopixPaintArgs {
//   x?: number;
//   y?: number;
//   color: string;
//   worldIdProof: ISuccessResult | null;
//   address: string;
// }

// /**
//  * hook for paint() function in Copix contract
//  */
// export const useCopixPaint = ({ x, y, color, worldIdProof, address }: CopixPaintArgs) => {
//   if (!worldIdProof) console.log("disabling paint because worldIdProof is null");
//   const { root, humanNullifierHash, proof } = transformFromSuccessToProofInput(worldIdProof);

//   return useScaffoldContractWrite({
//     contractName: CONTRACT_NAME,
//     functionName: "paint",
//     args: [
//       BigNumber.from(x),
//       BigNumber.from(y),
//       color,
//       address,
//       BigNumber.from(root),
//       BigNumber.from(humanNullifierHash),
//       proof,
//     ],
//     onBlockConfirmation: txnReceipt => {
//       console.log("📦 Transaction blockHash", txnReceipt.blockHash);
//     },
//   });
// };

export function transformFromSuccessToProofInput(worldIdProof: ISuccessResult): WorldIDProof {
  const { merkle_root: root, nullifier_hash: humanNullifierHash, proof } = worldIdProof;
  const unpackedProof = (decodeAbiParameters([{ type: "uint256[8]" }], proof as Tx)[0] as any).map(BigNumber.from);
  return {
    root: BigNumber.from(root),
    humanNullifierHash: BigNumber.from(humanNullifierHash),
    proof: unpackedProof,
  };
}

export const useCopixVerifyHumanity = (worldIdProof: ISuccessResult | null, address?: string) => {
  const { merkle_root: root, nullifier_hash: humanNullifierHash, proof } = worldIdProof || {};
  const unpackedProof = proof ? decodeAbiParameters([{ type: "uint256[8]" }], proof as Tx)[0] : undefined;
  console.log({ root, humanNullifierHash, proof: unpackedProof });
  const actualRoot = root ? BigNumber.from(root) : undefined;
  const actualHumanNullifierHash = humanNullifierHash ? BigNumber.from(humanNullifierHash) : undefined;

  return useScaffoldContractRead({
    contractName: CONTRACT_NAME,
    functionName: "verifyHumanityCheck",
    args: [address, actualRoot, actualHumanNullifierHash, unpackedProof as any],
    enabled: !!worldIdProof && !!address && !!unpackedProof && !!root && !!humanNullifierHash,
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
