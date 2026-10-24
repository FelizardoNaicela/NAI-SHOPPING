import { Routes, Route } from "react-router-dom";

import StorePage from "./pages/StorePage";
import StoreCategoryPage from "./pages/StoreCategoryPage";
import ProductPage from "./pages/ProductPage";
import CreateProductPage from "./pages/CreateProductPage";
import NotificationsPage from "./pages/NotificationsPage";
import SearchPage from "./pages/SearchPage";
import HomePage from "./pages/HomePage/HomePage";
import CategoryPage from "./pages/CategoryPage";
import MainLayout from "./components/layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import CreateStorePage from "./pages/CreateStorePage"; // 🔥 corrigido
import { Inbox } from "./pages/Inbox";
import AuctionsPage from "./pages/AuctionsPage";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import StartChatFromProduct from "./components/chat/StartChatFromProduct";
import PostPage from "./pages/PostPage";
import PromotionPage from "./pages/PromotionPage";
import PromotionPackagesPage from "./pages/PromotionPackagesPage";
import PromotionProductsPage from "./pages/PromotionProductsPage";
import PromotionConfigurePage from "./pages/PromotionConfigurePage";
import PromotionSummaryPage from "./pages/PromotionSummaryPage";
import PromotionHistoryPage from "./pages/PromotionHistoryPage";
import EditProductPage from "./pages/EditProductPage";
import StorePanelPage from "./pages/StorePanelPage";
import PainelPage from "./pages/PainelPage";
import NationalRankingManagementPage from "./pages/NationalRankingManagementPage";
import NationalRankingAuctionsPage from "./pages/NationalRankingAuctionsPage";
import NationalRankingAuctionPage from "./pages/NationalRankingAuctionPage";
import LegalDashboardPage from "./pages/Legal/LegalDashboardPage";

function App() {
  return (
    <Routes>

      {/* 🔹 ROTAS COM LAYOUT (HEADER + UI PADRÃO) */}
      <Route element={<MainLayout />}>

        <Route path="/" element={<HomePage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

      </Route>

      {/* 🔹 ROTAS FORA DO LAYOUT */}
      <Route path="/stores/:id" element={<StorePage />} />

<Route
  path="/stores/:id/promote"
  element={<PromotionPage />}
/>

<Route
  path="/stores/:id/panel"
  element={
    <ProtectedRoute>
      <StorePanelPage />
    </ProtectedRoute>
  }
/>

<Route path="/admin" element={<PainelPage />} />

<Route
  path="/admin/ranking/national"
  element={
    <ProtectedRoute>
      <NationalRankingManagementPage />
    </ProtectedRoute>
  }
/>

<Route
    path="/inbox"
    element={
      <ProtectedRoute>
        <Inbox />
      </ProtectedRoute>
    }
  />


  <Route
    path="/product/:id/edit"
    element={<ProtectedRoute>
    <EditProductPage />
    </ProtectedRoute>
  }
  />

<Route
  path="/stores/:id/promote/:type"
  element={<PromotionPackagesPage />}
/>

<Route
  path="/stores/:id/promote/configure"
  element={<PromotionConfigurePage />}
/>

<Route
  path="/stores/:id/promote/summary"
  element={<PromotionSummaryPage />}
/>

      <Route

    path="/user/:username"

    element={<PublicProfilePage />}

/>

<Route
  path="/chat/start/store/:storeId"
  element={<StartChatFromProduct />}
/>

<Route
  path="/stores/:id/promote/products"
  element={<PromotionProductsPage />}
/>

<Route
  path="/promotions"
  element={
    <ProtectedRoute>
      <PromotionHistoryPage />
    </ProtectedRoute>
  }
/>
<Route
    path="/post/:postId"
    element={<PostPage />}
/>

            <Route
    path="/profile"
    element={
        <ProtectedRoute>
            <ProfilePage />
        </ProtectedRoute>
    }
/>
        <Route
          path="/stores/:id/category/:categoryId"
          element={<StoreCategoryPage />}
        />

                <Route path="/search" element={<SearchPage />} />


        <Route path="/auctions" element={<AuctionsPage/>}/>

        <Route
          path="/stores/:id/products/new"
          element={
            <ProtectedRoute>
              <CreateProductPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div>Perfil</div>
            </ProtectedRoute>
          }
        />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/stores/create"
        element={
          <ProtectedRoute>
            <CreateStorePage />
          </ProtectedRoute>
        }
      />

      <Route
  path="/ranking/national/auctions"
  element={<NationalRankingAuctionsPage />}
/>

<Route
  path="/ranking/national/auction/:auctionId"
  element={<NationalRankingAuctionPage />}
/>
<Route
  path="/legal"
  element={
    <ProtectedRoute>
      <LegalDashboardPage />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}

export default App;