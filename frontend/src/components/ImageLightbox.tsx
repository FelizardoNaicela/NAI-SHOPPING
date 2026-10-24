import { useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

import SmartImage from "./SmartImage";
import styles from "./ImageLightbox.module.css";

type Props = {
  images: string[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export default function ImageLightbox({
  images,
  index,
  onClose,
  onNext,
  onPrev,
}: Props) {

  useEffect(() => {

    function handleKey(e: KeyboardEvent) {

      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();

    }

    window.addEventListener("keydown", handleKey);

    return () =>
      window.removeEventListener("keydown", handleKey);

  }, [onClose, onNext, onPrev]);

  return createPortal(

    <div
      className={styles.overlay}
      onClick={onClose}
    >

      <button
        className={`${styles.iconButton} ${styles.closeButton}`}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X size={26} />
      </button>

      <div
        className={styles.imageWrapper}
        onClick={(e) => e.stopPropagation()}
      >

        <SmartImage
          src={images[index]}
          fit="contain"
          aspectRatio="auto"
        />

      </div>

      {images.length > 1 && (

        <>
          <button
            className={`${styles.iconButton} ${styles.leftButton}`}
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <ChevronLeft size={34} />
          </button>

          <button
            className={`${styles.iconButton} ${styles.rightButton}`}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <ChevronRight size={34} />
          </button>
        </>

      )}

    </div>,
document.body
  );

}