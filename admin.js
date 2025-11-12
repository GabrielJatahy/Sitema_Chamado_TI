import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const listaChamados = document.getElementById("listaChamados");

// Função que renderiza os chamados em tela
function renderizarChamados(snapshot) {
  listaChamados.innerHTML = "";

  snapshot.forEach((d) => {
    const chamado = d.data();
    const div = document.createElement("div");
    div.classList.add("card");

    div.innerHTML = `
      <strong>${chamado.nome}</strong> (${chamado.setor})<br>
      <b>Descrição:</b> ${chamado.descricao}<br>
      <b>E-mail:</b> ${chamado.email}<br>
      <b>Telefone:</b> ${chamado.telefone}<br>
      <b>Status atual:</b> ${chamado.status}<br>
      <b>Responsável:</b> ${chamado.responsavel}<br>
      <b>Data abertura:</b> ${chamado.dataAbertura || "-"}<br>
      <b>Data encerramento:</b> ${chamado.dataFechamento || "-"}<br><br>

      <label>Alterar status:</label>
      <select id="status-${d.id}">
        <option value="Aberto" ${chamado.status === "Aberto" ? "selected" : ""}>Aberto</option>
        <option value="Em andamento" ${chamado.status === "Em andamento" ? "selected" : ""}>Em andamento</option>
        <option value="Em espera" ${chamado.status === "Em espera" ? "selected" : ""}>Em espera</option>
        <option value="Concluído" ${chamado.status === "Concluído" ? "selected" : ""}>Concluído</option>
      </select><br><br>

      <label>Responsável:</label>
      <input type="text" id="resp-${d.id}" value="${chamado.responsavel}"><br><br>

      <button onclick="salvarAlteracoes('${d.id}')">Salvar alterações</button>
      <button onclick="deletarChamado('${d.id}')">Excluir</button>
    `;

    listaChamados.appendChild(div);
  });
}

// Atualização em tempo real para admin (todos os chamados)
onSnapshot(collection(window.db, "chamados"), (snapshot) => {
  renderizarChamados(snapshot);
});

// Funções globais para salvar e deletar chamados
window.salvarAlteracoes = async function (id) {
  const status = document.getElementById(`status-${id}`).value;
  const responsavel = document.getElementById(`resp-${id}`).value;
  const chamadoRef = doc(window.db, "chamados", id);

  const updateData = { status, responsavel };
  if (status === "Concluído") {
    updateData.dataFechamento = new Date().toLocaleString();
  }

  await updateDoc(chamadoRef, updateData);
};

window.deletarChamado = async function (id) {
  await deleteDoc(doc(window.db, "chamados", id));
};
