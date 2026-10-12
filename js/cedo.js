// Roda cedo, antes de a página aparecer: se chegamos de outra página da loja pela cortina, cobre a tela
// até o JavaScript principal revelar o conteúdo. (Arquivo externo porque a política de segurança proíbe script inline.)
try {
  if (sessionStorage.getItem("amboni-cortina")) {
    document.documentElement.classList.add("chegando");
    sessionStorage.removeItem("amboni-cortina");
  }
} catch (e) {
  // Sem armazenamento de sessão, só não há revelação.
}
