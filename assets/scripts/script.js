document.addEventListener("DOMContentLoaded", () => {
    const submitButton = document.getElementById("submit");
    const emailInput = document.getElementById("email");

    submitButton.addEventListener("click", () => {
        const email = emailInput.value;
        console.log(`Email submitted: ${email}`);
    });

    const menuOpen = document.getElementById("menu-open");
    const sidebar = document.getElementById("sidebar");

    menuOpen.addEventListener("click", function(event) {
        event.preventDefault();
        sidebar.classList.toggle("active");
    });
});