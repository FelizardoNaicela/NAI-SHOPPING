import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { CircleUserRound } from "lucide-react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import styles from "./SiteHeader.module.css";

type UserMenuProps = {
    isAuthenticated: boolean;
    showUserMenu: boolean;
    setShowUserMenu: React.Dispatch<React.SetStateAction<boolean>>;
    userRef: React.RefObject<HTMLDivElement | null>;

    userMenuClassName: string;
    userAvatarClassName: string;
    dropdownClassName: string;
    itemClassName: string;
    logoutClassName: string;
    loginButtonClassName: string;
};

export default function UserMenu({
    isAuthenticated,
    showUserMenu,
    setShowUserMenu,
    userRef,

    userMenuClassName,
    userAvatarClassName,
    dropdownClassName,
    itemClassName,
    logoutClassName,
    loginButtonClassName,
}: UserMenuProps) {

    const navigate = useNavigate();

    const { logout } = useAuth();
      const { theme, toggleTheme } = useTheme();


    if (!isAuthenticated) {
        return (
            <button
                className={loginButtonClassName}
                onClick={() => navigate("/login")}
            >
                Entrar
            </button>
        );
    }

    return (
        <div
            ref={userRef}
            className={userMenuClassName}
        >
            <span
    onClick={() => setShowUserMenu(v => !v)}
    className={userAvatarClassName}
>
    <CircleUserRound size={22} strokeWidth={2} />
</span>

            {showUserMenu && (

                <div className={dropdownClassName}
                style={{background:"silver"}}>

                    <div
                        onClick={() => navigate("/profile")}
                        className={itemClassName}
                    >
                        Perfil
                    </div>

                    <div
                        onClick={() => {

                            const storeId =
                                localStorage.getItem("storeId");

                            setShowUserMenu(false);

                            if (!storeId) {
                                navigate("/stores/create");
                                return;
                            }

                            navigate(`/stores/${storeId}`);

                        }}
                        className={itemClassName}
                    >
                        Minha banca
                    </div>

                    <div
                        onClick={() => {

                            const storeId =
                                localStorage.getItem("storeId");

                            if (!storeId) {
                                alert("Cria uma banca primeiro");
                                return;
                            }

                            setShowUserMenu(false);

                            navigate(
                                `/stores/${storeId}/products/new`
                            );

                        }}
                        className={itemClassName}
                    >
                        Criar produto
                    </div>

                    <div
                        onClick={() => {

                            logout();

                            navigate("/");

                        }}
                        className={`${itemClassName} ${logoutClassName}`}
                    >
                        Sair
                    </div>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        className={styles.themeButton}
                        aria-label={
                          theme === "dark"
                            ? "Ativar modo claro"
                            : "Ativar modo escuro"
                        }
                        title={
                          theme === "dark"
                            ? "Modo claro"
                            : "Modo escuro"
                        }
                      >
                        {theme === "dark" ? (
                          <Sun size={20} />
                        ) : (
                          <Moon size={20} />
                        )}
                      </button>

                </div>

            )}

        </div>
    );

}