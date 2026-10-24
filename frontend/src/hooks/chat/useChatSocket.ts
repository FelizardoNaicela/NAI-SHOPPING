import { useEffect } from "react";

import { getSocket } from "../../socket/socket";

import type { Message } from "../../components/chat/types";

type Props = {
  conversationId?: string;

  userId: string;

  setMessages: React.Dispatch<
    React.SetStateAction<Message[]>
  >;

  setIsTyping: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

export function useChatSocket({
  conversationId,
  userId,
  setMessages,
  setIsTyping,
}: Props) {

  const handleMessageEdited = (
    updated: Message
  ) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === updated.id
          ? {
              ...msg,
              content: updated.content,
              editedAt: updated.editedAt,
            }
          : msg
      )
    );
  };

  const handleMessageDeleted = (
    data: {
      messageId: string;
    }
  ) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId
          ? {
              ...msg,
              content: "Mensagem apagada",
              imageUrl: undefined,
              deletedAt:
                new Date().toISOString(),
            }
          : msg
      )
    );
  };

  useEffect(() => {
    const s = getSocket();

    if (!s || !conversationId) return;

    const joinRoom = () => {
  s.emit("chat:join", {
    conversationId,
  });

  // Mensagens que estavam pendentes passam a ser entregues
  s.emit("chat:delivered", {
    conversationId,
  });
};

    if (s.connected) {
      joinRoom();
    }

    s.on("connect", joinRoom);

    // =========================================
    // 📩 NOVA MENSAGEM
    // =========================================

    const handleNewMessage = (
      msg: Message
    ) => {
      if (
        msg.conversationId !== conversationId
      ) {
        return;
      }

      setMessages((prev) => {

        if (
          prev.some(
            (m) => m.id === msg.id
          )
        ) {
          return prev;
        }

        return [
          ...prev,
          msg,
        ];
      });

      // 📦 Se a mensagem é para mim,
      // confirma a entrega
     if (msg.senderId !== userId) {
  s.emit("chat:delivered", {
    conversationId,
  });
}
    };

    // =========================================
    // ⌨️ TYPING
    // =========================================

    const handleTyping = () => {
      setIsTyping(true);
    };

    const handleStopTyping = () => {
      setIsTyping(false);
    };

    // =========================================
    // 👁️ LEITURA
    // =========================================

    const handleRead = (data: {
  conversationId: string;
  userId: string;
}) => {
  if (
    data.conversationId !== conversationId
  ) {
    return;
  }

  setMessages((prev) =>
    prev.map((msg) => {
      if (
        msg.senderId === userId &&
        !msg.readAt
      ) {
        return {
          ...msg,
          readAt: new Date().toISOString(),
        };
      }

      return msg;
    })
  );
};

    // =========================================
    // 📦 ENTREGA
    // =========================================

    const handleDelivered = (
      data: {
        conversationId: string;
        messageIds: string[];
      }
    ) => {

      if (
        data.conversationId !== conversationId
      ) {
        return;
      }

      const deliveredAt =
        new Date().toISOString();

      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg.id)
            ? {
                ...msg,
                deliveredAt,
              }
            : msg
        )
      );
    };

    // =========================================
    // ✏️ EDITAR
    // =========================================

    const handleReaction = (
      updatedMessage: Message
    ) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === updatedMessage.id
            ? updatedMessage
            : msg
        )
      );
    };

    // =========================================
    // SOCKET EVENTS
    // =========================================

    s.on(
      "chat:new-message",
      handleNewMessage
    );

    s.on(
      "chat:typing",
      handleTyping
    );

    s.on(
      "chat:stop-typing",
      handleStopTyping
    );

    s.on(
      "chat:read",
      handleRead
    );

    s.on(
      "chat:delivered",
      handleDelivered
    );

    s.on(
      "chat:message-edited",
      handleMessageEdited
    );

    s.on(
      "chat:message-deleted",
      handleMessageDeleted
    );

    s.on(
      "chat:message-reacted",
      handleReaction
    );

    // =========================================
    // CLEANUP
    // =========================================

    return () => {

      s.off(
        "connect",
        joinRoom
      );

      s.off(
        "chat:new-message",
        handleNewMessage
      );

      s.off(
        "chat:typing",
        handleTyping
      );

      s.off(
        "chat:stop-typing",
        handleStopTyping
      );

      s.off(
        "chat:read",
        handleRead
      );

      s.off(
        "chat:delivered",
        handleDelivered
      );

      s.off(
        "chat:message-edited",
        handleMessageEdited
      );

      s.off(
        "chat:message-deleted",
        handleMessageDeleted
      );

      s.off(
        "chat:message-reacted",
        handleReaction
      );
    };

  }, [
    conversationId,
    userId,
    setMessages,
    setIsTyping,
  ]);
}