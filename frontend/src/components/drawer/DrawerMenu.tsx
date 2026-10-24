import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { listCategories } from "../../services/categories";
import useChatUnreadCount from "../../hooks/useChatUnreadCount";
import SearchBar from "../header/SearchBar";
import CategoryMenu from "../header/CategoryMenu";
import UserMenu from "../header/UserMenu";
import DrawerProfile from "./DrawerProfile";

import styles from "./DrawerMenu.module.css";
import {
    House,
    Search,
    Gavel,
    Bell,
    MessageCircle,
} from "lucide-react";


type Category = {
    id: string;
    name: string;
    children?: Category[];
};

type DrawerMenuProps = {
    onClose: () => void;

    user: any | null;

    isAuthenticated: boolean;
};

export default function DrawerMenu({
    onClose,
    user,
    isAuthenticated,
}: DrawerMenuProps) {

    const navigate = useNavigate();
    const location = useLocation();

    const { unreadCount } =
    useChatUnreadCount(user?.id);

    const [query, setQuery] =
        useState("");

    const [categories, setCategories] =
        useState<Category[]>([]);

    const [showCategories, setShowCategories] =
        useState(false);

    const [showUserMenu, setShowUserMenu] =
        useState(false);

    const userRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {

        listCategories()
            .then(setCategories);

    }, []);

    function handleSearch(
        e: React.FormEvent
    ) {

        e.preventDefault();

        if (!query.trim())
            return;

        navigate(
            `/search?q=${encodeURIComponent(query)}`
        );

        onClose();

    }

    function handleHomeClick(
        e: React.MouseEvent
    ) {

        if (location.pathname !== "/") {

            onClose();

            return;

        }

        e.preventDefault();

        window.dispatchEvent(
            new CustomEvent("home-refresh")
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

        onClose();

    }

    useEffect(() => {

        function handleClickOutside(
            e: MouseEvent
        ) {

            if (
                userRef.current &&
                !userRef.current.contains(
                    e.target as Node
                )
            ) {

                setShowUserMenu(false);

            }

        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

        };

    }, []);

    return (

        <div className={styles.menu}>

            <DrawerProfile
    isAuthenticated={isAuthenticated}
    user={user}
/>

            <hr className={styles.divider} />

            <SearchBar
                query={query}
                setQuery={setQuery}
                onSearch={handleSearch}
                formClassName={styles.searchForm}
                inputClassName={styles.searchInput}
                buttonClassName={styles.searchButton}
            />

            <hr className={styles.divider} />

            <CategoryMenu
                categories={categories}
                showCategories={showCategories}
                setShowCategories={setShowCategories}
                className={styles.categories}
                buttonClassName={styles.categoryButton}
                dropdownClassName={styles.dropdown}
                categoryItemClassName={styles.categoryItem}
                subCategoryClassName={styles.subCategory}
            />

            <hr className={styles.divider} />

            <nav className={styles.links}>

                <Link
    to="/"
    onClick={(e) => {
        handleHomeClick(e);
    }}
>
    <House size={18} />
    Início
</Link>

<Link
    to="/auctions"
    onClick={onClose}
>
    <Gavel size={18} />
    Leilões
</Link>

<Link
    to="/search"
    onClick={onClose}
>
    <Search size={18} />
    Pesquisar
</Link>


                <Link
                    to="/inbox"
                    onClick={onClose}
                >

                    <MessageCircle size={18}/>
                    Mensagens

                    {unreadCount > 0 && (

                        <span className={styles.badge}>
                            {unreadCount}
                        </span>

                    )}

                </Link>

                <Link
    to="/notifications"
    onClick={onClose}
>
    <Bell size={18} />
    Notificações
</Link>

            </nav>

            <hr className={styles.divider} />

            <UserMenu
                isAuthenticated={isAuthenticated}
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
                userRef={userRef}
                userMenuClassName={styles.userMenu}
                userAvatarClassName={styles.userAvatar}
                dropdownClassName={styles.userDropdown}
                itemClassName={styles.userItem}
                logoutClassName={styles.userLogout}
                loginButtonClassName={styles.loginButton}
            />

        </div>

    );

}