const form = document.getElementById("formChamado");
const listaChamados = document.getElementById("listaChamados");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const dataHoraAtual = new Date();
  const dataAbertura = dataHoraAtual.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });

  const chamado = {
    id: Date.now(),
    nome: document.getElementById("nome").value,
    setor: document.getElementById("setor").value,
    descricao: document.getElementById("descricao").value,
    email: document.getElementById("email").value,
    telefone: document.getElementById("telefone").value,
    dataAbertura: dataAbertura,
    dataConclusao: "—",
    status: "Aberto",
    responsavel: "Não atribuído"
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
    div.classList.add("card");

    div.innerHTML = `
      <strong>${chamado.nome}</strong> (${chamado.setor})<br>
      <b>Descrição:</b> ${chamado.descricao}<br>
      <b>Status:</b> ${chamado.status}<br>
      <b>Responsável:</b> ${chamado.responsavel}<br>
      <b>Abertura:</b> ${chamado.dataAbertura}<br>
      <b>Conclusão:</b> ${chamado.dataConclusao}
    `;

    listaChamados.appendChild(div);
  });
}

mostrarChamados();
