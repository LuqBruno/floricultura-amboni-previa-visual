// Página completa de produto (Dia 6): escolha de cor/tamanho, foto, preço e estoque por variação,
// quantidade e inclusão na sacola. O estoque mostrado vem do servidor e é conferido de novo ao adicionar.
import { TONS, animate, aoTerminar, arteFlor, categoriaPorSlug, criar, formatarBRL, formatarPreparo, mola, produtoPorId, reduz } from "./base.js";
import { mostrarAdicionado } from "./adicionado.js";
import { criarLink, mostrarErro } from "./estados.js";
import { mostrarAviso, pulsarSacola } from "./feedback.js";
import * as sacola from "./sacola.js";

const unicos = (lista) => [...new Set(lista)];
const MAX_QUANTIDADE = 99;

export function iniciar({ catalogo, erroCatalogo }) {
  const carregando = document.getElementById("produto-carregando");
  const erro = document.getElementById("produto-erro");
  const artigo = document.getElementById("produto");
  carregando.hidden = true;

  if (!catalogo) {
    erro.hidden = false;
    mostrarErro(erro, erroCatalogo && erroCatalogo.message, () => window.location.reload());
    return;
  }

  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const produto = produtoPorId(id);
  const categoria = produto && categoriaPorSlug(produto.categoria);
  if (!produto || !categoria) {
    document.title = "Produto não encontrado · Floricultura Amboni";
    erro.hidden = false;
    erro.replaceChildren();
    const caixa = criar("div", "estado");
    caixa.appendChild(criar("h2", "", "Produto não encontrado"));
    caixa.appendChild(criar("p", "", "Este produto não está mais disponível ou o endereço mudou."));
    caixa.appendChild(criarLink("Ver todos os produtos", "index.html#fileiras"));
    erro.appendChild(caixa);
    return;
  }

  montar(produto, categoria, artigo);
}

function montar(produto, categoria, artigo) {
  document.title = `${produto.nome} · Floricultura Amboni`;
  artigo.hidden = false;
  artigo.style.setProperty("--tom", TONS[categoria.tom]);

  document.getElementById("migalha-categoria-link").textContent = categoria.nome;
  document.getElementById("migalha-categoria-link").href = "categoria.html?c=" + encodeURIComponent(categoria.slug);
  document.getElementById("migalha-produto").textContent = produto.nome;
  document.getElementById("produto-categoria").textContent = categoria.nome;
  document.getElementById("produto-nome").textContent = produto.nome;
  const descricao = document.getElementById("produto-descricao");
  descricao.textContent = produto.descricao || "";
  descricao.hidden = !produto.descricao;
  document.getElementById("produto-exemplo").hidden = !produto.exemplo;
  // Tempo de preparo informado pela loja (só informativo: não muda a escolha de data e horário).
  const preparoEl = document.getElementById("produto-preparo");
  preparoEl.hidden = !produto.preparoMinutos;
  if (produto.preparoMinutos) preparoEl.textContent = "Tempo de preparo: cerca de " + formatarPreparo(produto.preparoMinutos) + ".";

  const variacoes = produto.variacoes;
  const foto = document.getElementById("produto-foto");
  const precoEl = document.getElementById("produto-preco");
  const estoqueEl = document.getElementById("produto-estoque");
  const opcoesEl = document.getElementById("produto-opcoes");
  const quantidadeEl = document.getElementById("produto-quantidade");
  const saida = document.getElementById("quantidade-valor");
  const menos = document.getElementById("quantidade-menos");
  const mais = document.getElementById("quantidade-mais");
  const botao = document.getElementById("produto-adicionar");
  const naSacolaEl = document.getElementById("produto-na-sacola");

  // Grupos de escolha: cor, tamanho ou, se não houver nenhum dos dois, o nome da variação.
  const grupos = [];
  if (variacoes.some((v) => v.cor)) grupos.push({ chave: "cor", rotulo: "Cor", valores: unicos(variacoes.map((v) => v.cor).filter(Boolean)) });
  if (variacoes.some((v) => v.tamanho)) grupos.push({ chave: "tamanho", rotulo: "Tamanho", valores: unicos(variacoes.map((v) => v.tamanho).filter(Boolean)) });
  // Se nem toda variação tem cor e tamanho (ex.: uma "Padrão" ao lado de coloridas), cor e tamanho não dão para combinar:
  // mostra uma única lista de opções pelo nome, para o cliente alcançar todas.
  const uniforme = variacoes.every((v) => grupos.every((g) => v[g.chave]));
  if (!uniforme) grupos.length = 0;
  if (!grupos.length && variacoes.length > 1) grupos.push({ chave: "rotulo", rotulo: "Opção", valores: unicos(variacoes.map((v) => v.rotulo)) });

  const inicial = variacoes.find((v) => v.disponivel) || variacoes[0] || null;
  const escolha = {};
  grupos.forEach((g) => (escolha[g.chave] = inicial ? inicial[g.chave] ?? null : null));

  const combina = (v, ignorar) => grupos.every((g) => g.chave === ignorar || (v[g.chave] ?? null) === (escolha[g.chave] ?? null));
  const atual = () => (grupos.length ? variacoes.find((v) => combina(v)) : variacoes[0]) || null;

  let quantidade = 1;
  let ocupado = false;

  function escolher(chave, valor) {
    escolha[chave] = valor;
    if (!atual()) {
      // A combinação não existe: usa a variação mais próxima (com estoque, se houver) e ajusta os outros grupos.
      const candidata = variacoes.find((v) => v[chave] === valor && v.disponivel) || variacoes.find((v) => v[chave] === valor);
      if (candidata) grupos.forEach((g) => (escolha[g.chave] = candidata[g.chave] ?? null));
    }
    quantidade = 1;
    atualizar();
  }

  function desenharOpcoes() {
    opcoesEl.replaceChildren();
    for (const g of grupos) {
      const bloco = criar("div", "opcao-grupo");
      const titulo = criar("p", "opcao-titulo");
      titulo.append(g.rotulo + ": ");
      titulo.appendChild(criar("strong", "", escolha[g.chave] ?? ""));
      bloco.appendChild(titulo);

      const fila = criar("div", "opcoes");
      fila.setAttribute("role", "group");
      fila.setAttribute("aria-label", g.rotulo);
      for (const valor of g.valores) {
        const temEstoque = variacoes.some((v) => v[g.chave] === valor && v.disponivel && combina(v, g.chave));
        const chip = criar("button", "escolha", valor);
        chip.type = "button";
        chip.setAttribute("aria-pressed", String(escolha[g.chave] === valor));
        if (!temEstoque) {
          chip.dataset.esgotado = "true";
          chip.title = "Esgotado";
          chip.setAttribute("aria-label", `${valor}, esgotado`);
        }
        chip.addEventListener("click", () => escolher(g.chave, valor));
        fila.appendChild(chip);
      }
      bloco.appendChild(fila);
      opcoesEl.appendChild(bloco);
    }
  }

  let fotoAtual = null;
  function trocarFoto(variacao) {
    const origem = (variacao && variacao.imagem) || produto.imagem || categoria.imagem || null;
    if (origem === fotoAtual && foto.firstChild) return;
    fotoAtual = origem;
    const nova = origem ? criar("img", "produto-foto-img") : null;
    if (nova) {
      nova.src = origem;
      nova.alt = (produto.exemplo || !produto.imagem ? "Imagem ilustrativa de " : "Foto de ") + produto.nome;
      nova.decoding = "async";
    }
    const aplicar = () => {
      if (nova) foto.replaceChildren(nova);
      else foto.innerHTML = arteFlor(produto.id);
      if (!reduz) animate(foto.firstElementChild, { opacity: [0, 1], scale: [1.04, 1] }, { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] });
    };
    // aoTerminar tem tempo máximo: a foto nova entra mesmo se a animação de saída não avisar que terminou.
    if (foto.firstChild && !reduz) aoTerminar(animate(foto.firstElementChild, { opacity: 0 }, { duration: 0.15 }), 150, aplicar);
    else aplicar();
  }

  function atualizar() {
    const v = atual();
    desenharOpcoes();
    trocarFoto(v);

    const vendavel = Boolean(v && v.disponivel);
    const jaNaSacola = v ? sacola.quantidadeDe(v.id) : 0;
    const restante = v ? Math.max(0, Math.min(MAX_QUANTIDADE, v.estoque) - jaNaSacola) : 0;
    if (quantidade > restante) quantidade = Math.max(1, restante);

    // O valor é o destaque; "preço de teste" (itens de exemplo) vai ao lado, menor, sem competir com ele.
    precoEl.replaceChildren();
    if (!v) {
      precoEl.append("Indisponível");
    } else if (v.precoCentavos === null) {
      precoEl.append("Preço a confirmar");
    } else {
      precoEl.append(formatarBRL(v.precoCentavos));
      if (produto.exemplo) precoEl.appendChild(criar("span", "preco-teste-tag", "preço de teste"));
    }

    estoqueEl.dataset.estado = vendavel ? (v.estoque <= 3 ? "pouco" : "ok") : "esgotado";
    if (!v) estoqueEl.textContent = "Indisponível no momento.";
    else if (v.precoCentavos === null) estoqueEl.textContent = "Fale com a loja para pedir este item.";
    else if (!vendavel) estoqueEl.textContent = "Esgotado no momento.";
    else if (v.estoque <= 3) estoqueEl.textContent = v.estoque === 1 ? "Última unidade disponível." : `Últimas unidades: restam ${v.estoque}.`;
    else estoqueEl.textContent = "Em estoque.";

    quantidadeEl.hidden = !vendavel;
    saida.textContent = String(quantidade);
    // aria-disabled (e não disabled) nos botões que o teclado acabou de acionar: desativar o botão focado
    // faz o foco sumir. Os cliques são ignorados nos próprios tratadores.
    menos.setAttribute("aria-disabled", String(quantidade <= 1));
    mais.setAttribute("aria-disabled", String(quantidade >= restante));

    naSacolaEl.hidden = jaNaSacola === 0;
    naSacolaEl.textContent = jaNaSacola ? `Você já tem ${jaNaSacola} na sacola.` : "";

    const semMaisUnidades = vendavel && restante === 0;
    botao.disabled = !vendavel; // item que não pode ser comprado: botão realmente desativado
    botao.setAttribute("aria-disabled", String(ocupado || semMaisUnidades));
    botao.textContent = ocupado ? "Adicionando…" : !v || !vendavel ? (v && v.precoCentavos === null ? "Indisponível" : "Esgotado") : semMaisUnidades ? "Todas as unidades já estão na sacola" : "Adicionar à sacola";
  }

  menos.addEventListener("click", () => {
    if (menos.getAttribute("aria-disabled") === "true") return;
    quantidade = Math.max(1, quantidade - 1);
    atualizar();
  });
  mais.addEventListener("click", () => {
    if (mais.getAttribute("aria-disabled") === "true") return;
    quantidade += 1;
    atualizar();
  });

  // Um clique de cada vez: o botão fica travado enquanto o servidor confere, então clique duplo não duplica.
  botao.addEventListener("click", async () => {
    const v = atual();
    if (ocupado || !v || botao.getAttribute("aria-disabled") === "true") return;
    ocupado = true;
    const adicionadas = quantidade;
    atualizar();
    try {
      const r = await sacola.adicionarConferindo(v.id, adicionadas);
      if (!r.adicionado) {
        mostrarAviso(r.mensagem);
      } else {
        pulsarSacola();
        quantidade = 1;
        // O painel de baixo confirma, sugere complementos e deixa registrar uma data especial.
        mostrarAdicionado({ produto, variacao: v, quantidade: adicionadas, nota: r.mensagem, origem: botao });
      }
    } catch (e) {
      mostrarAviso(e.message);
    } finally {
      ocupado = false;
      atualizar();
    }
  });

  window.addEventListener("sacola:mudou", atualizar);
  atualizar();
  if (!reduz) animate(artigo, { opacity: [0, 1], y: [24, 0] }, { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] });
}
