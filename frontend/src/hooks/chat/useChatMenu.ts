import { useEffect, useState } from "react";

import type { Message }
from "../../components/chat/types";

type ContextMenu = {
  x: number;
  y: number;
  message: Message;
} | null;

export function useChatMenu() {

  const [contextMenu, setContextMenu] =
    useState<ContextMenu>(null);

  useEffect(() => {

    function closeMenu() {
      setContextMenu(null);
    }

    window.addEventListener(
      "click",
      closeMenu
    );

    return () => {
      window.removeEventListener(
        "click",
        closeMenu
      );
    };
  }, []);

  return {
    contextMenu,
    setContextMenu,
    closeMenu: () =>
      setContextMenu(null),
  };
}