import { X } from "lucide-react";
import styles from "./ProductImagePreview.module.css";

type ImageItem = {
  file: File
  preview: string
  isCover: boolean
}

interface Props {
  images: ImageItem[]
  onRemove: (index: number) => void
  onSetCover: (index: number) => void
}

export default function ProductImagePreview({
  images,
  onRemove,
  onSetCover,
}: Props) {

  if (!images.length) return null

  return (
    <div className={styles.grid}>
      {images.map((img, index) => (

        <div
          key={index}
    className={`${styles.card} ${
        img.isCover ? styles.cover : ""
    }`}
>


          <img
             src={img.preview}
    className={styles.image}
          />

          {/* botão remover */}

          <button
            className={styles.remove}
    onClick={() => onRemove(index)}
>
    <X size={16}/>
          </button>

          {/* botão capa */}

          {!img.isCover && (
            <button
             className={styles.coverButton}
    onClick={() => onSetCover(index)}
>
    Definir capa
            </button>
          )}

          {img.isCover && (
            <div className={styles.coverBadge}>
    Capa
</div>
          )}

        </div>

      ))}
    </div>
  )
}