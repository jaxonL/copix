import { useAccount } from "wagmi";
import { useCopixPixelUpdateEventSubscriber, useCopixPixelUpdateHistory } from "~~/hooks/copix/useCopixContract";
import { Humanity } from "~~/utils/constants";

const wrapperClassName = "flex flex-col";

export const PixelUpdateHistory = () => {
  const { address } = useAccount();

  function listener(painter: string, x: number, y: number, newColor: string, timestamp: Date, editedByHuman: Humanity) {
    console.log(painter, x, y, newColor, timestamp, editedByHuman);
  }

  useCopixPixelUpdateEventSubscriber({
    listener,
  });

  const {
    data: myPixelUpdateEvents,
    isLoading: isLoadingEvents,
    error: errorReadingEvents,
  } = useCopixPixelUpdateHistory({
    fromBlock: Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) || 0,
    filters: { painter: address },
    blockData: true,
  });

  console.log("Events:", isLoadingEvents, errorReadingEvents, myPixelUpdateEvents);
  if (isLoadingEvents) {
    return <div className={wrapperClassName}>Loading past events by you...</div>;
  }

  if (!myPixelUpdateEvents || myPixelUpdateEvents.length === 0) {
    return <div className={wrapperClassName}>No events found.</div>;
  }

  return (
    <div className={wrapperClassName}>
      {myPixelUpdateEvents.map(event => {
        return <div key={event.transaction.hash}>{JSON.stringify(event)}</div>;
      })}
    </div>
  );
};
