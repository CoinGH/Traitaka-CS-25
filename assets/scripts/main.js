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
        cart.push({productId: product.id, productTitle: product.title, productPrice: product.price, quantity: 1});
    }
    updateUI();
}
function updateUI() {
    const cartCounter = document.querySelector('.cart-counter');
    const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCounter) {
        cartCounter.textContent = cartItems;
    }

    console.log("Кошик: ", cart);
    console.log("Загальна сума: ", calculateTotal(), "грн");
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
initShop();