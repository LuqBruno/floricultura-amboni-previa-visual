// Fluidez: efeitos ligados à rolagem, ao cursor e à troca de página.
// Tudo respeita a preferência de movimento reduzido e nunca esconde conteúdo permanentemente.
import { animate, aoTerminar, inView, scroll, stagger, criar, reduz, mola, podePassarMouse } from "./base.js";

const LINEAR = { ease: "linear" };

// Barra fina no topo que enche conforme a página é rolada.
export function iniciarProgresso() {
  if (reduz) return;
  const barra = criar("div", "progresso");
  barra.setAttribute("aria-hidden", "true");
  document.body.appendChild(barra);
  scroll(animate(barra, { scaleX: [0, 1] }, LINEAR));
}

// Parallax: camadas diferentes andam em velocidades diferentes enquanto a página rola.
export function iniciarParalaxe() {
  if (reduz) return;

  const abertura = document.querySelector(".abertura");
  if (abertura) {
    const alvo = { target: abertura, offset: ["start start", "end start"] };
    const orbita = abertura.querySelector(".orbita");
    const texto = abertura.querySelector(".abertura-grade > div");
    if (orbita) scroll(animate(orbita, { y: [0, -70] }, LINEAR), alvo);
    if (texto) scroll(animate(texto, { y: [0, 40] }, LINEAR), alvo);
  }

  // A arte de cada banner se move mais devagar que o banner, dando profundidade.
  const trilho = document.getElementById("destaque-trilho");
  if (trilho) {
    const alvo = { target: trilho, offset: ["start end", "end start"] };
    trilho.querySelectorAll(".arte-grande").forEach((arte) => {
      scroll(animate(arte, { y: [-50, 50] }, LINEAR), alvo);
    });
  }
}

// Uma luz suave segue o cursor na abertura, com atraso de mola (só no computador).
export function iniciarLuzDoCursor() {
  const abertura = document.querySelector(".abertura");
  if (!abertura || reduz || !podePassarMouse) return;

  const luz = criar("div", "luz-cursor");
  luz.setAttribute("aria-hidden", "true");
  abertura.appendChild(luz);

  abertura.addEventListener("pointermove", (e) => {
    const r = abertura.getBoundingClientRect();
    animate(
      luz,
      { x: e.clientX - r.left, y: e.clientY - r.top, opacity: 1 },
      { type: "spring", stiffness: 70, damping: 18, mass: 0.8 }
    );
  });
  abertura.addEventListener("pointerleave", () => {
    animate(luz, { opacity: 0 }, { duration: 0.6 });
  });
}

// Feedback de toque: botões afundam um pouco ao pressionar e voltam com mola.
export function iniciarToque() {
  if (reduz) return;
  const seletor = ".botao, .botao-claro, .pilula, .seta, .orbita-chip, .balao-cat, .destaque-ponto, .cartao";
  let pressionado = null;

  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(seletor);
    if (!el) return;
    pressionado = el;
    animate(el, { scale: el.classList.contains("cartao") ? 0.97 : 0.93 }, { duration: 0.12, ease: "easeOut" });
  });

  const soltar = () => {
    if (!pressionado) return;
    const el = pressionado;
    pressionado = null;
    animate(el, { scale: 1 }, mola);
  };
  document.addEventListener("pointerup", soltar);
  document.addEventListener("pointercancel", soltar);
}

// Cartão que inclina em 3D seguindo o mouse, com a arte deslizando em sentido contrário.
export function inclinarComMouse(cartao) {
  if (reduz || !podePassarMouse) return;
  const arte = cartao.querySelector(".arte");
  const info = cartao.querySelector(".info");
  const suave = { type: "spring", stiffness: 260, damping: 22, mass: 0.7 };

  cartao.addEventListener("pointermove", (e) => {
    const r = cartao.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    animate(
      cartao,
      { rotateY: px * 14, rotateX: -py * 14, y: -8, scale: 1.035, transformPerspective: 900 },
      suave
    );
    if (arte) animate(arte, { x: -px * 18, y: -py * 18, scale: 1.08 }, suave);
    if (info) animate(info, { x: px * 6, y: -4 }, suave);
  });

  cartao.addEventListener("pointerleave", () => {
    animate(cartao, { rotateY: 0, rotateX: 0, y: 0, scale: 1 }, mola);
    if (arte) animate(arte, { x: 0, y: 0, scale: 1 }, mola);
    if (info) animate(info, { x: 0, y: 0 }, mola);
  });
}

// Arraste com o mouse nas fileiras, com inércia ao soltar. No toque, o navegador já faz isso.
export function arrastarComInercia(trilho) {
  if (!podePassarMouse) return;
  let ativo = false;
  let moveu = false;
  let x0 = 0;
  let rolagem0 = 0;
  let ultimoX = 0;
  let ultimoT = 0;
  let velocidade = 0;
  let quadro = 0;

  trilho.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    cancelAnimationFrame(quadro);
    ativo = true;
    moveu = false;
    x0 = e.clientX;
    rolagem0 = trilho.scrollLeft;
    ultimoX = e.clientX;
    ultimoT = performance.now();
    velocidade = 0;
    trilho.style.scrollSnapType = "none";
    trilho.style.cursor = "grabbing";
  });

  window.addEventListener("pointermove", (e) => {
    if (!ativo) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 5) moveu = true;
    trilho.scrollLeft = rolagem0 - dx;
    const agora = performance.now();
    const dt = agora - ultimoT;
    if (dt > 0) velocidade = 0.8 * velocidade + 0.2 * (((ultimoX - e.clientX) / dt) * 16);
    ultimoX = e.clientX;
    ultimoT = agora;
  });

  window.addEventListener("pointerup", () => {
    if (!ativo) return;
    ativo = false;
    trilho.style.cursor = "";
    const deslizar = () => {
      trilho.scrollLeft += velocidade;
      velocidade *= 0.94;
      if (Math.abs(velocidade) > 0.4) {
        quadro = requestAnimationFrame(deslizar);
      } else {
        trilho.style.scrollSnapType = "";
      }
    };
    deslizar();
  });

  // Soltar o mouse depois de arrastar não pode contar como clique no cartão.
  trilho.addEventListener(
    "click",
    (e) => {
      if (moveu) {
        e.stopPropagation();
        e.preventDefault();
        moveu = false;
      }
    },
    true
  );
}

// Divide um título em palavras para revelar uma a uma. Devolve as palavras.
export function dividirPalavras(titulo) {
  const texto = titulo.textContent;
  titulo.textContent = "";
  return texto.split(" ").map((palavra, i, todas) => {
    const span = criar("span", "palavra-titulo", palavra);
    titulo.appendChild(span);
    if (i < todas.length - 1) titulo.appendChild(document.createTextNode(" "));
    return span;
  });
}

export function revelarPalavras(palavras) {
  if (reduz) return;
  animate(
    palavras,
      { y: [38, 0], opacity: [0, 1] },
    { delay: stagger(0.07), type: "spring", stiffness: 260, damping: 24 }
  );
}

// Revela um bloco quando ele entra na tela, uma vez só.
export function revelarAoEntrar(elemento, deslocamento = 40) {
  if (reduz) return;
  let feito = false;
  inView(elemento, () => {
    if (feito) return;
    feito = true;
    animate(
      elemento,
      { opacity: [0, 1], y: [deslocamento, 0], scale: [0.97, 1] },
      { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }
    );
  });
}

// Cortina entre páginas: cobre a tela ao sair e revela ao chegar.
export function iniciarCortina() {
  if (reduz) {
    document.documentElement.classList.remove("chegando");
    return;
  }
  const cortina = criar("div", "cortina");
  cortina.setAttribute("aria-hidden", "true");
  document.body.appendChild(cortina);

  const curva = [0.76, 0, 0.24, 1];

  // Chegada: a página está coberta pelo CSS; troca pela cortina e revela de baixo para cima.
  if (document.documentElement.classList.contains("chegando")) {
    cortina.style.clipPath = "inset(0 0 0 0)";
    document.documentElement.classList.remove("chegando");
    animate(cortina, { clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"] }, { duration: 0.7, delay: 0.08, ease: curva });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    const destino = new URL(a.href, window.location.href);
    if (destino.origin !== window.location.origin) return;
    if (destino.pathname === window.location.pathname && destino.hash) return;

    e.preventDefault();
    try {
      sessionStorage.setItem("amboni-cortina", "1");
    } catch (erro) {
      // Sem armazenamento, a próxima página só não faz a revelação.
    }
    cortina.style.pointerEvents = "auto";
    aoTerminar(
      animate(cortina, { clipPath: ["inset(100% 0 0 0)", "inset(0 0 0 0)"] }, { duration: 0.5, ease: curva }),
      500,
      () => {
        window.location.href = destino.href;
      }
    );
  });

  // Voltar pelo navegador pode restaurar a página com a cortina fechada: reabre.
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    cortina.style.clipPath = "inset(0 0 100% 0)";
    cortina.style.pointerEvents = "none";
  });
}
