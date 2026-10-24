import { useState, useRef } from "react";
import { followStore, unfollowStore } from "../../services/stores";
import SmartImage from "../../components/SmartImage";
import StoreTypeBadge from "../../components/store/StoreTypeBadge";
import VerificationBadge from "../../components/VerificationBadge";

const API_URL = "http://localhost:3000";

interface Props {
  store: {
    id: string;
    name: string;
    description?: string;
    verified: boolean;
    avatarUrl?: string;
    bannerUrl?: string;
    countryCode?: string;
    region?: string;
    createdAt?: string;
    verificationType?: "BASIC" | "PREMIUM";
    type?: string | null;
  };

  stats: {
    followersCount: number;
    productsCount: number;
  };

  viewer: {
    isFollowing: boolean;
    isOwner: boolean;
  };

  verificationType?: "BASIC" | "PREMIUM";
type?: string;
}

export default function StoreHeader({ store, stats, viewer }: Props) {

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [isFollowing, setIsFollowing] = useState(viewer.isFollowing);
  const [followersCount, setFollowersCount] = useState(stats.followersCount);

  const [bannerUrl, setBannerUrl] = useState(store.bannerUrl);
  const [avatarUrl, setAvatarUrl] = useState(store.avatarUrl);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function toggleFollow() {

    if (loading) return;

    try {

      setLoading(true);

      if (isFollowing) {
        await unfollowStore(store.id);
        setIsFollowing(false);
        setFollowersCount(c => c - 1);
      } else {
        await followStore(store.id);
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
      }

    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File, type: "banner" | "avatar") {

  try {

    setUploading(true);

    const preview = URL.createObjectURL(file);

    if (type === "banner") setBannerUrl(preview);
    if (type === "avatar") setAvatarUrl(preview);

    const formData = new FormData();
    formData.append("files", file);

    const token = localStorage.getItem("token");

const upload = await fetch(`${API_URL}/upload/images`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData
});

    const images = await upload.json();
    const image = images[0];

    const url = image.largeUrl || image.originalUrl;

    const body =
      type === "banner"
        ? { bannerUrl: url }
        : { avatarUrl: url };

    await fetch(`${API_URL}/stores/${store.id}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify(body)
});

    if (type === "banner") setBannerUrl(url);
    if (type === "avatar") setAvatarUrl(url);

  } finally {

    setUploading(false);

  }
}

  return (

    <div style={{ marginBottom: 32 }}>

      {/* BANNER */}

      <div
  style={{
    width: "100%",
aspectRatio: "16 / 5",
minHeight: 40,
maxHeight: 220,
    borderRadius: 14,
    overflow: "visible",
background: "var(--surface-2)",
    position: "relative"
  }}
>

        <SmartImage
          src={bannerUrl}
          aspectRatio="16 / 5"
          fit="cover"
          enableFullscreen
        />

        {viewer.isOwner && (

          <button
            onClick={() => bannerInputRef.current?.click()}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "var(--surface-glass)",
backdropFilter: "blur(10px)",
border: "1px solid var(--border)",
color: "var(--text)",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12
            }}
          >
            {uploading ? "a enviar..." : "alterar capa"}
          </button>

        )}

        <input
          type="file"
          accept="image/*"
          ref={bannerInputRef}
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file, "banner");
          }}
        />

        {/* AVATAR */}

        <div
  style={{
    position: "absolute",
   width: "clamp(72px, 18vw, 96px)",
height: "clamp(72px, 18vw, 96px)",

bottom: "clamp(-36px, -9vw, -48px)",
left: "clamp(16px, 5vw, 24px)",
    borderRadius: "50%",
    overflow: "hidden",
    border: "4px solid var(--surface)",
background: "var(--surface-2)",
    zIndex: 5,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  }}
>

          <SmartImage
  src={avatarUrl}
  aspectRatio="1 / 1"
  fit="cover"
  enableFullscreen
/>

          {viewer.isOwner && (

            <button
  onClick={() => avatarInputRef.current?.click()}
  style={{
    position: "absolute",
   width: "clamp(24px,7vw,32px)",
height: "clamp(24px,7vw,32px)",
fontSize: "clamp(12px,3vw,16px)",
bottom: 2,
right: 2,
    background: "var(--primary)",
color: "#fff",
border: "2px solid var(--surface)",
    borderRadius: "50%",
    cursor: "pointer",
    fontWeight: "bold",
    zIndex: 10
  }}
>
  +
</button>

          )}

        </div>

        <input
          type="file"
          accept="image/*"
          ref={avatarInputRef}
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file, "avatar");
          }}
        />

      </div>

      {/* INFO */}

      <div
        style={{
          paddingTop: 56,
          borderBottom:"1px solid var(--border)",
          paddingBottom: 24,
          display: "flex",
flexWrap: "wrap",
gap: 16,
justifyContent: "space-between",
alignItems: "flex-start",
        }}
      >

        <div style={{ maxWidth: 520 }}>

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 24,
    fontWeight: 600,
    color: "var(--text)",
  }}
>
  {store.name}

  <VerificationBadge
    type={store.verificationType}
    verified={store.verified}
    size="lg"
  />
</div>

{store.type && (
  <div style={{ marginTop: 6 }}>
    <StoreTypeBadge type={store.type} />
  </div>
)}

          {store.description && (
            <div style={{ marginTop: 6, color:"var(--text-soft)" }}>
              {store.description}
            </div>
          )}

          {(store.region || store.countryCode) && (
            <div style={{ marginTop: 6, fontSize: 13, color:"var(--text-soft)" }}>
              {store.region} {store.countryCode}
            </div>
          )}

          {store.createdAt && (
            <div style={{ marginTop: 4, fontSize: 12, color:"var(--text-soft)" }}>
              desde {new Date(store.createdAt).getFullYear()}
            </div>
          )}

          {/* STATS */}

          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 12
            }}
          >

            <div>
              <strong>{followersCount}</strong>
              <div style={{ fontSize: 12, color:"var(--text-soft)" }}>
                seguidores
              </div>
            </div>

            <div>
              <strong>{stats.productsCount}</strong>
              <div style={{ fontSize: 12, color:"var(--text-soft)" }}>
                produtos
              </div>
            </div>

          </div>

        </div>

        {!viewer.isOwner && (

          <button
            onClick={toggleFollow}
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid var(--border)",

background: isFollowing
    ? "var(--primary)"
    : "var(--surface)",

color: isFollowing
    ? "#fff"
    : "var(--text)",
              cursor: "pointer",
              fontWeight: 600,
              width: "100%",
maxWidth: 180,
            }}
          >
            {isFollowing ? "A seguir" : "Seguir"}
          </button>

        )}

      </div>

    </div>
  );
}