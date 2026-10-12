// Avisos flutuantes e o pulso do contador da sacola.
import { animate, aoTerminar, reduz, mola } from "./base.js";

let timerAviso = null;

export function mostrarAviso(texto) {
  const aviso = document.getElementById("aviso-flutuante");
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.hidden = false;
  if (!reduz) animate(aviso, { opacity: [0, 1], y: [30, 0], scale: [0.92, 1] }, mola);
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => {
    const saida = reduz ? { duration: 0 } : { duration: 0.25 };
    aoTerminar(animate(aviso, { opacity: 0, y: 16 }, saida), reduz ? 0 : 250, () => {
      aviso.hidden = true;
    });
  }, 3600);
}

// Anima o contador da sacola depois de um item entrar.
export function pulsarSacola() {
  const contador = document.querySelector("#botao-sacola .contador");
  if (contador && !reduz) animate(contador, { scale: [1, 1.4, 1] }, mola);
}
