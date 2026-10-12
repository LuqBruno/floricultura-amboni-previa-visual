// Fileiras de categoria (estilo streaming) e grade de página de categoria.
// Os cartões são a mesma peça nas duas telas: um cartão, um comportamento.
import { animate, inView, stagger, criar, reduz, mola, arteFlor, precoTexto, produtosDaCategoria, TONS } from "./base.js";
import { arrastarComInercia, dividirPalavras, inclinarComMouse, revelarPalavras } from "./fluidez.js";

// Cartão de produto: link para a página do produto. Passar o mouse inclina o cartão e varre um brilho.
// O nome acessível do link é o próprio texto do cartão (nome, preço, esgotado), então o leitor de tela lê o preço.
// A foto é decorativa: a página já avisa que as imagens são ilustrativas.
export function criarCartao(produto, categoria, indice, { mostrarCategoria = false } = {}) {
  const botao = criar("a", "cartao");
  botao.href = "produto.html?id=" + produto.id;
  botao.style.setProperty("--tom", TONS[categoria.tom]);
  if (!produto.disponivel) botao.classList.add("cartao-esgotado");

  const arte = criar("div", "arte");
  const imagem = produto.imagem || categoria.imagem;
  if (imagem) {
    const foto = criar("img", "foto-produto");
    foto.src = imagem;
    foto.alt = "";
    foto.loading = "lazy";
    foto.decoding = "async";
    arte.appendChild(foto);
  } else {
    arte.innerHTML = arteFlor(indice);
  }
  const brilho = criar("span", "brilho");

  const info = criar("div", "info");
  if (produto.exemplo) info.appendChild(criar("span", "etiqueta", "Exemplo"));
  if (mostrarCategoria) info.appendChild(criar("p", "cartao-categoria", categoria.nome));
  info.appendChild(criar("h3", "", produto.nome));
  info.appendChild(criar("p", "preco", precoTexto(produto)));
  if (produto.exemplo && produto.precoCentavos != null) info.appendChild(criar("p", "preco-teste", "preço de teste"));

  botao.append(arte, brilho, info);
  if (!produto.disponivel) botao.appendChild(criar("span", "selo-esgotado", "Esgotado"));

  inclinarComMouse(botao);
  return botao;
}

// Fileiras da página inicial: título, "ver todos", setas e trilho com arraste.
export function renderizarFileiras(destino, categorias) {
  let indice = 0;

  categorias.forEach((cat) => {
    const produtos = produtosDaCategoria(cat.slug);
    const secao = criar("section", "fileira");
    secao.id = "fileira-" + cat.slug;
    secao.setAttribute("aria-labelledby", "titulo-" + cat.slug);

    const cabecalho = criar("div", "fileira-cab");
    const textos = criar("div");
    const titulo = criar("h2", "", cat.nome);
    titulo.id = "titulo-" + cat.slug;
    textos.append(titulo, criar("p", "", cat.frase || ""));

    const acoes = criar("div", "fileira-acoes");
    const verTodos = criar("a", "ver-todos", "Ver todos");
    verTodos.href = "categoria.html?c=" + encodeURIComponent(cat.slug);

    const anterior = criar("button", "seta", "‹");
    anterior.type = "button";
    anterior.setAttribute("aria-label", "Ver anteriores em " + cat.nome);
    const proximo = criar("button", "seta", "›");
    proximo.type = "button";
    proximo.setAttribute("aria-label", "Ver próximos em " + cat.nome);

    acoes.append(verTodos, anterior, proximo);
    cabecalho.append(textos, acoes);

    const palavras = dividirPalavras(titulo);
    if (!reduz) palavras.forEach((p) => (p.style.opacity = 0));

    const trilho = criar("div", "trilho");
    trilho.setAttribute("role", "region");
    trilho.setAttribute("aria-label", "Produtos de " + cat.nome);
    trilho.tabIndex = 0;
    arrastarComInercia(trilho);

    produtos.forEach((p) => {
      trilho.appendChild(criarCartao(p, cat, indice++));
    });
    if (produtos.length === 0) trilho.appendChild(criar("p", "fileira-vazia", "Ainda não há produtos cadastrados nesta categoria."));

    const passo = () => Math.max(260, trilho.clientWidth * 0.8);
    anterior.addEventListener("click", () => trilho.scrollBy({ left: -passo(), behavior: "smooth" }));
    proximo.addEventListener("click", () => trilho.scrollBy({ left: passo(), behavior: "smooth" }));
    [anterior, proximo].forEach((seta) => {
      seta.addEventListener("pointerdown", () => {
        if (!reduz) animate(seta, { scale: 0.88 }, { duration: 0.12 });
      });
      seta.addEventListener("pointerup", () => {
        if (!reduz) animate(seta, { scale: 1 }, mola);
      });
    });

    secao.append(cabecalho, trilho);
    destino.appendChild(secao);

    // Cartões entram em cascata quando a fileira aparece na tela (uma vez).
    let jaAnimou = false;
    inView(secao, () => {
      if (jaAnimou || reduz) return;
      jaAnimou = true;
      animate(
        Array.from(trilho.children),
        { opacity: [0, 1], x: [90, 0], scale: [0.9, 1] },
        { delay: stagger(0.07), type: "spring", stiffness: 300, damping: 26 }
      );
      revelarPalavras(palavras);
      animate([textos.querySelector("p"), acoes], { opacity: [0, 1], y: [18, 0] }, { delay: stagger(0.1, { startDelay: 0.25 }), duration: 0.6, ease: [0.2, 0.7, 0.2, 1] });
    });
  });
}

// Grade de produtos (categoria e busca). `categoria` é uma categoria ou uma função que acha a categoria de cada produto.
// Cada cartão fica num <li> (lista de verdade para o leitor de tela). `animar` só na primeira vez: filtrar a cada
// letra digitada não deve reanimar a grade inteira.
export function renderizarGrade(destino, produtos, categoria, { animar = true, mostrarCategoria = false } = {}) {
  const itens = produtos.map((p, i) => {
    const item = criar("li");
    item.appendChild(criarCartao(p, typeof categoria === "function" ? categoria(p) : categoria, i, { mostrarCategoria }));
    return item;
  });
  destino.replaceChildren(...itens);
  if (animar && !reduz && itens.length) {
    animate(itens, { opacity: [0, 1], y: [40, 0], scale: [0.92, 1] }, { delay: stagger(0.06, { startDelay: 0.15 }), type: "spring", stiffness: 300, damping: 26 });
  }
}
