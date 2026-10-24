import { getSocket } from "../../socket/socket";
import type { Message } from "../../components/chat/types";

type Props = {
  conversationId?: string;

  content: string;
  setContent: React.Dispatch<
    React.SetStateAction<string>
  >;

  replyingTo: Message | null;
  setReplyingTo: React.Dispatch<
    React.SetStateAction<Message | null>
  >;

  clearDraft: (
    conversationId: string
  ) => void;

  textareaRef: React.RefObject<
    HTMLTextAreaElement | null
  >;

  editingMessageId: string | null;

  saveEdit: () => void;
};

export function useChatActions({
  conversationId,

  content,
  setContent,

  replyingTo,
  setReplyingTo,

  clearDraft,

  textareaRef,

  editingMessageId,
  saveEdit,
}: Props) {

  function autoResizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    textarea.style.height =
      textarea.scrollHeight + "px";
  }

  function sendMessage() {
    if (
      !content.trim() ||
      !conversationId
    )
      return;

    getSocket()?.emit("chat:send", {
      conversationId,
      content,
      replyToId: replyingTo?.id,
    });

    clearDraft(conversationId);

    setContent("");

    if (textareaRef.current) {
      textareaRef.current.style.height =
        "auto";
    }

    setReplyingTo(null);
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      if (editingMessageId) {
        saveEdit();
      } else {
        sendMessage();
      }
    }
  }

  return {
    autoResizeTextarea,

    sendMessage,

    handleKeyDown,
  };
}