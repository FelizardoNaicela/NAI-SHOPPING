import { useState, useEffect } from "react";
import { createStorePost } from "../services/posts";
import { api } from "../services/api";
import styles from "./CreatePostForm.module.css";

import ProductImageUploader from "../components/product/ProductImageUploader";
import ProductImagePreview from "../components/product/ProductImagePreview";

interface Props {
  storeId: string;
  onCreated?: () => void;
}

type ImageItem = {
  file: File;
  preview: string;
  isCover: boolean;
};

export default function CreatePostForm({ storeId, onCreated }: Props) {

  const [content, setContent] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  // carregar produtos

  useEffect(() => {
    api.get(`/products?storeId=${storeId}`)
      .then(res => {
        const list = res.data.items || res.data || [];
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => setProducts([]));
  }, [storeId]);

  // adicionar imagens

  function addFiles(files: File[]) {

    const newImages = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isCover: images.length === 0 && i === 0,
    }));

    setImages(prev => [...prev, ...newImages]);
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  function setCover(index: number) {
    setImages(prev =>
      prev.map((img, i) => ({
        ...img,
        isCover: i === index,
      }))
    );
  }

  // upload imagens

  async function uploadImages() {

    if (!images.length) return [];

    const formData = new FormData();

    images.forEach(img => formData.append("files", img.file));

    const res = await api.post(
      "/upload/images",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const uploaded = res.data;

    return uploaded.map((img: any, index: number) => ({
      url: img.largeUrl,
      order: index,
      isCover: images[index].isCover
    }));
  }

  // enviar post

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {

      const uploadedImages = await uploadImages();

      await createStorePost(
        storeId,
        content,
        uploadedImages,
        productId
      );

      setContent("");
      setImages([]);
      setProductId(null);

      onCreated?.();

    } catch (err) {
    }

    setLoading(false);
  }

  return (

    <form
    onSubmit={handleSubmit}
    className={styles.form}
>

      <h3 className={styles.title}>
    Nova publicação
</h3>

      {error && (
    <div className={styles.error}>
        {error}
    </div>
)}

      <textarea
    className={styles.textarea}
    placeholder="O que deseja publicar?"
    value={content}
    onChange={e => setContent(e.target.value)}
    rows={4}
/>

      {/* produto */}

      <select
    className={styles.select}
    value={productId ?? ""}
    onChange={e => setProductId(e.target.value || null)}
>

        <option value="">
          Promover produto (opcional)
        </option>

        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.price} MT
          </option>
        ))}

      </select>

      {/* uploader */}

      <div className={styles.images}>

    <ProductImageUploader
        onFilesSelected={addFiles}
    />

      {/* preview */}

       <ProductImagePreview
        images={images}
        onRemove={removeImage}
        onSetCover={setCover}
    />

</div>

      {/* botão */}

      <button
    type="submit"
    disabled={loading}
    className={styles.submitButton}
>
    {loading
        ? "Publicando..."
        : "Publicar"}
</button>

    </form>
  );
}