import { useEffect, useState } from "react";
import { api } from "../services/api";
import { ChatWindow } from "../components/ChatWindow";
import { useAuth } from "../auth/AuthProvider";
import { getSocket } from "../socket/socket";
import ConversationList, {
} from "../components/conversation/ConversationList";
import styles from "./Inbox.module.css";
import { getImageUrl } from "../utils/image";

type ConversationRaw = {
  id: string;
  _count?: {
  messages: number;
  lastSeen?: string;
};

  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
      lastSeen?: string;
  };

  store?: {
    id: string;
    name: string;
    avatarUrl?: string;
    ownerId: string;
    owner?: {
  lastSeen?: string;
};
  };

  messages: {
    content: string;
  }[];
};

type ConversationUI = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount?: number;
  targetUserId?: string;
  lastSeen?: string;
};

export function Inbox() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationUI[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ConversationUI | null>(null);

  // 🔥 modo: "user" | "store"
  const [mode, setMode] = useState<"user" | "store">("user");

  // 🔒 espera user
  if (!user) {
    return <div style={{ padding: 20 }}>Carregando usuário...</div>;
  }

  const userId = user.id; // ✅ PADRÃO CORRETO

  useEffect(() => {
  const totalUnread = conversations.reduce(
    (total, conversation) =>
      total + (conversation.unreadCount || 0),
    0
  );

  window.dispatchEvent(
    new CustomEvent("chat-unread-count", {
      detail: totalUnread,
    })
  );
}, [conversations]);

  // 🔥 detectar automaticamente se tem loja
  useEffect(() => {
    const storeId = localStorage.getItem("storeId");
    if (storeId) {
      setMode("store");
    }
  }, []);

  // 📥 carregar conversas
  useEffect(() => {
    async function load() {
      try {
        let res;

        if (mode === "store") {
          res = await api.get("/chat/store");
        } else {
          res = await api.get("/chat/conversations");
        }

        const normalized: ConversationUI[] = res.data.map(
  (conv: ConversationRaw) => {
    const isStoreMode = mode === "store";
    return {
  id: conv.id,

  name: isStoreMode
    ? conv.user?.name || "Usuário"
    : conv.store?.name || "Loja",

 avatar: isStoreMode
  ? (
      conv.user?.avatarUrl
        ? getImageUrl(conv.user.avatarUrl)
        : undefined
    )
  : (
      conv.store?.avatarUrl
        ? getImageUrl(conv.store.avatarUrl)
        : undefined
    ),

  targetUserId: isStoreMode
    ? conv.user?.id
    : conv.store?.ownerId,

  unreadCount: conv._count?.messages || 0,

  lastMessage: getConversationPreview(
  conv.messages?.[0]
),

  lastSeen: isStoreMode
  ? conv.user?.lastSeen
  : conv.store?.owner?.lastSeen,
};
          }
        );

        setConversations(normalized);

        const activeId =
  localStorage.getItem(
    "activeConversationId"
  );

if (activeId) {

  const conv =
    normalized.find(
      c => c.id === activeId
    );

  if (conv) {

    setActiveConversation(conv);

    localStorage.removeItem(
      "activeConversationId"
    );

    const socket =
      getSocket();

    socket?.emit(
      "chat:read",
      {
        conversationId:
          conv.id,
      }
    );

  }
}




      } catch (err) {
      }
    }

    load();
  }, [mode, userId]);

  useEffect(() => {

  if (!activeConversation) {
    return;
  }

  const pendingProduct =
    localStorage.getItem(
      "pendingSharedProductId"
    );

  const pendingPost =
    localStorage.getItem(
      "pendingSharedPostId"
    );

  if (
    !pendingProduct &&
    !pendingPost
  ) {
    return;
  }

  // remove antes de enviar
  localStorage.removeItem(
    "pendingSharedProductId"
  );

  localStorage.removeItem(
    "pendingSharedPostId"
  );

  getSocket()?.emit(
    "chat:share-link",
    {
      conversationId:
        activeConversation.id,

      sharedProductId:
        pendingProduct ?? undefined,

      sharedPostId:
        pendingPost ?? undefined,
    }
  );

}, [activeConversation]);

  useEffect(() => {
  const handleClose = () => {
    setActiveConversation(null);
  };

  window.addEventListener(
    "close-chat",
    handleClose
  );

  return () => {
    window.removeEventListener(
      "close-chat",
      handleClose
    );
  };
}, []);

  useEffect(() => {
  const socket = getSocket();

  if (!socket) return;

  const handleNewMessage = (msg: any) => {
  if (msg.senderId === userId) {
    return;
  }

  setConversations((prev) => {
    const found = prev.find(
      (c) => c.id === msg.conversationId
    );

    // conversa ainda não carregada
    if (!found) {
      return prev;
    }

    const updatedConversation = {
      ...found,

      lastMessage:
        msg.messageType === "IMAGE"
          ? "📷 Imagem"
          : msg.content,

      unreadCount:
        activeConversation?.id === found.id
          ? 0
          : (found.unreadCount || 0) + 1,
    };

    // sobe pro topo
    return [
      updatedConversation,

      ...prev.filter(
        (c) => c.id !== found.id
      ),
    ];
  });
};

  socket.on(
    "chat:new-message",
    handleNewMessage
  );

  return () => {
    socket.off(
      "chat:new-message",
      handleNewMessage
    );
  };
}, [activeConversation, userId]);

  function getConversationPreview(
  message?: any
) {
  if (!message)
    return "";

  switch (message.messageType) {
    case "TEXT":
      return message.content;

    case "IMAGE":
      return "📷 Imagem";

    case "VIDEO":
      return "🎥 Vídeo";

    case "AUDIO":
      return "🎤 Áudio";

    case "DOCUMENT":
      return "📄 Documento";

    case "LOCATION":
      return "📍 Localização";

    default:
      return message.content ?? "";
  }
}
  return (

    <>
    <div
    className={`${styles.wrapper}
    ${
        activeConversation
            ? styles.chatMode
            : ""
    }`}
>

      {/* 🧾 SIDEBAR */}

<div className={styles.sidebar}>

    <ConversationList
        conversations={conversations}
        activeConversation={activeConversation}
        mode={mode}
        onModeChange={setMode}
        onConversationClick={(conv) => {

            setActiveConversation(conv);

            setConversations((prev) =>
                prev.map((c) =>
                    c.id === conv.id
                        ? {
                              ...c,
                              unreadCount: 0,
                          }
                        : c
                )
            );

            const socket = getSocket();

            socket?.emit("chat:read", {
                conversationId: conv.id,
            });

        }}
    />

</div>

      {/* 💬 CHAT */}
      <div className={styles.chat}>

        {activeConversation ? (
          <ChatWindow
          targetUserId={activeConversation.targetUserId}
            conversationId={activeConversation.id}
            userId={userId} // ✅ sempre correto
            conversationName={activeConversation.name}
            avatarUrl={activeConversation.avatar}
            lastSeen={activeConversation.lastSeen}
          />
        ) : (
          <div className={styles.empty}>

    <div className={styles.emptyIcon}>
        💬
    </div>

    <div className={styles.emptyTitle}>
        Nenhuma conversa selecionada
    </div>

    <div className={styles.emptyText}>
        Escolha uma conversa para começar a conversar.
    </div>

</div>
        )}
      </div>
    </div>
    </>
  );
}