import { useState } from "react";
import GlobalFeed from "../../components/GlobalFeed";
import FollowingFeed from "../../components/FollowingFeed";

export default function HomePage() {

  const [tab, setTab] = useState<"explore" | "following">("following");

  return (
    <div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>

        <button
          onClick={() => setTab("following")}
          style={tab === "following" ? activeTab : tabStyle}
        >
          Seguindo
        </button>

        <button
          onClick={() => setTab("explore")}
          style={tab === "explore" ? activeTab : tabStyle}
        >
          Explorar
        </button>



      </div>

      {/* FEED */}
      {tab === "following" && <FollowingFeed />}
      {tab === "explore" && <GlobalFeed />}
    </div>
  );
}

/* styles */

const tabStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  cursor: "pointer",
  transition: ".25s",
};

const activeTab: React.CSSProperties = {
  ...tabStyle,
  background: "var(--primary)",
  color: "#fff",
  border: "1px solid var(--primary)",
};