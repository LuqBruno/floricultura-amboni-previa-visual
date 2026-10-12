// Cabeçalho e rodapé da prévia. Não inclui conta de cliente nem links de operação.
import { criar } from "./base.js";
import { totalDeItens } from "./sacola.js";

const SETA = '<svg class="seta-baixo" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const CATEGORIAS = '<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="4" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="14" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const LUPA = '<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const SACOLA = '<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 9V6a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

export function montarLayout() {
  const topo = document.getElementById("topo-site");
  if (topo) {
    topo.outerHTML = `
      <p class="faixa-previa" role="note">Prévia visual · produtos e valores de demonstração · sem pedidos ou dados pessoais</p>
      <header class="topo">
        <div class="container">
          <a class="marca" href="index.html" aria-label="Floricultura Amboni, início">
            <i class="identidade identidade-fazendeiro" aria-hidden="true"></i>
            <i class="identidade identidade-logo" aria-hidden="true"></i>
          </a>
          <nav class="acoes" aria-label="Navegação principal">
            <button class="pilula magnetico" id="botao-categorias" type="button" aria-expanded="false" aria-controls="nuvem">${CATEGORIAS}<span class="rotulo-previa">Categorias</span>${SETA}</button>
            <a class="pilula pilula-busca magnetico" href="busca.html" aria-label="Buscar produtos" title="Buscar produtos">${LUPA}<span class="rotulo-previa">Buscar</span></a>
            <a class="pilula magnetico botao-sacola-previa" id="botao-sacola" href="sacola.html" aria-label="Sacola, 0 itens">${SACOLA}<span class="rotulo-previa">Sacola</span><span class="contador" aria-hidden="true">0</span></a>
          </nav>
        </div>
      </header>
      <div class="nuvem" id="nuvem" role="region" aria-label="Categorias" hidden>
        <p class="nuvem-titulo"><strong>O que você procura?</strong></p>
        <form class="nuvem-busca" action="busca.html" method="get" role="search">
          <label class="sr-only" for="nuvem-busca-campo">Buscar produtos</label>
          <input id="nuvem-busca-campo" name="q" type="search" placeholder="Buscar produtos" autocomplete="off" enterkeyhint="search" maxlength="80">
          <button class="botao" type="submit">Buscar</button>
        </form>
        <p class="nuvem-sub">Ou escolha uma categoria</p>
        <ul class="nuvem-grade"></ul>
      </div>`;
  }

  const rodape = document.getElementById("rodape-site");
  if (rodape) {
    rodape.outerHTML = `
      <footer class="rodape">
        <div class="container rodape-grade">
          <div>
            <a class="marca marca-rodape" href="index.html" aria-label="Floricultura Amboni, início">
              <i class="identidade identidade-fazendeiro" aria-hidden="true"></i>
              <i class="identidade identidade-logo" aria-hidden="true"></i>
            </a>
            <p>Todo afeto floresce. · Laguna, SC</p>
            <p class="rodape-nota">Esta é uma prévia navegável. Produtos, fotos e valores são demonstrativos; não é possível fazer pedidos ou pagamentos.</p>
          </div>
          <nav aria-label="Navegação da prévia">
            <a href="busca.html">Buscar produtos</a>
            <a href="index.html#fileiras">Categorias</a>
            <a href="checkout.html">Como funciona a prévia</a>
          </nav>
        </div>
      </footer>`;
  }

  const aviso = criar("div", "aviso-flutuante");
  aviso.id = "aviso-flutuante";
  aviso.hidden = true;
  aviso.setAttribute("role", "status");
  aviso.setAttribute("aria-live", "polite");
  document.body.appendChild(aviso);
  atualizarContador();
  window.addEventListener("sacola:mudou", atualizarContador);
}

function atualizarContador() {
  const botao = document.getElementById("botao-sacola");
  if (!botao) return;
  const total = totalDeItens();
  botao.querySelector(".contador").textContent = String(total);
  botao.setAttribute("aria-label", `Sacola de demonstração, ${total} ${total === 1 ? "item" : "itens"}`);
}
