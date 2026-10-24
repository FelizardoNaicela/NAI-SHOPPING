import { useRef } from "react";

import { getSocket }
from "../../socket/socket";

type Props = {
  conversationId?: string;

  setContent: (
    value: string
  ) => void;

  autoResizeTextarea: () => void;

  saveDraft: (
    conversationId: string,
    value: string
  ) => void;
};

export function useChatTyping({
  conversationId,
  setContent,
  autoResizeTextarea,
  saveDraft,
}: Props) {

  const typingTimeout =
    useRef<any>(null);

  function handleTypingInput(
    value: string
  ) {

    setContent(value);

    if (conversationId) {
      saveDraft(
        conversationId,
        value
      );
    }

    autoResizeTextarea();

    const socket = getSocket();

    if (
      !socket ||
      !conversationId
    ) return;

    socket.emit(
      "chat:typing",
      {
        conversationId,
      }
    );

    if (
      typingTimeout.current
    ) {
      clearTimeout(
        typingTimeout.current
      );
    }

    typingTimeout.current =
      setTimeout(() => {

        socket.emit(
          "chat:stop-typing",
          {
            conversationId,
          }
        );

      }, 1200);
  }

  return {
    handleTypingInput,
  };
}