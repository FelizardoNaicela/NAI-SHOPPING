import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { getSocket } from "../socket/socket";

type User = {
  sub?: string;
};

export default function useHeaderNotifications(
  user?: User
) {
  const navigate = useNavigate();

  // =========================================
  // MENSAGENS JÁ NOTIFICADAS
  // =========================================

  const notifiedMessageIds =
    useRef<Set<string>>(new Set());

  // =========================================
  // TEXTO DA NOTIFICAÇÃO
  // =========================================

  function getMessageNotificationText(
    msg: any
  ): string {
    if (!msg) {
      return "Nova mensagem";
    }

    switch (msg.messageType) {
      case "IMAGE":
        return "📷 Imagem";

      case "VIDEO":
        return "🎥 Vídeo";

      case "AUDIO":
        return "🎤 Áudio";

      case "DOCUMENT":
        return msg.documentName
          ? `📄 ${msg.documentName}`
          : "📄 Documento";

      case "LOCATION":
        return "📍 Localização";

      case "SHARED_MESSAGE":
        return "↗️ Mensagem compartilhada";

      case "SHARED_LINK":
        if (msg.sharedProduct) {
          return `🛍️ ${
            msg.sharedProduct.name ??
            "Produto compartilhado"
          }`;
        }

        if (msg.sharedPost) {
          return "📰 Publicação compartilhada";
        }

        return "🔗 Link compartilhado";

      case "SHARED_PRODUCT":
        return `🛍️ ${
          msg.sharedProduct?.name ??
          "Produto compartilhado"
        }`;

      case "SHARED_POST":
        return "📰 Publicação compartilhada";

      default:
        break;
    }

    const content =
      typeof msg.content === "string"
        ? msg.content.trim()
        : "";

    if (content) {
      return content;
    }

    return "Nova mensagem";
  }

  // =========================================
  // NOME DO REMETENTE
  // =========================================

 function getNotificationSenderName(
  msg: any
): string {
  const senderId = msg?.sender?.id;

  const storeOwnerId =
    msg?.conversation?.store?.ownerId;

  if (
    storeOwnerId &&
    senderId === storeOwnerId
  ) {
    const storeName =
      msg?.conversation?.store?.name;

    if (
      typeof storeName === "string" &&
      storeName.trim()
    ) {
      return storeName.trim();
    }
  }

  const senderName =
    msg?.sender?.name;

  if (
    typeof senderName === "string" &&
    senderName.trim()
  ) {
    return senderName.trim();
  }

  return "Nova mensagem";
}

  // =========================================
  // NOTIFICAÇÃO DO NAVEGADOR
  // =========================================

  function showMessageNotification(
    msg: any
  ) {
    if (!("Notification" in window)) {
      return;
    }

    if (
      Notification.permission !==
      "granted"
    ) {
      return;
    }

    const text =
      getMessageNotificationText(msg);

    const senderName =
      getNotificationSenderName(msg);

    const notification =
      new Notification(
        senderName,
        {
          body: text,

          icon:
            msg?.sender?.avatarUrl ??
            msg?.conversation?.store?.avatarUrl ??
            "/logo192.png",

          badge: "/logo192.png",

          tag:
            `chat-${msg.conversationId}`,
        }
      );

    notification.onclick = () => {
  window.focus();

  localStorage.setItem(
    "activeConversationId",
    msg.conversationId
  );

  navigate("/inbox");

  notification.close();
};
  }

  // =========================================
  // PROCESSAR MENSAGEM NOVA
  // =========================================

  function processMessage(
    msg: any
  ) {
    if (!msg) {
      return;
    }

    const messageId =
      msg.id ??
      msg.messageId;

    if (!messageId) {
      return;
    }

    // =======================================
    // A MENSAGEM É MINHA
    // =======================================

    if (
      msg.senderId === user?.sub
    ) {
      return;
    }

    // =======================================
    // EVITAR DUPLICAÇÃO
    // =======================================

    if (
      notifiedMessageIds.current.has(
        messageId
      )
    ) {
      return;
    }

    notifiedMessageIds.current.add(
      messageId
    );

    // =======================================
    // CONVERSA ATUAL
    // =======================================

    const activeConversation =
      sessionStorage.getItem(
        "activeConversation"
      );

    const sameConversation =
      activeConversation ===
      msg.conversationId;

    /*
     * Se estou vendo a conversa neste
     * momento, não mostramos notificação.
     */

    if (
      !document.hidden &&
      sameConversation
    ) {
      return;
    }

    // =======================================
    // MOSTRAR NOTIFICAÇÃO
    // =======================================

    showMessageNotification(msg);
  }

  // =========================================
  // PERMISSÃO DO NAVEGADOR
  // =========================================

  useEffect(() => {
    if (
      !("Notification" in window)
    ) {
      return;
    }

    if (
      Notification.permission ===
      "default"
    ) {
      Notification.requestPermission()
        .then(() => {
        })
        .catch(() => {
        });
    }
  }, []);

  // =========================================
  // SOCKET
  // =========================================

  useEffect(() => {
    if (!user?.sub) {
      return;
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanupSocket: (() => void) | null = null;

    const setupSocket = () => {
      const socket = getSocket();

      // Socket ainda não foi criado.
      // Esperamos o AuthProvider terminar createSocket().
      if (!socket) {
        retryTimer = setTimeout(
          setupSocket,
          300
        );

        return;
      }

      // =======================================
      // NOVA MENSAGEM
      // =======================================

      const handleNewMessage = (msg: any) => {
        processMessage(msg);
      };

      // =======================================
      // CONNECT
      // =======================================

      const handleConnect = () => {

      };

      // =======================================
      // LISTENERS
      // =======================================

      socket.on(
        "chat:new-message",
        handleNewMessage
      );

      socket.on(
        "connect",
        handleConnect
      );

      // =======================================
      // CONECTAR
      // =======================================

      if (!socket.connected) {
        socket.connect();
      } else {
      }

      // =======================================
      // CLEANUP
      // =======================================

      cleanupSocket = () => {
        socket.off(
          "chat:new-message",
          handleNewMessage
        );

        socket.off(
          "connect",
          handleConnect
        );
      };
    };

    setupSocket();

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }

      if (cleanupSocket) {
        cleanupSocket();
      }
    };
  }, [
    user?.sub,
    navigate,
  ]);
}