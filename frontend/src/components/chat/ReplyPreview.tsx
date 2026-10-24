import { getReplyPreview } from "./chatPreview";
import { getImageUrl } from "../../utils/image";

type ReplyMessage = {
    content?: string | null;

    messageType?: string;

    imageUrl?: string | null;

    thumbnailUrl?: string | null;

    documentName?: string | null;
};

type Props = {
    message: ReplyMessage;
};

export function ReplyPreview({
  message,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        maxWidth: "100%",
      }}
    >
      {/* Miniatura da imagem */}
      {message.messageType === "IMAGE" &&
        message.imageUrl && (
          <img
            src={getImageUrl(message.imageUrl)}
            alt=""
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        )}

      {/* Miniatura do vídeo */}
      {message.messageType === "VIDEO" &&
  message.thumbnailUrl && (
          <div
            style={{
              position: "relative",
              width: 42,
              height: 42,
              flexShrink: 0,
            }}
          >
            <img
               src={getImageUrl(message.thumbnailUrl)}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 18,
                background:
                  "rgba(0,0,0,.25)",
                borderRadius: 8,
              }}
            >
              ▶
            </div>
          </div>
        )}

      {/* Texto */}
      <div
        style={{
          overflow: "hidden",
          flex: 1,
        }}
      >
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow:
              "ellipsis",
          }}
        >
          {getReplyPreview(message)}
        </div>
      </div>
    </div>
  );
}