import { createPortal } from "react-dom";
import { forwardRef } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";


type Props = {
  onSelect: (
    emoji: string
  ) => void;

  x: number;
  y: number;
};

export const ReactionPicker = forwardRef<
    HTMLDivElement,
    Props
>(({
    onSelect,
    x,
    y,
}, ref) => {


  const pickerWidth = 320;
const pickerHeight = 400;
const margin = 10;

const left = Math.max(
    margin,
    Math.min(
        x,
        window.innerWidth - pickerWidth - margin
    )
);

      const mobile = window.innerWidth < 480;


const top = Math.max(
    margin,
    Math.min(
        y,
        window.innerHeight - pickerHeight - margin
    )
);

  return createPortal(

    <div
    ref={ref}
    style={{
        position: "fixed",

        top,
        left,

        zIndex: 999999,

        borderRadius: 18,

        overflow: "hidden",

        border: "1px solid var(--border)",

        background: "var(--surface-glass)",

        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",

        boxShadow: "var(--shadow-lg)",

        animation: "pickerAppear .18s ease",
    }}
>
      <EmojiPicker
    onEmojiClick={(emojiData) =>
        onSelect(emojiData.emoji)
    }

    width={mobile ? window.innerWidth - 20 : 320}

    height={mobile ? 340 : 400}

    theme={
        document.documentElement.dataset.theme === "dark"
            ? Theme.DARK
            : Theme.LIGHT
    }
/>
    </div>,

    document.body

 );

});