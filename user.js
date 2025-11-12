import { collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const form = document.getElementById("formChamado");
const listaChamados = document.getElementById("listaChamados");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const chamado = {
    nome: document.getElementById("nome").value,
    setor: document.getElementById("setor").value,
    descricao: document.getElementById("descricao").value,
    email: document.getElementById("email").value,
    telefone: document.getElementById("telefone").value,
    status: "Aberto",
    responsavel: "Não atribuído",
    dataAbertura: new Date().toLocaleString()
  };

  await addDoc(collection(window.db, "chamados"), chamado);
  form.reset();
});

// Atualização em tempo real
onSnapshot(collection(window.db, "chamados"), (snapshot) => {
  listaChamados.innerHTML = "";
  snapshot.forEach((doc) => {
    const chamado = doc.data();
    const div = document.createElement("div");
    div.classList.add("card");
    div.innerHTML = `
      <strong>${chamado.nome}</strong> (${chamado.setor})<br>
      <b>Descrição:</b> ${chamado.descricao}<br>
      <b>Status:</b> ${chamado.status}<br>
      <b>Responsável:</b> ${chamado.responsavel}<br>
      <b>Data de abertura:</b> ${chamado.dataAbertura}
    `;
    listaChamados.appendChild(div);
  });
});
