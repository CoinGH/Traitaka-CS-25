const products = [
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

let cart = [];
document.querySelector('.products-grid').addEventListener('click', (event) => {
    if (event.target.classList.contains('btn')) {
        const productId = Number(event.target.dataset.id);
        const selectedProduct = products.find((p) => p.id === productId);
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
}

function calculateTotal() {
    return cart.reduce((total, item) => total + item.productPrice * item.quantity, 0);
}

function fetchProducts() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(products);
            // reject(new Error("Не вдалося підключитися до бази даних"));
        }, 1500);
    });
}

async function initShop() {
    const loader = document.getElementById("loader");
    const container = document.querySelector(".products-grid");

    loader.classList.remove("hidden");
    container.innerHTML = "";

    try {
        const data = await fetchProducts();

        loader.classList.add("hidden");

        const htmlString = data
            .map((product) => `
                <article class="prod_item">
                    <img src="${product.image}" alt="${product.title}" class="product_image">
                    <h3>${product.title}</h3>
                    <p class="lower-text">${product.price} грн</p>
                    <button class="btn" data-id="${product.id}">Купити</button>
                </article>`).join("");

        container.innerHTML = htmlString;
    } catch (error) {
        loader.classList.add("hidden");
        container.innerHTML = `<p class="error">Помилка: ${error.message}</p>`;
    }
}


// Modal

const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartCount = document.getElementById("cartTotalSum");

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
        cartItemsContainer.innerHTML = "<p>Кошик порожній і йому дуже сумно...</p>"
        cartCount.innerText = "0";
    } else {
        const cartItems = cart
            .map((item) => `
                <div class="cart-item">
                    <h3>${item.productTitle}</h3>
                    <img src="${item.productImage}" alt="${item.productTitle}" class="cart-item-image">
                    <p class="lower-text">${item.productPrice} грн</p>
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
        cartCount.innerText = calculateTotal();
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

initShop();