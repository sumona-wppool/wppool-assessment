class ProductConfigurator extends HTMLElement {
  constructor() {
    super();
    this.basePrice = parseFloat(this.dataset.basePrice) || 0;
    this.priceAdders = {};
  }

  connectedCallback() {
    this.initSteps();
    this.initColorOptions();
    this.initVentilationBrand();
    this.initPriceAdders();
    this.initAddToCart();
    this.updatePrice();
  }

  initSteps() {
    this.querySelectorAll('.btn-next').forEach(btn => {
      btn.addEventListener('click', () => {
        this.goToStep(parseInt(btn.dataset.next));
      });
    });
    this.querySelectorAll('.btn-prev').forEach(btn => {
      btn.addEventListener('click', () => {
        this.goToStep(parseInt(btn.dataset.prev));
      });
    });
  }

  goToStep(step) {
    this.querySelectorAll('.step-panel').forEach(panel => {
      panel.style.display = 'none';
    });
    const target = this.querySelector(`.step-panel[data-step="${step}"]`);
    if (target) target.style.display = 'block';
    this.querySelectorAll('.step-indicator').forEach(ind => {
      const s = parseInt(ind.dataset.step);
      ind.classList.remove('active', 'completed');
      if (s === step) ind.classList.add('active');
      if (s < step) ind.classList.add('completed');
    });
    if (step === 5) this.updateFullSummary();
  }

  initColorOptions() {
    const colorOptions = this.querySelector('#color-options');
    if (!colorOptions) return;
    colorOptions.addEventListener('change', () => {
      const val = colorOptions.value;
      const pg = this.querySelector('#paint-finish-group');
      const cm = this.querySelector('#color-match-group');
      const sw = this.querySelector('#sw-code-group');
      if (pg) pg.style.display = val === 'Paint Match' ? 'block' : 'none';
      if (cm) cm.style.display = val === 'Paint Match' ? 'block' : 'none';
      if (sw) sw.style.display = val === 'Sherwin-Williams Match' ? 'block' : 'none';
      this.priceAdders['color'] = val === 'Paint Match' ? 150 : val === 'Sherwin-Williams Match' ? 200 : 0;
      this.updatePrice();
    });
  }

  initVentilationBrand() {
    const ventBrand = this.querySelector('#ventilation-brand');
    if (!ventBrand) return;
    ventBrand.addEventListener('change', () => {
      const brand = ventBrand.value;
      const ids = ['broan-cfm','zline-cfm','ventahood-cfm','tradewinds-cfm','hauslane-cfm'];
      const brands = ['Broan','ZLine','Vent-A-Hood','TradeWinds','Hauslane'];
      ids.forEach((id, i) => {
        const el = this.querySelector(`#${id}`);
        if (el) el.style.display = brand === brands[i] ? 'block' : 'none';
      });
    });
  }

  initPriceAdders() {
    this.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', () => {
        const selected = sel.options[sel.selectedIndex];
        const price = parseInt(selected.getAttribute('data-price') || 0);
        this.priceAdders[sel.name] = price;
        this.updatePrice();
      });
    });
  }

  updatePrice() {
    let total = this.basePrice;
    Object.values(this.priceAdders).forEach(p => { total += p; });
    const tp = this.querySelector('#total-price');
    const fp = this.querySelector('#final-price');
    if (tp) tp.textContent = total.toFixed(2);
    if (fp) fp.textContent = total.toFixed(2);
  }

  updateFullSummary() {
    const summary = this.querySelector('#full-summary');
    if (!summary) return;
    let html = '';
    this.querySelectorAll('select, input').forEach(field => {
      if (field.name && field.value && field.offsetParent !== null) {
        html += `<p><strong>${field.name}:</strong> ${field.value}</p>`;
      }
    });
    summary.innerHTML = html;
    this.updatePrice();
  }

  initAddToCart() {
    const addBtn = this.querySelector('#add-to-cart-btn');
    if (!addBtn) return;
    addBtn.addEventListener('click', () => {
      const properties = {};
      this.querySelectorAll('select, input').forEach(field => {
        if (field.name && field.value && field.offsetParent !== null) {
          properties[field.name] = field.value;
        }
      });
      const variantId = this.dataset.variantId;
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1, properties: properties })
      })
      .then(res => res.json())
      .then(() => { document.dispatchEvent(new CustomEvent('cart:open')); })
      .catch(err => {
        console.error('Error:', err);
        alert('Error adding to cart. Please try again.');
      });
    });
  }
}

customElements.define('product-configurator', ProductConfigurator);