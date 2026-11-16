
import { useEffect, useRef, useState } from "react";
import GlobalFeed from "../../components/GlobalFeed";
import FollowingFeed from "../../components/FollowingFeed";
import styles from "./HomePage.module.css";

export default function HomePage() {
    const [tab, setTab] = useState<"explore" | "following">("following");
    const [tabsVisible, setTabsVisible] = useState(true);

    const lastScrollY = useRef(0);

    useEffect(() => {
        lastScrollY.current = window.scrollY;

        function handleScroll() {
            const currentScrollY = Math.max(0, window.scrollY);
            const difference = currentScrollY - lastScrollY.current;

            if (currentScrollY <= 10) {
                setTabsVisible(true);
            } else if (difference > 6) {
                // A descer: esconder os filtros
                setTabsVisible(false);
            } else if (difference < -6) {
                // A subir: mostrar os filtros
                setTabsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        }

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div className={styles.page}>

            {/* FILTROS */}

            <div
                className={`${styles.tabs} ${
                    tabsVisible ? "" : styles.tabsHidden
                }`}
            >
                <button
                    type="button"
                    onClick={() => setTab("following")}
                    className={
                        tab === "following"
                            ? `${styles.tab} ${styles.activeTab}`
                            : styles.tab
                    }
                    aria-pressed={tab === "following"}
                >
                    Seguindo
                </button>

                <button
                    type="button"
                    onClick={() => setTab("explore")}
                    className={
                        tab === "explore"
                            ? `${styles.tab} ${styles.activeTab}`
                            : styles.tab
                    }
                    aria-pressed={tab === "explore"}
                >
                    Explorar
                </button>
            </div>

            {/* FEED */}

            {tab === "following" && <FollowingFeed />}
            {tab === "explore" && <GlobalFeed />}

        </div>
    );}