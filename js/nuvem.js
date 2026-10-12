// Nuvem de categorias: um balão que nasce do botão "Categorias", com mola, borrão e cascata de itens.
import { animate, aoTerminar, criar, reduz, mola, podePassarMouse, produtosDaCategoria, stagger, TONS } from "./base.js";

export function iniciarNuvem(categorias, aoEscolher) {
  const botao = document.getElementById("botao-categorias");
  const nuvem = document.getElementById("nuvem");
  if (!botao || !nuvem) return;

  const grade = nuvem.querySelector(".nuvem-grade");
  let aberta = false;
  let timerAbrir = null;
  let timerFechar = null;

  categorias.forEach((cat) => {
    const produtos = produtosDaCategoria(cat.slug);
    const total = produtos.length;
    // "de exemplo" só aparece quando todos os itens da categoria são de exemplo; com catálogo real some sozinho.
    const exemplos = total > 0 && produtos.every((p) => p.exemplo);
    const item = criar("li");
    const balao = criar("button", "balao-cat");
    balao.type = "button";
    balao.style.setProperty("--tom", TONS[cat.tom]);
    balao.appendChild(criar("span", "balao-nome", cat.nome));
    balao.appendChild(criar("span", "balao-sub", total === 0 ? "Em breve" : `${total} ${total === 1 ? "item" : "itens"}${exemplos ? " de exemplo" : ""}`));
    if (podePassarMouse && !reduz) {
      balao.addEventListener("pointerenter", () => animate(balao, { scale: 1.05, rotate: -1.5 }, mola));
      balao.addEventListener("pointerleave", () => animate(balao, { scale: 1, rotate: 0 }, mola));
    }
    balao.addEventListener("click", () => {
      fechar();
      aoEscolher(cat.slug);
    });
    item.appendChild(balao);
    grade.appendChild(item);
  });

  function abrir() {
    if (aberta) return;
    aberta = true;
    clearTimeout(timerFechar);
    nuvem.hidden = false;
    botao.setAttribute("aria-expanded", "true");

    const transicao = reduz ? { duration: 0 } : mola;
    animate(
      nuvem,
      { opacity: [0, 1], scale: [0.55, 1], y: [-18, 0] },
      transicao
    );
    if (!reduz) {
      animate(
        Array.from(grade.children),
        { opacity: [0, 1], y: [16, 0], scale: [0.82, 1] },
        { delay: stagger(0.045, { startDelay: 0.1 }), type: "spring", stiffness: 420, damping: 24 }
      );
    }
  }

  function fechar() {
    if (!aberta) return;
    aberta = false;
    clearTimeout(timerAbrir);
    botao.setAttribute("aria-expanded", "false");
    const saida = reduz
      ? { duration: 0 }
      : { duration: 0.22, ease: [0.4, 0, 1, 1] };
    const duracao = reduz ? 0 : 220;
    aoTerminar(animate(nuvem, { opacity: 0, scale: 0.75, y: -12 }, saida), duracao, () => {
      if (!aberta) nuvem.hidden = true;
    });
  }

  function alternar() {
    aberta ? fechar() : abrir();
  }

  // Aberta pelo teclado (Enter ou espaço): o foco vai para o campo de busca, para a pessoa não ter de procurar o painel.
  botao.addEventListener("click", (e) => {
    alternar();
    if (aberta && e.detail === 0) nuvem.querySelector("input[type=search]")?.focus();
  });

  // Sair do painel com Tab fecha o painel (ele não fica aberto por cima da página enquanto o foco segue adiante).
  nuvem.addEventListener("focusout", (e) => {
    if (aberta && e.relatedTarget && !nuvem.contains(e.relatedTarget) && e.relatedTarget !== botao) fechar();
  });

  // No computador a nuvem acompanha o mouse: abre ao passar e fecha ao sair de ambos.
  if (podePassarMouse) {
    botao.addEventListener("pointerenter", () => {
      clearTimeout(timerFechar);
      timerAbrir = setTimeout(abrir, 120);
    });
    const sairDoBotao = () => {
      clearTimeout(timerAbrir);
      timerFechar = setTimeout(() => {
        if (!nuvem.matches(":hover")) fechar();
      }, 260);
    };
    botao.addEventListener("pointerleave", sairDoBotao);
    nuvem.addEventListener("pointerleave", () => {
      timerFechar = setTimeout(fechar, 200);
    });
    nuvem.addEventListener("pointerenter", () => clearTimeout(timerFechar));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aberta) {
      fechar();
      botao.focus();
    }
  });

  document.addEventListener("pointerdown", (e) => {
    if (aberta && !nuvem.contains(e.target) && !botao.contains(e.target)) fechar();
  });
}
