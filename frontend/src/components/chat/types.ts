export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  store?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  images?: {
    url: string;
    isCover?: boolean;
  }[];
  type?: "NORMAL" | "AUCTION";
  currentBid?: number | null;
  auctionStartPrice?: number | null;
  auctionEndsAt?: string | null;
auctionClosed?: boolean | null;
};

export type Post = {
  id: string;
  content?: string | null;
  images?: { url: string }[];
  store?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
};

export type Auction = {
  id: string;
  title: string;
  currentBid?: number | null;
  imageUrl?: string | null;
  endsAt?: string | null;
  store?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
};

export type MessageReaction = {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
};

export type Message = {
  id: string;

  content: string | null;

  senderId: string;

  conversationId: string;

  createdAt: string;

  editedAt?: string | null;

  deletedAt?: string | null;

  deliveredAt?: string | null;

  readAt?: string | null;

  imageUrl?: string | null;

  audioUrl?: string | null;

  messageType?: string;

  reactions?: MessageReaction[];

  replyTo?: {
    id: string;
    content?: string | null;
    senderId: string;
    imageUrl?: string | null;
    messageType?: string;
  };

  videoUrl?: string | null;

documentUrl?: string | null;

documentName?: string | null;

documentSize?: number | null;

latitude?: number | null;

longitude?: number | null;

thumbnailUrl?: string | null;

 sharedMessageId?: string | null;
  sharedMessage?: Message | null;

sharedProductId?: string | null;
sharedProduct?: Product | null;

sharedPostId?: string | null;
sharedPost?: Post | null;
};