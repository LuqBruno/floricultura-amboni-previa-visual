// Pétalas caindo: um toque discreto, só na página inicial (ver app.js). Poucas, pequenas, lentas e translúcidas.
// Para desligar de vez, basta tirar a chamada de iniciarPetalas() em app.js.
import { animate, aoTerminar, criar, reduz } from "./base.js";

const CORES = ["#EDB9AA", "#F5D9C9", "#FFF6E6", "#E9A77A", "#F3CB6E"];
const MAXIMO_NA_TELA = 5;
const PASSO_DE_ROLAGEM = 520;
const INTERVALO_MS = 7500;

export function iniciarPetalas() {
  if (reduz) return;

  const camada = criar("div", "camada-petalas");
  camada.setAttribute("aria-hidden", "true");
  document.body.appendChild(camada);

  let vivas = 0;
  let ultimoY = window.scrollY;
  let acumulado = 0;

  function soltarUma() {
    if (vivas >= MAXIMO_NA_TELA) return;
    const tamanho = 8 + Math.random() * 8;
    const petala = criar("span", "petala");
    petala.style.setProperty("--s", tamanho + "px");
    petala.style.setProperty("--cor", CORES[Math.floor(Math.random() * CORES.length)]);
    petala.style.left = Math.random() * 100 + "vw";
    camada.appendChild(petala);
    vivas++;

    const deriva = (Math.random() - 0.5) * 120;
    const sentido = Math.random() > 0.5 ? 1 : -1;
    const duracao = 10 + Math.random() * 6;
    aoTerminar(
      animate(
        petala,
        {
          y: [-40, window.innerHeight + 60],
          x: [0, deriva, deriva * 0.3, deriva * 1.1],
          rotate: [0, 160 * sentido, 320 * sentido],
          opacity: [0, 0.5, 0.5, 0]
        },
        { duration: duracao, ease: "linear" }
      ),
      duracao * 1000,
      () => {
        petala.remove();
        vivas--;
      }
    );
  }

  // Rolagem: um trecho longo percorrido solta uma pétala.
  window.addEventListener(
    "scroll",
    () => {
      acumulado += Math.abs(window.scrollY - ultimoY);
      ultimoY = window.scrollY;
      while (acumulado > PASSO_DE_ROLAGEM) {
        acumulado -= PASSO_DE_ROLAGEM;
        soltarUma();
      }
    },
    { passive: true }
  );

  // Fundo suave: uma pétala de vez, com bastante intervalo.
  setInterval(() => {
    if (!document.hidden) soltarUma();
  }, INTERVALO_MS);
}
