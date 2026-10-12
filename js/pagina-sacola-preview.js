// Sacola de demonstração: mantida apenas nesta aba do navegador, sem dados pessoais.
import { animate, arteFlor, criar, formatarBRL, reduz, stagger } from "./base.js";
import { criarLink, mostrarErro, mostrarVazio } from "./estados.js";
import { mostrarAviso } from "./feedback.js";
import * as sacola from "./sacola.js";

let sequencia = 0;

export async function iniciar() {
  const raiz = document.getElementById("sacola-conteudo");
  let primeira = true;

  async function atualizar() {
    const atual = ++sequencia;
    if (sacola.totalDeItens() === 0) {
      mostrarVazio(raiz, "Sua sacola está vazia", "Explore os produtos de demonstração para experimentar esta interação.", criarLink("Ver produtos", "index.html#fileiras"));
      return;
    }
    try {
      const resposta = await sacola.validar();
      if (atual !== sequencia) return;
      const avisos = sacola.reconciliar(resposta);
      resposta.itens = resposta.itens.filter((item) => item.status !== "inexistente");
      desenhar(resposta, avisos);
      primeira = false;
    } catch (erro) {
      if (atual === sequencia) mostrarErro(raiz, erro.message, atualizar);
    }
  }

  function desenhar(resposta, avisos) {
    if (!resposta.itens.length) {
      mostrarVazio(raiz, "Sua sacola está vazia", avisos[0] || "Explore os produtos de demonstração.", criarLink("Ver produtos", "index.html#fileiras"));
      return;
    }
    const grade = criar("div", "sacola-grade");
    const principal = criar("div");
    if (avisos.length) {
      const alerta = criar("div", "aviso aviso-sacola");
      alerta.setAttribute("role", "status");
      avisos.forEach((texto) => alerta.appendChild(criar("p", "", texto)));
      principal.appendChild(alerta);
    }
    const lista = criar("ul", "sacola-linhas");
    lista.setAttribute("aria-label", "Itens da sacola de demonstração");
    resposta.itens.forEach((linha) => lista.appendChild(criarLinha(linha)));
    principal.appendChild(lista);

    const resumo = criar("aside", "sacola-resumo");
    resumo.setAttribute("aria-label", "Resumo da sacola de demonstração");
    resumo.appendChild(criar("h2", "", "Resumo demonstrativo"));
    const total = criar("p", "resumo-linha");
    total.append(criar("span", "", "Subtotal de exemplo"), criar("strong", "", formatarBRL(resposta.subtotalCentavos)));
    resumo.append(total, criar("p", "aviso", "Valores fictícios. Esta prévia não registra pedidos nem cobra pagamentos."));
    resumo.appendChild(criarLink("Ver a etapa seguinte", "checkout.html", "botao botao-cheio"));
    resumo.appendChild(criarLink("Continuar explorando", "index.html#fileiras", "link-secundario"));
    grade.append(principal, resumo);
    raiz.replaceChildren(grade);
    if (primeira && !reduz) animate(Array.from(lista.children), { opacity: [0, 1], y: [20, 0] }, { delay: stagger(0.07), type: "spring", stiffness: 300, damping: 26 });
  }

  function criarLinha(linha) {
    const item = criar("li", "sacola-linha");
    const foto = criar("a", "sacola-foto");
    foto.href = `produto.html?id=${linha.produtoId}`;
    foto.setAttribute("aria-label", `Ver ${linha.produtoNome}`);
    if (linha.imagem) {
      const imagem = criar("img");
      imagem.src = linha.imagem;
      imagem.alt = "";
      imagem.loading = "lazy";
      foto.appendChild(imagem);
    } else foto.innerHTML = arteFlor(linha.produtoId);

    const corpo = criar("div", "sacola-corpo");
    const titulo = criar("h3");
    const link = criar("a", "", linha.produtoNome);
    link.href = foto.href;
    titulo.appendChild(link);
    corpo.append(titulo, criar("p", "sacola-variacao", linha.rotulo));
    if (linha.precoCentavos !== null) corpo.appendChild(criar("p", "sacola-preco-unit", `${formatarBRL(linha.precoCentavos)} · preço de teste cada`));
    if (linha.mensagem) corpo.appendChild(criar("p", "sacola-alerta", linha.mensagem));

    const controles = criar("div", "sacola-controles");
    if (linha.status === "ok" || linha.status === "ajustado") {
      const stepper = criar("div", "quantidade");
      const menos = criar("button", "quantidade-botao", "−");
      menos.type = "button";
      menos.setAttribute("aria-label", `Diminuir ${linha.produtoNome}`);
      menos.setAttribute("aria-disabled", String(linha.quantidade <= 1));
      menos.addEventListener("click", () => menos.getAttribute("aria-disabled") !== "true" && mudar(linha, linha.quantidade - 1));
      const valor = criar("output", "quantidade-valor", String(linha.quantidade));
      const mais = criar("button", "quantidade-botao", "+");
      mais.type = "button";
      mais.setAttribute("aria-label", `Aumentar ${linha.produtoNome}`);
      mais.setAttribute("aria-disabled", String(linha.quantidade >= linha.estoque));
      mais.addEventListener("click", () => mais.getAttribute("aria-disabled") !== "true" && mudar(linha, linha.quantidade + 1));
      stepper.append(menos, valor, mais);
      controles.append(stepper, criar("p", "sacola-subtotal", formatarBRL(linha.subtotalCentavos)));
    }
    const remover = criar("button", "link-botao", "Remover");
    remover.type = "button";
    remover.setAttribute("aria-label", `Remover ${linha.produtoNome} da sacola`);
    remover.addEventListener("click", () => {
      sacola.remover(linha.variacaoId);
      mostrarAviso("Item removido da sacola de demonstração.");
      atualizar();
    });
    controles.appendChild(remover);
    item.append(foto, corpo, controles);
    return item;
  }

  function mudar(linha, quantidade) {
    sacola.definir(linha.variacaoId, quantidade);
    atualizar();
  }

  window.addEventListener("storage", atualizar);
  await atualizar();
}
