const menuButton = document.getElementById("menuButton");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav a");
const projectLinks = document.querySelectorAll(".project-link");
const toast = document.getElementById("toast");

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

projectLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();

        const projectName = link.dataset.project;
        toast.textContent = `${projectName} — посилання додамо після публікації проєкту.`;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    });
});
