import type { Message } from "./types";
import { MessageBubble } from "./MessageBubble";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import {
  useRef, useState, useEffect
} from "react";

type Props = {
  messages: Message[];
  loadingMessages: boolean;

  hasMore: boolean;
  loadingMore: boolean;

  loadMoreMessages: () => void;

  userId: string;

  conversationName?: string;

  setSelectedImage: (
    image: string
  ) => void;

  setContextMenu: (
    data: {
      x: number;
      y: number;
      message: Message;
    } | null
  ) => void;

  formatTime: (
    date: string
  ) => string;

  onReact: (
    message: Message,
    emoji: string
  ) => void;

  scrollToMessageId?: string | null;

  onReplyClick?: (
  messageId: string
) => void;

highlightedMessageId?: string| null;

onReplyScrollFinished?: () => void;

onSwipeReply?: (
  message: Message
) => void;

setSelectedVideo: React.Dispatch<
    React.SetStateAction<{
        src: string;
        poster?: string | null;
    } | null>
>;
};

export function ChatMessages({
  messages,
  loadingMessages,

  hasMore,
  loadingMore,

  loadMoreMessages,

  userId,
  conversationName,

  setSelectedImage,
  setContextMenu,

  formatTime,

  onReact,
  scrollToMessageId,

  onReplyClick,

  highlightedMessageId,

  onReplyScrollFinished,

  onSwipeReply,

  setSelectedVideo

}: Props) {

  const scrollToBottom = () => {
  virtuosoRef.current?.scrollToIndex({
    index: messages.length - 1,
    behavior: "smooth",
  });
};

  const virtuosoRef =
  useRef<VirtuosoHandle>(null);

  const [
  isAtBottom,
  setIsAtBottom,
] = useState(true);

const [
  initialized,
  setInitialized,
] = useState(false);

const [
  didInitialScroll,
  setDidInitialScroll,
] = useState(false);

useEffect(() => {
  if (
    !loadingMessages &&
    messages.length > 0
  ) {
    const timeout = setTimeout(() => {
      setInitialized(true);
    }, 300);

    return () => clearTimeout(timeout);
  }
}, [
  loadingMessages,
  messages.length,
]);

useEffect(() => {

  if (
    didInitialScroll ||
    loadingMessages ||
    messages.length === 0
  ) return;

  requestAnimationFrame(() => {

    virtuosoRef.current?.scrollToIndex({
      index: messages.length - 1,
      align: "end",
      behavior: "auto",
    });

    setDidInitialScroll(true);

  });

}, [
  loadingMessages,
  messages.length,
  didInitialScroll,
]);

useEffect(() => {

  if (!scrollToMessageId)
    return;

  const index = messages.findIndex(
    (m) => m.id === scrollToMessageId
  );

  // ainda não carregou
  if (index === -1) {

    if (hasMore && !loadingMore) {
      loadMoreMessages();
    }

    return;
  }

  virtuosoRef.current?.scrollToIndex({
    index,
    behavior: "smooth",
    align: "center",
  });

  const timeout = setTimeout(() => {
    onReplyScrollFinished?.();
  }, 100);

  return () => clearTimeout(timeout);

}, [
  scrollToMessageId,
  messages,
  hasMore,
  loadingMore,
  loadMoreMessages,
]);

  if (loadingMessages) {
    return (
      <div
        style={{
          flex: 1,
          padding: 15,
          background:"var(--surface-glass)",
          overflow: "hidden",
        }}
      >
        {Array.from({
          length: 8,
        }).map((_, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems:
                index % 2 === 0
                  ? "flex-start"
                  : "flex-end",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width:
                  Math.random() *
                    140 +
                  80,
                height: 42,
                borderRadius: 14,
                background:"var(--border)",
                animation:
                  "pulse 1.2s infinite",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        background:"var(--background)",
      }}
    >
     <Virtuoso

  firstItemIndex={
    Math.max(
      0,
      100000 - messages.length
    )
  }

  initialTopMostItemIndex={
    messages.length - 1
  }

  atBottomStateChange={(bottom) => {
    setIsAtBottom(bottom);
  }}

  ref={virtuosoRef}

  followOutput={
    isAtBottom
      ? "smooth"
      : false
  }

  style={{
    height: "100%",
  }}

  data={messages}

  startReached={() => {

  if (!initialized)
    return;

  if (
    hasMore &&
    !loadingMore
  ) {
    loadMoreMessages();
  }
}}

  itemContent={(index, msg) => {

  const previousMessage =
    messages[index - 1];

  const isGrouped =
  previousMessage &&
  previousMessage.senderId ===
    msg.senderId &&
  isWithinFiveMinutes(
    msg.createdAt,
    previousMessage.createdAt
  );

  const nextMessage =
  messages[index + 1];

const isLastInGroup =
  !nextMessage ||
  nextMessage.senderId !==
    msg.senderId ||
  !isWithinFiveMinutes(
    nextMessage.createdAt,
    msg.createdAt
  );

      function isWithinFiveMinutes(
  current: string,
  previous: string
) {
  const currentDate =
    new Date(current).getTime();

  const previousDate =
    new Date(previous).getTime();

  const diff =
    currentDate - previousDate;

  return diff < 1000 * 60 * 5;
}
  return (
          <MessageBubble
            msg={msg}
            userId={userId}
            conversationName={
              conversationName
            }
            formatTime={formatTime}
            onImageClick={
              setSelectedImage
            }
            onContextMenu={(
              e,
              message
            ) => {
              e.preventDefault();

              if (
                message.deletedAt
              )
                return;

              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                message,
              });
            }}
            onReact={onReact}
                isGrouped={!!isGrouped}

                isLastInGroup={
  isLastInGroup
}

onReplyClick={onReplyClick}

highlighted={
  highlightedMessageId === msg.id
}

onSwipeReply={onSwipeReply}

 onVideoClick={(src, poster)=>

        setSelectedVideo({

            src,

            poster,

        })

    }
    />
  );
}}
      />

{!isAtBottom && (
  <button
    onClick={scrollToBottom}
    style={{
      position: "absolute",

      bottom: 86, // acima do input

      right: 18,

      width: 46,
      height: 46,

      borderRadius: "50%",

      border: "none",

      background:"var(--primary)",

      color: "#fff",

      cursor: "pointer",

      boxShadow:
        "0 4px 12px rgba(0,0,0,.25)",

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      fontSize: 22,

      zIndex: 20,
    }}
  >
    ↓
  </button>
)}
    </div>
  );
}