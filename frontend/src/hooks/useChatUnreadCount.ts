import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { getSocket } from "../socket/socket";

type ConversationRaw = {
  id: string;
  _count?: {
    messages?: number;
  };
};

export default function useChatUnreadCount(
  userId?: string
) {
  const [unreadCount, setUnreadCount] =
    useState(0);

  const loadUnreadCount = useCallback(
    async () => {
      if (!userId) {
        setUnreadCount(0);
        return;
      }

      try {
        const [
          personalRes,
          storeRes,
        ] = await Promise.all([
          api.get("/chat/conversations"),
          api.get("/chat/store"),
        ]);

        const personal =
          Array.isArray(personalRes.data)
            ? personalRes.data
            : [];

        const store =
          Array.isArray(storeRes.data)
            ? storeRes.data
            : [];

        const personalCount =
          personal.reduce(
            (
              total: number,
              conversation: ConversationRaw
            ) =>
              total +
              (conversation._count?.messages ?? 0),
            0
          );

        const storeCount =
          store.reduce(
            (
              total: number,
              conversation: ConversationRaw
            ) =>
              total +
              (conversation._count?.messages ?? 0),
            0
          );

        const total =
          personalCount + storeCount;


        setUnreadCount(total);

      } catch (error) {


      }
    },
    [userId]
  );

  useEffect(() => {

    if (!userId) {
      return;
    }

    const socket = getSocket();

    // =========================================
    // CONTADOR INICIAL
    // =========================================

    loadUnreadCount();

    // =========================================
    // NOVA MENSAGEM
    //
    // Não precisamos calcular +1 manualmente.
    // Recarregamos as duas listas e deixamos
    // o backend dizer qual é o valor correto.
    // =========================================

    const handleNewMessage = (
      message: any
    ) => {

      if (!message?.conversationId) {
        return;
      }

      // mensagem enviada pelo próprio usuário
      // não aumenta unread
      if (
        message.senderId === userId
      ) {
        return;
      }

      loadUnreadCount();
    };

    // =========================================
    // LEITURA
    //
    // O Inbox dispara "chat-read" localmente
    // depois de abrir uma conversa.
    // =========================================

    const handleChatRead = () => {

      loadUnreadCount();
    };

    // =========================================
    // SOCKET
    // =========================================

    socket?.on(
      "chat:new-message",
      handleNewMessage
    );

    window.addEventListener(
      "chat-read",
      handleChatRead
    );

    return () => {

      socket?.off(
        "chat:new-message",
        handleNewMessage
      );

      window.removeEventListener(
        "chat-read",
        handleChatRead
      );

    };

  }, [
    userId,
    loadUnreadCount,
  ]);

  return {
    unreadCount,
    refreshUnread: loadUnreadCount,
  };
}