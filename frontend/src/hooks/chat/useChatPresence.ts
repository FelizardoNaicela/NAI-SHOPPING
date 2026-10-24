import { useEffect, useState } from "react";

import { getSocket } from "../../socket/socket";

type Props = {
  targetUserId?: string;
};

export function useChatPresence({
  targetUserId,
}: Props) {
  const [isOnline, setIsOnline] =
    useState(false);

  useEffect(() => {
    const socket = getSocket();

    if (!socket || !targetUserId)
      return;

    socket.on(
      "chat:status",
      handleStatus
    );

    socket.emit("chat:get-status", {
      targetUserId,
    });

    function handleStatus(data: any) {
      if (data.userId === targetUserId) {
        setIsOnline(data.online);
      }
    }

    return () => {
      socket.off(
        "chat:status",
        handleStatus
      );
    };
  }, [targetUserId]);

  return {
    isOnline,
  };
}