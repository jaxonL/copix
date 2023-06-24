import { useScaffoldContractWrite } from "../scaffold-eth";
import { BigNumber } from "ethers";

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
    contractName: "Copix",
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
