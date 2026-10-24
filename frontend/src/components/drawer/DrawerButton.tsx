import { useEffect, useRef, useState } from "react";
import styles from "./DrawerButton.module.css";
import { PanelLeftOpen } from "lucide-react";

type DrawerButtonProps = {
  onClick: () => void;
};

export default function DrawerButton({
  onClick,
}: DrawerButtonProps) {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("drawer-position");

    if (saved) {
      return JSON.parse(saved);
    }

    return {
      x: 18,
      y: 90,
    };
  });

  const dragging = useRef(false);
  const moved = useRef(false);
  const offset = useRef({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    localStorage.setItem(
      "drawer-position",
      JSON.stringify(position)
    );
  }, [position]);

  function handlePointerDown(
    e: React.PointerEvent<HTMLButtonElement>
  ) {
    dragging.current = true;
    moved.current = false;

    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!dragging.current) return;

   const deltaX = Math.abs(e.clientX - offset.current.x);
const deltaY = Math.abs(e.clientY - offset.current.y);

if (deltaX > 3 || deltaY > 3) {
    moved.current = true;
}

    const size = 52;

    const x = Math.min(
      Math.max(0, e.clientX - offset.current.x),
      window.innerWidth - size
    );

    const y = Math.min(
      Math.max(0, e.clientY - offset.current.y),
      window.innerHeight - size
    );

    setPosition({ x, y });
  }

  function handlePointerUp() {
    dragging.current = false;

    if (!moved.current) {
      onClick();
    }
  }

  return (
    <button
      className={styles.button}
      style={{
        left: position.x,
        top: position.y,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <PanelLeftOpen
    size={24}
    strokeWidth={2.2}
/>
    </button>
  );
}