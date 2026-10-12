// Página de uma categoria: cabeçalho com a cor da categoria, busca e filtros dentro dela e a grade de produtos.
import { TONS, categoriaPorSlug, criar, produtosDaCategoria } from "./base.js";
import { criarLink, mostrarErro } from "./estados.js";
import { montarFiltros } from "./filtros.js";
import { renderizarGrade } from "./fileiras.js";

export function iniciar({ catalogo, erroCatalogo }) {
  const titulo = document.getElementById("titulo-categoria");
  const frase = document.getElementById("frase-categoria");
  const migalha = document.getElementById("migalha-categoria");
  const conteudo = document.getElementById("conteudo-categoria");
  const naoEncontrada = document.getElementById("categoria-nao-encontrada");
  const cabecalho = document.getElementById("cabecalho-categoria");

  if (!catalogo) {
    conteudo.hidden = true;
    naoEncontrada.hidden = false;
    mostrarErro(naoEncontrada, erroCatalogo && erroCatalogo.message, () => window.location.reload());
    return;
  }

  const categoria = categoriaPorSlug(new URLSearchParams(window.location.search).get("c"));
  if (!categoria) {
    document.title = "Categoria não encontrada · Floricultura Amboni";
    titulo.textContent = "Categoria não encontrada";
    migalha.textContent = "Categoria não encontrada";
    conteudo.hidden = true;
    naoEncontrada.hidden = false;
    return;
  }

  document.title = categoria.nome + " · Floricultura Amboni";
  cabecalho.style.setProperty("--tom", TONS[categoria.tom]);
  if (categoria.imagem) {
    cabecalho.style.setProperty("--foto-categoria", `url("${new URL(categoria.imagem, document.baseURI).href}")`);
  }
  titulo.textContent = categoria.nome;
  frase.textContent = categoria.frase || "";
  migalha.textContent = categoria.nome;

  const produtos = produtosDaCategoria(categoria.slug);
  if (produtos.length === 0) {
    document.getElementById("categoria-vazia").hidden = false;
    return;
  }

  const lista = document.getElementById("lista-produtos");
  const vazio = document.getElementById("busca-vazia");
  let primeira = true;
  const controle = montarFiltros({
    destino: document.getElementById("filtros"),
    universo: produtos,
    categorias: catalogo.categorias,
    categoriaFixa: categoria.slug,
    aoMudar(resultado, estado) {
      lista.hidden = resultado.length === 0;
      vazio.hidden = resultado.length > 0;
      if (resultado.length === 0) {
        vazio.className = "busca-vazia";
        vazio.replaceChildren(
          criar("h2", "", "Nenhum produto encontrado"),
          criar("p", "", estado.q ? `Não achamos nada para “${estado.q}” em ${categoria.nome} com os filtros escolhidos.` : "Nenhum produto desta categoria combina com os filtros escolhidos.")
        );
        const botoes = criar("div", "botoes");
        const limpar = criar("button", "botao", "Limpar filtros");
        limpar.type = "button";
        limpar.addEventListener("click", () => controle.limpar());
        botoes.append(limpar, criarLink("Buscar em todo o catálogo", "busca.html" + (estado.q ? "?q=" + encodeURIComponent(estado.q) : ""), "botao botao-claro"));
        vazio.appendChild(botoes);
      } else {
        renderizarGrade(lista, resultado, categoria, { animar: primeira });
      }
      primeira = false;
    }
  });
}
