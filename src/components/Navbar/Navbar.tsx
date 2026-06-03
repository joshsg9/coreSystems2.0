// src/components/Navbar/Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCategories } from '../../services/categoryService';
import CategoryDropdown from '../CategoryDropdown/CategoryDropdown';
import SearchOverlay from '../SearchOverlay/SearchOverlay';
import CartDrawer from '../CartDrawer/CartDrawer';
import FavoritesDrawer from '../FavoritesDrawer/FavoritesDrawer';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useUser } from '../../hooks/useUser';
import type { SearchProduct } from '../../services/searchService';
import styles from './Navbar.module.css';

interface NavbarProps {
  onLogoClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogoClick }) => {
  const navigate = useNavigate();
  const categories = getAllCategories();
  const { totalItems, toggleCart } = useCart();
  const { totalFavorites, toggleDrawer: toggleFavorites } = useFavorites();
  const { user } = useUser();

  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const categoryNavRef = useRef<HTMLElement>(null);

  // Cierra el dropdown cuando se hace clic fuera del área de categorías
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryNavRef.current && !categoryNavRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeData = categories.find(c => c.id === activeCategory);

  // ── Search ─────────────────────────────────────────────────────────────────
  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (!searchOpen) setSearchOpen(true);
  };

  const handleTagClick = (tag: string) => {
    setSearchValue(tag);
    inputRef.current?.focus();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    closeSearch();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleProductClick = (product: SearchProduct) => {
    closeSearch();
    navigate(`/search?q=${encodeURIComponent(product.name)}`);
  };

  // Maneja el clic en una categoría: abre/cierra el dropdown
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(prev => (prev === categoryId ? null : categoryId));
  };

  // Cierra el dropdown cuando se elige una opción dentro del menú
  const handleDropdownItemClick = () => {
    setActiveCategory(null);
  };

  return (
    <>
      <header className={styles.header}>
        {/* ── Top Bar ── */}
        <div className={styles.topBar}>
          <div className={styles.logo} onClick={onLogoClick}>
            <span className={styles.logoDot1}>●</span>
            <span className={styles.logoDot2}>◉</span>
            <span className={styles.logoText}>
              <span className={styles.logoCore}>Core</span>
              <span className={styles.logoSystems}>Systems</span>
            </span>
          </div>

          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              ref={inputRef}
              className={`${styles.searchInput} ${searchOpen ? styles.searchInputActive : ''}`}
              type="text"
              placeholder="What are you looking for?"
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={openSearch}
              autoComplete="off"
            />
            <button className={styles.searchBtn} type="submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>

          <nav className={styles.topActions}>
            {/* Wishlist */}
            <button
              className={styles.iconBtn}
              aria-label={`Favoritos (${totalFavorites})`}
              onClick={toggleFavorites}
              style={{ position: 'relative' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {totalFavorites > 0 && (
                <span className={styles.cartBadge}>{totalFavorites > 99 ? '99+' : totalFavorites}</span>
              )}
            </button>

            {/* Account → Seller Register */}
            <button
              className={styles.iconBtn}
              aria-label="Seller Account"
              onClick={() => navigate('/seller/register')}
              style={{ overflow: 'hidden', borderRadius: '50%', padding: user?.avatarUrl ? 0 : undefined }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
              }
            </button>

            {/* Carrito */}
            <button
              className={styles.iconBtn}
              aria-label={`Carrito (${totalItems} productos)`}
              onClick={toggleCart}
              style={{ position: 'relative' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>
              )}
            </button>
          </nav>
        </div>

        {/* ── Category Nav ── */}
        <nav className={styles.catNav} ref={categoryNavRef}>
          <button className={styles.allCategoriesBtn}>
            <span className={styles.hamburger}>≡</span>
            <span>All Categories</span>
          </button>

          {categories.map(cat => (
            <div key={cat.id} className={styles.catItemWrapper}>
              <button
                className={[
                  styles.catItem,
                  cat.id === 'trending' ? styles.trending : '',
                  cat.id === 'on-sale' ? styles.onSale : '',
                  activeCategory === cat.id ? styles.catItemActive : '',
                ].join(' ')}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.label}
              </button>
            </div>
          ))}

          {activeCategory && activeData && (
            <div className={styles.dropdownWrapper}>
              <CategoryDropdown
                category={activeData}
                onItemClick={handleDropdownItemClick}
              />
            </div>
          )}
        </nav>
      </header>

      {searchOpen && (
        <SearchOverlay
          query={searchValue}
          onClose={closeSearch}
          onTagClick={handleTagClick}
          onProductClick={handleProductClick}
        />
      )}

      <CartDrawer />
      <FavoritesDrawer />
    </>
  );
};

export default Navbar;