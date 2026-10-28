
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import styles from "./RightDrawerHandle.module.css";

type RightDrawerHandleProps = {
  open: boolean;
  onToggle: () => void;
};

const MOVE_THRESHOLD = 10;
const SWIPE_THRESHOLD = 45;

export default function RightDrawerHandle({
  open,
  onToggle,
}: RightDrawerHandleProps) {
  const [y, setY] = useState(() => {
    const saved = localStorage.getItem(
      "right-drawer-handle-y",
    );

    const parsed = saved === null ? 180 : Number(saved);

    return Number.isFinite(parsed) ? parsed : 180;
  });

  const dragging = useRef(false);
  const moved = useRef(false);
  const gesture = useRef<"none" | "vertical" | "horizontal">(
    "none",
  );
  const start = useRef({ x: 0, y: 0 });
  const startY = useRef(180);
  const pointerId = useRef<number | null>(null);
  const toggled = useRef(false);

  useEffect(() => {
    localStorage.setItem(
      "right-drawer-handle-y",
      String(y),
    );
  }, [y]);

  function handlePointerDown(
    e: PointerEvent<HTMLButtonElement>,
  ) {
    if (!e.isPrimary) return;

    dragging.current = true;
    moved.current = false;
    gesture.current = "none";
    toggled.current = false;
    pointerId.current = e.pointerId;

    start.current = {
      x: e.clientX,
      y: e.clientY,
    };

    startY.current = y;

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

    if (gesture.current === "none") {
      if (
        Math.hypot(deltaX, deltaY) < MOVE_THRESHOLD
      ) {
        return;
      }

      moved.current = true;

      gesture.current =
        Math.abs(deltaX) > Math.abs(deltaY)
          ? "horizontal"
          : "vertical";
    }

    // Arrasto vertical: reposiciona o puxador.
    if (gesture.current === "vertical") {
      const newY = startY.current + deltaY;

      const clamped = Math.min(
        Math.max(70, newY),
        Math.max(70, window.innerHeight - 120),
      );

      setY(clamped);
      return;
    }

    // Gesto horizontal para a esquerda: alterna o drawer uma vez.
    if (
      gesture.current === "horizontal" &&
      deltaX < -SWIPE_THRESHOLD &&
      !toggled.current
    ) {
      toggled.current = true;
      dragging.current = false;

      navigator.vibrate?.(10);
      onToggle();
    }
  }

  function finishPointer(
    e: PointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) {
    if (pointerId.current !== e.pointerId) return;

    const shouldToggle =
      dragging.current &&
      !moved.current &&
      !cancelled;

    dragging.current = false;
    pointerId.current = null;

    if (shouldToggle) {
      onToggle();
    }
  }

  return (
    <button
      type="button"
      aria-label={
        open
          ? "Fechar Ranking Nacional"
          : "Abrir Ranking Nacional"
      }
      aria-expanded={open}
      className={styles.handle}
      style={{
        top: y,
        touchAction: "none",
        cursor: dragging.current ? "grabbing" : "grab",
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
      {open ? "❯" : "❮"}
    </button>
  );
}
