import { useEffect, useState } from "react";

import {
  addFavorite,
  removeFavorite,
  isFavorite,
} from "../services/favorites";

type Props = {
  productId: string;

  size?: number;
};

export default function FavoriteButton({
  productId,
  size = 26,
}: Props) {
    const [favorite, setFavorite] =
  useState(false);

const [loading, setLoading] =
  useState(true);

const [saving, setSaving] =
  useState(false);

  useEffect(() => {

  let mounted = true;

  async function load() {

    try {

      const result =
        await isFavorite(productId);

      if (mounted) {

setFavorite(result);

      }

    } catch {

      // utilizador não autenticado

    } finally {

      if (mounted)
        setLoading(false);

    }

  }

  load();

  return () => {

    mounted = false;

  };

}, [productId]);

async function toggleFavorite(
  e: React.MouseEvent,
) {

  e.preventDefault();

  e.stopPropagation();

  if (saving)
    return;

  try {
    setSaving(true);

    if (favorite) {
        await removeFavorite(productId);
        setFavorite(false);
    } else {
        await addFavorite(productId);
        setFavorite(true);
    }
} catch (err) {
} finally {
    setSaving(false);
}

}

if (loading)
  return null;

return (

<button
  onClick={toggleFavorite}
  disabled={saving}
  aria-label={
    favorite
      ? "Remover dos favoritos"
      : "Adicionar aos favoritos"
  }
  style={{
    width: size + 12,
    height: size + 12,

    borderRadius: "50%",

    border: `1px solid var(--border)`,

    cursor: saving ? "not-allowed" : "pointer",

    background: "var(--surface)",

    color: "var(--text-primary)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: size,

    opacity: saving ? .6 : 1,

    transition:
      "transform .2s ease, background .2s ease, box-shadow .2s ease",

    boxShadow: "var(--shadow-sm)",
  }}

  onMouseEnter={(e) => {
    if (saving) return;

    e.currentTarget.style.transform = "scale(1.08)";
    e.currentTarget.style.boxShadow = "var(--shadow-md)";
    e.currentTarget.style.background = "var(--surface-hover)";
  }}

  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
    e.currentTarget.style.background = "var(--surface)";
  }}
>

{favorite ? "❤️" : "F"}

</button>

);
}