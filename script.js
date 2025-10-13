const form = document.getElementById("formChamado");
const listaChamados = document.getElementById("listaChamados");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const chamado = {
    id: Date.now(),
    nome: document.getElementById("nome").value,
    setor: document.getElementById("setor").value,
    descricao: document.getElementById("descricao").value,
    prioridade: document.getElementById("prioridade").value,
    status: "Aberto"
  };

  let chamados = JSON.parse(localStorage.getItem("chamados")) || [];
  chamados.push(chamado);
  localStorage.setItem("chamados", JSON.stringify(chamados));

  form.reset();
  mostrarChamados();
});

function mostrarChamados() {
  const chamados = JSON.parse(localStorage.getItem("chamados")) || [];
  listaChamados.innerHTML = "";

  chamados.forEach(chamado => {
    const div = document.createElement("div");

    div.innerHTML = `
      <strong>${chamado.nome}</strong> (${chamado.setor}) - <b>${chamado.prioridade}</b><br>
      ${chamado.descricao} <br>
      <small>Status: ${chamado.status}</small><br>
      <button onclick="deletarChamado(${chamado.id})">Excluir</button>
    `;

    listaChamados.appendChild(div);
  });
}

function deletarChamado(id) {
  let chamados = JSON.parse(localStorage.getItem("chamados")) || [];
  chamados = chamados.filter(chamado => chamado.id !== id);
  localStorage.setItem("chamados", JSON.stringify(chamados));
  mostrarChamados();
}

mostrarChamados();
