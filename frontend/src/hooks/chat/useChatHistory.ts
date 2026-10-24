import { useEffect } from "react";
import { api } from "../../services/api";

type Props = {
  conversationId?: string;

  setMessages: React.Dispatch<
    React.SetStateAction<any[]>
  >;

  setCursor: (
    cursor: string | null
  ) => void;

  setHasMore: (
    value: boolean
  ) => void;

  setLoadingMessages: (
    value: boolean
  ) => void;

  setLoadingMore: (
    value: boolean
  ) => void;

  cursor: string | null;

  hasMore: boolean;

  loadingMore: boolean;

  messagesContainerRef:
    React.RefObject<HTMLDivElement | null>;
};

export function useChatHistory({
  conversationId,

  setMessages,

  setCursor,
  setHasMore,

  setLoadingMessages,
  setLoadingMore,

  cursor,
  hasMore,
  loadingMore,
}: Props) {

  // 📥 carregar histórico inicial
  useEffect(() => {
    if (!conversationId) return;

    async function load() {
      try {
        setLoadingMessages(true);

        const { data } = await api.get(
          `/chat/messages/${conversationId}?limit=20`
        );

        setMessages(
          data.messages.reverse()
        );

        setCursor(data.nextCursor);

        setHasMore(data.hasMore);

      } catch (err) {

      } finally {
        setLoadingMessages(false);
      }
    }

    load();
  }, [conversationId]);

  // 📦 carregar mais mensagens
  async function loadMoreMessages() {

  if (
    !conversationId ||
    !cursor ||
    loadingMore ||
    !hasMore
  )
    return;

  try {

    setLoadingMore(true);

    const { data } = await api.get(
      `/chat/messages/${conversationId}?limit=20&cursor=${cursor}`
    );

    const olderMessages =
      data.messages.reverse();

    setMessages((prev) => {

      const merged = [
        ...olderMessages,
        ...prev,
      ];

      return merged.filter(
        (msg, index, self) =>
          index ===
          self.findIndex(
            (m) => m.id === msg.id
          )
      );
    });

    setCursor(data.nextCursor);

    setHasMore(data.hasMore);

  } catch (err) {

  } finally {

    setLoadingMore(false);
  }
}

  return {
    loadMoreMessages,
  };
}