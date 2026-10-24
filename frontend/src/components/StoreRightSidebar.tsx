import { useEffect, useState } from "react";
import SmartImage from '../components/SmartImage';
import {
  followStore,
  unfollowStore,
  getMyFollows
} from "../services/follows";
import { useStore } from "../context/StoreContext";

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

type Props = {
  sidebarFeeds: SidebarFeed[];
  navigate: any;
};

export default function StoreRightSidebar({
  sidebarFeeds,
  navigate,
}: Props) {

const { store, isFollowing, setIsFollowing } = useStore();
  const [loadingFollow, setLoadingFollow] = useState(false);

  // ================= LOAD FOLLOW STATE =================
  useEffect(() => {
  if (!store?.id) return;

  getMyFollows().then((follows) => {
    const isFollowingStore = follows.some(
      (f: any) => f.storeId === store.id
    );
    setIsFollowing(isFollowingStore);
  });
}, [store?.id]);

  // ================= TOGGLE FOLLOW =================
  const handleFollow = async () => {
    if (loadingFollow) return;

    setLoadingFollow(true);

    try {
      if (isFollowing) {
        await unfollowStore(store.id);
        setIsFollowing(false);
      } else {
        await followStore(store.id);
        setIsFollowing(true);
      }
    } finally {
      setLoadingFollow(false);
    }
  };

 return (
  <aside
    style={{
      position: "sticky",
      top: 80,
      maxHeight: "calc(100vh - 100px)",
      overflowY: "auto",
    }}
  >
    {/* POPULARES */}
    <div
      style={{
        border: "1px solid var(--surface-glass-border)",
        borderRadius: 14,
        padding: 16,

        background: "var(--surface-glass)",
        backdropFilter: "blur(12px)",

        boxShadow: "var(--shadow-sm)",
      }}
    >
      <h4
        style={{
          margin: "0 0 14px",
          color: "var(--text)",
        }}
      >
        🔥 Populares
      </h4>

      {sidebarFeeds.slice(0, 1).map(feed =>
        feed.items.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/product/${p.id}`)}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",

              padding: 8,
              marginBottom: 10,

              borderRadius: 10,

              cursor: "pointer",

              transition: ".2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
            }}
          >
            <div
              style={{
                width: 56,
                flexShrink: 0,
              }}
            >
              <SmartImage
                src={p.imageUrl}
                aspectRatio="1/1"
              />
            </div>

            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  color: "var(--text)",
                  fontSize: 13,
                  fontWeight: 600,

                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.name}
              </div>

              <strong
                style={{
                  color: "var(--primary)",
                  fontSize: 14,
                }}
              >
                {p.price} MT
              </strong>
            </div>
          </div>
        ))
      )}
    </div>

    {/* FOLLOW CTA */}
    <div
      style={{
        marginTop: 18,

        padding: 16,

        borderRadius: 14,

        border: "1px solid var(--surface-glass-border)",

        background: "var(--surface-glass)",
        backdropFilter: "blur(12px)",

        textAlign: "center",

        boxShadow: "var(--shadow-sm)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "var(--text-soft)",
          fontSize: 13,
        }}
      >
        Gostou desta banca?
      </p>

      <button
        onClick={handleFollow}
        disabled={loadingFollow}
        style={{
          marginTop: 12,

          width: "100%",

          padding: "10px 14px",

          borderRadius: 10,

          border: "none",

          background: isFollowing
            ? "var(--surface-2)"
            : "var(--primary)",

          color: isFollowing
            ? "var(--text)"
            : "#fff",

          fontWeight: 600,

          cursor: loadingFollow
            ? "default"
            : "pointer",

          opacity: loadingFollow ? .7 : 1,

          transition: ".2s",
        }}
      >
        {loadingFollow
          ? "..."
          : isFollowing
          ? "Seguindo ✓"
          : "Seguir banca"}
      </button>
    </div>
  </aside>
);
}