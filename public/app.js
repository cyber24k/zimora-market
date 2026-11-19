const state = {
  products: [],
  category: 'All',
  query: '',
  sort: 'featured',
  cart: [],
  token: localStorage.getItem('zimora-token') || '',
  user: null,
  authMode: 'login'
};

const $ = selector => document.querySelector(selector);
const productGrid = $('#product-grid');
const overlay = $('#overlay');
const cartDrawer = $('#cart-drawer');
const money = amount => `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let toastTimer;

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function productCard(product) {
  const img = escapeHtml(product.image);
  return `<article class="product-card" data-product="${escapeHtml(product._id)}" tabindex="0" aria-label="View ${escapeHtml(product.name)}">
    <div class="product-image"><img src="${img}" alt="${escapeHtml(product.name)}" loading="lazy">${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}
      <button class="quick-add" data-add="${escapeHtml(product._id)}" aria-label="Add ${escapeHtml(product.name)} to bag">+</button></div>
    <div class="product-info"><p class="product-category">${escapeHtml(product.category)}</p><h3>${escapeHtml(product.name)}</h3>
      <div class="product-rating">★ ${Number(product.rating).toFixed(1)} <span>(${Math.max(14, Math.round(product.rating * 23))} reviews)</span></div>
      <div class="product-price">${money(product.price)}${product.compareAtPrice ? `<del>${money(product.compareAtPrice)}</del>` : ''}</div></div>
  </article>`;
}

async function loadProducts() {
  const params = new URLSearchParams({ sort: state.sort });
  if (state.category !== 'All') params.set('category', state.category);
  if (state.query) params.set('q', state.query);
  productGrid.innerHTML = '<div class="loading-state">Finding the good stuff…</div>';
  try {
    const data = await api(`/api/products?${params}`);
    state.products = data.products;
    productGrid.innerHTML = state.products.map(productCard).join('');
    $('#results-label').textContent = `${state.products.length} ${state.products.length === 1 ? 'find' : 'finds'} for your everyday`;
    $('#all-count').textContent = state.category === 'All' && !state.query ? state.products.length : '';
    $('#empty-state').classList.toggle('hidden', state.products.length > 0);
    productGrid.classList.toggle('hidden', state.products.length === 0);
  } catch (error) {
    productGrid.innerHTML = '<div class="loading-state">We couldn’t load the collection. Please refresh to try again.</div>';
    showToast(error.message);
  }
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function updateCartBadge() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $('#cart-count').textContent = count;
  $('#drawer-count').textContent = count ? `(${count})` : '';
  $('#cart-subtotal').textContent = money(cartTotal());
  $('#checkout-total').textContent = money(cartTotal());
}

function renderCart() {
  updateCartBadge();
  const hasItems = state.cart.length > 0;
  $('#cart-empty').classList.toggle('hidden', hasItems);
  $('#cart-summary').classList.toggle('hidden', !hasItems);
  $('#cart-items').classList.toggle('hidden', !hasItems);
  $('#cart-items').innerHTML = state.cart.map(({ product, quantity }) => `
    <article class="cart-line">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      <div><h3>${escapeHtml(product.name)}</h3><p class="line-category">${escapeHtml(product.category)}</p>
        <div><span class="quantity-control"><button data-quantity="${escapeHtml(product._id)}" data-change="-1" aria-label="Decrease quantity">−</button><span>${quantity}</span><button data-quantity="${escapeHtml(product._id)}" data-change="1" aria-label="Increase quantity">+</button></span>
        <button class="remove-item" data-remove="${escapeHtml(product._id)}">Remove</button></div>
      </div><span class="line-price">${money(product.price * quantity)}</span>
    </article>`).join('');
}

function saveGuestCart() {
  localStorage.setItem('zimora-cart', JSON.stringify(state.cart.map(item => ({ productId: item.product._id, quantity: item.quantity }))));
}

function guestCart() {
  try { return JSON.parse(localStorage.getItem('zimora-cart') || '[]'); }
  catch { return []; }
}

async function loadCart() {
  if (!state.token) {
    const saved = guestCart();
    state.cart = saved.map(line => {
      const product = state.products.find(item => item._id === line.productId);
      return product ? { product, quantity: line.quantity } : null;
    }).filter(Boolean);
    renderCart();
    return;
  }
  try {
    const { cart } = await api('/api/cart');
    state.cart = (cart.items || []).filter(line => line.product).map(line => ({ product: line.product, quantity: line.quantity }));
    renderCart();
  } catch (error) {
    if (error.message.includes('session has expired')) signOut(false);
    showToast(error.message);
  }
}

async function syncGuestCart() {
  const items = guestCart();
  const { cart } = await api('/api/cart/sync', { method: 'POST', body: JSON.stringify({ items }) });
  state.cart = (cart.items || []).filter(line => line.product).map(line => ({ product: line.product, quantity: line.quantity }));
  localStorage.removeItem('zimora-cart');
  renderCart();
}

async function addToCart(productId) {
  const product = state.products.find(item => item._id === productId);
  if (!product) return;
  if (state.token) {
    try {
      const { cart } = await api('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) });
      state.cart = cart.items.filter(line => line.product).map(line => ({ product: line.product, quantity: line.quantity }));
      renderCart();
    } catch (error) { showToast(error.message); return; }
  } else {
    const existing = state.cart.find(item => item.product._id === productId);
    if (existing) existing.quantity = Math.min(20, existing.quantity + 1);
    else state.cart.push({ product, quantity: 1 });
    saveGuestCart();
    renderCart();
  }
  showToast(`${product.name} added to your bag.`);
}

async function changeQuantity(productId, delta) {
  const item = state.cart.find(line => line.product._id === productId);
  if (!item) return;
  const quantity = item.quantity + delta;
  if (quantity < 1) return removeItem(productId);
  if (quantity > 20) return showToast('Maximum quantity is 20 per item.');
  if (state.token) {
    try {
      const { cart } = await api(`/api/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
      state.cart = cart.items.filter(line => line.product).map(line => ({ product: line.product, quantity: line.quantity }));
    } catch (error) { showToast(error.message); return; }
  } else {
    item.quantity = quantity;
    saveGuestCart();
  }
  renderCart();
}

async function removeItem(productId) {
  if (state.token) {
    try {
      const { cart } = await api(`/api/cart/items/${productId}`, { method: 'DELETE' });
      state.cart = cart.items.filter(line => line.product).map(line => ({ product: line.product, quantity: line.quantity }));
    } catch (error) { showToast(error.message); return; }
  } else {
    state.cart = state.cart.filter(item => item.product._id !== productId);
    saveGuestCart();
  }
  renderCart();
}

function openLayer(layer) {
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('visible'));
  layer.classList.remove('hidden');
  requestAnimationFrame(() => layer.classList.add('visible'));
  document.body.style.overflow = 'hidden';
}

function closeLayers() {
  if (cartDrawer.classList.contains('open')) $('#cart-button').focus();
  overlay.classList.remove('visible');
  cartDrawer.classList.remove('open');
  document.querySelectorAll('.modal.visible').forEach(modal => modal.classList.remove('visible'));
  document.body.style.overflow = '';
  setTimeout(() => {
    overlay.classList.add('hidden');
    cartDrawer.classList.add('hidden');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
  }, 220);
}

function openCart() {
  renderCart();
  cartDrawer.classList.remove('hidden');
  cartDrawer.setAttribute('aria-hidden', 'false');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => { overlay.classList.add('visible'); cartDrawer.classList.add('open'); });
  document.body.style.overflow = 'hidden';
}

function openAuth(mode = 'login') {
  state.authMode = mode;
  $('#auth-form').reset();
  $('#auth-error').textContent = '';
  updateAuthForm();
  openLayer($('#auth-modal'));
}

function updateAuthForm() {
  const registering = state.authMode === 'register';
  $('#auth-title').innerHTML = registering ? 'Make yourself<br><em>at home.</em>' : 'Good to have<br><em>you here.</em>';
  $('#auth-description').textContent = registering ? 'Create an account to keep your bag and orders together.' : 'Sign in to keep your bag close and check out.';
  $('#auth-submit').innerHTML = registering ? 'Create account <span>→</span>' : 'Sign in <span>→</span>';
  $('#name-field').classList.toggle('hidden', !registering);
  $('#phone-field').classList.toggle('hidden', !registering);
  $('#name-field input').required = registering;
  $('#auth-form [name="password"]').autocomplete = registering ? 'new-password' : 'current-password';
  document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.authMode === state.authMode));
}

function updateAccount() {
  $('#account-label').textContent = state.user ? state.user.name.split(' ')[0] : 'Account';
  $('#account-button').setAttribute('aria-label', state.user ? 'Sign out' : 'Sign in');
}

function signOut(showMessage = true) {
  state.token = '';
  state.user = null;
  state.cart = [];
  localStorage.removeItem('zimora-token');
  updateAccount();
  renderCart();
  if (showMessage) showToast('You have signed out.');
}

function showProduct(productId) {
  const product = state.products.find(item => item._id === productId);
  if (!product) return;
  $('#product-modal').innerHTML = `<button class="close-button modal-close" data-close aria-label="Close product details">×</button>
    <div class="product-modal-content"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
    <div><p class="product-category">${escapeHtml(product.category)}</p><h2>${escapeHtml(product.name)}</h2>
      <div class="product-rating">★ ${Number(product.rating).toFixed(1)} <span>Thoughtfully selected</span></div>
      <div class="product-price">${money(product.price)}${product.compareAtPrice ? `<del>${money(product.compareAtPrice)}</del>` : ''}</div>
      <p class="product-description">${escapeHtml(product.description)}</p><button class="button button-dark" data-add="${escapeHtml(product._id)}">Add to your bag <span>+</span></button></div></div>`;
  openLayer($('#product-modal'));
}

function openCheckout() {
  if (!state.cart.length) return;
  closeLayers();
  setTimeout(() => {
    if (!state.token) {
      openAuth('login');
      showToast('Sign in or create an account to finish checkout.');
      return;
    }
    $('#checkout-form').reset();
    $('#checkout-error').textContent = '';
    $('#order-result').classList.add('hidden');
    $('#checkout-form').classList.remove('hidden');
    $('#pay-button').disabled = false;
    $('#pay-button').classList.remove('hidden');
    $('#processing-message').classList.add('hidden');
    $('#checkout-total').textContent = money(cartTotal());
    updatePaymentFields();
    openLayer($('#checkout-modal'));
  }, 230);
}

function updatePaymentFields() {
  const method = $('#checkout-form').elements.paymentMethod.value;
  $('#card-fields').classList.toggle('hidden', method !== 'card');
  $('#ecocash-fields').classList.toggle('hidden', method !== 'ecocash');
  $('#card-fields').querySelectorAll('input').forEach(input => { input.required = method === 'card'; });
  $('#ecocash-fields').querySelector('input').required = method === 'ecocash';
}

productGrid.addEventListener('click', event => {
  const addButton = event.target.closest('[data-add]');
  if (addButton) { event.stopPropagation(); addToCart(addButton.dataset.add); return; }
  const card = event.target.closest('[data-product]');
  if (card) showProduct(card.dataset.product);
});
productGrid.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.product-card')) {
    event.preventDefault();
    showProduct(event.target.dataset.product);
  }
});

document.addEventListener('click', event => {
  const category = event.target.closest('[data-category]');
  if (category) {
    state.category = category.dataset.category;
    document.querySelectorAll('.category-chip').forEach(chip => chip.classList.toggle('active', chip === category));
    loadProducts();
  }
  const navCategory = event.target.closest('[data-nav-category]');
  if (navCategory) {
    state.category = navCategory.dataset.navCategory;
    document.querySelectorAll('.category-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.category === state.category));
    loadProducts();
  }
  const quantity = event.target.closest('[data-quantity]');
  if (quantity) changeQuantity(quantity.dataset.quantity, Number(quantity.dataset.change));
  const remove = event.target.closest('[data-remove]');
  if (remove) removeItem(remove.dataset.remove);
  if (event.target.closest('[data-close]')) closeLayers();
  const authTab = event.target.closest('[data-auth-mode]');
  if (authTab) { state.authMode = authTab.dataset.authMode; updateAuthForm(); }
  const addButton = event.target.closest('[data-add]');
  if (addButton && !productGrid.contains(addButton)) {
    addToCart(addButton.dataset.add);
    closeLayers();
  }
});

$('#cart-button').addEventListener('click', openCart);
$('#account-button').addEventListener('click', () => state.user ? signOut() : openAuth());
$('#checkout-button').addEventListener('click', openCheckout);
$('#clear-filters').addEventListener('click', () => {
  state.category = 'All'; state.query = ''; $('#search-input').value = '';
  document.querySelectorAll('.category-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.category === 'All'));
  loadProducts();
});
$('#sort-select').addEventListener('change', event => { state.sort = event.target.value; loadProducts(); });
let searchTimer;
$('#search-input').addEventListener('input', event => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.query = event.target.value.trim(); loadProducts(); }, 230);
});
overlay.addEventListener('click', closeLayers);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLayers(); });
$('#checkout-form').elements.paymentMethod.forEach(input => input.addEventListener('change', updatePaymentFields));

$('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  const endpoint = state.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  const button = $('#auth-submit');
  button.disabled = true;
  $('#auth-error').textContent = '';
  try {
    const result = await api(endpoint, { method: 'POST', body: JSON.stringify(values) });
    state.token = result.token;
    state.user = result.user;
    localStorage.setItem('zimora-token', state.token);
    updateAccount();
    await syncGuestCart();
    closeLayers();
    showToast(`Welcome${state.user.name ? `, ${state.user.name.split(' ')[0]}` : ''}!`);
  } catch (error) {
    $('#auth-error').textContent = error.message;
  } finally { button.disabled = false; }
});

$('#checkout-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  const paymentDetails = values.paymentMethod === 'card'
    ? { cardNumber: values.cardNumber, expiry: values.expiry, cvv: values.cvv }
    : { phone: values.ecocashPhone };
  $('#checkout-error').textContent = '';
  $('#pay-button').disabled = true;
  $('#processing-message').classList.remove('hidden');
  await new Promise(resolve => setTimeout(resolve, 1100));
  try {
    const result = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: values.paymentMethod, paymentDetails, deliveryAddress: values.deliveryAddress })
    });
    const succeeded = result.result === 'success';
    const receipt = result.order ? `<br>Confirmation: <strong>${escapeHtml(result.order.confirmationCode)}</strong><br>Order total: ${money(result.order.total)}` : '';
    $('#order-result').innerHTML = `<strong>${succeeded ? 'Your order is confirmed. ✓' : 'Payment not approved'}</strong>${escapeHtml(result.message)}${receipt}${succeeded ? '<br><br><button class="text-button" data-close>Continue exploring</button>' : ''}`;
    $('#order-result').classList.toggle('failure', !succeeded);
    $('#order-result').classList.remove('hidden');
    if (succeeded) {
      $('#checkout-form').classList.add('hidden');
      $('#pay-button').classList.add('hidden');
      await loadCart();
      await loadProducts();
    }
  } catch (error) {
    $('#checkout-error').textContent = error.message;
    $('#pay-button').disabled = false;
  } finally {
    $('#processing-message').classList.add('hidden');
  }
});

async function initialize() {
  await loadProducts();
  if (state.token) {
    try {
      const { user } = await api('/api/auth/me');
      state.user = user;
      updateAccount();
    } catch { signOut(false); }
  }
  await loadCart();
}

initialize();
