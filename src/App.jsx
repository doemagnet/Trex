// src/App.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { menuCategories, menuData } from "./data";
import logo from "./assets/logo.webp";
import igIcon from "./assets/ig.svg";
import ttIcon from "./assets/tt.svg";
import fbIcon from "./assets/fb.svg";
import bgMusic from "./assets/sound.mp3"; // <-- Imported sound

// Phone from menu cover: 449-413-55-93 → MX international format = 524494135593
const WHATSAPP_NUMBER = "524494135593";
const BUSINESS_NAME = "Trex-Burger";

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    url: "https://www.instagram.com/tre.xburguer",
    icon: igIcon,
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@trex_burger.1",
    icon: ttIcon,
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/share/195VgnhtCz/?mibextid=wwXIfr",
    icon: fbIcon,
  },
];

export default function App() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("trex_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [orderNotes, setOrderNotes] = useState(() => {
    try {
      return localStorage.getItem("trex_notes") || "";
    } catch {
      return "";
    }
  });
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // ─── Audio State & Ref ───────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const categoryRefs = useRef({});
  const navRef = useRef(null);

  // Persist cart + notes across reloads
  useEffect(() => {
    localStorage.setItem("trex_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("trex_notes", orderNotes);
  }, [orderNotes]);

  // Group items by category once
  const itemsByCategory = useMemo(() => {
    return menuCategories.reduce((acc, cat) => {
      acc[cat] = menuData.filter((item) => item.category === cat);
      return acc;
    }, {});
  }, []);

  // Totals
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  // ─── Audio actions ───────────────────────────────────────────────
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // ─── Cart actions ────────────────────────────────────────────────
  const addToCart = (item, variant = "base", qty = 1) => {
    const isCombo = variant === "combo";
    const price = isCombo ? item.priceCombo : item.priceBase;
    const comboLabel = item.variantLabels?.combo || "c/Papas";
    const name = isCombo ? `${item.name} (${comboLabel})` : item.name;
    const cartId = `${item.id}-${variant}`;

    setCart((prev) => {
      const existing = prev.find((c) => c.cartId === cartId);
      if (existing) {
        return prev.map((c) =>
          c.cartId === cartId ? { ...c, quantity: c.quantity + qty } : c
        );
      }
      return [...prev, { cartId, id: item.id, name, price, quantity: qty }];
    });

    // Confirmation animation hook — bump the FAB
    const fab = document.querySelector(".cart-fab");
    if (fab) {
      fab.classList.remove("bump");
      void fab.offsetWidth;
      fab.classList.add("bump");
    }
  };

  const updateQuantity = (cartId, delta) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.cartId === cartId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const clearCart = () => {
    if (window.confirm("¿Vaciar el pedido?")) {
      setCart([]);
      setOrderNotes("");
    }
  };

  // ─── Category navigation ─────────────────────────────────────────
  const scrollToCategory = (cat) => {
    const el = categoryRefs.current[cat];
    if (!el) return;
    const offset = 110;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // Keep active pill visible in the horizontal nav
  useEffect(() => {
    const activeBtn = navRef.current?.querySelector(
      `[data-cat="${CSS.escape(activeCategory)}"]`
    );
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCategory]);

  // Scroll-spy: highlight the category currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveCategory(visible[0].target.dataset.category);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      }
    );

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Lock body scroll when cart drawer is open
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // ─── WhatsApp order ──────────────────────────────────────────────
  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    let message = `*NUEVO PEDIDO — ${BUSINESS_NAME.toUpperCase()}*\n\n`;
    message += `*Productos:*\n`;
    cart.forEach((item) => {
      message += `• ${item.quantity}x ${item.name} — $${
        item.price * item.quantity
      }\n`;
    });
    message += `\n*TOTAL: $${totalPrice}*\n`;

    const notes = orderNotes.trim();
    if (notes) {
      message += `\n*Notas:*\n${notes}\n`;
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="header">
        <img src={logo} alt={BUSINESS_NAME} className="logo" />
        <div className="header-text">
          <h1>{BUSINESS_NAME}</h1>
          <p>Hamburguesas, tacos y más</p>
        </div>
        <div className="social-links">
          {SOCIAL_LINKS.map(({ name, url, icon }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label={name}
            >
              <img src={icon} alt="" />
            </a>
          ))}
        </div>
      </header>

      <nav className="category-nav" ref={navRef} aria-label="Categorías">
        {menuCategories.map((cat) => (
          <button
            key={cat}
            data-cat={cat}
            className={`category-pill ${
              activeCategory === cat ? "active" : ""
            }`}
            onClick={() => scrollToCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main className="menu">
        {menuCategories.map((cat) => {
          const items = itemsByCategory[cat] || [];
          if (items.length === 0) return null;
          return (
            <section
              key={cat}
              ref={(el) => (categoryRefs.current[cat] = el)}
              data-category={cat}
              className="category-section"
            >
              <h2 className="category-title">{cat}</h2>
              <div className="items-list">
                {items.map((item) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    onAdd={(variant, qty) => addToCart(item, variant, qty)}
                  />
                ))}
              </div>
            </section>
          );
        })}
        <div style={{ height: totalItems > 0 ? 100 : 40 }} />
      </main>

      {totalItems > 0 && !isCartOpen && (
        <button
          className="cart-fab"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Ver pedido, ${totalItems} artículos`}
        >
          <span className="cart-fab-left">
            <span className="cart-count">{totalItems}</span>
            <span>Ver pedido</span>
          </span>
          <span className="cart-fab-total">${totalPrice}</span>
        </button>
      )}

      {isCartOpen && (
        <>
          <div
            className="cart-backdrop"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />
          <div
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Tu pedido"
          >
            <div className="cart-handle" />
            <div className="cart-header">
              <h2>Tu Pedido</h2>
              <button
                className="close-btn"
                onClick={() => setIsCartOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="cart-empty">Tu pedido está vacío</p>
            ) : (
              <>
                <ul className="cart-items">
                  {cart.map((item) => (
                    <li key={item.cartId} className="cart-item">
                      <div className="cart-item-main">
                        <h4>{item.name}</h4>
                        <p className="cart-item-unit">${item.price} c/u</p>
                      </div>
                      <div className="cart-item-controls">
                        <div className="qty-control">
                          <button
                            onClick={() => updateQuantity(item.cartId, -1)}
                            aria-label="Quitar uno"
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartId, 1)}
                            aria-label="Agregar uno"
                          >
                            +
                          </button>
                        </div>
                        <div className="cart-item-total">
                          ${item.price * item.quantity}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="cart-footer">
                  <textarea
                    className="order-notes"
                    placeholder="Notas para el pedido (ej. sin cebolla, extra picante, sin tomate...)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    maxLength={300}
                  />
                  <button className="clear-btn" onClick={clearCart}>
                    Vaciar pedido
                  </button>
                  <div className="cart-total-row">
                    <span>Total</span>
                    <strong>${totalPrice}</strong>
                  </div>
                  <button className="whatsapp-btn" onClick={sendWhatsAppOrder}>
                    <WhatsAppIcon />
                    Ordena por WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={bgMusic} loop />

      {/* Floating Music Button */}
      <button
        onClick={toggleMusic}
        aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px", // Placed on the left to avoid the cart FAB
          zIndex: 99,
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#1a1a1a",
          color: "white",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          transition: "transform 0.2s ease"
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isPlaying ? "⏸️" : "🎵"}
      </button>

    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function MenuItem({ item, onAdd }) {
  const hasCombo = item.priceCombo != null;
  const hasQuickAdd =
    item.isIndividualItem &&
    Array.isArray(item.quickQuantities) &&
    item.quickQuantities.length > 0;
  const baseLabel = item.variantLabels?.base || "Sencilla";
  const comboLabel = item.variantLabels?.combo || "C/Papas";

  return (
    <article className="item-card">
      <div className="item-info">
        <h3>{item.name}</h3>
        {item.description && <p>{item.description}</p>}
        {hasQuickAdd && (
          <p className="item-unit-price">${item.priceBase} c/u</p>
        )}
      </div>

      <div className="item-actions">
        {hasQuickAdd ? (
          <div className="quick-add">
            {item.quickQuantities.map((qty) => (
              <button
                key={qty}
                className="quick-add-btn"
                onClick={() => onAdd("base", qty)}
                aria-label={`Agregar ${qty} ${item.name}`}
              >
                <span className="qa-qty">+{qty}</span>
                <span className="qa-price">${item.priceBase * qty}</span>
              </button>
            ))}
          </div>
        ) : hasCombo ? (
          <>
            <button
              className="add-btn"
              onClick={() => onAdd("base", 1)}
              aria-label={`Agregar ${item.name} ${baseLabel}`}
            >
              <span className="add-btn-label">{baseLabel}</span>
              <span className="add-btn-price">${item.priceBase}</span>
            </button>
            <button
              className="add-btn combo"
              onClick={() => onAdd("combo", 1)}
              aria-label={`Agregar ${item.name} ${comboLabel}`}
            >
              <span className="add-btn-label">{comboLabel}</span>
              <span className="add-btn-price">${item.priceCombo}</span>
            </button>
          </>
        ) : (
          <button
            className="add-btn full"
            onClick={() => onAdd("base", 1)}
            aria-label={`Agregar ${item.name}`}
          >
            <span className="add-btn-label">Agregar</span>
            <span className="add-btn-price">
              ${item.priceBase}
              {item.isIndividualItem ? " c/u" : ""}
            </span>
          </button>
        )}
      </div>
    </article>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}