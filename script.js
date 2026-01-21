const header = document.querySelector("header");
window.addEventListener("scroll",function(){
header.classList.toggle("sticky", window.scrollY > 50)
})

const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".navlist li a");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 120;
    if (pageYOffset >= sectionTop) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active");
    }
  });
});



function checkQuiz() {
  let score = 0;
  const total = 10;

  for (let i = 1; i <= total; i++) {
    const q = document.querySelector(`input[name="q${i}"]:checked`);
    if (q && q.value === "1") {
      score++;
    }
  }

  document.getElementById("result").innerHTML =
    `Your Score: ${score} / ${total}`;
}


