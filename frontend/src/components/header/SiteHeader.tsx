import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { listCategories } from "../../services/categories";
import { useAuth } from "../../auth/AuthProvider";
import styles from "./SiteHeader.module.css";
import SearchBar from "./SearchBar";
import HeaderLeft from "./HeaderLeft";
import UserMenu from "./UserMenu";
import HeaderActions from "./HeaderActions";
import useChatUnreadCount
  from "../../hooks/useChatUnreadCount";

type Category = {
  id: string;
  name: string;
  children?: Category[];
};
export default function SiteHeader() {
const navigate = useNavigate();
const location = useLocation();

const { isAuthenticated, user } = useAuth();

const { unreadCount } =
    useChatUnreadCount(user?.id);

const [query, setQuery] = useState("");

const [showCategories, setShowCategories] =
    useState(false);

const [showUserMenu, setShowUserMenu] =
    useState(false);

const [categories, setCategories] =
    useState<Category[]>([]);

const userRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    listCategories().then(setCategories);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!query.trim()) return;

    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  function handleHomeClick(e: React.MouseEvent) {

  if (location.pathname !== "/") {
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

}

  /* fechar dropdown ao clicar fora */

  useEffect(() => {

    function handleClickOutside(e: MouseEvent) {

      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }

    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };

  }, []);

  return (

    <header className={styles.header}>

      {/* LEFT */}

      <HeaderLeft
    categories={categories}
    showCategories={showCategories}
    setShowCategories={setShowCategories}
    onHomeClick={handleHomeClick}
    leftClassName={styles.left}
    logoClassName={styles.logo}
    categoriesClassName={styles.categories}
    categoryButtonClassName={styles.categoryButton}
    dropdownClassName={styles.dropdown}
    categoryItemClassName={styles.categoryItem}
    subCategoryClassName={styles.subCategory}
/>

      <SearchBar
    query={query}
    setQuery={setQuery}
    onSearch={handleSearch}
    className={styles.center}
    formClassName={styles.searchForm}
    inputClassName={styles.searchInput}
    buttonClassName={styles.searchButton}
/>



      {/* ACTIONS */}
<div className={styles.right}>

  <HeaderActions
    unreadCount={unreadCount}
    onHomeClick={handleHomeClick}
    iconButtonClassName={styles.iconButton}
    badgeClassName={styles.badge}
  />

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
    loginButtonClassName={styles.blackButton}
  />

</div>

    </header>

  );

}