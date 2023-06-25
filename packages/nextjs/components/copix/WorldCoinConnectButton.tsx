import { useContext } from "react";
import { CredentialType, IDKitWidget, ISuccessResult } from "@worldcoin/idkit";
import { AuthContext } from "~~/components/copix/AuthContext";

export const WorldCoinConnectButton = () => {
  const credential_types = [CredentialType.Orb, CredentialType.Phone];

  const action = "paint";
  const app_id = "app_staging_e37599212a8ec2e551684f70564c8041";
  const { login } = useContext(AuthContext);

  const onSuccess = (result: ISuccessResult) => {
    login(result);
  };

  return (
    <IDKitWidget
      action={action}
      signal="my_signal"
      onSuccess={onSuccess}
      app_id={app_id}
      credential_types={credential_types}
      // walletConnectProjectId="get_this_from_walletconnect_portal"
    >
      {({ open }) => (
        <button
          className="flex items-center gap-x-4 transition-all no-underline bg-gray-900 border border-gray-900 h-[50px] px-6 rounded-xl text-white"
          onClick={open}
        >
          Connect with Worldcoin
        </button>
      )}
    </IDKitWidget>
  );
};
