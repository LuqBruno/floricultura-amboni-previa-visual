// Abertura da página inicial: entrada do título e carrossel de categorias com fotos conceituais.
import { animate, stagger, criar, reduz, arteFlor, TONS } from "./base.js";

export function iniciarAbertura(categorias, aoEscolher) {
  entradaDoTitulo();
  orbitarCategorias(categorias, aoEscolher);
  iniciarDestaques(categorias, aoEscolher);
}

function entradaDoTitulo() {
  if (reduz) return;
  const palavras = document.querySelectorAll(".titulo-hero .palavra");
  animate(
    palavras,
    { y: [46, 0], opacity: [0, 1], rotate: [4, 0] },
    { delay: stagger(0.09, { startDelay: 0.1 }), type: "spring", stiffness: 240, damping: 22 }
  );
  animate(
    document.querySelectorAll(".kicker, .hero-texto, .ctas"),
    { opacity: [0, 1], y: [18, 0] },
    { delay: stagger(0.12, { startDelay: 0.55 }), duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }
  );
}

// Mantém compatibilidade caso uma órbita de categorias volte a ser usada.
function orbitarCategorias(categorias, aoEscolher) {
  const orbita = document.getElementById("orbita");
  if (!orbita) return;
  const total = categorias.length;
  const raioX = 36;
  const raioY = 40;

  const chips = categorias.map((cat, i) => {
    const angulo = -Math.PI / 2 + (i * 2 * Math.PI) / total;
    const ponto = criar("div", "orbita-ponto");
    ponto.style.setProperty("--x", 50 + raioX * Math.cos(angulo) + "%");
    ponto.style.setProperty("--y", 50 + raioY * Math.sin(angulo) + "%");

    const chip = criar("button", "orbita-chip", cat.nome);
    chip.type = "button";
    chip.style.setProperty("--tom", TONS[cat.tom]);
    chip.addEventListener("click", () => aoEscolher(cat.slug));
    ponto.appendChild(chip);
    orbita.appendChild(ponto);
    return chip;
  });

  if (reduz) return;
  animate(chips, { scale: [0, 1], opacity: [0, 1] }, { delay: stagger(0.08, { startDelay: 0.7 }), type: "spring", stiffness: 260, damping: 18 });
  // Flutuação em fases diferentes: a órbita parece viva sem ficar agitada.
  chips.forEach((chip, i) => {
    animate(chip, { y: [0, -9, 0] }, { duration: 3.2 + (i % 3) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 });
  });
}

// Carrossel de destaques: um banner por categoria, troca sozinho e pausa com o mouse.
function iniciarDestaques(categorias, aoEscolher) {
  const trilho = document.getElementById("destaque-trilho");
  const pontos = document.getElementById("destaque-pontos");
  if (!trilho || !pontos) return;

  const slides = categorias.map((cat, i) => {
    const slide = criar("article", "destaque-slide");
    slide.style.setProperty("--tom", TONS[cat.tom]);
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${i + 1} de ${categorias.length}: ${cat.nome}`);

    if (cat.imagem) {
      const foto = criar("img", "destaque-foto");
      foto.src = cat.imagem;
      foto.alt = "";
      foto.loading = i === 0 ? "eager" : "lazy";
      foto.decoding = "async";
      slide.appendChild(foto);
    } else {
      const arte = criar("div", "arte-grande");
      arte.innerHTML = arteFlor(i + 2);
      slide.appendChild(arte);
    }
    const titulo = criar("h2", "", cat.nome);
    const frase = criar("p", "", cat.frase);
    const botao = criar("button", "botao", "Ver " + cat.nome.toLowerCase());
    botao.type = "button";
    botao.addEventListener("click", () => aoEscolher(cat.slug));

    slide.append(titulo, frase, botao);
    trilho.appendChild(slide);
    return slide;
  });

  const bolinhas = categorias.map((cat, i) => {
    const b = criar("button", "destaque-ponto");
    b.type = "button";
    b.setAttribute("aria-label", "Mostrar " + cat.nome);
    b.addEventListener("click", () => ir(i));
    pontos.appendChild(b);
    return b;
  });

  let atual = 0;
  let timer = null;
  let pausado = false; // mouse em cima
  let pausadoPeloFoco = false; // foco do teclado dentro do carrossel
  let pausadoPelaPessoa = false; // botão "Pausar"

  // A troca automática precisa poder ser parada (quem lê devagar ou usa teclado). Sem movimento, nem há troca automática.
  if (!reduz) {
    const pausa = criar("button", "destaque-pausa", "Pausar");
    pausa.type = "button";
    pausa.setAttribute("aria-label", "Pausar a troca automática dos destaques");
    pausa.addEventListener("click", () => {
      pausadoPelaPessoa = !pausadoPelaPessoa;
      pausa.textContent = pausadoPelaPessoa ? "Retomar" : "Pausar";
      pausa.setAttribute("aria-label", pausadoPelaPessoa ? "Retomar a troca automática dos destaques" : "Pausar a troca automática dos destaques");
    });
    pontos.appendChild(pausa);
  }

  function ir(proximo) {
    const anterior = atual;
    atual = (proximo + slides.length) % slides.length;
    const sentido = atual > anterior ? 1 : -1;

    slides.forEach((slide, i) => {
      const ativo = i === atual;
      slide.inert = !ativo;
      slide.style.zIndex = ativo ? 2 : 1;
      if (reduz) {
        slide.style.opacity = ativo ? 1 : 0;
        return;
      }
      if (ativo) {
        slide.style.pointerEvents = "auto";
        animate(slide, { opacity: [0, 1], x: [60 * sentido, 0], scale: [1.04, 1] }, { duration: 0.75, ease: [0.2, 0.7, 0.2, 1] });
      } else if (i === anterior) {
        slide.style.pointerEvents = "none";
        animate(slide, { opacity: 0, x: [0, -40 * sentido] }, { duration: 0.6, ease: [0.4, 0, 0.2, 1] });
      } else {
        slide.style.opacity = 0;
      }
    });

    bolinhas.forEach((b, i) => b.setAttribute("aria-current", i === atual ? "true" : "false"));
  }

  ir(0);
  if (!reduz) {
    trilho.addEventListener("pointerenter", () => (pausado = true));
    trilho.addEventListener("pointerleave", () => (pausado = false));
    const secao = document.getElementById("destaque");
    secao.addEventListener("focusin", () => (pausadoPeloFoco = true));
    secao.addEventListener("focusout", (e) => {
      if (!secao.contains(e.relatedTarget)) pausadoPeloFoco = false;
    });
    timer = setInterval(() => {
      if (!pausado && !pausadoPeloFoco && !pausadoPelaPessoa && !document.hidden) ir(atual + 1);
    }, 6500);
  }
}
