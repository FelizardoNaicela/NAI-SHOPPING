import type { Message } from "./types";
import { ChatAudioPlayer } from "./ChatAudioPlayer";
import LinkText from "./LinkText";
import { FaPlay } from "react-icons/fa";

type Props = {
    message: Message;
    onImageClick(url: string): void;
    onVideoClick(
        url: string,
        poster?: string | null
    ): void;
};

export function MessageContent({
  message,
  onImageClick,
  onVideoClick,
}: Props) {
  switch (message.messageType) {
    case "IMAGE":
      return (
        <img
          src={`http://localhost:3000${message.imageUrl}`}
          onClick={() =>
            onImageClick(
              `http://localhost:3000${message.imageUrl}`
            )
          }
          style={{
    display: "block",
    width: "100%",
    maxWidth: 240,
    borderRadius: 14,
    cursor: "pointer",
    objectFit: "cover",

    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-sm)",

    transition:
        "transform .25s, box-shadow .25s",
}}
onMouseEnter={(e)=>{
    e.currentTarget.style.transform="scale(1.02)";
}}
onMouseLeave={(e)=>{
    e.currentTarget.style.transform="scale(1)";
}}
        />
      );

    case "AUDIO":
      return (
        <ChatAudioPlayer
          src={`http://localhost:3000${message.audioUrl}`}
        />
      );

   case "VIDEO":
  return (
    <div
      onClick={() =>
        onVideoClick(
          `http://localhost:3000${message.videoUrl}`,
          message.thumbnailUrl
            ? `http://localhost:3000${message.thumbnailUrl}`
            : null
        )
      }
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 240,
        cursor: "pointer",
        borderRadius: 12,
        overflow: "hidden",
        background:"var(--surface-glass)",
        color:"var(--text)"
      }}
    >
      <video
        playsInline
        preload="metadata"
        poster={
          message.thumbnailUrl
            ? `http://localhost:3000${message.thumbnailUrl}`
            : undefined
        }
        src={`http://localhost:3000${message.videoUrl}`}
        style={{
          display: "block",
          width: "100%",
          borderRadius: 12,
boxShadow:"var(--shadow-md)",
            border:"1px solid var(--border)"

        }}
      />

      {/* sombra */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.25))",
        }}
      />

      {/* botão play */}
      <div
    style={{
        position: "absolute",
        inset: 0,

        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        transition: ".25s",
    }}
>
        <div
    style={{
        width: 70,
        height: 70,
        borderRadius: "50%",

        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        background: "var(--surface-glass)",

        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",

        border: "1px solid rgba(255,255,255,.18)",

        boxShadow: "var(--shadow-lg)",

        transition:
            "transform .22s ease, background .25s ease",

        color: "white",
    }}
>
    <FaPlay
        size={24}
        style={{
            marginLeft: 4,
        }}
    />
        </div>
      </div>
    </div>
  );

    case "DOCUMENT":
      return (
        <a
          href={`http://localhost:3000${message.documentUrl}`}
          target="_blank"
          rel="noreferrer"
          style={{
    display:"flex",
    alignItems:"center",
    gap:12,

    padding:"12px 14px",

    borderRadius:14,

    background:"var(--surface-glass)",

    backdropFilter:"blur(10px)",

    border:"1px solid var(--border)",

    color:"var(--text)",

    textDecoration:"none",

    boxShadow:"var(--shadow-sm)",

    transition:
        "transform .2s, background .25s",
}}
        >
          📄 {message.documentName}
        </a>
      );

    case "LOCATION":
      return (
        <a
          href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
          target="_blank"
          rel="noreferrer"
          style={{
    display:"flex",
    alignItems:"center",
    gap:10,

    padding:"12px",

    borderRadius:14,

    background:"var(--surface-glass)",

    border:"1px solid var(--border)",

    color:"var(--text)",

    textDecoration:"none",

    boxShadow:"var(--shadow-sm)",
}}
        >
          📍 Ver localização
        </a>
      );

    default:
      return <div
    style={{
        color:"var(--text)",

        lineHeight:1.55,

        fontSize:15,

        whiteSpace:"pre-wrap",

        wordBreak:"break-word",
    }}
>
    <LinkText text={message.content}/>
</div>;
  }
}