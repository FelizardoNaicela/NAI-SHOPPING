import { useEffect } from "react";
import type { Message }
from "../../components/chat/types";

type Props = {
  conversationId?: string;

  getDraft: (
    conversationId: string
  ) => string;

  setContent: React.Dispatch<
    React.SetStateAction<string>
  >;

  setReplyingTo: React.Dispatch<
    React.SetStateAction<Message | null>
  >;

  setSelectedFile: React.Dispatch<
    React.SetStateAction<File | null>
  >;

  setPreviewUrl: React.Dispatch<
    React.SetStateAction<string | null>
  >;

  cancelEdit: () => void;

  textareaRef: React.RefObject<
    HTMLTextAreaElement | null
  >;
};

export function useChatConversationState({
  conversationId,

  getDraft,
  setContent,

  setReplyingTo,

  setSelectedFile,
  setPreviewUrl,

  cancelEdit,

  textareaRef,
}: Props) {

  useEffect(() => {

    if (conversationId) {
      setContent(
        getDraft(conversationId)
      );
    }

    setReplyingTo(null);

    setSelectedFile(null);
    setPreviewUrl(null);

    cancelEdit();

    if (textareaRef.current) {
      textareaRef.current.style.height =
        "auto";
    }

  }, [conversationId]);
}