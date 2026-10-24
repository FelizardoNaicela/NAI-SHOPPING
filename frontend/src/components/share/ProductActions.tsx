import { useState } from "react";
import {
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../auth/AuthProvider";
import ShareModal from "./ShareModal";
import styles from "./ProductActions.module.css";

type Props = {
  productId: string;
  storeId?: string;
  storeOwnerId?: string;
};

export default function ProductActions({
  productId,
  storeId,
  storeOwnerId,
}: Props) {

  const navigate = useNavigate();

  const { user } = useAuth();

  const [shareOpen, setShareOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  // ==========================================
  // DONO DO PRODUTO
  // ==========================================

  const isOwner =
    !!user?.id &&
    !!storeOwnerId &&
    user.id === storeOwnerId;

  // ==========================================
  // CHAT
  // ==========================================

  async function startChat(
    e: React.MouseEvent,
  ) {

    e.stopPropagation();

    if (!storeId) return;

    const { data } =
      await api.post(
        `/chat/conversation/${storeId}`,
      );

    localStorage.setItem(
      "activeConversationId",
      data.id,
    );

    localStorage.setItem(
      "pendingSharedProductId",
      productId,
    );

    navigate("/inbox");
  }

  // ==========================================
  // EDITAR
  // ==========================================

  function editProduct(
    e: React.MouseEvent,
  ) {

    e.stopPropagation();

    setMenuOpen(false);

    navigate(`/product/${productId}/edit`);
  }

  // ==========================================
  // APAGAR
  // ==========================================

  async function deleteProduct(
    e: React.MouseEvent,
  ) {

    e.stopPropagation();

    if (!isOwner) return;

    const confirmed =
      window.confirm(
        "Tem certeza que deseja apagar este produto?",
      );

    if (!confirmed) return;

    try {

      setDeleting(true);

      await api.delete(
        `/products/${productId}`,
      );

      setMenuOpen(false);

      // avisaremos o componente pai
      window.dispatchEvent(
        new CustomEvent(
          "productDeleted",
          {
            detail: {
              productId,
            },
          },
        ),
      );

    } catch (error) {

      alert(
        "Não foi possível apagar o produto.",
      );

    } finally {

      setDeleting(false);

    }
  }

 return (
  <>
    <div
      className={styles.container}
      onClick={(e) => e.stopPropagation()}
    >

      {/* =====================================
          MENU DE AÇÕES
      ===================================== */}

      <div className={styles.menuWrapper}>

        <button
          type="button"
          className={styles.moreButton}
          onClick={(e) => {
            e.stopPropagation();

            setMenuOpen(value => !value);
          }}
          aria-label="Mais opções"
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <div
            className={styles.dropdown}
            onClick={(e) => e.stopPropagation()}
          >

            {/* COMPARTILHAR — TODOS */}

            <button
              type="button"
              className={styles.menuItem}
              onClick={(e) => {
                e.stopPropagation();

                setMenuOpen(false);
                setShareOpen(true);
              }}
            >
              <Share2 size={15} />
              <span>Compartilhar</span>
            </button>


            {/* CHAT — TODOS */}

            {storeId && (
              <button
                type="button"
                className={styles.menuItem}
                onClick={startChat}
              >
                <MessageCircle size={15} />
                <span>Conversar com a banca</span>
              </button>
            )}


            {/* =================================
                OPÇÕES DO DONO
            ================================= */}

            {isOwner && (
              <>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={editProduct}
                >
                  <Pencil size={15} />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.deleteItem}`}
                  onClick={deleteProduct}
                  disabled={deleting}
                >
                  <Trash2 size={15} />

                  <span>
                    {deleting
                      ? "A apagar..."
                      : "Apagar"}
                  </span>
                </button>
              </>
            )}

          </div>
        )}

      </div>

    </div>

    <ShareModal
      open={shareOpen}
      type="product"
      id={productId}
      shareUrl={`${window.location.origin}/products/${productId}`}
      onClose={() => setShareOpen(false)}
    />
  </>
);
}