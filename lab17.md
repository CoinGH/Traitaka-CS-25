# Звіт до Лабораторної роботи №17

## Фрагмент коду читання та валідації стану з URL

```javascript

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

```

Кожен параметр з адресного рядка перевіряється окремо. Якщо значення некоректне (наприклад, `sort=hack` або `page=-5`), то замість нього підставляється значення за замовчуванням. Категорія перевіряється окремою функцією `validateCategory()` вже після завантаження товарів, бо до цього ми не знаємо, які категорії взагалі існують.

## Фрагмент коду запису стану в URL

```javascript

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

```

У URL потрапляють лише ті параметри, які відрізняються від значень за замовчуванням, тому адреса лишається короткою. Якщо нова адреса збігається з поточною, запис в історію не додається, щоб не було дублікатів.

## Фрагмент коду пагінації

```javascript

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

```

Функція рахує кількість сторінок, обмежує номер сторінки діапазоном від 1 до останньої і нарізає масив методом `slice()`. Вихідний масив вона не змінює.

## Фрагмент коду обробника popstate

```javascript

window.addEventListener('popstate', (event) => {
    console.log('popstate → history.state:', event.state);

    if (globalStoreProducts.length === 0) return;

    catalogState = readStateFromURL();
    catalogState.category = validateCategory(catalogState.category);

    applyStateToControls();
    updateCatalog();
});

```

При натисканні «Назад» або «Вперед» стан заново читається з адресного рядка, поля фільтрів синхронізуються зі станом, а каталог перемальовується. `updateCatalog()` викликається без аргументу, тому нові записи в історію не додаються.

## Скриншот адресного рядка з параметрами фільтрації

![Фото для звіту](screenshot17_0.png)

## Скриншот вітрини на 2-й сторінці

![Фото для звіту](screenshot17_1.png)

## Скриншот перевірки некоректних параметрів

Адреса `index.html?sort=hack&page=999&category=cars` автоматично виправилась, а сторінка показала останню існуючу сторінку каталогу.

![Фото для звіту](screenshot17_2.png)

## Скриншот перевірки XSS-рядка

Адреса `index.html?q=<img src=x onerror=alert(1)>` показала запит як звичайний текст, вікно alert не з'явилося.

![Фото для звіту](screenshot17_3.png)

## Скриншот консолі з history.state

![Фото для звіту](screenshot17_4.png)

`history.length` показує, скільки записів зараз є в історії вкладки. Воно росте з кожним `pushState()` (категорія, сортування, сторінка), але не росте від `replaceState()` (живий пошук). `history.state` повертає знімок `catalogState`, який ми передали в `pushState()` або `replaceState()` для поточного запису. Якщо запис створено без нашого знімка (наприклад, перше відкриття сторінки), то там буде `null`.

## Додаткові завдання

### Фільтр за діапазоном ціни

Додано два поля `minPrice` та `maxPrice`. Значення з URL перевіряються через `Number()` та перевірку на `NaN`, `Infinity` і від'ємні числа (функція `parsePrice()`). Порожній рядок вважається відсутнім фільтром, бо `Number('')` повертає `0`, а це не те, що потрібно. Якщо мінімальна ціна більша за максимальну, при читанні з URL вони міняються місцями. Поля працюють з debounce і записують стан через `replaceState()`, як і живий пошук.

Приклад адреси: `index.html?minPrice=20&maxPrice=100&perPage=8`

![Фото для звіту](screenshot17_5.png)

### Список «Товарів на сторінці»

Додано `perPage` з білим списком `[4, 6, 8, 12]`. Якщо в URL прийшло інше значення (наприклад, `perPage=77`), то береться значення за замовчуванням (6). При зміні значення сторінка скидається на 1, а перехід записується через `pushState()`.

### Сортування за рейтингом та вивід рейтингу на картці

Додано сортування `rating_desc` (`?sort=rating_desc`). На картці товару тепер виводиться рядок виду `★ 3.9 (120)`, де перше число це оцінка, а друге це кількість відгуків.

### Навігація стрілками клавіатури

Стрілки ← та → перемикають сторінки каталогу. Вони ігноруються, якщо фокус у полі введення, у списку або в `textarea`, а також коли відкрито кошик чи «Улюблене», щоб не заважати користувачу.

## Відповіді на питання:

1. __Чому стан фільтрів, сортування та номер сторінки каталогу зберігається в URL, а вміст кошика і тема оформлення — у localStorage?__

Адреса — це спосіб описати, що саме зараз бачить користувач, і цією адресою можна поділитися, зберегти її в закладки або оновити сторінку. Кошик і тема це особисті дані конкретного браузера, їх не потрібно передавати іншим людям, але вони мають зберігатися навіть після закриття вкладки. Якщо ж помістити кошик в URL, то посилання стане безглуздим для іншої людини і до того ж видимим для всіх.

2. __У чому різниця між методами URLSearchParams.get(), set(), append() і delete(), та чому для формування адреси зручніше використовувати URLSearchParams, ніж склеювати рядок вручну?__

`get()` повертає перше значення параметра або `null`, якщо його немає. `set()` встановлює значення і при цьому замінює всі попередні з такою самою назвою. `append()` додає ще одну пару, навіть якщо така назва вже є. `delete()` видаляє параметр повністю. Через `URLSearchParams` зручніше, бо він сам кодує пробіли, апострофи, кирилицю та символи `&` і `=`, а при ручному склеюванні легко зламати адресу.

3. __Чому зміна window.location.search призводить до перезавантаження сторінки, а виклик history.pushState() — ні?__

Зміна `location.search` це справжня навігація: браузер робить новий запит на сервер і завантажує сторінку заново. А `pushState()` лише змінює адресу в рядку та додає запис в історію, при цьому нічого не завантажується і весь JavaScript-стан залишається на місці.

4. __За яким принципом у роботі обрано pushState() для зміни категорії та сторінки і replaceState() для живого пошуку?__

`pushState()` використовується для окремих дій, до яких користувач може захотіти повернутися кнопкою «Назад»: категорія, сортування, сторінка, скидання. А живий пошук спрацьовує на кожну введену літеру, тому якби там був `pushState()`, то слово laptop залишило б в історії шість записів. Тому для нього `replaceState()`, який просто замінює поточний запис.

5. __У який момент генерується подія popstate, чому вона не спрацьовує під час виклику pushState() і чому в її обробнику не можна записувати нові стани в історію?__

Подія виникає, коли активний запис історії змінюється через дії користувача: кнопки «Назад» і «Вперед» або `history.back()` / `history.go()`. Під час `pushState()` вона не спрацьовує, бо зміну робить сам код, тож він і так знає про неї. Якщо викликати `pushState()` всередині `popstate`, то створиться новий запис, усі записи «вперед» видаляться, кнопка «Вперед» перестане працювати, і користувач застрягне між двома станами.

6. __Чому в конвеєрі обробки нарізка сторінки slice() виконується після фільтрації та сортування, а не до них?__

Сторінка це шматок вже готового списку. Якби спочатку нарізати, то фільтрувалися б і сортувалися б лише 6 товарів поточної сторінки, а решта каталогу випала б. Крім того, неправильно порахувалась би кількість сторінок, а порядок товарів між сторінками не збігався б.

7. __Як обчислюються startIndex, endIndex і загальна кількість сторінок, і що поверне slice(), якщо endIndex перевищує довжину масиву?__

`startIndex = (page − 1) × perPage`, `endIndex = startIndex + perPage`, а кількість сторінок це `Math.ceil(totalItems / perPage)`. Наприклад, для 20 товарів і 6 на сторінці буде 4 сторінки. Якщо `endIndex` більший за довжину масиву, то `slice()` не видасть помилку, а просто поверне елементи до кінця масиву (на 4-й сторінці це індекси 18–19, тобто 2 товари).

8. __Навіщо в функції sortProducts() створюється копія масиву [...products] перед викликом sort()?__

Метод `sort()` змінює той масив, до якого застосований, а не повертає новий. Без копії ми б відсортували `globalStoreProducts`, і порядок «За замовчуванням» був би втрачений назавжди, а також могли б з'явитися побічні ефекти в іншому коді, який користується цим масивом.

9. __які загрози виникають при використанні параметрів URL без валідації і які прийоми захисту застосовано в роботі (білий список, parseInt з перевіркою, textContent)?__

Користувач може вручну змінити адресу або надіслати підроблене посилання. Тоді в код потраплять неіснуючі значення (`sort=hack`, `page=-5`, `category=xyz`), що ламає логіку і дає порожню вітрину. А якщо вставити параметр в `innerHTML`, то можливий XSS, коли чужий скрипт виконається на сторінці. Для захисту застосовано білі списки для `sort` та `perPage`, перевірку категорії за реальним списком, `parseInt` та `Number` з перевіркою на `NaN`, обмеження довжини запиту, виведення тексту через `textContent` та автоматичне виправлення адреси через `replaceState()`.

10. __Чому при зміні пошукового запиту, категорії або сортування номер сторінки обов’язково скидається на 1?__

Нова вибірка може бути меншою за попередню. Якщо користувач був на 4-й сторінці повного каталогу і вибрав категорію, де лише 5 товарів, то 4-ї сторінки там не існує, і він побачив би порожню вітрину. Тому після будь-якої зміни фільтрів починаємо з першої сторінки.

11. __Як працює прийом debounce і яку проблему він вирішує під час живого пошуку?__

Це обгортка над функцією, яка при кожному виклику скидає попередній таймер (`clearTimeout`) і запускає новий (`setTimeout`). Тому функція виконується лише тоді, коли користувач зробив паузу (у нас 300 мс). Без цього каталог перемальовувався б і адреса оновлювалась на кожну літеру, а так це відбувається один раз після закінчення введення.
