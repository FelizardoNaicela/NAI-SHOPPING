import { useEffect, useState } from "react";

export function useChatDrafts() {
  const [drafts, setDrafts] =
    useState<Record<string, string>>({});

  useEffect(() => {
    const savedDrafts =
      localStorage.getItem(
        "chat-drafts"
      );

    if (savedDrafts) {
      setDrafts(
        JSON.parse(savedDrafts)
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "chat-drafts",
      JSON.stringify(drafts)
    );
  }, [drafts]);

  function getDraft(
    conversationId?: string
  ) {
    if (!conversationId) {
      return "";
    }

    return (
      drafts[conversationId] || ""
    );
  }

  function saveDraft(
    conversationId: string,
    value: string
  ) {
    setDrafts((prev) => ({
      ...prev,
      [conversationId]: value,
    }));
  }

  function clearDraft(
    conversationId: string
  ) {
    setDrafts((prev) => ({
      ...prev,
      [conversationId]: "",
    }));
  }

  return {
    drafts,

    getDraft,
    saveDraft,
    clearDraft,
  };
}