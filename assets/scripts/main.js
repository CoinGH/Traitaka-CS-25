/* const products = [
    {
        id: 0,
        title: "Ноутбук Apple MacBook Pro 16",
        price: 99999,
        category: "laptops",
        image: "assets/img/item_pics/item0.png",
    },
    {
        id: 1,
        title: "Смартфон Samsung Galaxy S25",
        price: 39999,
        category: "smartphones",
        image: "assets/img/item_pics/item1.png",
    },
    {
        id: 2,
        title: "Смартфон Apple iPhone 15 Pro 256GB",
        price: 89999,
        category: "smartphones",
        image: "assets/img/item_pics/item2.png",
    },
    {
        id: 3,
        title: "Смартфон Apple iPhone 67 Pro Max 6767GB",
        price: 670000,
        category: "exclusives",
        image: "assets/img/item_pics/item3.png",
    },
    {
        id: 4,
        title: "Кубок 10000 годин вайбкодингу",
        price: 9999,
        category: "exclusives",
        image: "assets/img/item_pics/item4.png",
    },
    {
        id: 5,
        title: "Мерч SayGex Shop X DEGAN",
        price: 200,
        category: "exclusives",
        image: "assets/img/item_pics/item5.png",
    }
];
*/
const CART_STORAGE_KEY = 'saygexshop_cart';
let globalStoreProducts = [];
let cart = loadCartFromStorage();

const productsContainer = document.querySelector('.products-grid');
productsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-buy')) {
        const productId = Number(event.target.dataset.id);
        addToCart(productId);
    }
});

function addToCart(productId) {
    const product = globalStoreProducts.find(item => item.id === Number(productId));
    if (!product) return;

    const existingCartItem = cart.find(item => item.productId === product.id);

    if (existingCartItem) {
        existingCartItem.quantity += 1;
    } else {
        cart.push({productId: product.id, productImage: product.image, productTitle: product.title, productPrice: product.price, quantity: 1});
    }

    // Обов'язково фіксуємо зміни у localStorage:
    saveCartToStorage();

    // Оновлюємо UI (бейдж кількості та підсумкову суму)
    updateCartSummary();
    if (typeof renderCartItems === 'function') {
        renderCartItems();
    }
}

function updateCartSummary() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotalSum = cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

    const cartBadge = document.getElementById("cartCountBadge");
    if (cartBadge) cartBadge.textContent = totalItems;
    cartTotalSumEl.textContent = subtotalSum.toFixed(2);

    return subtotalSum;
}

function renderProducts(products) {
    const container = document.querySelector(".products-grid");

    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-products">Товарів не знайдено</p>';
        return;
    }

    container.innerHTML = products
        .map((product) => {
            const ratingBlock = product.rating
                ? `<p class="product-rating">★ ${product.rating.rate} (${product.rating.count})</p>`
                : "";

            return `
            <article class="prod_item" draggable="true" data-id="${product.id}">
                <img src="${product.image}" alt="${product.title}" class="product_image" draggable="false">
                <h3>${product.title}</h3>
                <p class="lower-text">$${product.price}</p>
                ${ratingBlock}
                <button class="btn btn-buy" data-id="${product.id}">Купити</button>
            </article>`;
        }).join("");
}

async function fetchProducts() {
    try {
        const response = await fetch(
            "https://fakestoreapi.com/products",
        );

        if (!response.ok) {
            throw new Error(`HTTP помилка: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Помилка завантаження товарів:", error.message);
        throw error;
    }
}

async function initShop() {
    const loader = document.getElementById("loader");
    const container = document.querySelector(".products-grid");

    loader.classList.remove("hidden");
    container.innerHTML = "";

    try {
        const data = await fetchProducts();

        globalStoreProducts = data;

        loader.classList.add("hidden");

        populateCategorySelect(globalStoreProducts);

        catalogState = readStateFromURL();
        catalogState.category = validateCategory(catalogState.category);

        applyStateToControls();

        updateCatalog('replace');
    } catch (error) {
        loader.classList.add("hidden");
        container.innerHTML = `<p class="error">Помилка: ${error.message}</p>`;
    }
}


// Modal

const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotalSumEl = document.getElementById("cartTotalSum");

cartItemsContainer.addEventListener('change', (event) => {
    if (event.target.classList.contains('cart-item-q')) {
        const input = event.target;
        let newQuantity = Math.round(Number(input.value));
        const productId = Number(event.target.dataset.id);

        if (isNaN(newQuantity)) {
            return;
        }

        if (newQuantity <= 0) {
            cart = cart.filter((item) => item.productId !== productId);
            renderCartItems();
            return;
        }

        updateItemQuantity(productId, newQuantity);
    }
});

cartItemsContainer.addEventListener('click', (event) => {
    const btn = event.target.closest('.counter-btn');
    if (!btn) return;

    const productId = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const item = cart.find((p) => p.productId === productId);

    if (!item) return;

    if (action === 'increase') {
        updateItemQuantity(productId, item.quantity + 1);
    } else if (action === 'decrease') {
        if (item.quantity > 1) {
            updateItemQuantity(productId, item.quantity - 1);
        } else {
            cart = cart.filter((p) => p.productId !== productId);
            renderCartItems();
        }
    }
});

function updateItemQuantity(productId, newQuantity) {
    const existingItem = cart.find((item) => item.productId === productId);
    existingItem.quantity = newQuantity;
    saveCartToStorage();
    updateCartSummary();
    renderCartItems();
}

function renderCartItems() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Кошик порожній і йому дуже сумно...</p>";
    } else {
        const cartItems = cart
            .map((item) => `
                <div class="cart-item">
                    <h3>${item.productTitle}</h3>
                    <img src="${item.productImage}" alt="${item.productTitle}" class="cart-item-image" draggable="false">
                    <p class="lower-text">$${item.productPrice}</p>
                    <div class="cart-counter">
                        <button type="button" class="counter-btn" data-action="decrease" data-id="${item.productId}">
                        <svg viewBox="0 0 45 45" class="counter-icon">
                            <circle cx="22.5" cy="22.5" r="20" fill="#ef4444" />
                            <path d="M 12 22.5 L 33 22.5" stroke="#000000" stroke-width="4" stroke-linecap="round" />
                        </svg>
                        </button>
                        <input type="number" class="cart-item-q" value="${item.quantity}" min="0" step="1" data-id="${item.productId}">
                        <button type="button" class="counter-btn" data-action="increase" data-id="${item.productId}">
                        <svg viewBox="0 0 45 45" class="counter-icon">
                            <circle cx="22.5" cy="22.5" r="20" fill="#22c55e" />
                            <path d="M 22.5 12 L 22.5 33 M 12 22.5 L 33 22.5" stroke="#000000" stroke-width="4" stroke-linecap="round" />
                        </svg>
                        </button>
                    </div>
                </div>
            `).join("");
        cartItemsContainer.innerHTML = cartItems;
    }

    updateCartSummary();
}

function clearCart() {
    cart = [];
    // Очищаємо запис кошика з localStorage
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartSummary();
    if (typeof renderCartItems === 'function') {
        renderCartItems();
    }
}

const cartButton = document.querySelector(".btn-cart");
const cartOverlay = document.getElementById("cartOverlay");
const closeBtn = document.getElementById("closeCartBtn");

function openCartModal(event) {
    event.preventDefault();
    cartOverlay.classList.remove("hidden");
    renderCartItems();
}

function closeCartModal() {
    cartOverlay.classList.add("hidden");
}

cartButton.addEventListener("click", openCartModal);
closeBtn.addEventListener("click", closeCartModal);

cartOverlay.addEventListener("click", (event) => {
    if (event.target === cartOverlay) {
        closeCartModal();
    }
});

// Drag-n-Drop

const favBtn = document.getElementById("favorites-btn");
const favZone = document.getElementById("favorites-zone");

productsContainer.addEventListener('dragstart', (event) => {
    if (event.target.classList.contains('prod_item')) {
        event.dataTransfer.setData('text/plain', event.target.dataset.id);
        event.target.classList.add('dragging');

        favBtn.classList.add('hidden');
        favZone.classList.remove('hidden');
    }
});

productsContainer.addEventListener('dragend', (event) => {
    if (event.target.classList.contains('prod_item')) {
        event.target.classList.remove('dragging');

        favBtn.classList.remove('hidden');
        favZone.classList.add('hidden');
    }
});

const favoritesZone = document.getElementById('favorites-zone');

// Дозволяємо кидання! Без preventDefault() подія drop не спрацює
favoritesZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    favoritesZone.classList.add('drag-over'); // Підсвічуємо зону, коли над нею тягнуть товар
});

// Коли курсор залишає зону - прибираємо підсвітку
favoritesZone.addEventListener('dragleave', () => {
    favoritesZone.classList.remove('drag-over');
});

const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const perPageSelect = document.getElementById('perPageSelect');
const minPriceInput = document.getElementById('minPriceInput');
const maxPriceInput = document.getElementById('maxPriceInput');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const shareLinkBtn = document.getElementById('shareLinkBtn');
const paginationContainer = document.getElementById('pagination');
const catalogInfo = document.getElementById('catalogInfo');

const CATALOG_DEFAULTS = Object.freeze({
    q: '',
    category: 'all',
    sort: 'default',
    page: 1,
    perPage: 6,
    minPrice: null,
    maxPrice: null
});

const ALLOWED_SORTS = ['default', 'price_asc', 'price_desc', 'title_asc', 'rating_desc'];
const ALLOWED_PER_PAGE = [4, 6, 8, 12];
const MAX_QUERY_LENGTH = 50;

let catalogState = { ...CATALOG_DEFAULTS };
let totalPagesCount = 1;

function debounce(callback, delay = 300) {
    let timerId = null;
    return (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => callback(...args), delay);
    };
}

function parsePrice(rawValue) {
    if (rawValue === null || String(rawValue).trim() === '') return null;

    const value = Number(rawValue);
    if (Number.isNaN(value) || value === Infinity || value < 0) return null;

    return value;
}

function readStateFromURL() {
    const params = new URLSearchParams(window.location.search);

    const q = (params.get('q') || '').trim().slice(0, MAX_QUERY_LENGTH);

    const category = params.get('category') || CATALOG_DEFAULTS.category;

    const rawSort = params.get('sort');
    const sort = ALLOWED_SORTS.includes(rawSort) ? rawSort : CATALOG_DEFAULTS.sort;

    const rawPage = Number.parseInt(params.get('page'), 10);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : CATALOG_DEFAULTS.page;

    const rawPerPage = Number.parseInt(params.get('perPage'), 10);
    const perPage = ALLOWED_PER_PAGE.includes(rawPerPage) ? rawPerPage : CATALOG_DEFAULTS.perPage;

    let minPrice = parsePrice(params.get('minPrice'));
    let maxPrice = parsePrice(params.get('maxPrice'));
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
        [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    return { q, category, sort, page, perPage, minPrice, maxPrice };
}

function getAvailableCategories(products) {
    return [...new Set(products.map(product => product.category))];
}

function validateCategory(category) {
    const categories = getAvailableCategories(globalStoreProducts);
    return categories.includes(category) ? category : CATALOG_DEFAULTS.category;
}

function buildCatalogURL(state) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();

    if (state.q) params.set('q', state.q);
    if (state.category !== CATALOG_DEFAULTS.category) params.set('category', state.category);
    if (state.sort !== CATALOG_DEFAULTS.sort) params.set('sort', state.sort);
    if (state.minPrice !== null) params.set('minPrice', String(state.minPrice));
    if (state.maxPrice !== null) params.set('maxPrice', String(state.maxPrice));
    if (state.perPage !== CATALOG_DEFAULTS.perPage) params.set('perPage', String(state.perPage));
    if (state.page !== CATALOG_DEFAULTS.page) params.set('page', String(state.page));

    url.search = params.toString();
    return url;
}

function syncURL(mode = 'push') {
    const newURL = buildCatalogURL(catalogState);

    if (newURL.href === window.location.href) return;

    const stateSnapshot = { ...catalogState };

    if (mode === 'replace') {
        history.replaceState(stateSnapshot, '', newURL);
    } else {
        history.pushState(stateSnapshot, '', newURL);
    }
}

function filterProducts(products, { q, category, minPrice, maxPrice }) {
    const normalizedQuery = q.toLowerCase();

    return products.filter(product => {
        const matchesQuery = product.title.toLowerCase().includes(normalizedQuery);
        const matchesCategory = category === 'all' || product.category === category;
        const matchesMinPrice = minPrice === null || product.price >= minPrice;
        const matchesMaxPrice = maxPrice === null || product.price <= maxPrice;
        return matchesQuery && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });
}

function sortProducts(products, sort) {
    const sorted = [...products];

    switch (sort) {
        case 'price_asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'title_asc':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'rating_desc':
            return sorted.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0));
        default:
            return sorted;
    }
}

function paginateProducts(products, page, perPage) {
    const totalItems = products.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;

    return {
        items: products.slice(startIndex, endIndex),
        totalItems,
        totalPages,
        currentPage,
        startIndex
    };
}

function updateCatalog(historyMode = null) {
    const filtered = filterProducts(globalStoreProducts, catalogState);
    const sorted = sortProducts(filtered, catalogState.sort);
    const { items, totalItems, totalPages, currentPage, startIndex } =
        paginateProducts(sorted, catalogState.page, catalogState.perPage);

    totalPagesCount = totalPages;

    if (currentPage !== catalogState.page) {
        catalogState.page = currentPage;
        historyMode = historyMode || 'replace';
    }

    renderProducts(items);
    renderPagination(currentPage, totalPages);
    renderCatalogInfo(totalItems, startIndex, items.length);

    if (historyMode) {
        syncURL(historyMode);
    }
}

function renderCatalogInfo(totalItems, startIndex, shownCount) {
    if (!catalogInfo) return;

    if (totalItems === 0) {
        catalogInfo.textContent = catalogState.q
            ? `За запитом «${catalogState.q}» нічого не знайдено`
            : 'За вибраними фільтрами товарів не знайдено';
        return;
    }

    const from = startIndex + 1;
    const to = startIndex + shownCount;
    catalogInfo.textContent = `Показано ${from}–${to} з ${totalItems} товарів`;
}

function renderPagination(currentPage, totalPages) {
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

    paginationContainer.innerHTML = `
        <button class="page-btn" data-page="${currentPage - 1}"
            ${currentPage === 1 ? 'disabled' : ''} aria-label="Попередня сторінка">‹</button>

        ${pageNumbers.map(number => `
            <button class="page-btn ${number === currentPage ? 'is-active' : ''}"
                data-page="${number}"
                ${number === currentPage ? 'aria-current="page"' : ''}>${number}</button>
        `).join('')}

        <button class="page-btn" data-page="${currentPage + 1}"
            ${currentPage === totalPages ? 'disabled' : ''} aria-label="Наступна сторінка">›</button>
    `;
}

function goToPage(targetPage) {
    if (targetPage === catalogState.page) return;

    catalogState.page = targetPage;
    updateCatalog('push');

    document.querySelector('.catalog-toolbar')?.scrollIntoView({ behavior: 'smooth' });
}

function populateCategorySelect(products) {
    if (!categorySelect) return;

    const categories = getAvailableCategories(products);

    categorySelect.innerHTML = '<option value="all">Усі категорії</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categorySelect.append(option);
    });
}

function applyStateToControls() {
    if (searchInput) searchInput.value = catalogState.q;
    if (categorySelect) categorySelect.value = catalogState.category;
    if (sortSelect) sortSelect.value = catalogState.sort;
    if (perPageSelect) perPageSelect.value = String(catalogState.perPage);
    if (minPriceInput) minPriceInput.value = catalogState.minPrice ?? '';
    if (maxPriceInput) maxPriceInput.value = catalogState.maxPrice ?? '';
}

if (searchInput) {
    const handleSearch = debounce((value) => {
        catalogState.q = value.trim().slice(0, MAX_QUERY_LENGTH);
        catalogState.page = 1;
        updateCatalog('replace');
    }, 300);

    searchInput.addEventListener('input', (event) => handleSearch(event.target.value));
}

if (minPriceInput && maxPriceInput) {
    const handlePriceChange = debounce(() => {
        catalogState.minPrice = parsePrice(minPriceInput.value);
        catalogState.maxPrice = parsePrice(maxPriceInput.value);
        catalogState.page = 1;
        updateCatalog('replace');
    }, 300);

    minPriceInput.addEventListener('input', handlePriceChange);
    maxPriceInput.addEventListener('input', handlePriceChange);
}

if (categorySelect) {
    categorySelect.addEventListener('change', (event) => {
        catalogState.category = event.target.value;
        catalogState.page = 1;
        updateCatalog('push');
    });
}

if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
        catalogState.sort = event.target.value;
        catalogState.page = 1;
        updateCatalog('push');
    });
}

if (perPageSelect) {
    perPageSelect.addEventListener('change', (event) => {
        const newPerPage = Number(event.target.value);
        catalogState.perPage = ALLOWED_PER_PAGE.includes(newPerPage) ? newPerPage : CATALOG_DEFAULTS.perPage;
        catalogState.page = 1;
        updateCatalog('push');
    });
}

if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        catalogState = { ...CATALOG_DEFAULTS };
        applyStateToControls();
        updateCatalog('push');
    });
}

if (paginationContainer) {
    paginationContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.page-btn');
        if (!button || button.disabled) return;

        goToPage(Number(button.dataset.page));
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

    const activeElement = document.activeElement;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement?.tagName) || activeElement?.isContentEditable;
    if (isTyping) return;

    const isModalOpen = !cartOverlay.classList.contains('hidden') || !favoritesOverlay.classList.contains('hidden');
    if (isModalOpen) return;

    const targetPage = catalogState.page + (event.key === 'ArrowLeft' ? -1 : 1);
    if (targetPage < 1 || targetPage > totalPagesCount) return;

    goToPage(targetPage);
});

window.addEventListener('popstate', (event) => {
    console.log('popstate → history.state:', event.state);

    if (globalStoreProducts.length === 0) return;

    catalogState = readStateFromURL();
    catalogState.category = validateCategory(catalogState.category);

    applyStateToControls();
    updateCatalog();
});

if (shareLinkBtn) {
    shareLinkBtn.addEventListener('click', async () => {
        const originalText = shareLinkBtn.textContent;

        try {
            await navigator.clipboard.writeText(window.location.href);
            shareLinkBtn.textContent = '✅ Скопійовано';
        } catch (error) {
            console.error('Не вдалося скопіювати посилання:', error);
            window.prompt('Скопіюйте посилання вручну:', window.location.href);
        }

        setTimeout(() => {
            shareLinkBtn.textContent = originalText;
        }, 2000);
    });
}

// Form

const orderForm = document.getElementById("checkoutOrderForm");

if (orderForm) {
    orderForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(orderForm);

        const rawName = formData.get("clientName") || "";
        const rawPhone = formData.get("clientPhone") || "";
        const rawEmail = formData.get("clientEmail") || "";
        const rawPromo = formData.get("orderPromo") || "";

        const cleanName = rawName.trim().replace(/\s+/g, " ");
        const cleanPhone = rawPhone.replaceAll(/[\s()\-]/g, "");
        const cleanEmail = rawEmail.trim().toLowerCase();
        const cleanPromo = rawPromo.trim().toUpperCase();

        if (!validateCheckoutForm(cleanName, cleanPhone, cleanEmail)) {
            return;
        }

        completeCheckoutProcess(cleanName, cleanPhone, cleanEmail, cleanPromo);
    });
}

function validateCheckoutForm(name, phone, email) {
    let isValid = true;

    document.getElementById("nameError").textContent = "";
    document.getElementById("phoneError").textContent = "";
    document.getElementById("emailError").textContent = "";

    const words = name.split(" ").filter(Boolean);
    if (words.length < 2 || name.length < 5) {
        document.getElementById("nameError").textContent = "Введіть повне ім'я та прізвище (щонайменше 2 слова).";
        isValid = false;
    }

    const phonePattern = /^\+?380\d{9}$/;
    if (!phonePattern.test(phone)) {
        document.getElementById("phoneError").textContent = "Введіть коректний номер у форматі +380XXXXXXXXX.";
        isValid = false;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        document.getElementById("emailError").textContent = "Введіть дійсну поштову адресу (наприклад, user@mail.com).";
        isValid = false;
    }

    return isValid;
}

function completeCheckoutProcess(name, phone, email, promo) {
    if (cart.length === 0) {
        alert("Ваш кошик порожній! Спочатку додайте товари до кошика.");
        sessionStorage.removeItem(DRAFT_ORDER_KEY);
        return;
    }

    // 1. Сума до знижки (reduce)
    const subtotal = cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

    // 2. Знижка за промокодом
    let discountPercent = 0;
    if (promo === "SALE10") {
        discountPercent = 10;
    }

    const discountAmount = Number((subtotal * (discountPercent / 100)).toFixed(2));
    const finalAmount = Math.max(0, subtotal - discountAmount);

    // 3. map() переводить поля кошика (productId, productTitle, productPrice) у назви, які мають бути у чеку (id, title, price)
    const orderData = {
        customer: { name, phone, email },
        items: cart.map((item) => ({
            id: item.productId,
            title: item.productTitle,
            quantity: item.quantity,
            price: item.productPrice,
            cost: Number((item.productPrice * item.quantity).toFixed(2))
        })),
        promoCode: promo || null,
        discountAmount: discountAmount,
        totalToPay: Number(finalAmount.toFixed(2)),
        createdAt: new Date().toISOString()
    };

    console.log("Замовлення сформовано (JSON Payload):", orderData);
    alert(`Дякуємо, ${name}! Замовлення на суму $${finalAmount.toFixed(2)} успішно прийнято.`);

    clearCart();
    orderForm.reset();
    closeCartModal();
}


// THEME
const themeToggleBtn = document.getElementById('themeToggleBtn');
const THEME_STORAGE_KEY = 'saygexshop_theme';

// 1. Функція встановлення та синхронізації теми
function applyTheme(themeName) {
    const themeIcon = themeToggleBtn?.querySelector('.theme-icon');

    if (themeName === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        if (themeIcon) themeIcon.textContent = '🌙';
    }
}

// 2. Ініціалізація теми при старті сторінки (перевірка сховища та системних налаштувань ОС)
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme) {
        // Якщо користувач уже вибирав тему раніше — застосовуємо її
        applyTheme(savedTheme);
    } else {
        // Якщо вибору немає — перевіряємо системне налаштування темної теми в ОС користувача
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }
}

// 3. Обробник кліку на перемикач
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = document.body.classList.contains('dark-theme');
        const newTheme = isCurrentlyDark ? 'light' : 'dark';

        applyTheme(newTheme);
        // Зберігаємо вибір у localStorage для довготривалої пам'яті
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    });
}

initTheme();

// 1. Безпечне зчитування кошика з localStorage із захистом від пошкодженого JSON
function loadCartFromStorage() {
    const rawData = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawData) {
        return []; // якщо сховище порожнє — повертаємо чистий масив
    }

    try {
        const parsedCart = JSON.parse(rawData);
        // Переконуємося, що в сховищі дійсно зберігся масив, а не довільний об'єкт чи примітив
        if (Array.isArray(parsedCart)) {
            return parsedCart;
        }
        return [];
    } catch (error) {
        console.error('Помилка парсингу кошика з localStorage:', error);
        // У разі пошкодження формату безпечно очищаємо некоректний запис
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
    }
}

// 2. Серіалізація та запис актуального масиву cart у сховище
function saveCartToStorage() {
    try {
        const serializedData = JSON.stringify(cart);
        localStorage.setItem(CART_STORAGE_KEY, serializedData);
    } catch (error) {
        console.error('Помилка збереження кошика у Web Storage:', error);
    }
}


//Favourites

const FAVORITES_STORAGE_KEY = 'saygexshop_favorites';

// 1. Завантаження масиву ID улюблених товарів
function loadFavoritesFromStorage() {
    try {
        const rawData = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const parsed = rawData ? JSON.parse(rawData) : [];
        // як і для кошика: переконуємось, що у сховищі справді масив
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Помилка завантаження Favorites:', error);
        return [];
    }
}

// Глобальний масив збережених ID улюблених товарів:
let favoriteProductIds = loadFavoritesFromStorage();

// 2. Збереження масиву ID у сховище
function saveFavoritesToStorage() {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteProductIds));
}

// Лічильник біля сердечка завжди беремо з масиву — одне джерело правди
function updateFavCounter() {
    document.getElementById('fav-count').textContent = favoriteProductIds.length;
}

// 3. Список улюбленого — у модальному вікні (зона #favorites-zone видима лише під час перетягування)
const favoritesOverlay = document.getElementById('favoritesOverlay');
const favoritesList = document.getElementById('favoritesList');

function renderFavoritesList() {
    // Знаходимо повні об'єкти товарів за збереженими ID
    const favoriteItems = globalStoreProducts.filter(product => favoriteProductIds.includes(product.id));

    if (favoriteItems.length === 0) {
        favoritesList.innerHTML = '<p>Тут поки порожньо. Перетягніть товар на сердечко.</p>';
        return;
    }

    favoritesList.innerHTML = favoriteItems
        .map((item) => `
            <div class="fav-row">
                <img src="${item.image}" alt="${item.title}" draggable="false">
                <h3>${item.title}</h3>
                <p class="lower-text">$${item.price}</p>
                <button type="button" class="btn-remove-fav" data-id="${item.id}" aria-label="Видалити з улюбленого">&times;</button>
            </div>`).join('');
}

function openFavoritesModal(event) {
    event.preventDefault();
    renderFavoritesList();
    favoritesOverlay.classList.remove('hidden');
}

function closeFavoritesModal() {
    favoritesOverlay.classList.add('hidden');
}

favBtn.addEventListener('click', openFavoritesModal);
document.getElementById('closeFavoritesBtn').addEventListener('click', closeFavoritesModal);

favoritesOverlay.addEventListener('click', (event) => {
    if (event.target === favoritesOverlay) {
        closeFavoritesModal();
    }
});

// 4. Drop: додаємо ID у масив (без дублів), зберігаємо, оновлюємо лічильник
favoritesZone.addEventListener('drop', (event) => {
    event.preventDefault();
    favoritesZone.classList.remove('drag-over');

    const productId = Number(event.dataTransfer.getData('text/plain'));

    if (productId && !favoriteProductIds.includes(productId)) {
        favoriteProductIds.push(productId);
        saveFavoritesToStorage();
        updateFavCounter();
    }
});

// 5. Видалення з улюбленого за кліком на хрестик (делегування на контейнер списку)
favoritesList.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.btn-remove-fav');
    if (!removeBtn) return;

    const idToRemove = Number(removeBtn.dataset.id);
    favoriteProductIds = favoriteProductIds.filter(id => id !== idToRemove);
    saveFavoritesToStorage();
    updateFavCounter();
    renderFavoritesList();
});

// 6. Одразу при старті показуємо збережену кількість
updateFavCounter();

// autosaving

const DRAFT_ORDER_KEY = 'techshop_order_draft';

// 1. Функція збереження поточного стану полів форми у sessionStorage
function saveOrderFormDraft() {
    if (!orderForm) return;

    const draftData = {
        clientName: document.getElementById('clientName')?.value || '',
        clientPhone: document.getElementById('clientPhone')?.value || '',
        clientEmail: document.getElementById('clientEmail')?.value || '',
        orderPromo: document.getElementById('orderPromo')?.value || ''
    };

    sessionStorage.setItem(DRAFT_ORDER_KEY, JSON.stringify(draftData));
}

// 2. Функція відновлення полів форми з sessionStorage при відкритті
function restoreOrderFormDraft() {
    const rawDraft = sessionStorage.getItem(DRAFT_ORDER_KEY);
    if (!rawDraft || !orderForm) return;

    try {
        const draft = JSON.parse(rawDraft);

        if (draft.clientName) document.getElementById('clientName').value = draft.clientName;
        if (draft.clientPhone) document.getElementById('clientPhone').value = draft.clientPhone;
        if (draft.clientEmail) document.getElementById('clientEmail').value = draft.clientEmail;
        if (draft.orderPromo) document.getElementById('orderPromo').value = draft.orderPromo;
    } catch (error) {
        console.error('Помилка відновлення чернетки замовлення:', error);
    }
}

// 3. Відстеження введення даних користувачем у формі (подія input з делегуванням)
if (orderForm) {
    orderForm.addEventListener('input', () => {
        // Автоматично записуємо кожну зміну в sessionStorage
        saveOrderFormDraft();
    });
}

// 4. Очищення чернетки після успішного оформлення покупки (всередині completeCheckoutProcess)


// cross tabs sync

// Слухач синхронізації між паралельними вкладками одного браузера
window.addEventListener('storage', (event) => {
    // 1. Якщо змінився стан кошика в іншій вкладці:
    if (event.key === CART_STORAGE_KEY) {
        console.log('Виявлено зміну кошика в сусідній вкладці!');
        // Перечитуємо масив кошика з оновленого localStorage
        cart = loadCartFromStorage();
        // Оновлюємо бейдж та суму у поточному вікні
        updateCartSummary();
        if (typeof renderCartItems === 'function') {
            renderCartItems();
        }
    }

    // 2. Якщо користувач перемкнув тему в сусідній вкладці:
    if (event.key === THEME_STORAGE_KEY) {
        applyTheme(event.newValue || 'light');
    }

    // 3. Якщо змінився список "Улюблене":
    if (event.key === FAVORITES_STORAGE_KEY) {
        favoriteProductIds = loadFavoritesFromStorage();
        updateFavCounter();
        renderFavoritesList();
    }
});

initShop();