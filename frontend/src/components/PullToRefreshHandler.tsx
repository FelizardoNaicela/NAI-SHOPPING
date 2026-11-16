
import { useEffect, useRef, useState } from "react";

export default function PullToRefreshHandler() {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const pulling = useRef(false);
  const ignored = useRef(false);
  const pullDistanceRef = useRef(0);

  const THRESHOLD = 85;
  const MAX_PULL = 130;

  useEffect(() => {
    const getScrollTop = () => {
      return Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop,
      );
    };

    const hasInnerScrollableParent = (target: EventTarget | null) => {
      let element =
        target instanceof Element ? target : null;

      while (element && element !== document.body &&
        element !== document.documentElement) {
        const style = window.getComputedStyle(element);
        const overflowY = style.overflowY;

        const isScrollable =
          (overflowY === "auto" || overflowY === "scroll") &&
          element.scrollHeight > element.clientHeight + 1;

        if (isScrollable) return true;

        element = element.parentElement;
      }

      return false;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || refreshing) return;

      startY.current = event.touches[0].clientY;
      pulling.current = false;

      ignored.current =
        getScrollTop() > 0 ||
        hasInnerScrollableParent(event.target);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (
        ignored.current ||
        refreshing ||
        event.touches.length !== 1
      ) {
        return;
      }

      const currentY = event.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance <= 0) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }

      if (getScrollTop() > 0) return;

      pulling.current = true;

      const resistance = Math.min(
        distance * 0.55,
        MAX_PULL,
      );

      setPullDistance(resistance);

      if (distance > 0) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (pulling.current && pullDistanceRef.current >= THRESHOLD) {
        setRefreshing(true);
        window.location.reload();
      }

      pulling.current = false;
      ignored.current = false;
      setPullDistance(0);
    };

    const handleTouchCancel = () => {
      pulling.current = false;
      ignored.current = false;
      setPullDistance(0);
    };

    const updatePullDistance = () => {
  pullDistanceRef.current = pullDistance;
};

    updatePullDistance();

    window.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    window.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    window.addEventListener("touchcancel", handleTouchCancel, {
      passive: true,
    });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [refreshing, pullDistance]);

  return (
    <>
      {(pullDistance > 0 || refreshing) && (
        <div
          style={{
            position: "fixed",
            top: "calc(env(safe-area-inset-top, 0px) + 12px)",
            left: "50%",
            zIndex: 99999,
            transform: `translate(-50%, ${Math.min(
              pullDistance,
              MAX_PULL,
            )}px)`,
            opacity: Math.min(pullDistance / 45, 1),
            transition: refreshing ? "none" : "opacity 0.15s",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 17px",
              borderRadius: 30,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                color: "var(--primary)",
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              NAI
            </span>

            <span>
              {refreshing
                ? "A atualizar..."
                : pullDistance >= THRESHOLD
                  ? "Solta para atualizar"
                  : "Puxa para atualizar"}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
