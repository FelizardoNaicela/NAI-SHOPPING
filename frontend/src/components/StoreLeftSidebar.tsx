type Props = {
  store: any;
};

export default function StoreLeftSidebar({ store }: Props) {
  return (
    <aside
      style={{
        position: "sticky",
        top: 80,
        height: "fit-content",
      }}
    >
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 16,

          background: "var(--surface-glass)",
          backdropFilter: "blur(12px)",

          padding: 18,

          boxShadow: "var(--shadow-sm)",
          transition: ".25s",
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: 12,
            color: "var(--text)",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {store.name}
        </h3>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-soft)",
            margin: 0,
            marginBottom: 18,
            lineHeight: 1.6,
          }}
        >
          {store.description || "Sem descrição"}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 14,
          }}
        >
          <div
            style={{
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⭐
            <span>
              {(store.ratingAverage ?? 0).toFixed(1)}
            </span>

            <span
              style={{
                color: "var(--text-soft)",
              }}
            >
              ({store.ratingCount ?? 0})
            </span>
          </div>

          <div
            style={{
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            📍

            <span
              style={{
                color: "var(--text-soft)",
              }}
            >
              {store.region || "Localização não definida"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}