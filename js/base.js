// Base compartilhada: biblioteca de motion, preferências do usuário e utilitários.
// Motion (sucessor do Framer Motion, versão JavaScript) carregado do jsDelivr, versão fixa.
// Se o jsDelivr não responder, a loja continua funcionando sem animação (ver semMovimento abaixo).

import { catalogoPreview } from "./catalogo-preview.js";

let motion;
try {
  motion = await import("https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm");
} catch (e) {
  motion = semMovimento();
}
export const { animate, inView, scroll, stagger } = motion;

// Substituto mínimo da biblioteca: aplica o estado final na hora, sem animar.
// Animações ligadas à rolagem voltam ao estado inicial (barra de progresso vazia, parallax parado).
function semMovimento() {
  const alvos = (a) => (typeof a === "string" ? [...document.querySelectorAll(a)] : a instanceof Element ? [a] : a ? [...a].filter(Boolean) : []);
  const px = (v) => (typeof v === "number" ? v + "px" : v);
  function aplicar(el, valores) {
    const t = {};
    for (const [prop, v] of Object.entries(valores)) {
      if (["x", "y", "scale", "scaleX", "scaleY", "rotate"].includes(prop)) t[prop] = v;
      else el.style[prop] = v;
    }
    if (Object.keys(t).length) {
      const partes = [];
      if ("x" in t || "y" in t) partes.push(`translate(${px(t.x ?? 0)}, ${px(t.y ?? 0)})`);
      if ("scale" in t) partes.push(`scale(${t.scale})`);
      if ("scaleX" in t) partes.push(`scaleX(${t.scaleX})`);
      if ("scaleY" in t) partes.push(`scaleY(${t.scaleY})`);
      if ("rotate" in t) partes.push(`rotate(${typeof t.rotate === "number" ? t.rotate + "deg" : t.rotate})`);
      el.style.transform = partes.join(" ");
    }
  }
  const quadro = (keyframes, i) =>
    Object.fromEntries(Object.entries(keyframes || {}).map(([k, v]) => [k, Array.isArray(v) ? (i < 0 ? v[v.length - 1] : v[0]) : v]));
  function animateFalso(alvo, keyframes, opcoes = {}) {
    const lista = typeof alvo === "number" ? [] : alvos(alvo);
    if (typeof alvo === "number") opcoes.onUpdate?.(Array.isArray(keyframes) ? keyframes.at(-1) : keyframes);
    lista.forEach((el) => aplicar(el, quadro(keyframes, -1)));
    const finished = Promise.resolve();
    return { finished, then: (fn) => finished.then(fn), stop() {}, cancel() {}, complete() {}, play() {}, pause() {}, voltarAoInicio: () => lista.forEach((el) => aplicar(el, quadro(keyframes, 0))) };
  }
  function inViewFalso(alvo, aoEntrar) {
    if (!("IntersectionObserver" in window)) {
      alvos(alvo).forEach((el) => aoEntrar({ target: el, isIntersecting: true }));
      return () => {};
    }
    const obs = new IntersectionObserver((entradas) => entradas.forEach((e) => e.isIntersecting && aoEntrar(e)));
    alvos(alvo).forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }
  return {
    animate: animateFalso,
    inView: inViewFalso,
    scroll: (controles) => (controles?.voltarAoInicio?.(), () => {}),
    stagger: () => () => 0
  };
}

export const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const podePassarMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Curva padrão de "mola" usada em quase toda a interface: rápida, com um leve rebote.
export const mola = { type: "spring", stiffness: 340, damping: 26, mass: 0.9 };
export const molaSuave = { type: "spring", stiffness: 180, damping: 24 };

// Cores de apoio de cada tom de categoria (usadas em CSS via --tom).
export const TONS = {
  creme: "#F3E7CF",
  damasco: "#F4D2B5",
  rosa: "#F2CFC5",
  oliva: "#D6DDB8",
  sol: "#F6E1A6"
};

// Chama "fn" quando a animação termina. Se a promise não resolver (animação substituída por outra),
// o tempo máximo garante que a interface não fique presa, por exemplo com um painel invisível clicável.
export function aoTerminar(controles, duracaoMs, fn) {
  let feito = false;
  const concluir = () => {
    if (feito) return;
    feito = true;
    fn();
  };
  setTimeout(concluir, duracaoMs + 80);
  if (controles && controles.finished) controles.finished.then(concluir, concluir);
}

export function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto) el.textContent = texto;
  return el;
}

// Catálogo vindo do servidor (preço e estoque nunca são decididos aqui). Uma única busca por página.
let catalogo = null;
let promessaCatalogo = null;

export function carregarCatalogo() {
  promessaCatalogo ??= Promise.resolve().then(() => (catalogo = structuredClone(catalogoPreview)));
  return promessaCatalogo;
}

// "90" -> "1 h 30 min"; "1440" -> "1 dia". Tempo de preparo informado pela loja, em minutos.
export function formatarPreparo(minutos) {
  const m = Number(minutos);
  if (!Number.isInteger(m) || m < 1) return "";
  if (m < 60) return `${m} min`;
  if (m < 1440) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
  }
  const d = Math.floor(m / 1440);
  const h = Math.round((m % 1440) / 60);
  return `${d} ${d === 1 ? "dia" : "dias"}${h ? ` e ${h} h` : ""}`;
}

export const formatarBRL = (centavos) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Preço para listas e cartões (só o valor). Itens de exemplo ganham, à parte, o aviso "preço de teste".
export function precoTexto(produto) {
  if (produto.precoCentavos == null) return "Preço a confirmar";
  return (produto.aPartirDe ? "A partir de " : "") + formatarBRL(produto.precoCentavos);
}

export const categoriaPorSlug = (slug) => (catalogo ? catalogo.categorias.find((c) => c.slug === slug) : undefined);
export const produtosDaCategoria = (slug) => (catalogo ? catalogo.produtos.filter((p) => p.categoria === slug) : []);
export const produtoPorId = (id) => (catalogo ? catalogo.produtos.find((p) => p.id === id) : undefined);

// Arte decorativa gerada no código: pétalas em volta de um miolo. Não é foto de produto.
// "i" muda a quantidade e a rotação das pétalas, para que cada cartão pareça diferente.
export function arteFlor(i = 0) {
  const n = 5 + (i % 3);
  const giro = (i * 23) % 60;
  let petalas = "";
  for (let k = 0; k < n; k++) {
    const angulo = (360 / n) * k + giro;
    petalas += `<ellipse cx="0" cy="-52" rx="26" ry="52" transform="rotate(${angulo})"/>`;
  }
  return `<svg viewBox="-100 -125 200 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
    `<g fill="rgba(255,252,244,0.55)">${petalas}</g>` +
    `<circle r="17" fill="rgba(243,203,110,0.95)"/></svg>`;
}
