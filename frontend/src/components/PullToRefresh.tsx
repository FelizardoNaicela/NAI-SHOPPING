import { useEffect, useRef, useState } from "react";

const REFRESH_THRESHOLD = 90;
const MAX_PULL = 130;

export default function PullToRefresh() {
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const refreshing = useRef(false);
  const distanceRef = useRef(0);

  const [pullDistance, setPullDistance] =
    useState(0);

  useEffect(() => {
    function setDistance(
      distance: number,
    ) {
      distanceRef.current = distance;
      setPullDistance(distance);
    }

    function isInteractiveElement(
      target: EventTarget | null,
    ) {
      const element =
        target instanceof HTMLElement
          ? target
          : null;

      if (!element) {
        return false;
      }

      return Boolean(
        element.closest(
          "input, textarea, select, button, a, [role='button']",
        ),
      );
    }

    function handleTouchStart(
      event: TouchEvent,
    ) {
      if (
        refreshing.current ||
        window.scrollY > 0 ||
        event.touches.length !== 1
      ) {
        return;
      }

      if (
        isInteractiveElement(
          event.target,
        )
      ) {
        return;
      }

      startY.current =
        event.touches[0].clientY;

      pulling.current = true;
    }

    function handleTouchMove(
      event: TouchEvent,
    ) {
      if (
        !pulling.current ||
        startY.current === null ||
        refreshing.current
      ) {
        return;
      }

      if (window.scrollY > 0) {
        pulling.current = false;
        startY.current = null;
        setDistance(0);
        return;
      }

      const currentY =
        event.touches[0].clientY;

      const rawDistance =
        currentY - startY.current;

      if (rawDistance <= 0) {
        setDistance(0);
        return;
      }

      const distance =
        Math.min(
          rawDistance,
          MAX_PULL,
        );

      setDistance(distance);

      if (rawDistance > 5) {
        event.preventDefault();
      }
    }

    function handleTouchEnd() {
      if (
        !pulling.current ||
        refreshing.current
      ) {
        return;
      }

      const shouldRefresh =
        distanceRef.current >=
        REFRESH_THRESHOLD;

      pulling.current = false;
      startY.current = null;

      if (shouldRefresh) {
        refreshing.current = true;

        setDistance(
          REFRESH_THRESHOLD,
        );

        window.setTimeout(() => {
          window.location.reload();
        }, 150);

        return;
      }

      setDistance(0);
    }

    function handleTouchCancel() {
      pulling.current = false;
      startY.current = null;
      setDistance(0);
    }

    document.addEventListener(
      "touchstart",
      handleTouchStart,
      {
        passive: true,
      },
    );

    document.addEventListener(
      "touchmove",
      handleTouchMove,
      {
        passive: false,
      },
    );

    document.addEventListener(
      "touchend",
      handleTouchEnd,
      {
        passive: true,
      },
    );

    document.addEventListener(
      "touchcancel",
      handleTouchCancel,
      {
        passive: true,
      },
    );

    return () => {
      document.removeEventListener(
        "touchstart",
        handleTouchStart,
      );

      document.removeEventListener(
        "touchmove",
        handleTouchMove,
      );

      document.removeEventListener(
        "touchend",
        handleTouchEnd,
      );

      document.removeEventListener(
        "touchcancel",
        handleTouchCancel,
      );
    };
  }, []);

  if (pullDistance <= 0) {
    return null;
  }

  const progress =
    Math.min(
      pullDistance /
        REFRESH_THRESHOLD,
      1,
    );

  const ready =
    pullDistance >=
    REFRESH_THRESHOLD;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 10000,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        paddingBottom: 10,

        transform: `translateY(${Math.min(
          pullDistance * 0.55 - 35,
          20,
        )}px)`,

        opacity: Math.min(
          progress * 1.5,
          1,
        ),

        transition:
          "transform .2s ease, opacity .2s ease",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background:
            "var(--surface)",
          border:
            "1px solid var(--border)",
          boxShadow:
            "var(--shadow-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text)",
          fontSize: 18,

          transform: `rotate(${
            ready
              ? 180
              : progress * 180
          }deg)`,

          transition:
            "transform .15s ease",
        }}
      >
        ↓
      </div>
    </div>
  );
}