// Busca de produtos: texto, categoria, cor, disponibilidade e ordem. Usa só o catálogo que o servidor já entrega.
import { categoriaPorSlug, criar } from "./base.js";
import { criarLink, mostrarErro } from "./estados.js";
import { montarFiltros } from "./filtros.js";
import { renderizarGrade } from "./fileiras.js";

export function iniciar({ catalogo, erroCatalogo }) {
  const filtros = document.getElementById("filtros");
  const lista = document.getElementById("lista-produtos");
  const vazio = document.getElementById("busca-vazia");

  if (!catalogo) {
    lista.hidden = true;
    mostrarErro(filtros, erroCatalogo && erroCatalogo.message, () => window.location.reload());
    return;
  }
  if (catalogo.produtos.length === 0) {
    lista.hidden = true;
    filtros.replaceChildren();
    vazio.hidden = false;
    vazio.className = "busca-vazia";
    vazio.replaceChildren(criar("h2", "", "Estamos preparando a vitrine"), criar("p", "", "Em breve, os produtos da Amboni estarão aqui."), criarLink("Voltar ao início", "index.html"));
    return;
  }

  let primeira = true;
  const controle = montarFiltros({
    destino: filtros,
    universo: catalogo.produtos,
    categorias: catalogo.categorias,
    aoMudar(resultado, estado) {
      lista.hidden = resultado.length === 0;
      vazio.hidden = resultado.length > 0;
      if (resultado.length === 0) desenharVazio(estado);
      else renderizarGrade(lista, resultado, (p) => categoriaPorSlug(p.categoria), { animar: primeira, mostrarCategoria: true });
      primeira = false;
      document.title = (estado.q ? `“${estado.q}” · ` : "") + "Buscar produtos · Floricultura Amboni";
    }
  });

  function desenharVazio(estado) {
    vazio.className = "busca-vazia";
    vazio.replaceChildren(criar("h2", "", "Nenhum produto encontrado"));
    vazio.appendChild(
      criar("p", "", estado.q ? `Não achamos nada para “${estado.q}” com os filtros escolhidos. Confira a escrita ou tire algum filtro.` : "Nenhum produto combina com os filtros escolhidos.")
    );
    const botoes = criar("div", "botoes");
    const limpar = criar("button", "botao", "Limpar filtros");
    limpar.type = "button";
    limpar.addEventListener("click", () => controle.limpar());
    botoes.appendChild(limpar);
    for (const cat of catalogo.categorias) botoes.appendChild(criarLink(cat.nome, "categoria.html?c=" + encodeURIComponent(cat.slug), "botao botao-claro"));
    vazio.append(criar("p", "", "Ou veja uma categoria:"), botoes);
  }
}
