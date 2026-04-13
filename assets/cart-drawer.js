class CartDrawer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.overlay = this.querySelector('#cart-overlay');
    this.closeBtn = this.querySelector('#close-cart');
    
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    document.addEventListener('cart:open', () => this.open());
  }

  open() {
    this.fetchCart();
    this.classList.add('open');
  }

  close() {
    this.classList.remove('open');
  }

  fetchCart() {
    fetch('/cart.js')
      .then(res => res.json())
      .then(cart => {
        const cartItems = this.querySelector('#cart-items');
        const cartTotal = this.querySelector('#cart-total-price');
        let html = '';