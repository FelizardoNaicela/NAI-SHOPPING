import { useEffect } from "react";
import { getSocket }
from "../../socket/socket";

type Props = {
  conversationId?: string;
  messagesLength: number;
};

export function useChatRead({
  conversationId,
  messagesLength,
}: Props) {

  useEffect(() => {
  const socket = getSocket();

  if (!socket || !conversationId)
    return;

  socket.emit("chat:read", {
    conversationId,
  });

  window.dispatchEvent(
    new CustomEvent("chat-read")
  );

}, [
  conversationId,
  messagesLength,
]);
}