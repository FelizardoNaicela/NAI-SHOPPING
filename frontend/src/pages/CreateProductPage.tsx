import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

import ProductImageUploader from "../components/product/ProductImageUploader";
import ProductImagePreview from "../components/product/ProductImagePreview";
import styles from "./CreateProductPage.module.css"
type ImageItem = {
  file: File;
  preview: string;
  isCover: boolean;
};

export default function CreateProductPage() {

  const { id } = useParams();
  const navigate = useNavigate();
  const storeId = id as string;

  // =========================
  // estados produto
  // =========================

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");

  // =========================
  // categorias
  // =========================

  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");

  // =========================
  // feed
  // =========================

  const [publishToFeed, setPublishToFeed] = useState(true);

  // =========================
  // imagens
  // =========================

  const [images, setImages] = useState<ImageItem[]>([]);

  // =========================
  // loading
  // =========================

  const [loading, setLoading] = useState(false);

  const [productType, setProductType] = useState<"NORMAL" | "AUCTION">("NORMAL");

const [minimumIncrement, setMinimumIncrement] = useState("");

const [reservePrice, setReservePrice] = useState("");

const [auctionStartsAt, setAuctionStartsAt] = useState("");

const [auctionEndsAt, setAuctionEndsAt] = useState("");

const now = new Date()
  .toISOString()
  .slice(0, 16);

  // =========================
  // carregar categorias
  // =========================

  useEffect(() => {

    api.get(`/categories?storeId=${storeId}`)
      .then(res => {
        const list = res.data.items || res.data || [];
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => setCategories([]));

  }, [storeId]);

  useEffect(() => {
  if (
    auctionStartsAt &&
    auctionEndsAt &&
    new Date(auctionEndsAt) < new Date(auctionStartsAt)
  ) {
    setAuctionEndsAt("");
  }
}, [auctionStartsAt]);

  // =========================
  // imagens
  // =========================

  function addFiles(files: File[]) {

    const newImages = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isCover: images.length === 0 && i === 0
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
        isCover: i === index
      }))
    );

  }

  // =========================
  // criar categoria
  // =========================

  async function createCategory() {

    if (!newCategory.trim()) return;

    const res = await api.post("/categories", {
      storeId,
      name: newCategory
    });

    const cat = res.data;

    setCategories(prev => [...prev, cat]);
    setCategoryId(cat.id);
    setNewCategory("");

  }

  // =========================
  // criar subcategoria
  // =========================

  async function createSubCategory() {

    if (!newSubCategory.trim() || !categoryId) return;

    const res = await api.post("/categories", {
      storeId,
      name: newSubCategory,
      parentId: categoryId
    });

    const sub = res.data;

    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, children: [...(cat.children || []), sub] }
          : cat
      )
    );

    setCategoryId(sub.id);
    setNewSubCategory("");

  }

  // =========================
  // upload imagens
  // =========================

  async function uploadImages() {

    if (!images.length) return [];

    const formData = new FormData();

    images.forEach(img => formData.append("files", img.file));

    const res = await api.post("/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    const uploaded = res.data;

    return uploaded.map((img: any, index: number) => ({
      url: img.largeUrl,
      order: index,
      isCover: images[index].isCover
    }));

  }

  // =========================
  // criar produto
  // =========================

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    try {

      if (productType === "AUCTION") {

  if (!auctionStartsAt || !auctionEndsAt) {
    alert("Escolha a data de início e fim do leilão.");
    return;
  }

  if (new Date(auctionEndsAt) <= new Date(auctionStartsAt)) {
    alert("A data de término deve ser posterior à data de início.");
    return;
  }

}

      setLoading(true);

      const uploadedImages = await uploadImages();

     const res = await api.post("/products", {
  storeId,

  name,
  description,

  type: productType,

  price: Number(price),

  stock: Number(stock),

  categoryId,

  images: uploadedImages,

  publishToFeed,

  minimumIncrement:
    productType === "AUCTION"
      ? Number(minimumIncrement)
      : undefined,

  reservePrice:
    reservePrice
      ? Number(reservePrice)
      : undefined,

  auctionStartsAt:
    productType === "AUCTION"
      ? auctionStartsAt
      : undefined,

  auctionEndsAt:
    productType === "AUCTION"
      ? auctionEndsAt
      : undefined,
});

      navigate(`/product/${res.data.id}`);

    } catch (err) {

      alert("Erro ao criar produto");

    }

    setLoading(false);

  }

  // =========================
  // UI
  // =========================

  return (

    <div className={styles.container}>

      <h2 className={styles.title}>
  {productType === "NORMAL"
    ? "Criar Produto"
    : "Criar Leilão"}
</h2>

      <form className={styles.form} onSubmit={handleSubmit}>

<div
  style={{
    display: "flex",
    gap: 20,
    marginBottom: 20,
  }}
>
  <label>
    <input
      type="radio"
      checked={productType === "NORMAL"}
      onChange={() => setProductType("NORMAL")}
    />
    Produto
  </label>

  <label>
    <input
      type="radio"
      checked={productType === "AUCTION"}
      onChange={() => setProductType("AUCTION")}
    />
    Leilão
  </label>
</div>
        {/* dados produto */}

        <input className={styles.input}
          placeholder="Nome do produto"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

         <textarea className={styles.textarea}
          placeholder="Descrição"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <input className={styles.input}
          type="number"
placeholder={
  productType === "NORMAL"
    ? "Preço"
    : "Lance inicial"
}
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
        />

        {productType === "AUCTION" && (
  <>
    <input className={styles.input}
      type="number"
      placeholder="Incremento mínimo"
      value={minimumIncrement}
      onChange={e => setMinimumIncrement(e.target.value)}
    />

    <input className={styles.input}
      type="number"
      placeholder="Preço de reserva (opcional)"
      value={reservePrice}
      onChange={e => setReservePrice(e.target.value)}
    />

     <label className={styles.smallLabel}>Início do leilão</label>

   <input
      className={styles.datetime}
      type="datetime-local"
  value={auctionStartsAt}
  min={now}
  onChange={e => setAuctionStartsAt(e.target.value)}
/>

    <label>Fim do leilão</label>

    <input
      className={styles.datetime}
  type="datetime-local"
  value={auctionEndsAt}
  min={auctionStartsAt || now}
  onChange={e => setAuctionEndsAt(e.target.value)}
/>
  </>
)}

        {productType === "NORMAL" && (
    // campo Stock

        <input className={styles.input}
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={e => setStock(e.target.value)}
        />)}

        {/* categorias */}

        <select className={styles.select}
          value={categoryId ?? ""}
          onChange={e => setCategoryId(e.target.value || null)}
        >

          <option value="">Selecionar categoria</option>

          {categories.map(cat => (

            <optgroup key={cat.id} label={cat.name}>

              <option value={cat.id}>{cat.name}</option>

              {cat.children?.map((sub: any) => (
                <option key={sub.id} value={sub.id}>
                  └ {sub.name}
                </option>
              ))}

            </optgroup>

          ))}

        </select>

        {/* criar categoria */}

        <div className={styles.row}>

          <input className={styles.input}
            placeholder="Nova categoria"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
          />

          <button className={styles.buttonSecondary}
          type="button" onClick={createCategory}>
            Criar
          </button>

        </div>

        {/* criar subcategoria */}

        <div className={styles.row}>

           <input className={styles.input}
            placeholder="Nova subcategoria"
            value={newSubCategory}
            onChange={e => setNewSubCategory(e.target.value)}
          />

          <button className={styles.buttonSecondary}
           type="button" onClick={createSubCategory}>
            Criar Sub
          </button>

        </div>

        {/* imagens */}
<div className={styles.imageSection}>
        <ProductImageUploader onFilesSelected={addFiles} />
</div>
        <div className={styles.previewSection}>
          <ProductImagePreview
            images={images}
            onRemove={removeImage}
            onSetCover={setCover}
          />
        </div>

        {/* feed */}

        <label className={styles.feedOption}>

          <input
            type="checkbox"
            checked={publishToFeed}
            onChange={e => setPublishToFeed(e.target.checked)}
          />

          Publicar produto no feed da banca

        </label>

        <button
          type="submit"
          disabled={loading}
           className={styles.submitButton}
        >

          {
loading
? "Criando..."
: productType === "NORMAL"
    ? "Criar Produto"
    : "Criar Leilão"
}

        </button>

      </form>

    </div>

  );

}