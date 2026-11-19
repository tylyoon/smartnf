"use strict";
// 원래 details/summary로 동작하며, JS는 닫기와 키보드 이동만 보완합니다.
document.querySelectorAll(".mobile-menu").forEach((menu) => {
  const summary = menu.querySelector("summary");
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => { menu.open = false; });
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      summary.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) menu.open = false;
  });
});
