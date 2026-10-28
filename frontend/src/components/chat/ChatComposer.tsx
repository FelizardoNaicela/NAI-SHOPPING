import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import type { Message } from "./types";
import {
  Mic,
  SmilePlus,
  X,
  Circle,
  Square,
  Send,
} from "lucide-react";
import { ReplyPreview } from "./ReplyPreview";

type Props = {
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;

  content: string;

  textareaRef: React.RefObject<HTMLTextAreaElement | null>;

  handleTypingInput: (value: string) => void;

  handleKeyDown: (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;

  sendMessage: () => void;

  recording: boolean;

  startRecording: () => void;

  cancelRecording: () => void;

  stopRecording: () => void;

  recordingTime: number;
};

export function ChatComposer({
  replyingTo,
  setReplyingTo,

  content,

  textareaRef,

  handleTypingInput,
  handleKeyDown,

  sendMessage,

  recording,

  startRecording,
  stopRecording,
  cancelRecording,

  recordingTime,
}: Props) {
  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  const emojiPickerRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(
      e: MouseEvent
    ) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(
          e.target as Node
        )
      ) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  useEffect(() => {
  const textarea = textareaRef.current;

  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";

  const maxHeight = 140;

  const nextHeight = Math.min(
    textarea.scrollHeight,
    maxHeight,
  );

  textarea.style.height = `${nextHeight}px`;

  textarea.style.overflowY =
    textarea.scrollHeight > maxHeight
      ? "auto"
      : "hidden";
}, [content]);

  const hasText =
    content.trim().length > 0;

 return (
  <>
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {replyingTo && (
        <div
          style={{
            padding: 10,
            background:"rgba(255,255,255,.08)",
border:"1px solid var(--border)",
backdropFilter:"blur(8px)",
            borderRadius: 10,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color:"var(--text-soft)",
              marginBottom: 4,
            }}
          >
            Respondendo mensagem
          </div>

          <ReplyPreview
            message={replyingTo}
          />

          <button
            onClick={() =>
              setReplyingTo(null)
            }
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color:"var(--text)",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Barra de envio */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {/* Emoji */}
        {!recording && (
          <div
            ref={emojiPickerRef}
            style={{
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setShowEmojiPicker(
                  (prev) => !prev
                )
              }
              style={{
    border: "none",
    background: "transparent",

    cursor: "pointer",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color:"var(--text-soft)",
}}
            >
             <SmilePlus size={30} strokeWidth={2} />
            </button>

            {showEmojiPicker && (
              <div
                style={{
                  position: "absolute",
                  bottom: 50,
                  left: 0,
                  zIndex: 999,
                }}
              >
                <EmojiPicker
                  onEmojiClick={(
                    emojiData
                  ) => {
                    handleTypingInput(
                      content +
                        emojiData.emoji
                    );

                    setShowEmojiPicker(
                      false
                    );
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Textarea OU gravação */}
        <div style={{ flex: 1 }}>
          {recording ? (
            <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    fontSize: 16,
  }}
>
  <button
  type="button"
  onClick={cancelRecording}
  style={{
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--danger)",
  }}
  aria-label="Cancelar gravação"
  title="Cancelar gravação"
>
  <X size={22} strokeWidth={2.2} />
</button>
  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "var(--danger)",
    fontWeight: "bold",
  }}
>
  <Circle
    size={12}
    fill="currentColor"
    strokeWidth={0}
  />
  Gravando...
</div>

  <div
    style={{
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {Math.floor(recordingTime / 60)
      .toString()
      .padStart(2, "0")}
    :
    {(recordingTime % 60)
      .toString()
      .padStart(2, "0")}
  </div>
</div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) =>
                handleTypingInput(
                  e.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder="Digite..."
              rows={1}
              style={{
    width: "100%",
    minHeight: 42,
    maxHeight: 140,
    resize: "none",
    overflowY: "hidden",

    padding: "10px 12px",

    borderRadius: 14,
    border: "1px solid var(--border)",

    background: "var(--surface)",
    color: "var(--text)",

    outline: "none",

    boxSizing: "border-box",

    lineHeight: 1.4,

    transition: "height .12s ease",
  }}
            />
          )}
        </div>

        {/* Botão direito */}
        {recording ? (
          <button
  type="button"
  onClick={stopRecording}
  style={{
    padding: "0 18px",
    height: 44,
    borderRadius: 10,
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
  aria-label="Parar gravação"
  title="Parar gravação"
>
  <Square size={18} fill="currentColor" />
</button>
        ) : !hasText ? (
          <button
            type="button"
            onClick={startRecording}
            style={{
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
          >
            <Mic size={25} />
          </button>
        ) : (
          <button
  type="button"
  onClick={sendMessage}
  style={{
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
  aria-label="Enviar mensagem"
  title="Enviar mensagem"
>
  <Send size={18} strokeWidth={2.2} />
</button>
        )}
      </div>
    </div>
  </>
);
}