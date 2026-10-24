import type { Message } from "./types";
import {
  useState,
  useRef,
  useEffect,
} from "react";
import { ReactionPicker } from "./ReactionPicker";
import { ReplyPreview } from "./ReplyPreview";
import { SharedLinkBubble } from "./SharedLinkBubble";
import { MessageContent } from "./MessageContent";
import { SharedMessageBubble } from "./SharedMessageBubble";

type Props = {
  msg: Message;
  userId: string;
  conversationName?: string;

  onImageClick(url: string): void;

  onContextMenu(
    e: React.MouseEvent,
    message: Message
  ): void;

  formatTime(date: string): string;

  onReact: (
    message: Message,
    emoji: string,
  ) => void;

  isGrouped?: boolean;

  isLastInGroup?: boolean;

  highlighted?: boolean;

  onReplyClick?: (
  messageId: string
) => void;

onSwipeReply?: (
  message: Message
) => void;

 onVideoClick: (
        src: string,
        poster?: string | null
    ) => void;
};

export function MessageBubble({
  msg,
  userId,
  conversationName,
  onImageClick,
  onContextMenu,
  formatTime,
  onReact,
  isGrouped,
  isLastInGroup,
  highlighted,
  onReplyClick,
  onSwipeReply,
 onVideoClick,
}: Props) {

  const isMine =
    msg.senderId === userId;

    const isAudio =
    msg.messageType === "AUDIO";

  const [
    showPicker,
    setShowPicker,
  ] = useState(false);

  const [
  hovered,
  setHovered,
] = useState(false);

const [
  touchStartX,
  setTouchStartX,
] = useState<number | null>(null);

const [
  swipeOffset,
  setSwipeOffset,
] = useState(0);

const [
  pickerPosition,
  setPickerPosition,
] = useState({
  x: 0,
  y: 0,
});

  const pickerRef =
    useRef<HTMLDivElement | null>(
      null
    );

    const pickerPortalRef =
    useRef<HTMLDivElement | null>(null);

  // ✅ FECHAR PICKER AO CLICAR FORA
  useEffect(() => {

    function handleClickOutside(
      e: MouseEvent
    ) {

      const target = e.target as Node;

const clickedButton =
    pickerRef.current?.contains(target);

const clickedPicker =
    pickerPortalRef.current?.contains(target);

if (!clickedButton && !clickedPicker) {
    setShowPicker(false);
}
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);

  return (
    <div

   onTouchStart={(e) => {

  const target =
    e.target as HTMLElement;

  if (
    target.closest("video") ||
    target.closest("audio")
  ) {
    return;
  }

  setTouchStartX(
    e.touches[0].clientX
  );
}}

onTouchMove={(e) => {
  if (touchStartX === null)
    return;


  const target =
    e.target as HTMLElement;

  if (
    target.closest("video") ||
    target.closest("audio")
  ) {
    return;
  }

  const currentX =
    e.touches[0].clientX;

  const diff =
    currentX - touchStartX;

  // direita
  if (diff > 0 && diff < 120) {
    setSwipeOffset(diff);
  }

  // esquerda
  if (diff < 0 && diff > -120) {
    setSwipeOffset(diff);
  }
}}

onTouchEnd={() => {

  if (
    Math.abs(swipeOffset) > 70
  ) {
    onSwipeReply?.(msg);
  }

  setTouchStartX(null);

  setSwipeOffset(0);
}}



  id={`message-${msg.id}`}

  onMouseEnter={() =>
    setHovered(true)
  }

  onMouseLeave={() => {

  if (!showPicker) {
    setHovered(false);
  }

}}

  onContextMenu={(e) =>
    onContextMenu(e, msg)
  }
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isMine
          ? "flex-end"
          : "flex-start",
        marginBottom: isGrouped
  ? 2
  : 12,
  transform: `translateX(${swipeOffset}px)`,

transition:
  touchStartX !== null
    ? "none"
    : "transform 0.2s ease",
      }}
    >

      <div
  style={{
    transform: `translateX(${swipeOffset}px)`,

    transition:
      touchStartX !== null
        ? "none"
        : "transform 0.2s ease",
  }}
></div>
      <div
        style={{
  background: highlighted
        ? "var(--bubble-highlight)"
        : isMine
        ? "var(--bubble-mine)"
        : "var(--bubble-other)",
    transition:
"background .3s, color .3s, box-shadow .25s",


          padding: "10px 14px",

          borderRadius: isMine
  ? isGrouped
    ? "14px 14px 4px 14px"
    : 14
  : isGrouped
  ? "14px 14px 14px 4px"
  : 14,

         maxWidth:
        isAudio
            ? 320
            : "65%",

    width:
        isAudio
            ? "65%"
            : "fit-content",

          wordBreak: "break-word",

          boxShadow: "var(--shadow-sm)",
          color: "var(--text)",
        }}

        onMouseEnter={(e)=>{
    e.currentTarget.style.boxShadow="var(--shadow-md)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.boxShadow="var(--shadow-sm)";
}}
      >

        {msg.replyTo && (
  <div
    onClick={() =>
      onReplyClick?.(
        msg.replyTo!.id
      )
    }
    style={{
      transition:"background .2s",
    }}
    onMouseEnter={(e)=>{
    e.currentTarget.style.background="rgba(249,115,22,.06)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.background="transparent";
}}
  >
          <div
            style={{
              marginBottom: 8,
              padding: 8,
              background:
"var(--surface-soft)",

borderLeft:
"3px solid var(--primary)",
              borderRadius: 6,
              fontSize: 12,
              color:"var(--text)",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              {msg.replyTo.senderId ===
              userId
                ? "Você"
                : conversationName}
            </div>

            <ReplyPreview
  message={msg.replyTo}
/>
          </div>
          </div>
        )}

        {msg.deletedAt ? (

  <div
    style={{
      fontStyle: "italic",
     color: "var(--text-soft)",
    }}
  >
    Mensagem apagada
  </div>

) : msg.sharedMessage ? (

  <SharedMessageBubble
    message={msg.sharedMessage}
  />

) : msg.messageType === "SHARED_LINK" ? (

  <SharedLinkBubble
    product={msg.sharedProduct}
    post={msg.sharedPost}
  />

) : (

  <MessageContent
    message={msg}
    onImageClick={onImageClick}
     onVideoClick={onVideoClick}
/>

)}

        {isLastInGroup && (
  <div
    style={{
      marginTop: 6,
            fontSize: 11,
            color: "var(--text-soft)",
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 6,
          }}
        >
          <span>
            {formatTime(
              msg.createdAt
            )}

            {msg.editedAt &&
              " • editada"}
          </span>

          {isMine && (
            <span
style={{
    color:
        msg.readAt
            ? "var(--primary)"
            : "var(--text-soft)"
}}
>
              {msg.readAt
                ? "◉"
                : msg.deliveredAt
                ? "○"
                : "✓"}
            </span>
          )}
        </div>)}
      </div>

      {!msg.deletedAt && (
  <div
    style={{
      display: "flex",
      gap: 6,
      marginTop: 4,
      flexWrap: "wrap",
      alignItems: "center",
    }}
  >

    {/* REAÇÕES */}
    {(msg.reactions?.length ?? 0) > 0 && (
      <>
        {[
          ...new Set(
            msg.reactions?.map(
              (r) => r.emoji
            ) || []
          ),
        ].map((emoji) => {

          const count =
            msg.reactions?.filter(
              (r) =>
                r.emoji === emoji
            ).length || 0;

          const reacted =
            msg.reactions?.some(
              (r) =>
                r.emoji === emoji &&
                r.userId === userId
            );

          return (
            <button
              key={emoji}
              onClick={() =>
                onReact(
                  msg,
                  emoji
                )
              }
              style={{
                borderRadius: 999,
                padding: "4px 8px",
                cursor: "pointer",
               background: reacted
    ? "rgba(249,115,22,.18)"
    : "var(--surface-soft)",

border:
`1px solid var(--border)`,

color:
"var(--text)",
                fontSize: 13,
                transition:
"transform .15s, background .2s",
              }}

              onMouseEnter={(e)=>{
    e.currentTarget.style.transform="scale(1.08)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.transform="scale(1)";
}}
            >
              {emoji} {count}
            </button>
          );
        })}
      </>
    )}

    {/* BOTÃO + */}
    {(hovered || showPicker) && (
      <div
        ref={pickerRef}
        style={{
          position: "relative",
        }}
      >
          <button
  type="button"

  onMouseDown={(e) => {

  e.preventDefault();

  const rect =
    e.currentTarget.getBoundingClientRect();

  const pickerHeight = 410;
  const pickerWidth = 320;

  const spaceAbove =
    rect.top;

  const shouldOpenDown =
    spaceAbove < pickerHeight;

  let x = rect.left;

  if (
    x + pickerWidth >
    window.innerWidth
  ) {
    x =
      window.innerWidth -
      pickerWidth -
      20;
  }

  setPickerPosition({
    x,

    y: shouldOpenDown
      ? rect.bottom + 10
      : rect.top - pickerHeight,
  });

  setShowPicker(
    (prev) => !prev
  );
}}
          style={{
           width:30,
height:30,
borderRadius:999,

background:
hovered
? "var(--surface)"
: "transparent",
color:"var(--text)",
boxShadow:hovered
    ? "var(--shadow-sm)"
    : "none",

border:"none",
transition:
"background .25s, transform .18s, box-shadow .25s",
          }}

          onMouseEnter={(e)=>{
    e.currentTarget.style.transform="scale(1.08)";
}}
onMouseLeave={(e)=>{
    e.currentTarget.style.transform="scale(1)";
}}
        >
          ➕
        </button>

        {showPicker && (
          <ReactionPicker
 ref={pickerPortalRef}
    x={pickerPosition.x}
    y={pickerPosition.y}

  onSelect={(emoji) => {

              onReact(
                msg,
                emoji
              );

              setShowPicker(false);
            }}
          />
        )}
      </div>
    )}
  </div>
)}
    </div>
  );
}