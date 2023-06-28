import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { RoomProvider } from "../liveblocks.config";
import CanvasComponent from "./canvas";
import { MetaHeader } from "~~/components/MetaHeader";
import { LiveCursorContainer } from "~~/components/cursor/LiveCursorContainer";

/**
 * This function is used when deploying an example on liveblocks.io.
 * You can ignore it completely if you run the example locally.
 */
function useOverrideRoomId(roomId: string) {
  const { query } = useRouter();
  const overrideRoomId = useMemo(() => {
    console.log("roomID:", query?.roomId ? `${roomId}-${query.roomId}` : roomId);
    return query?.roomId ? `${roomId}-${query.roomId}` : roomId;
  }, [query, roomId]);

  return overrideRoomId;
}

export default function Home() {
  const roomId = useOverrideRoomId("nextjs-live-cursors-chat-copix");

  return (
    <>
      <MetaHeader />
      <RoomProvider
        id={roomId}
        initialPresence={() => ({
          cursor: null,
          message: "",
        })}
      >
        <LiveCursorContainer>
          <CanvasComponent />
        </LiveCursorContainer>
      </RoomProvider>
    </>
  );
}
