import { useState } from "react";

import type { Message } from "../../components/chat/types";

type Props = {
  conversationId?: string;
};

export function useChatMessages({
}: Props) {
  const [messages, setMessages] =
    useState<Message[]>([]);

  const [cursor, setCursor] =
    useState<string | null>(null);

  const [hasMore, setHasMore] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [loadingMessages, setLoadingMessages] =
    useState(true);

  return {
    messages,
    setMessages,

    cursor,
    setCursor,

    hasMore,
    setHasMore,

    loadingMore,
    setLoadingMore,

    loadingMessages,
    setLoadingMessages,
  };
}