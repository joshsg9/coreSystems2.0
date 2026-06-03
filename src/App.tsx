// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider }      from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ChatProvider }      from './context/ChatContext';
import LoginPage             from './pages/Login/LoginPage';
import Home                  from './pages/Home/Home';
import SearchResultsPage     from './components/SearchResultsPage/SearchResultsPage';
import ProductDetailPage     from './pages/ProductDetailPage/ProductDetailPage';
import SellerRegister        from './pages/SellerRegister/SellerRegister';
import SellerHome            from './pages/SellerHome/SellerHome';
import Navbar                from './components/Navbar/Navbar';
import { supabase }          from './lib/supabase';

const AppLayout: React.FC = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/"                  element={<Home />} />
      <Route path="/search"            element={<SearchResultsPage />} />
      <Route path="/product/:slugOrId" element={<ProductDetailPage />} />
      <Route path="/seller/register"   element={<SellerRegister />} />
      <Route path="*"                  element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading]         = useState(true);

  useEffect(() => {
    // Restore session on first load (reads from localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    // Keep auth state in sync (magic links, OAuth redirects, token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) return null;

  return (
    <BrowserRouter>
      <CartProvider>
        <FavoritesProvider>
          <ChatProvider>
            <Routes>
              {/* SellerHome: standalone (no buyer Navbar) */}
              <Route path="/seller/home" element={<SellerHome />} />

              <Route
                path="*"
                element={
                  !isAuthenticated
                    ? <LoginPage />
                    : <AppLayout />
                }
              />
            </Routes>
          </ChatProvider>
        </FavoritesProvider>
      </CartProvider>
    </BrowserRouter>
  );
};

export default App;
