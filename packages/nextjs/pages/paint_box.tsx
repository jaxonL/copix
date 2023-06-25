import { Fragment, useContext, useEffect, useState } from "react";
import ColorPicker from "./color_picker";
import { Dialog, Transition } from "@headlessui/react";
import { BigNumber } from "ethers";
import { AuthContext } from "~~/components/copix/AuthContext";
import {
  BigNumberProof,
  WorldIDProof,
  transformFromSuccessToProofInput, // useCopixPaint,
} from "~~/hooks/copix/useCopixContract";
import { useDeployedContractInfo, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { CONTRACT_NAME } from "~~/utils/constants";

interface ModalProps {
  x?: number;
  y?: number;
  showModal: boolean;
  closeModal: () => void;
  color: string;
  setColor: (color: string) => void;
}

const Modal: React.FC<ModalProps> = ({ x, y, showModal, closeModal, color, setColor }) => {
  // console.log(color);
  const { currentUser } = useContext(AuthContext);
  const { data } = useDeployedContractInfo(CONTRACT_NAME);
  const [paintArgs, setPaintArgs] = useState<WorldIDProof>(
    currentUser
      ? transformFromSuccessToProofInput(currentUser)
      : {
          root: BigNumber.from(0),
          humanNullifierHash: BigNumber.from(0),
          proof: [
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0),
          ] as BigNumberProof,
        },
  );
  // const { signal, root, humanNullifierHash, proof } = currentUser ? transformFromSuccessToProofInput(currentUser) : {};

  // const { writeAsync, isLoading, isMining } = useScaffoldContractWrite({
  //   contractName: CONTRACT_NAME,
  //   functionName: "paint",
  //   args: [
  //     BigNumber.from(x ?? 0),
  //     BigNumber.from(y ?? 0),
  //     color,
  //     paintArgs.root,
  //     paintArgs.humanNullifierHash,
  //     paintArgs.proof,
  //   ],
  //   onBlockConfirmation: txnReceipt => {
  //     console.log("📦 Transaction blockHash", txnReceipt.blockHash);
  //   },
  //   onSuccess: (data: any) => {
  //     console.log("successful tx, data: ", data);
  //     // Only displays confetti on the first paint
  //     setShowConfetti(showConfetti);
  //   },
  // });
  const { writeAsync, isLoading, isMining } = useScaffoldContractWrite({
    contractName: CONTRACT_NAME,
    functionName: "unsafePaint",
    args: [BigNumber.from(x ?? 0), BigNumber.from(y ?? 0), color, paintArgs.humanNullifierHash],
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
    onSuccess: (data: any) => {
      console.log("successful tx, data: ", data);
      // Only displays confetti on the first paint
      setShowConfetti(showConfetti);
    },
  });

  useEffect(() => {
    if (currentUser) {
      setPaintArgs(transformFromSuccessToProofInput(currentUser));
    }
  }, [currentUser]);

  const { showConfetti, setShowConfetti } = useContext(AuthContext);
  async function paint() {
    console.log(`Painting (${x}, ${y}) to be ${color}`);
    if (!currentUser || !data?.address) {
      console.log("No user or contract address");
      return;
    }
    await writeAsync();
    /// actually create transaction
    closeModal();
  }

  return (
    <>
      <Transition appear show={!!showModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-10 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Color Picker
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You are modifying the color of ({x}, {y})
                    </p>
                  </div>
                  <ColorPicker color={color} setColor={setColor} />
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 mt-10 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={paint}
                      disabled={isLoading || isMining}
                    >
                      {isLoading ? "Loading..." : isMining ? "Mining transaction..." : "Create paint transaction"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Modal;
