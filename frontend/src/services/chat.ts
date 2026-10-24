import { api } from './api';

export async function shareLink(data: {
  conversationId: string;
  sharedProductId?: string;
  sharedPostId?: string;
  sharedAuctionId?: string;
}) {

  await api.post('/chat/share/link', data);

}