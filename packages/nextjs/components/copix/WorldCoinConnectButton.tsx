// TODO: Add WorldCoinConnectButton component
interface WorldCoinConnectButtonProps {
  onSuccess: () => void;
  onError: () => void;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const WorldCoinConnectButton = ({ onError, onSuccess }: WorldCoinConnectButtonProps) => {
  // trigger idkit on click
  function onClick() {
    console.log("WorldCoinConnectButton clicked");
  }

  return <button onClick={onClick}>WorldCoin Login</button>;
};
