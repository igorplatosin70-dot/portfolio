const menuButton = document.getElementById("menuButton");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav a");

menuButton.addEventListener("click", () => {
    nav.classList.toggle("open");
    menuButton.textContent = nav.classList.contains("open") ? "✕" : "☰";
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.textContent = "☰";
    });
});
