// src/pages/ProductDetailPage/ProductDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductBySlugOrId, getRelatedProducts, formatPrice } from '../../services/productService';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import styles from './ProductDetailPage.module.css';

// ─── Spec section ─────────────────────────────────────────────────────────────
interface SpecSectionProps { title: string; lines: string[]; }
const SpecSection: React.FC<SpecSectionProps> = ({ title, lines }) => (
  <div className={styles.specSection}>
    <h3 className={styles.specTitle}>{title}</h3>
    <ul className={styles.specList}>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
  </div>
);

// ─── Related card ─────────────────────────────────────────────────────────────
interface RelatedCardProps { product: Product; onClick: () => void; }
const RelatedCard: React.FC<RelatedCardProps> = ({ product, onClick }) => (
  <button className={styles.relatedCard} onClick={onClick}>
    <div className={styles.relatedImageWrap}>
      <img src={product.image} alt={product.name} className={styles.relatedImage} loading="lazy" />
    </div>
    <p className={styles.relatedName}>{product.name}</p>
    <p className={styles.relatedPrice}>${product.price.toLocaleString('es-CO')}</p>
  </button>
);

// ─── Add to cart button ───────────────────────────────────────────────────────
interface AddToCartBtnProps { onAdd: () => void; }
const AddToCartBtn: React.FC<AddToCartBtnProps> = ({ onAdd }) => {
  const [added, setAdded] = useState(false);
  const handleClick = () => { onAdd(); setAdded(true); setTimeout(() => setAdded(false), 1800); };
  return (
    <button
      className={`${styles.addToCartBtn} ${added ? styles.addToCartBtnAdded : ''}`}
      onClick={handleClick}
    >
      {added ? (
        <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>¡Agregado!</>
      ) : (
        <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Agregar al carrito</>
      )}
    </button>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const ProductDetailPage: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();

  const [product,        setProduct]        = useState<Product | null>(null);
  const [related,        setRelated]        = useState<Product[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [quantity,       setQuantity]       = useState(1);
  const [activeThumb,    setActiveThumb]    = useState(0);
  const [specsExpanded,  setSpecsExpanded]  = useState(false);

  useEffect(() => {
    if (!slugOrId) return;
    setLoading(true);
    getProductBySlugOrId(slugOrId).then(async p => {
      setProduct(p);
      setLoading(false);
      if (p) {
        const rel = await getRelatedProducts(p.category, String(p.id));
        setRelated(rel);
      }
    });
  }, [slugOrId]);

  if (loading) {
    return (
      <div className={styles.notFound}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFound}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p>Product not found.</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Go back</button>
      </div>
    );
  }

  const thumbs = [product.image, product.image, product.image];
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const specs = product.specs || {};
  const specSections: SpecSectionProps[] = [];
  if (specs.screenSize)  specSections.push({ title: 'Pantalla',   lines: [`Tamaño: ${specs.screenSize}`, specs.screenType || 'Super Retina XDR OLED', specs.refreshRate || 'ProMotion hasta 120 Hz'] });
  if (specs.processor)   specSections.push({ title: 'Procesador', lines: [specs.processor, specs.processorDetails || 'Alto rendimiento'].filter(Boolean) });
  if (specs.ram)         specSections.push({ title: 'RAM',        lines: [`${specs.ram} de RAM`] });
  if (specs.storage)     specSections.push({ title: 'Almacenamiento', lines: [specs.storage] });
  if (specs.camera)      specSections.push({ title: 'Cámaras',   lines: [`Principal: ${specs.camera}`, specs.videoRecording || '4K video', specs.frontCamera || 'Cámara frontal 12MP'] });
  if (specs.battery)     specSections.push({ title: 'Batería',   lines: [specs.battery, specs.chargingSpeed || 'Carga rápida'].filter(Boolean) });
  if (specs.connectivity) specSections.push({ title: 'Conectividad', lines: [specs.connectivity] });

  const visibleSpecs = specsExpanded ? specSections : specSections.slice(0, 2);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <button onClick={() => navigate('/')}>Home</button>
        <span>›</span>
        <button onClick={() => navigate(`/search?q=${encodeURIComponent(product.category)}`)}>{product.category}</button>
        <span>›</span>
        <span>{product.name}</span>
      </nav>

      <section className={styles.hero}>
        <div className={styles.thumbCol}>
          {thumbs.map((src, i) => (
            <button key={i} className={`${styles.thumb} ${activeThumb === i ? styles.thumbActive : ''}`} onClick={() => setActiveThumb(i)}>
              <img src={src} alt={`${product.name} view ${i + 1}`} />
            </button>
          ))}
        </div>

        <div className={styles.mainImageWrap}>
          {discount > 0 && <span className={styles.discountBadge}>-{discount}%</span>}
          <img src={thumbs[activeThumb]} alt={product.name} className={styles.mainImage} />
        </div>

        <div className={styles.purchasePanel}>
          <h1 className={styles.productName}>{product.name}</h1>

          {product.rating !== undefined && (
            <div className={styles.ratingRow}>
              <span className={styles.stars}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
              <span className={styles.ratingNum}>{product.rating.toFixed(1)}</span>
              {product.reviewCount !== undefined && <span className={styles.reviewCount}>({product.reviewCount} reviews)</span>}
            </div>
          )}

          {(product.badges ?? []).length > 0 && (
            <div className={styles.badgeRow}>
              {product.badges!.map(b => <span key={b} className={styles.badge}>{b}</span>)}
            </div>
          )}

          <div className={styles.priceBlock}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          <div className={styles.quantityRow}>
            <button className={styles.qtyBtn} onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
            <span className={styles.qtyValue}>{quantity}</span>
            <button className={styles.qtyBtn} onClick={() => setQuantity(q => q + 1)}>+</button>
          </div>

          <AddToCartBtn onAdd={() => { addItem(product, quantity); openCart(); }} />
          <button className={styles.buyNowBtn} onClick={() => { addItem(product, quantity); openCart(); }}>Comprar</button>

          <ul className={styles.quickSpecs}>
            {specs.storage    && <li>· Almacenamiento: {specs.storage}</li>}
            {specs.screenSize && <li>· Pantalla: {specs.screenSize}</li>}
            {specs.camera     && <li>· Cámara: {specs.camera}</li>}
            {specs.ram        && <li>· RAM: {specs.ram}</li>}
            {product.color    && <li>· Color: {product.color}</li>}
          </ul>

          {product.stock !== undefined && (
            <p className={styles.stock}>
              {product.stock > 0
                ? <><span className={styles.inStock}>●</span> {product.stock} units available</>
                : <><span className={styles.outStock}>●</span> Out of stock</>}
            </p>
          )}
        </div>
      </section>

      <hr className={styles.divider} />

      <section className={styles.detailSection}>
        {product.description && (
          <div className={styles.descBlock}>
            <h2 className={styles.sectionTitle}>Descripción general</h2>
            <p className={styles.description}>{product.description}</p>
          </div>
        )}
        {visibleSpecs.map(s => <SpecSection key={s.title} title={s.title} lines={s.lines} />)}
        {specSections.length > 2 && (
          <button className={styles.toggleSpecs} onClick={() => setSpecsExpanded(v => !v)}>
            {specsExpanded ? '∧ Ver menos' : '∨ Ver más especificaciones'}
          </button>
        )}
      </section>

      {related.length > 0 && (
        <>
          <hr className={styles.divider} />
          <section className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>Más Productos</h2>
            <div className={styles.relatedGrid}>
              {related.map(p => (
                <RelatedCard key={p.id} product={p} onClick={() => navigate(`/product/${p.slug ?? p.id}`)} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ProductDetailPage;
