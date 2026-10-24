import { useState } from "react";
import { getSocket } from "../../socket/socket";

type Props = {
  setMessages: React.Dispatch<
    React.SetStateAction<any[]>
  >;
};

export function useChatEditor({
  setMessages,
}: Props) {

  const [
    editingMessageId,
    setEditingMessageId,
  ] = useState<string | null>(null);

  const [
    editingContent,
    setEditingContent,
  ] = useState("");

  function saveEdit() {
    if (
      !editingMessageId ||
      !editingContent.trim()
    )
      return;

    getSocket()?.emit("chat:edit", {
      messageId: editingMessageId,
      content: editingContent,
    });

    // ⚡ update otimista
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === editingMessageId
          ? {
              ...msg,
              content: editingContent,
              editedAt:
                new Date().toISOString(),
            }
          : msg
      )
    );

    setEditingMessageId(null);
    setEditingContent("");
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setEditingContent("");
  }

  return {
    editingMessageId,
    setEditingMessageId,

    editingContent,
    setEditingContent,

    saveEdit,
    cancelEdit,
  };
}