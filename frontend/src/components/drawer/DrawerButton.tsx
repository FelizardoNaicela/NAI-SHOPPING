
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { PanelLeftOpen } from "lucide-react";

import styles from "./DrawerButton.module.css";

type DrawerButtonProps = {
  onClick: () => void;
};

const BUTTON_SIZE = 44;
const DRAG_THRESHOLD = 10;

export default function DrawerButton({
  onClick,
}: DrawerButtonProps) {
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem("drawer-position");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          Number.isFinite(parsed.x) &&
          Number.isFinite(parsed.y)
        ) {
          return parsed;
        }
      }
    } catch {
      // Usa a posição padrão se os dados guardados forem inválidos.
    }

    return { x: 18, y: 90 };
  });

  const dragging = useRef(false);
  const moved = useRef(false);

  const start = useRef({ x: 0, y: 0 });
  const startPosition = useRef({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(
      "drawer-position",
      JSON.stringify(position),
    );
  }, [position]);

  function handlePointerDown(
    e: PointerEvent<HTMLButtonElement>,
  ) {
    if (!e.isPrimary) return;

    dragging.current = true;
    moved.current = false;
    pointerId.current = e.pointerId;

    start.current = {
      x: e.clientX,
      y: e.clientY,
    };

    startPosition.current = {
      x: position.x,
      y: position.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(
    e: PointerEvent<HTMLButtonElement>,
  ) {
    if (
      !dragging.current ||
      pointerId.current !== e.pointerId
    ) {
      return;
    }

    const deltaX = e.clientX - start.current.x;
    const deltaY = e.clientY - start.current.y;

    // Pequenos movimentos naturais do dedo não contam como arrasto.
    if (
      !moved.current &&
      Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD
    ) {
      return;
    }

   moved.current = true;

    const x = Math.min(
      Math.max(0, startPosition.current.x + deltaX),
      Math.max(0, window.innerWidth - BUTTON_SIZE),
    );

    const y = Math.min(
      Math.max(0, startPosition.current.y + deltaY),
      Math.max(0, window.innerHeight - BUTTON_SIZE),
    );

    setPosition({ x, y });
  }

  function finishPointer(
    e: PointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) {
    if (pointerId.current !== e.pointerId) return;

    const shouldClick =
      dragging.current && !moved.current && !cancelled;

    dragging.current = false;
    pointerId.current = null;

    if (shouldClick) {
      onClick();
    }
  }

  return (
    <button
      type="button"
      aria-label="Abrir ou fechar menu"
      className={styles.button}
      style={{
        left: position.x,
        top: position.y,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => finishPointer(e)}
      onPointerCancel={(e) => finishPointer(e, true)}
      onLostPointerCapture={(e) => {
        if (pointerId.current === e.pointerId) {
          dragging.current = false;
          pointerId.current = null;
        }
      }}
    >
      <PanelLeftOpen size={24} strokeWidth={2.2} />
    </button>
  );
}
