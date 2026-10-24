import { useState } from "react";

export function useChatScroll() {

  const [
    showScrollButton,
    setShowScrollButton,
  ] = useState(false);

  return {
    showScrollButton,
    setShowScrollButton,
  };
}