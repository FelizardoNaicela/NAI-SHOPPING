import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import { listProducts } from "../services/products";
import ProductCard from "../components/ProductCard";
import styles from "./StoreCategoryPage.module.css";

export default function StoreCategoryPage() {
  const { id, categoryId } = useParams();

  const [items, setItems] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [nextCursor, setNextCursor] =
    useState<string | null>(null);

  const observer =
    useRef<IntersectionObserver | null>(null);

  async function load() {
    if (!id || !categoryId) return;

    setLoading(true);

    try {
      const result = await listProducts({
        storeId: id,
        category: categoryId,
        limit: 20,
      });

      setItems(result.items);

      setNextCursor(result.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    load();
  }, [id, categoryId]);

  const loadMore = useCallback(async () => {
    if (
      !nextCursor ||
      loadingMore ||
      !id ||
      !categoryId
    )
      return;

    setLoadingMore(true);

    try {
      const result = await listProducts({
        storeId: id,
        category: categoryId,
        cursor: nextCursor,
        limit: 20,
      });

      setItems(prev => {
        const ids = new Set(
          prev.map(p => p.id)
        );

        const novos = result.items.filter(
          (p: any) => !ids.has(p.id)
        );

        return [...prev, ...novos];
      });

      setNextCursor(result.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [
    nextCursor,
    loadingMore,
    id,
    categoryId,
  ]);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (
        loadingMore ||
        !nextCursor
      )
        return;

      if (observer.current)
        observer.current.disconnect();

      observer.current =
        new IntersectionObserver(entries => {
          if (
            entries[0].isIntersecting &&
            nextCursor
          ) {
            loadMore();
          }
        });

      if (node)
        observer.current.observe(node);
    },
    [
      loadingMore,
      nextCursor,
      loadMore,
    ]
  );

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>
        Produtos da categoria
      </h2>

      {items.length === 0 && (
        <p>
          Nenhum produto nesta categoria
        </p>
      )}

      <div
  className={styles.productsGrid}
>
        {items.map((p, index) => {
          const isLast =
            index === items.length - 1;

          return (
            <div
              key={p.id}
              ref={
                isLast
                  ? lastItemRef
                  : null
              }
            >
              <ProductCard
                product={p}
              />
            </div>
          );
        })}
      </div>

      {loadingMore && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--text-soft)",
          }}
        >
          Carregando mais produtos...
        </div>
      )}
    </div>
  );
}