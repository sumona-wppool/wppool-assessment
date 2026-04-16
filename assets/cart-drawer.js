class CartDrawer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.overlay  = this.querySelector('#cart-overlay');
    this.closeBtn = this.querySelector('#close-cart');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Listen for cart:open event (fired by Add to Cart buttons)
    document.addEventListener('cart:open', () => this.open());

    // Intercept all Add to Cart form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('form[action*="/cart/add"]');
      if (!form) return;
      e.preventDefault();
      this.addToCart(form);
    });
  }

  // ── ADD TO CART ────────────────────────────────────────────
  async addToCart(form) {
    const submitBtn = form.querySelector('[type="submit"], [name="add"]');
    const origText  = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) {
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Adding…';
    }

    try {
      const res = await fetch('/cart/add.js', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams(new FormData(form)).toString(),
      });

      if (!res.ok) throw new Error('Add to cart failed');

      this.open();
    } catch (err) {
      console.error('[CartDrawer]', err);
      alert('Could not add item. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled    = false;
        submitBtn.textContent = origText;
      }
    }
  }

  // ── OPEN / CLOSE ───────────────────────────────────────────
  open() {
    this.fetchCart();
    this.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── FETCH CART DATA ────────────────────────────────────────
  fetchCart() {
    const cartItems = this.querySelector('#cart-items');
    const cartTotal = this.querySelector('#cart-total-price');
    const cartCount = this.querySelector('#cart-count');

    // Show loading spinner
    if (cartItems) {
      cartItems.innerHTML = `
        <div class="cart-loading">
          <div class="spinner"></div>
        </div>`;
    }

    fetch('/cart.js')
      .then(res => res.json())
      .then(cart => {

        // Update count
        if (cartCount) cartCount.textContent = cart.item_count;

        // Update total price
        if (cartTotal) cartTotal.textContent = this.formatMoney(cart.total_price);

        // Render items
        if (cartItems) {
          if (!cart.items || cart.items.length === 0) {
            cartItems.innerHTML = `
              <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>Your cart is empty.</p>
              </div>`;
            return;
          }

          cartItems.innerHTML = cart.items.map(item => this.renderItem(item)).join('');

          // Bind qty and remove buttons after render
          this.bindItemEvents();
        }
      })
      .catch(err => {
        console.error('[CartDrawer] fetchCart error:', err);
        if (cartItems) {
          cartItems.innerHTML = `<p style="padding:20px;color:#999">Unable to load cart.</p>`;
        }
      });
  }

  // ── RENDER SINGLE ITEM ─────────────────────────────────────
  renderItem(item) {
    const image = item.image
      ? `<img class="cart-item-image" src="${item.image}" alt="${this.escapeHtml(item.product_title)}" loading="lazy">`
      : `<div class="cart-item-image" style="background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:24px">📦</div>`;

    const variant = (item.variant_title && item.variant_title !== 'Default Title')
      ? `<p class="cart-item-variant">${this.escapeHtml(item.variant_title)}</p>`
      : '';

    const configHtml = this.renderConfig(item);

    return `
      <div class="cart-item" data-key="${item.key}" data-qty="${item.quantity}">
        <div class="cart-item-top">
          ${image}
          <div class="cart-item-details">
            <h4 class="cart-item-title">${this.escapeHtml(item.product_title)}</h4>
            ${variant}
            <p class="cart-item-price">${this.formatMoney(item.final_line_price)}</p>
          </div>
        </div>

        ${configHtml}

        <div class="cart-item-actions">
          <div class="qty-control">
            <button class="qty-btn" data-key="${item.key}" data-qty-change="-1" aria-label="Decrease">−</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" data-key="${item.key}" data-qty-change="1" aria-label="Increase">+</button>
          </div>
          <button class="remove-btn" data-remove-key="${item.key}">Remove</button>
        </div>
      </div>`;
  }

  // ── RENDER CONFIGURATION SUMMARY ──────────────────────────
  renderConfig(item) {
    const rows = [];

    // Line-item properties (custom options, engraving, builder fields, etc.)
    if (item.properties && Object.keys(item.properties).length > 0) {
      Object.entries(item.properties).forEach(([key, value]) => {
        // Skip empty values and private (underscore) properties
        if (!value || key.startsWith('_')) return;
        rows.push({ key: this.formatKey(key), value: String(value) });
      });
    }

    // Variant options (Color, Size, Material, etc.)
    if (item.options_with_values && item.options_with_values.length > 0) {
      item.options_with_values.forEach(({ name, value }) => {
        if (value && value !== 'Default Title') {
          rows.push({ key: name, value });
        }
      });
    }

    if (rows.length === 0) return '';

    const rowsHtml = rows.map(({ key, value }) => `
      <div class="config-row">
        <span class="config-key">${this.escapeHtml(key)}</span>
        <span class="config-value">${this.escapeHtml(value)}</span>
      </div>`).join('');

    return `
      <div class="cart-item-config">
        <p class="cart-item-config-title">Configuration</p>
        ${rowsHtml}
      </div>`;
  }

  // ── BIND QTY + REMOVE EVENTS ───────────────────────────────
  bindItemEvents() {
    this.querySelectorAll('[data-qty-change]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key     = btn.dataset.key;
        const row     = btn.closest('.cart-item');
        const current = parseInt(row.dataset.qty, 10);
        const delta   = parseInt(btn.dataset.qtyChange, 10);
        const next    = Math.max(0, current + delta);
        this.updateQty(key, next);
      });
    });

    this.querySelectorAll('[data-remove-key]').forEach(btn => {
      btn.addEventListener('click', () => this.updateQty(btn.dataset.removeKey, 0));
    });
  }

  // ── UPDATE QUANTITY ────────────────────────────────────────
  updateQty(key, qty) {
    fetch('/cart/change.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: key, quantity: qty }),
    })
    .then(() => this.fetchCart())
    .catch(err => console.error('[CartDrawer] updateQty error:', err));
  }

  // ── HELPERS ────────────────────────────────────────────────
  formatMoney(cents) {
    return (cents / 100).toLocaleString('en-US', {
      style:    'currency',
      currency: window.Shopify?.currency?.active || 'USD',
    });
  }

  // "product_color" → "Product Color"
  formatKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ── Register Web Component ─────────────────────────────────
customElements.define('cart-drawer', CartDrawer);

// ── Global API ─────────────────────────────────────────────
window.CartDrawerAPI = {
  open:  () => document.getElementById('cart-drawer')?.open(),
  close: () => document.getElementById('cart-drawer')?.close(),
};