import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  History,
  Package,
  Search,
  SearchX,
  Store as StoreIcon,
  Trash2,
  X,
} from "lucide-react";

import ProductCard from "../components/ProductCard";
import FloatingDrawers from "../components/drawer/FloatingDrawers";
import MarketplaceFilters from "../components/filters/MarketplaceFilters";
import PromotedMarketplaceSlots from "../components/PromotedMarketplaceSlots";

import { searchGlobal, searchSuggestions } from "../services/search";
import { STORE_TYPES } from "../shared/storeTypes";
import VerificationBadge from "../components/VerificationBadge";
import StoreTypeBadge from "../components/store/StoreTypeBadge";
import {
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistory,
  saveSearchHistory,
} from "../services/searchHistory";

import styles from "./SearchPage.module.css";

type Suggestion = {
  text: string;
  type: "product" | "store";
};

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q");
  const navigate = useNavigate();

  // ---------- Estado ----------

  const [searchText, setSearchText] = useState(q ?? "");
  const [history, setHistory] = useState<string[]>([]);

  const [filters, setFilters] = useState({
  country: "MZ",
  region: "",
  time: "all",
  sort: "recent",
  type: "",
});

  const [tab, setTab] = useState<"products" | "stores">("products");

  const [products, setProducts] = useState<any[]>([]);
  const [premiumProduct, setPremiumProduct] = useState<any | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // ---------- Sincronizar o input com a URL ----------

  useEffect(() => {
    setSearchText(q ?? "");
  }, [q]);

  // ---------- Pesquisa ----------

  useEffect(() => {
    if (!q?.trim()) {
      setProducts([]);
      setStores([]);
      setPremiumProduct(null);
      setNextCursor(null);
      return;
    }

    const searchQuery = q;
    let cancelled = false;

    async function fetchSearch() {
      try {
        setLoading(true);
        setError("");

        const result = await searchGlobal(
          searchQuery,
          undefined,
          20,
          filters,
        );

        if (cancelled) {
          return;
        }

        setProducts(Array.isArray(result.products) ? result.products : []);
        setPremiumProduct(result.premiumProduct ?? null);
        setStores(Array.isArray(result.stores) ? result.stores : []);
        setNextCursor(result.nextCursor ?? null);
      } catch (err) {

        if (!cancelled) {
          setError("Não foi possível carregar os resultados.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSearch();

    return () => {
      cancelled = true;
    };
  }, [
  q,
  filters.country,
  filters.region,
  filters.time,
  filters.sort,
  filters.type,
  reloadKey,
]);
  // ---------- Histórico ----------

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // ---------- Sugestões ----------

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchSuggestions(searchText);

        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchText]);

  // ---------- Fechar o dropdown ----------

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // ---------- Carregar mais (agora acrescenta) ----------

  const loadMore = useCallback(async () => {
    if (!q?.trim() || !nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const result = await searchGlobal(q, nextCursor, 20, filters);

      const received = Array.isArray(result.products) ? result.products : [];

      setProducts(previous => {
        const ids = new Set(previous.map(item => item.id));

        return [...previous, ...received.filter((item: any) => !ids.has(item.id))];
      });

      setNextCursor(result.nextCursor ?? null);
    } catch (err) {
    } finally {
      setLoadingMore(false);
    }
  }, [
  q,
  nextCursor,
  loadingMore,
  filters.country,
  filters.region,
  filters.time,
  filters.sort,
  filters.type,
]);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore || !nextCursor) {
        return;
      }

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [loadingMore, nextCursor, loadMore],
  );

  useEffect(() => {
    return () => observer.current?.disconnect();
  }, []);

  // ---------- Ações ----------

  function goTo(text: string) {
    setSearchText(text);
    setShowDropdown(false);

    navigate(`/search?q=${encodeURIComponent(text)}`);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();

    const text = searchText.trim();

    if (!text) {
      return;
    }

    saveSearchHistory(text);
    setHistory(getSearchHistory());

    goTo(text);
  }

  // ---------- Render ----------

  return (
    <div className={styles.page}>
      <FloatingDrawers />

      {/* PESQUISA */}

      <div ref={dropdownRef} className={styles.searchBox}>
        <form className={styles.form} onSubmit={submitSearch}>
          <Link to="/" aria-label="Voltar" className={styles.back}>
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>

          <div className={styles.inputWrapper}>
            <Search size={17} className={styles.inputIcon} />

            <input
              autoFocus
              className={styles.input}
              value={searchText}
              onFocus={() => setShowDropdown(true)}
              onChange={event => {
                setSearchText(event.target.value);
                setShowDropdown(true);
              }}
              placeholder="Pesquisar produtos ou bancas..."
            />
          </div>

          <button type="submit" aria-label="Pesquisar" className={styles.submit}>
            <Search size={19} strokeWidth={2} />
          </button>
        </form>

        {showDropdown && (
          <div className={styles.dropdown}>
            {searchText.trim() === "" ? (
              history.length === 0 ? (
                <div className={styles.dropdownEmpty}>
                  Ainda não tem pesquisas recentes.
                </div>
              ) : (
                <>
                  <div className={styles.dropdownTitle}>Pesquisas recentes</div>

                  {history.map(item => (
                    <div key={item} className={styles.row}>
                      <button
                        type="button"
                        className={styles.option}
                        onClick={() => goTo(item)}
                      >
                        <History size={17} strokeWidth={2} />
                        <span className={styles.optionText}>{item}</span>
                      </button>

                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label={`Remover pesquisa ${item}`}
                        onClick={() => {
                          removeSearchHistory(item);
                          setHistory(getSearchHistory());
                        }}
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className={styles.clearHistory}
                    onClick={() => {
                      clearSearchHistory();
                      setHistory([]);
                    }}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                    Limpar histórico
                  </button>
                </>
              )
            ) : suggestions.length === 0 ? (
              <div className={styles.dropdownEmpty}>Sem sugestões</div>
            ) : (
              suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${index}`}
                  type="button"
                  className={styles.option}
                  onClick={() => goTo(suggestion.text)}
                >
                  {suggestion.type === "store" ? (
                    <StoreIcon size={17} strokeWidth={2} />
                  ) : (
                    <Package size={17} strokeWidth={2} />
                  )}

                  <span className={styles.optionText}>{suggestion.text}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* TÍTULO */}

      {q && (
        <h2 className={styles.heading}>
          Resultados para: <b>{q}</b>
        </h2>
      )}

      {/* FILTROS (valem para produtos e bancas) */}

      <MarketplaceFilters value={filters} onChange={setFilters} />

      <div className={styles.typeChips}>
  <button
    type="button"
    className={`${styles.typeChip} ${
      filters.type === "" ? styles.typeChipActive : ""
    }`}
    onClick={() => setFilters(current => ({ ...current, type: "" }))}
  >
    Todos
  </button>

  {STORE_TYPES.map(({ value, label, Icon }) => (
    <button
      key={value}
      type="button"
      className={`${styles.typeChip} ${
        filters.type === value ? styles.typeChipActive : ""
      }`}
      onClick={() => setFilters(current => ({ ...current, type: value }))}
    >
      <Icon size={14} />
      {label}
    </button>
  ))}
</div>

      {/* ABAS */}

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "products"}
          className={`${styles.tab} ${tab === "products" ? styles.tabActive : ""}`}
          onClick={() => setTab("products")}
        >
          <Package size={16} />
          Produtos
          {!loading && q && <span className={styles.count}>{products.length}</span>}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === "stores"}
          className={`${styles.tab} ${tab === "stores" ? styles.tabActive : ""}`}
          onClick={() => setTab("stores")}
        >
          <StoreIcon size={16} />
          Bancas
          {!loading && q && <span className={styles.count}>{stores.length}</span>}
        </button>
      </div>

      {/* ERRO */}

      {error && (
        <div role="alert" className={styles.errorBox}>
          <AlertTriangle size={17} />
          {error}

          <button
            type="button"
            className={styles.retry}
            onClick={() => setReloadKey(key => key + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading && <p className={styles.state}>A procurar...</p>}

      {/* PRODUTOS */}

      {tab === "products" && (
        <>
          {!loading && !error && q && products.length === 0 && !premiumProduct && (
  <div className={styles.empty}>
    <SearchX size={36} />
    <strong>Nenhum produto encontrado</strong>
    <span>
      {filters.type
        ? "Não há produtos de bancas deste tipo para esta pesquisa. Experimente outro tipo ou escolha \"Todos\"."
        : "Experimente outra pesquisa ou ajuste os filtros."}
    </span>
  </div>
)}

          <div className={styles.productsGrid}>
            <PromotedMarketplaceSlots
              items={products}
              premiumProduct={premiumProduct}
              placement="SEARCH"
              loading={loading || loadingMore}
              renderItem={product => (
                <ProductCard
                  product={{
                    id: product.id,
                    name: product.name,
                    type: product.type,
                    price: product.price,
                    stock: product.stock,
                    discountedPrice: product.discountedPrice ?? null,
                    activeDiscount: product.activeDiscount ?? null,
                    imageUrl: product.imageUrl,
                    storeName: product.store?.name ?? product.storeName,
                    currentBid: product.currentBid,
                    auctionStartPrice: product.auctionStartPrice,
                    auctionEndsAt: product.auctionEndsAt,
                    auctionClosed: product.auctionClosed,
                  }}
                  showStore
                />
              )}
            />
          </div>

          {loadingMore && (
            <p className={styles.state}>A carregar mais produtos...</p>
          )}

          {products.length > 0 && nextCursor && (
            <div ref={lastItemRef} className={styles.sentinel} />
          )}
        </>
      )}

      {/* BANCAS */}

      {tab === "stores" && (
        <>
          {!loading && !error && q && stores.length === 0 && (
  <div className={styles.empty}>
    <SearchX size={36} />
    <strong>Nenhuma banca encontrada</strong>
    <span>
      {filters.type
        ? "Não há bancas deste tipo para esta pesquisa. Experimente outro tipo ou escolha \"Todos\"."
        : "Experimente outra pesquisa ou ajuste os filtros."}
    </span>
  </div>
)}

          <div className={styles.storesList}>
            {stores.map(store => (
              <button
                key={store.id}
                type="button"
                className={styles.store}
                onClick={() => navigate(`/stores/${store.id}`)}
              >
                <span className={styles.avatar}>
                  {store.avatarUrl ? (
                    <img src={store.avatarUrl} alt="" />
                  ) : (
                    <StoreIcon size={22} />
                  )}
                </span>

                <span className={styles.storeInfo}>
  <strong>
    {store.name}{" "}
    <VerificationBadge
      type={store.verificationType}
      verified={store.verified}
      size="sm"
    />
  </strong>

  <span>
    <StoreTypeBadge type={store.type} />{" "}
    {store._count?.followers ?? 0} seguidores
  </span>
</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}