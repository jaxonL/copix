import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Cursor from "~~/components/cursor/Cursor";
import FlyingReaction from "~~/components/cursor/FlyingReaction";
import ReactionSelector from "~~/components/cursor/ReactionSelector";
import useInterval from "~~/hooks/cursors/useInterval";
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from "~~/liveblocks.config";

/**
 * This file shows how to create Live Cursors with a small chat and interactions
 *
 * Because it's a bit more advanced that others examples, it's implemented using typescript to ensure that we introduce less bug while maintaining it.
 * It also uses Tailwind CSS for the styling
 */

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

enum CursorMode {
  Hidden,
  Chat,
  ReactionSelector,
  Reaction,
}

type CursorState =
  | {
      mode: CursorMode.Hidden;
    }
  | {
      mode: CursorMode.Chat;
      message: string;
      previousMessage: string | null;
    }
  | {
      mode: CursorMode.ReactionSelector;
    }
  | {
      mode: CursorMode.Reaction;
      reaction: string;
      isPressed: boolean;
    };

type Reaction = {
  value: string;
  timestamp: number;
  point: { x: number; y: number };
};

type ReactionEvent = {
  x: number;
  y: number;
  value: string;
};

export const LiveCursorContainer = ({ children }: any) => {
  const others = useOthers();
  const [{ cursor }, updateMyPresence] = useMyPresence();
  const broadcast = useBroadcastEvent();
  const [state, setState] = useState<CursorState>({ mode: CursorMode.Hidden });
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const setReaction = useCallback((reaction: string) => {
    setState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  // Remove reactions that are not visible anymore (every 1 sec)
  useInterval(() => {
    setReactions(reactions => reactions.filter(reaction => reaction.timestamp > Date.now() - 4000));
  }, 1000);

  useInterval(() => {
    if (state.mode === CursorMode.Reaction && state.isPressed && cursor) {
      setReactions(reactions =>
        reactions.concat([
          {
            point: { x: cursor.x, y: cursor.y },
            value: state.reaction,
            timestamp: Date.now(),
          },
        ]),
      );
      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: state.reaction,
      });
    }
  }, 100);

  useEffect(() => {
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "/") {
        setState({ mode: CursorMode.Chat, previousMessage: null, message: "" });
      } else if (e.key === "Escape") {
        updateMyPresence({ message: "" });
        setState({ mode: CursorMode.Hidden });
      } else if (e.key === "e") {
        setState({ mode: CursorMode.ReactionSelector });
      }
    }

    window.addEventListener("keyup", onKeyUp);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/") {
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence, cursor]);

  useEventListener(eventData => {
    const event = eventData.event as ReactionEvent;
    setReactions(reactions =>
      reactions.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ]),
    );
  });

  return (
    <div
      className=" overflow-hidden touch-none"
      style={{
        cursor: state.mode === CursorMode.Chat ? "none" : "url(cursor.svg) 0 0, auto",
      }}
      onMouseDown={event => {
        event.preventDefault();
        if (cursor != null && state.mode === CursorMode.Chat) {
          updateMyPresence({ message: "" });
          setState({ mode: CursorMode.Hidden });
        }
      }}
      onPointerMove={event => {
        event.preventDefault();
        if (cursor == null || state.mode !== CursorMode.ReactionSelector) {
          updateMyPresence({
            cursor: {
              x: Math.round(event.clientX),
              y: Math.round(event.clientY),
            },
          });
        }
      }}
      onPointerLeave={() => {
        setState({
          mode: CursorMode.Hidden,
        });
        updateMyPresence({
          cursor: null,
        });
      }}
      onPointerDown={event => {
        updateMyPresence({
          cursor: {
            x: Math.round(event.clientX),
            y: Math.round(event.clientY),
          },
        });
        setState(state => (state.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state));
      }}
      onPointerUp={() => {
        setState(state => (state.mode === CursorMode.Reaction ? { ...state, isPressed: false } : state));
      }}
    >
      {reactions.map(reaction => {
        return (
          <FlyingReaction
            key={reaction.timestamp.toString()}
            x={reaction.point.x}
            y={reaction.point.y}
            timestamp={reaction.timestamp}
            value={reaction.value}
          />
        );
      })}
      {cursor && (
        <div
          className="absolute top-0 left-0 z-40"
          style={{
            transform: `translateX(${cursor.x}px) translateY(${cursor.y}px)`,
          }}
        >
          {state.mode === CursorMode.Chat && (
            <>
              <Image width="24" height="36" src="cursor.svg" alt="cursor" />

              <div
                className="absolute top-5 left-2 px-4 py-2 bg-blue-500 text-white leading-relaxed text-sm"
                onKeyUp={e => e.stopPropagation()}
                style={{
                  borderRadius: 20,
                }}
              >
                {state.previousMessage && <div>{state.previousMessage}</div>}
                <input
                  className="bg-transparent border-none	outline-none text-white placeholder-blue-300 w-60"
                  autoFocus={true}
                  onChange={e => {
                    updateMyPresence({ message: e.target.value });
                    setState({
                      mode: CursorMode.Chat,
                      previousMessage: null,
                      message: e.target.value,
                    });
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      setState({
                        mode: CursorMode.Chat,
                        previousMessage: state.message,
                        message: "",
                      });
                    } else if (e.key === "Escape") {
                      setState({
                        mode: CursorMode.Hidden,
                      });
                    }
                  }}
                  placeholder={state.previousMessage ? "" : "Say something…"}
                  value={state.message}
                  maxLength={50}
                />
              </div>
            </>
          )}
          {state.mode === CursorMode.ReactionSelector && (
            <ReactionSelector
              setReaction={reaction => {
                setReaction(reaction);
              }}
            />
          )}
          {state.mode === CursorMode.Reaction && (
            <div className="absolute top-3.5 left-1 pointer-events-none select-none">{state.reaction}</div>
          )}
        </div>
      )}

      {others.map(({ connectionId, presence }) => {
        if (presence == null || !presence.cursor) {
          return null;
        }
        return (
          <>
            <Cursor
              key={connectionId}
              color={COLORS[connectionId % COLORS.length]}
              x={presence.cursor.x}
              y={presence.cursor.y}
              message={presence.message}
            />
          </>
        );
      })}
      {children}
    </div>
  );
};
