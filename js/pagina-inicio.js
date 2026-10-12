// Página inicial: abertura, destaques por categoria e uma fileira de produtos por categoria.
import { animate, reduz } from "./base.js";
import { iniciarAbertura } from "./abertura.js";
import { mostrarErro, mostrarVazio } from "./estados.js";
import { renderizarFileiras } from "./fileiras.js";
import { iniciarLuzDoCursor, iniciarParalaxe, revelarAoEntrar } from "./fluidez.js";

// Leva à fileira da categoria, com um pequeno destaque para orientar o olhar.
export function aoEscolherCategoria(slug) {
  const alvo = document.getElementById("fileira-" + slug);
  if (!alvo) return;
  alvo.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "start" });
  if (!reduz) animate(alvo.querySelector(".fileira-cab h2"), { scale: [1, 1.06, 1] }, { duration: 0.6 });
}

export function iniciar({ catalogo, erroCatalogo }) {
  const fileiras = document.getElementById("fileiras");
  if (!catalogo) {
    mostrarErro(fileiras, erroCatalogo && erroCatalogo.message, () => window.location.reload());
    return;
  }
  if (catalogo.categorias.length === 0) {
    mostrarVazio(fileiras, "Estamos preparando a vitrine", "Em breve, os produtos da Amboni estarão aqui.");
    return;
  }

  iniciarAbertura(catalogo.categorias, aoEscolherCategoria);
  renderizarFileiras(fileiras, catalogo.categorias);
  iniciarParalaxe();
  iniciarLuzDoCursor();
  revelarAoEntrar(document.getElementById("destaque-trilho"), 50);
  revelarAoEntrar(document.querySelector(".rodape .container"), 24);
}
