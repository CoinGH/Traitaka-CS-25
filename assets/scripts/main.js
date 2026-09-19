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
        price: 99999,
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
        price: 39999,
        category: "exclusives",
        image: "assets/img/item_pics/item5.png",
    }
];

const container = document.querySelector(".products-grid");

const htmlString = products
    .map((product) => {
        return `
        <article class="prod_item">
            <img src="${product.image}" alt="${product.title}" class="product_image">
            <h3>${product.title}</h3>
            <p class="lower-text">${product.price} грн</p>
            <button class="btn" data-id="${product.id}">Купити</button>
        </article>
    `;
    }).join("");

// Вставляємо згенерований текст на сторінку
container.innerHTML = htmlString;