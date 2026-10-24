import { Outlet } from "react-router-dom";

import SiteHeader from "../header/SiteHeader";

import styles from "./MainLayout.module.css";

import FloatingDrawers from "../drawer/FloatingDrawers";

import NationalRanking from "../ranking/NationalRanking";

export default function MainLayout() {

  return (
    <>

      <SiteHeader />

      <FloatingDrawers />

      <div
        className={
          styles.wrapper
        }
      >

        <aside
          className={
            styles.leftSidebar
          }
        >

        </aside>

        <main
          className={
            styles.main
          }
        >
          <Outlet />
        </main>

        <aside
          className={
            styles.rightSidebar
          }
        >

          <div
            className={
              styles.card
            }
          >

            <div
              className={
                styles.cardHeader
              }
            >

              <div
                className={
                  styles.cardTitle
                }
              >
                Ranking Nacional
              </div>

            </div>

            <div
              className={
                styles.cardContent
              }
            >

              <NationalRanking />

            </div>

          </div>

        </aside>

      </div>

    </>
  );
}