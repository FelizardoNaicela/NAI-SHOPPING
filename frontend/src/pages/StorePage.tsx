import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getStorePage,
} from '../services/stores';
import {
  getCachedStore,
  setCachedStore,
} from '../services/storeCache';
import StoreFeed from '../components/StoreFeed';
import SmartImage from '../components/SmartImage';
import CreatePostForm from '../components/CreatePostForm';
import StoreHeader from "./StorePage/StoreHeader";
import StoreLeftSidebar from "../components/StoreLeftSidebar";
import StoreRightSidebar from "../components/StoreRightSidebar";
import { StoreProvider } from "../context/StoreContext";
import { api } from '../services/api';
import { listProducts } from '../services/products';
import FloatingDrawers from "../components/drawer/FloatingDrawers";
import ProductCard from "../components/ProductCard";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
};

type Category = {
  id: string;
  name: string;
};

type SidebarFeed = {
  category: Category;
  totalInCategory: number;
  items: Product[];
};

export default function StorePage() {
  const { id } = useParams();
  const navigate = useNavigate();

const [data, setData] = useState<{
  store: any;
  stats: any;
  viewer: any;
  sidebarFeeds: SidebarFeed[];
} | null>(null);  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'feed' | 'products'>('feed');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

const [productSearch, setProductSearch] = useState("");
const [storeProducts, setStoreProducts] = useState<any[]>([]);
const [productsLoading, setProductsLoading] = useState(false);

useEffect(() => {
  function handleResize() {
    setIsMobile(window.innerWidth < 900);
  }

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
  // ========================= LOAD STORE =========================

  useEffect(() => {
    if (!id) return;

    const cached = getCachedStore(id);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    getStorePage(id)
      .then(res => {
        setData(res);
        setCachedStore(id, res);

         // 🔥 salva aqui
      if (res.viewer?.isOwner) {
        localStorage.setItem("storeId", res.store.id);
      }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
  if (!id || !data?.store?.id) {
    return;
  }

  const search = productSearch.trim();

  if (!search) {
    setStoreProducts([]);
    setProductsLoading(false);
    return;
  }

  let cancelled = false;

  const timer = setTimeout(async () => {
    try {
      setProductsLoading(true);

      const result = await listProducts({
        storeId: data.store.id,
        search,
        limit: 50,
        country: data.store.countryCode,
        region: data.store.region,
        sort: "recent",
      });

      if (cancelled) {
        return;
      }

      setStoreProducts(
        Array.isArray(result?.items)
          ? result.items
          : [],
      );
    } catch (error) {
      if (!cancelled) {

        setStoreProducts([]);
      }
    } finally {
      if (!cancelled) {
        setProductsLoading(false);
      }
    }
  }, 300);

  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}, [
  id,
  data?.store?.id,
  data?.store?.countryCode,
  data?.store?.region,
  productSearch,
]);

  if (loading) return <p style={{ padding: 24 }}>Carregando banca...</p>;
  if (!data) return <p style={{ padding: 24 }}>Banca não encontrada</p>;

  const { store, stats, viewer, sidebarFeeds } = data;

const productsLabel =
  store.type === "RESTAURANT" || store.type === "BAKERY"
    ? "Menu"
    : store.type === "BEAUTY" ||
        store.type === "CLINIC" ||
        store.type === "SERVICES"
      ? "Serviços"
      : "Produtos";

  const handlePostCreated = () => {
    setShowCreateModal(false);
    setFeedKey(prev => prev + 1);
  };
async function startChat(storeId: string) {
  const { data } = await api.post(`/chat/conversation/${storeId}`);

  // 🔥 salva conversa ativa
  localStorage.setItem("activeConversationId", data.id);

  // 🔥 ir para inbox sem reload pesado
  navigate("/inbox");
}
  // ========================= LAYOUT =========================

  return (
  <StoreProvider value={{ store, stats, viewer, sidebarFeeds }}>
    <div
  style={{
    maxWidth: 1300,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "240px 1fr 260px",
    gap: 24,
    padding: 24,
    color: "var(--text)",
  }}
>
              <FloatingDrawers />

      {/* ================= LEFT SIDEBAR ================= */}
      {!isMobile && <StoreLeftSidebar store={store} />}

      {/* ================= CENTER ================= */}
<main style={{ minWidth: 0 }}>
        <StoreHeader
          store={store}
          stats={stats}
          viewer={viewer}
        />
        <button
  onClick={() => startChat(store.id)}
  style={{
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    cursor: "pointer",
    fontWeight: 600,
    marginBottom: 20,
  }}
>
  Falar com vendedor
</button>


        {/* ================= TABS ================= */}
        <div
  style={{
    display: "flex",
    gap: 24,
    borderBottom: "1px solid var(--border)",
    marginBottom: 24,
  }}
>
  <button
    onClick={() => setTab("feed")}
    style={{
      padding: "12px 0",
      border: "none",
      background: "none",
      borderBottom:
        tab === "feed"
          ? "2px solid var(--primary)"
          : "2px solid transparent",
      color: "var(--text)",
      fontWeight: tab === "feed" ? "bold" : "normal",
      cursor: "pointer",
    }}
  >
    Publicações
  </button>

  <button
    onClick={() => setTab("products")}
    style={{
      padding: "12px 0",
      border: "none",
      background: "none",
      borderBottom:
        tab === "products"
          ? "2px solid var(--primary)"
          : "2px solid transparent",
      color: "var(--text)",
      fontWeight: tab === "products" ? "bold" : "normal",
      cursor: "pointer",
    }}
  >
    {productsLabel}
  </button>
</div>

        {/* ================= FEED ================= */}
        {tab === 'feed' && (
          <>
            {viewer.isOwner && (
              <button
  onClick={() => setShowCreateModal(true)}
  style={{
    marginBottom: 24,
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    background: "var(--primary)",
    color: "var(--text-on-primary)",
    cursor: "pointer",
    fontWeight: 600,
  }}
>
  Nova publicação
</button>
            )}

            <StoreFeed key={feedKey} storeId={store.id} />
          </>
        )}

        {/* ================= PRODUCTS ================= */}
        {tab === 'products' && (
          <>
            {viewer.isOwner && (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 32,
    }}
  >

    <button
      onClick={() =>
        navigate(`/stores/${store.id}/panel`)
      }
      style={{
        padding: "10px 18px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      ⚙️ Painel da banca
    </button>
  </div>
)}


<div style={{ marginBottom: 24 }}>
  <input
    type="text"
    placeholder={`Pesquisar em ${store.name}...`}
    value={productSearch}
    onChange={(e) => setProductSearch(e.target.value)}
    style={{
      width: "100%",
      padding: "12px 16px",
      borderRadius: 10,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      color: "var(--text)",
      fontSize: 15,
      boxSizing: "border-box",
      outline: "none",
    }}
  />
</div>

{/* ================= PESQUISA DE PRODUTOS ================= */}

{productSearch.trim() ? (
  <>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <h3 style={{ margin: 0 }}>
        Resultados
      </h3>

      {!productsLoading && (
        <span
          style={{
            fontSize: 13,
            color: "var(--text-soft)",
          }}
        >
          {storeProducts.length} produto
          {storeProducts.length === 1 ? "" : "s"}
        </span>
      )}
    </div>

    {productsLoading && (
      <div
        style={{
          padding: 30,
          textAlign: "center",
          color: "var(--text-soft)",
        }}
      >
        A procurar produtos...
      </div>
    )}

    {!productsLoading &&
      storeProducts.length === 0 && (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color: "var(--text-soft)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--surface-glass)",
          }}
        >
          Nenhum resultado encontrado nesta banca.
        </div>
      )}

    {!productsLoading &&
      storeProducts.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {storeProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                type: product.type,
                price: product.price,
                stock: product.stock,
                imageUrl: product.imageUrl,
                storeName: store.name,
                currentBid: product.currentBid,
                auctionStartPrice:
                  product.auctionStartPrice,
                auctionEndsAt:
                  product.auctionEndsAt,
                auctionClosed:
                  product.auctionClosed,
              }}
              showStore={false}
            />
          ))}
        </div>
      )}
  </>
) : (
  /* ================= CATEGORIAS ================= */

  <>
               <h3>Categorias</h3>

            {sidebarFeeds.map((feed) => (
              <div key={feed.category.id} style={{ marginBottom: 32 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <strong>{feed.category.name}</strong>

                  <Link
  to={`/stores/${store.id}/category/${feed.category.id}`}
  style={{
    fontSize: 12,
    color: "var(--primary)",
    textDecoration: "none",
  }}
>
  Ver todos
</Link>
                </div>
                <div
  style={{
    fontSize: 12,
    marginBottom: 8,
    color: "var(--text-soft)",
  }}
>
                  {feed.totalInCategory} produtos
                </div>

                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', color: "var(--text)" }}>
                  {feed.items.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/product/${p.id}`)}
                     style={{
  width: 160,
  minWidth: 160,
  maxWidth: 160,

  border: "1px solid var(--border)",
  borderRadius: 10,
  overflow: "hidden",

  cursor: "pointer",

  background: "var(--surface-glass)",
  backdropFilter: "blur(10px)",

  color: "var(--text)",

  transition: ".2s",

  flexShrink: 0,
}}
                    >
                      <SmartImage
                        src={p.imageUrl}
                        aspectRatio="1 / 1"
                        fit="cover"
                      />

                      <div style={{ padding: 8 }}>
                       <div
  style={{
    fontSize: 14,
    marginBottom: 4,

    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }}
>
  {p.name}
</div>
                        <strong>{p.price} MT</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
   </>
)}

      </main>

      {/* ================= RIGHT SIDEBAR ================= */}
      {!isMobile && (
  <StoreRightSidebar
  sidebarFeeds={sidebarFeeds}
  navigate={navigate}
/>
)}

      {/* ================= MODAL ================= */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
  onClick={e => e.stopPropagation()}
  style={{
    width: 500,
    maxWidth: "90%",
    background: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    padding: 24,
    borderRadius: 12,
    boxShadow: "var(--shadow-lg)",
  }}
>
            <CreatePostForm
              storeId={store.id}
              onCreated={handlePostCreated}
            />
          </div>
        </div>
      )}

    </div>
  </StoreProvider>
);
}