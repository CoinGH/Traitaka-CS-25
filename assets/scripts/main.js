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
let globalStoreProducts = [];
let cart = [];

const productsContainer = document.querySelector('.products-grid');
productsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-buy')) {
        const productId = Number(event.target.dataset.id);
        const selectedProduct = globalStoreProducts.find((p) => p.id === productId);
        addToCart(selectedProduct);
    }
});

function addToCart(product) {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({productId: product.id, productImage: product.image, productTitle: product.title, productPrice: product.price, quantity: 1});
    }

    updateCartSummary();
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
        .map((product) => `
            <article class="prod_item" draggable="true" data-id="${product.id}">
                <img src="${product.image}" alt="${product.title}" class="product_image" draggable="false">
                <h3>${product.title}</h3>
                <p class="lower-text">$${product.price}</p>
                <button class="btn btn-buy" data-id="${product.id}">Купити</button>
            </article>`).join("");
}

async function fetchProducts() {
    try {
        const response = await fetch(
            "https://fakestoreapi.com/products?limit=8",
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

        renderProducts(data);
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
let favCount = 0;

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

// Обробка моменту "кидання" (відпускання миші)
favoritesZone.addEventListener('drop', (event) => {
    event.preventDefault();
    favoritesZone.classList.remove('drag-over');
    const favCounter = document.getElementById("fav-count");

    // Дістаємо збережений ID товару з "буфера обміну"
    const productId = event.dataTransfer.getData('text/plain');

    // Візуалізуємо дію (в реальному проекті тут буде додавання до масиву favorites)
    favoritesZone.innerHTML += `<div class="fav-item">Товар #${productId}</div>`;
    favCount += 1;
    favCounter.innerText = `${favCount}`;

});


const searchInput = document.getElementById('searchInput');
const searchResultCount = document.getElementById('searchResultCount');

searchInput.addEventListener('input', (event) => {
    const searchQuery = event.target.value.trim().toLowerCase();

    const matchedProducts = globalStoreProducts.filter(product => {
        return product.title.toLowerCase().includes(searchQuery);
    });

    if (searchQuery.length > 0) {
        searchResultCount.textContent = `Знайдено товарів: ${matchedProducts.length}`;
    } else {
        searchResultCount.textContent = '';
    }

    renderProducts(matchedProducts);
});

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

    cart = [];
    renderCartItems();
    orderForm.reset();
    closeCartModal();
}

initShop();