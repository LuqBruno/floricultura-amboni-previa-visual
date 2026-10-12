// Barra de busca e filtros usada na página de busca e nas páginas de categoria.
// O estado fica no endereço (?q=…&cor=…&disp=1&ordem=…): dá para voltar, recarregar e compartilhar a mesma lista.
import { criar } from "./base.js";
import { ORDENS, coresDoCatalogo, estadoVazio, filtrar, lerEstado, paraParams, temFiltro } from "./busca.js";

function opcao(valor, texto) {
  const o = criar("option", "", texto);
  o.value = valor;
  return o;
}

function seletor(id, rotulo, opcoes, valor) {
  const campo = criar("div", "campo");
  const label = criar("label", "", rotulo);
  label.htmlFor = id;
  const select = criar("select");
  select.id = id;
  opcoes.forEach(([v, t]) => select.appendChild(opcao(v, t)));
  select.value = valor;
  campo.append(label, select);
  return { campo, select };
}

// `universo`: os produtos entre os quais a pessoa pode procurar (todos, ou os de uma categoria).
// `aoMudar(resultado, estado)`: devolve a lista já filtrada e ordenada para a página desenhar.
export function montarFiltros({ destino, universo, categorias, categoriaFixa = null, aoMudar }) {
  const cores = coresDoCatalogo(universo);
  let estado = lerEstado(new URLSearchParams(window.location.search), { categorias, cores });
  if (categoriaFixa) estado.categoria = categoriaFixa;

  const form = criar("form", "filtros-barra");
  form.setAttribute("role", "search");
  form.setAttribute("aria-label", "Buscar e filtrar produtos");
  form.noValidate = true;

  const campoBusca = criar("div", "campo campo-busca");
  const labelBusca = criar("label", "", "Buscar");
  labelBusca.htmlFor = "filtro-q";
  const entrada = criar("input");
  entrada.id = "filtro-q";
  entrada.type = "search";
  entrada.name = "q";
  entrada.placeholder = "Nome, cor ou tamanho";
  entrada.autocomplete = "off";
  entrada.maxLength = 80;
  entrada.enterKeyHint = "search";
  entrada.value = estado.q;
  campoBusca.append(labelBusca, entrada);

  const linha = criar("div", "filtros-linha");

  let selCategoria = null;
  if (!categoriaFixa && categorias.length > 1) {
    selCategoria = seletor("filtro-categoria", "Categoria", [["", "Todas"], ...categorias.map((c) => [c.slug, c.nome])], estado.categoria);
    linha.appendChild(selCategoria.campo);
  }
  let selCor = null;
  if (cores.length > 0) {
    selCor = seletor("filtro-cor", "Cor", [["", "Todas"], ...cores.map((c) => [c, c])], estado.cor);
    linha.appendChild(selCor.campo);
  }
  const selOrdem = seletor("filtro-ordem", "Ordenar por", ORDENS, estado.ordem);
  linha.appendChild(selOrdem.campo);

  const rodape = criar("div", "filtros-rodape");
  const marcador = criar("label", "marcador");
  const caixa = criar("input");
  caixa.type = "checkbox";
  caixa.id = "filtro-disponiveis";
  caixa.checked = estado.disponiveis;
  marcador.append(caixa, criar("span", "", "Mostrar só o que está disponível"));
  rodape.append(marcador);

  // Filtros e ordem: no celular ficam recolhidos (a busca por texto continua à vista); em tela larga ficam abertos.
  const mais = criar("details", "filtros-mais");
  const resumo = criar("summary", "", "Filtros e ordem ");
  const selo = criar("span", "filtros-selo");
  resumo.appendChild(selo);
  mais.append(resumo, linha, rodape);

  const limpar = criar("button", "link-botao", "Limpar filtros");
  limpar.type = "button";
  const contagem = criar("p", "filtros-contagem");
  contagem.setAttribute("role", "status");
  contagem.setAttribute("aria-live", "polite");
  const fim = criar("div", "filtros-fim");
  fim.append(contagem, limpar);

  form.append(campoBusca, mais, fim);
  destino.replaceChildren(form);

  const larga = window.matchMedia("(min-width: 640px)");
  larga.addEventListener("change", (e) => {
    if (e.matches) mais.open = true;
  });
  let primeiraVez = true;
  mais.open = larga.matches;

  function aplicar() {
    const resultado = filtrar(universo, categorias, estado);
    const ativo = temFiltro(estado, { categoriaFixa });
    limpar.hidden = !ativo;
    // Quantos filtros (fora o texto) estão valendo: aparece no botão recolhido e abre o painel se vierem do endereço.
    const ativos = (estado.categoria && !categoriaFixa ? 1 : 0) + (estado.cor ? 1 : 0) + (estado.disponiveis ? 1 : 0) + (estado.ordem !== "padrao" ? 1 : 0);
    selo.textContent = ativos ? "(" + ativos + ")" : "";
    if (ativos > 0 && primeiraVez) mais.open = true;
    primeiraVez = false;

    const params = paraParams(estado, { categoriaFixa, base: new URLSearchParams(window.location.search) }).toString();
    try {
      window.history.replaceState(null, "", window.location.pathname + (params ? "?" + params : ""));
    } catch (e) {
      // sem histórico (ex.: arquivo local): a lista continua funcionando, só o endereço não acompanha
    }

    const n = universo.length;
    contagem.textContent =
      resultado.length === 0
        ? "Nenhum produto encontrado."
        : ativo
          ? `${resultado.length} de ${n} ${n === 1 ? "produto" : "produtos"}`
          : `${n} ${n === 1 ? "produto" : "produtos"}`;
    aoMudar(resultado, estado);
  }

  let espera = null;
  entrada.addEventListener("input", () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      estado.q = entrada.value.replace(/\s+/g, " ").trim();
      aplicar();
    }, 140);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearTimeout(espera);
    estado.q = entrada.value.replace(/\s+/g, " ").trim();
    aplicar();
  });
  if (selCategoria)
    selCategoria.select.addEventListener("change", () => {
      estado.categoria = selCategoria.select.value;
      aplicar();
    });
  if (selCor)
    selCor.select.addEventListener("change", () => {
      estado.cor = selCor.select.value;
      aplicar();
    });
  selOrdem.select.addEventListener("change", () => {
    estado.ordem = selOrdem.select.value;
    aplicar();
  });
  caixa.addEventListener("change", () => {
    estado.disponiveis = caixa.checked;
    aplicar();
  });

  function limparTudo() {
    estado = { ...estadoVazio(), categoria: categoriaFixa || "" };
    entrada.value = "";
    if (selCategoria) selCategoria.select.value = "";
    if (selCor) selCor.select.value = "";
    selOrdem.select.value = "padrao";
    caixa.checked = false;
    aplicar();
    entrada.focus();
  }
  limpar.addEventListener("click", limparTudo);

  aplicar();
  return { limpar: limparTudo, temFiltro: () => temFiltro(estado, { categoriaFixa }) };
}
