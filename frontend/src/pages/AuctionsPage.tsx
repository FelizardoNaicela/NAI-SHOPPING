import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Gavel,
  Heart,
  Search,
  SearchX,
  Timer,
} from "lucide-react";

import ProductCard from "../components/ProductCard";
import AuctionPanel from "../components/AuctionPanel";
import FloatingDrawers from "../components/drawer/FloatingDrawers";

import { getAuctions, getAuctionStats } from "../services/auctions";
import { listCategories } from "../services/categories";

import styles from "./AuctionPage.module.css";

type CardKey = "active" | "ending" | "favorites";

export default function AuctionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [auctions, setAuctions] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  const [stats, setStats] = useState({
    active: 0,
    ending: 0,
    favorites: 0,
    highestBid: 0,
  });

  const [openedCard, setOpenedCard] = useState<CardKey | null>("active");

  const observer = useRef<IntersectionObserver | null>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const currentTab: string | undefined =
    openedCard && openedCard !== "active" ? openedCard : undefined;

  const selectedCategory =
    categoryId === "all"
      ? "Todas as categorias"
      : categories
          .flatMap(c => [c, ...(c.children ?? [])])
          .find(c => c.id === categoryId)?.name ?? "Categoria";

  // ---------- Carregar ----------

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [auctionResult, statsResult, categoriesData] = await Promise.all([
        getAuctions(currentTab),
        getAuctionStats(),
        listCategories(),
      ]);

      setStats(statsResult);
      setAuctions(auctionResult.data);
      setNextCursor(auctionResult.nextCursor);
      setCategories(categoriesData);
    } catch (err) {
      setError("Não foi possível carregar os leilões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [currentTab]);

  // ---------- Fechar o menu de categorias ----------

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        catRef.current &&
        !catRef.current.contains(event.target as Node)
      ) {
        setShowCategories(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowCategories(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // ---------- Scroll infinito ----------

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const result = await getAuctions(currentTab, nextCursor);

      setAuctions(prev => {
        const ids = new Set(prev.map(item => item.id));

        return [...prev, ...result.data.filter((item: any) => !ids.has(item.id))];
      });

      setNextCursor(result.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, currentTab]);

  const lastAuctionRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore || !nextCursor) {
        return;
      }

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && nextCursor) {
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

  // ---------- Dados derivados ----------

  const highestAuctions = [...auctions]
    .sort(
      (a, b) =>
        (b.currentBid ?? b.auctionStartPrice ?? 0) -
        (a.currentBid ?? a.auctionStartPrice ?? 0),
    )
    .slice(0, 10);

  const visibleAuctions = auctions.filter(auction => {
    const matchesSearch = auction.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      categoryId === "all" ||
      auction.category?.id === categoryId ||
      auction.category?.parentId === categoryId;

    return matchesSearch && matchesCategory;
  });

  function toggleCard(key: CardKey) {
    setOpenedCard(current => (current === key ? null : key));
  }

  function pickCategory(id: string) {
    setCategoryId(id);
    setShowCategories(false);
  }

  // ---------- Render ----------

  return (
    <div className={styles.page}>
      <FloatingDrawers />

      <Link to="/" className={styles.backButton}>
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <header className={styles.header}>
        <span className={styles.headerIcon}>
          <Gavel size={22} />
        </span>

        <div>
          <h1 className={styles.title}>Leilões</h1>
          <p className={styles.subtitle}>
            Acompanhe licitações em tempo real.
          </p>
        </div>
      </header>

      {/* ESTATÍSTICAS */}

      <div className={styles.stats}>
        <StatCard
          active={openedCard === "active"}
          onClick={() => toggleCard("active")}
          icon={<Gavel size={20} />}
          label="Leilões ativos"
          value={stats.active}
        />

        <StatCard
          active={openedCard === "ending"}
          onClick={() => toggleCard("ending")}
          icon={<Timer size={20} />}
          label="Terminam hoje"
          value={stats.ending}
        />

        <StatCard
          active={openedCard === "favorites"}
          onClick={() => toggleCard("favorites")}
          icon={<Heart size={20} />}
          label="Favoritos"
          value={stats.favorites}
        />
      </div>

      {openedCard && <AuctionPanel highestAuctions={highestAuctions} />}

      {/* FILTROS */}

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={17} className={styles.searchIcon} />

          <input
            className={styles.searchInput}
            placeholder="Pesquisar leilões..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        <div ref={catRef} className={styles.categoryWrapper}>
          <button
            type="button"
            className={styles.categoryButton}
            aria-haspopup="listbox"
            aria-expanded={showCategories}
            onClick={() => setShowCategories(value => !value)}
          >
            <span className={styles.categoryLabel}>{selectedCategory}</span>

            <ChevronDown
              size={17}
              className={`${styles.chevron} ${
                showCategories ? styles.chevronOpen : ""
              }`}
            />
          </button>

          {showCategories && (
            <div className={styles.categoryMenu} role="listbox">
              <button
                type="button"
                role="option"
                aria-selected={categoryId === "all"}
                className={`${styles.categoryItem} ${
                  categoryId === "all" ? styles.categoryItemActive : ""
                }`}
                onClick={() => pickCategory("all")}
              >
                Todas as categorias
                {categoryId === "all" && <Check size={15} />}
              </button>

              {categories.map(cat => (
                <div key={cat.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={categoryId === cat.id}
                    className={`${styles.categoryItem} ${
                      categoryId === cat.id ? styles.categoryItemActive : ""
                    }`}
                    onClick={() => pickCategory(cat.id)}
                  >
                    {cat.name}
                    {categoryId === cat.id && <Check size={15} />}
                  </button>

                  {cat.children?.map((sub: any) => (
                    <button
                      key={sub.id}
                      type="button"
                      role="option"
                      aria-selected={categoryId === sub.id}
                      className={`${styles.subcategoryItem} ${
                        categoryId === sub.id ? styles.categoryItemActive : ""
                      }`}
                      onClick={() => pickCategory(sub.id)}
                    >
                      {sub.name}
                      {categoryId === sub.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ERRO */}

      {error && (
        <div role="alert" className={styles.errorBox}>
          <AlertTriangle size={17} />
          {error}

          <button type="button" className={styles.retry} onClick={load}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* LISTA */}

      {loading ? (
        <p className={styles.state}>A carregar...</p>
      ) : !error && visibleAuctions.length === 0 ? (
        <div className={styles.empty}>
          <SearchX size={36} />
          <strong>Nenhum leilão encontrado</strong>
          <span>Experimente outra pesquisa ou categoria.</span>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {visibleAuctions.map((product, index) => (
              <div
                key={product.id}
                ref={
                  index === visibleAuctions.length - 1 ? lastAuctionRef : null
                }
              >
                <ProductCard product={product} showStore />
              </div>
            ))}
          </div>

          {loadingMore && (
            <div className={styles.loadingMore}>A carregar mais leilões...</div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${styles.statCard} ${active ? styles.statCardActive : ""}`}
    >
      <span className={styles.statIcon}>{icon}</span>

      <span className={styles.statBody}>
        <span className={styles.statLabel}>{label}</span>
        <strong className={styles.statValue}>{value}</strong>
      </span>
    </button>
  );
}