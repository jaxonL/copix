import { useContext } from "react";
import { CredentialType, IDKitWidget, ISuccessResult } from "@worldcoin/idkit";
// import { decodeAbiParameters } from "viem";
import { AuthContext } from "~~/components/copix/AuthContext";

const action = "paint";
const app_id = "app_c43feb41170563f6a0606c914a4766b6";

export const WorldCoinConnectButton = () => {
  const credential_types = [CredentialType.Orb, CredentialType.Phone];
  const { login, currentUser } = useContext(AuthContext);
  const onSuccess = (result: ISuccessResult) => {
    login(result);
  };

  if (currentUser) {
    if (currentUser.credential_type === CredentialType.Orb) {
      return (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="ml-5 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {"Verified Humanity"}
        </>
      );
    }
    if (currentUser.credential_type === CredentialType.Phone) {
      return (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="ml-5 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {"Verified Phone Number"}
        </>
      );
    }
  }
  return (
    <IDKitWidget
      action={action}
      signal="1"
      onSuccess={onSuccess}
      app_id={app_id}
      credential_types={credential_types}
      // walletConnectProjectId="get_this_from_walletconnect_portal"
    >
      {({ open }) => (
        <button
          className="btn btn-primary btn-sm normal-case flex items-center gap-x-4 transition-all no-underline h-[50px] px-6 rounded-xl text-white bg-gray-700 hover:bg-gray-900"
          onClick={open}
        >
          Verify with Worldcoin
        </button>
      )}
    </IDKitWidget>
  );
};
