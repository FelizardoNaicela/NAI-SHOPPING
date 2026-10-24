import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import styles from "./ProductImageUploader.module.css";

type Props = {
  onFilesSelected: (files: File[]) => void;
};

export default function ProductImageUploader({ onFilesSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    onFilesSelected(Array.from(e.target.files));
  }

  return (
    <div
    className={styles.uploader}
    onClick={() => inputRef.current?.click()}
>

    <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={handleSelect}
    />

    <div className={styles.icon}>
        <ImagePlus size={28}/>
    </div>

    <div className={styles.title}>
        Clique para adicionar imagens
    </div>

    <div className={styles.subtitle}>
        JPG • PNG • WEBP
    </div>
<div className={styles.subtitle}>
    Máximo de 10 imagens
</div>

</div>
  );
}
