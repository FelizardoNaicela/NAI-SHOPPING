import { useEffect, useRef, useState } from "react";
import styles from "./RightDrawerHandle.module.css";

type RightDrawerHandleProps = {
    open: boolean;
    onToggle: () => void;
};

export default function RightDrawerHandle({
    open,
    onToggle,
}: RightDrawerHandleProps) {

    const [y, setY] = useState(() => {
        const saved =
            localStorage.getItem("right-drawer-handle-y");

        return saved
            ? Number(saved)
            : 180;
    });

    const dragging = useRef(false);
    const moved = useRef(false);
    const start = useRef({
        x: 0,
        y: 0,
    });

    useEffect(() => {
        localStorage.setItem(
            "right-drawer-handle-y",
            String(y)
        );
    }, [y]);

    function handlePointerDown(
        e: React.PointerEvent<HTMLButtonElement>
    ) {
        dragging.current = true;
        moved.current = false;

        start.current = {
            x: e.clientX,
            y: e.clientY,
        };

        e.currentTarget.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(
        e: React.PointerEvent<HTMLButtonElement>
    ) {
        if (!dragging.current)
            return;

        const deltaY =
            e.clientY - start.current.y;

        const deltaX =
            start.current.x - e.clientX;

        if (
            Math.abs(deltaY) > 3 ||
            deltaX > 3
        ) {
            moved.current = true;
        }

        const newY =
            y + deltaY;

        const clamped =
            Math.min(
                Math.max(70, newY),
                window.innerHeight - 120
            );

        setY(clamped);

        start.current = {
            x: e.clientX,
            y: e.clientY,
        };

if (deltaX > 45) {

    navigator.vibrate?.(10);

    dragging.current = false;

    onToggle();

}
    }

    function handlePointerUp() {

        dragging.current = false;

        if (!moved.current) {
            onToggle();
        }

    }

    return (

        <button
            className={styles.handle}
            style={{
    top:y,
    cursor:
        dragging.current
            ? "grabbing"
            : "grab",
}}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >

            {open ? "❯" : "❮"}

        </button>

    );

}