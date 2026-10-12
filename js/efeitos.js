// Efeitos gerais: entrada do cabeçalho, borda ao rolar e botões que puxam o cursor.
import { animate, reduz, podePassarMouse, mola } from "./base.js";

export function iniciarCabecalho() {
  const topo = document.querySelector(".topo");
  if (!topo) return;
  if (!reduz) animate(topo, { y: [-70, 0], opacity: [0, 1] }, { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] });

  // Páginas de fundo claro pedem o cabeçalho sólido desde o início; as de foto escura o deixam transparente.
  const solido = document.body.dataset.cabecalho === "solido";
  const atualizar = () => topo.classList.toggle("rolado", solido || window.scrollY > 8);
  window.addEventListener("scroll", atualizar, { passive: true });
  atualizar();
}

// Botões ".magnetico" seguem levemente o cursor e voltam com mola ao sair.
export function iniciarMagneticos() {
  if (!podePassarMouse || reduz) return;
  document.querySelectorAll(".magnetico").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
      animate(el, { x: dx, y: dy }, { duration: 0.25, ease: "easeOut" });
    });
    el.addEventListener("pointerleave", () => {
      animate(el, { x: 0, y: 0 }, mola);
    });
  });
}
