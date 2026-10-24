import { useEffect, useState } from "react";
import { api } from "../../services/api";

export type ConversationImage = {
  id: string;
  url: string;
  createdAt: string;
  senderId?: string;
  senderName?: string;
};

export type ConversationVideo = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  senderId?: string;
  senderName?: string;
};

export type ConversationGalleryItem = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  createdAt: string;
  senderName?: string;
};

export type ConversationAudio = {
  id: string;
  url: string;
  createdAt: string;
};

export type ConversationDocument = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

export type ConversationLocation = {
  id: string;
  latitude: number;
  longitude: number;
  createdAt: string;
};

export type ConversationLink = {
  id: string;
  text: string;
  createdAt: string;
};

export type ConversationMedia = {
  images: ConversationImage[];
  videos: ConversationVideo[];
  gallery: ConversationGalleryItem[];
  audios: ConversationAudio[];
  documents: ConversationDocument[];
  locations: ConversationLocation[];
  links: ConversationLink[];
};

export type ConversationParticipant = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  lastSeen?: string;
};

export type ConversationStatistics = {
  totalMessages: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
};

export type ConversationInfoData = {
  participant: ConversationParticipant;
  media: ConversationMedia;
  statistics: ConversationStatistics;
};

type Props = {
  conversationId?: string;
  open: boolean;
};

export function useConversationInfo({
  conversationId,
  open,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [info, setInfo] =
    useState<ConversationInfoData | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function load() {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
  `/chat/conversation/${conversationId}/info`
);

      setInfo(res.data);
    } catch (err) {

      setError(
        "Não foi possível carregar as informações."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    load();
  }, [conversationId, open]);

  return {
    loading,
    error,
    info,
    reload: load,
  };
}