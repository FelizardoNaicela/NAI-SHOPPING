import { useEffect, useState } from "react";
import { Trophy, UserCog } from "lucide-react";

import { api } from "../services/api";
import FloatingDrawers from "../components/drawer/FloatingDrawers";
import PanelSection from "../components/panel/PanelSection";

import AdminManagement, {
  type PainelProfile,
} from "./painel/AdminManagement";
import AdminVerificationRequests from "./painel/AdminVerificationRequests";
import AdminVerificationPayments from "./painel/AdminVerificationPayments";
import AdminPromotionPayments from "./painel/AdminPromotionPayments";
import StoreManagement from "./painel/StoreManagement";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AdminRevenue from "./painel/AdminRevenue";
import AdminLegalHolds from "./painel/AdminLegalHolds";


import AdminLegalInvestigators from "./painel/AdminLegalInvestigators";

import styles from "./PainelPage.module.css";

export default function PainelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

const isAdminUser = user?.role === "ADMIN";

  const [profile, setProfile] = useState<PainelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  if (!isAdminUser) {
    return;
  }

  let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get<PainelProfile>("/admin/me");

        if (mounted) {
          setProfile(res.data);
        }
      } catch (err: any) {
        if (!mounted) {
          return;
        }


        const status = err?.response?.status;

        if (status === 401) {
          setError("A sua sessão expirou. Faça login novamente.");
        } else if (status === 403) {
          setError(
            "Não possui permissão para acessar o painel administrativo.",
          );
        } else {
          setError(
            err?.response?.data?.message ??
              "Não foi possível carregar o painel administrativo.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

     return () => {
    mounted = false;
  };
}, [isAdminUser]);

if (!isAdminUser) {
  return <Navigate to="/" replace />;
}
  // ---------- Estados ----------

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.stateCard}>
          <div className={styles.stateTitle}>A carregar painel...</div>
          <p className={styles.stateText}>
            A verificar as permissões do administrador.
          </p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className={styles.page}>
        <div className={`${styles.stateCard} ${styles.stateCardError}`}>
          <h2 className={styles.stateTitle}>
            {error
              ? "Não foi possível abrir o painel"
              : "Perfil administrativo não encontrado"}
          </h2>
          <p className={styles.stateText}>
            {error || "Não foi possível obter os dados do administrador."}
          </p>
        </div>
      </main>
    );
  }

  // ---------- Permissões ----------

  const isSuperAdmin = profile.adminRole === "SUPER_ADMIN";
  const canManageStores = isSuperAdmin || profile.canManageStores;

  const displayName = profile.user.name ?? "Administrador";

  return (
    <>
      <FloatingDrawers />

      <main className={styles.page}>
        <div className={styles.container}>
          {/* CABEÇALHO */}

          <header className={styles.header}>
            <div>
              <div className={styles.eyebrow}>PAINEL</div>
              <h1 className={styles.title}>Gestão da plataforma</h1>
              <p className={styles.subtitle}>
                Administração, permissões e gestão das lojas.
              </p>
            </div>

            <button
              type="button"
              className={styles.rankingButton}
              onClick={() => navigate("/admin/ranking/national")}
            >
              <Trophy size={17} />
              Gestão do Ranking Nacional
            </button>
          </header>

          {/* PERFIL */}

          <PanelSection
            title="O seu perfil"
            description="Função, região e estado da sua conta."
            icon={<UserCog size={20} strokeWidth={1.9} />}
            storageKey="adminPanel:profile"
            summary={
              <span
                className={`${styles.badge} ${
                  isSuperAdmin ? styles.badgeSuper : styles.badgeRegional
                }`}
              >
                {isSuperAdmin ? "SUPER ADMIN" : "ADMIN REGIONAL"}
              </span>
            }
          >
            <div className={styles.profileMain}>
              <div className={styles.avatar}>
                {(profile.user.name ?? profile.user.email ?? "A")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>{displayName}</h2>
                <p className={styles.profileEmail}>{profile.user.email}</p>
              </div>
            </div>

            <div className={styles.profileMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Função</span>
                <span
                  className={`${styles.badge} ${
                    isSuperAdmin ? styles.badgeSuper : styles.badgeRegional
                  }`}
                >
                  {isSuperAdmin ? "SUPER ADMIN" : "ADMIN REGIONAL"}
                </span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Região</span>
                <strong className={styles.metaValue}>
                  {isSuperAdmin
                    ? "Global"
                    : profile.region ?? "Não definida"}
                </strong>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Estado</span>
                <span className={`${styles.badge} ${styles.badgeActive}`}>
                  ATIVO
                </span>
              </div>
            </div>
          </PanelSection>

          {/* ÁREAS (cada uma recolhe sozinha) */}

          <AdminManagement profile={profile} />

          <AdminVerificationRequests profile={profile} />

          {isSuperAdmin && (
            <AdminVerificationPayments isSuperAdmin={isSuperAdmin} />
          )}

          <AdminPromotionPayments profile={profile} />

          {canManageStores && <StoreManagement profile={profile} />}

          {isSuperAdmin && <AdminLegalInvestigators />}
          {isSuperAdmin && <AdminLegalHolds />}

        </div>
      </main>
                        {isSuperAdmin && <AdminRevenue />}

    </>
  );
}