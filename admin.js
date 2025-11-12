import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const listaChamados = document.getElementById("listaChamados");
const auth = getAuth();

// 🔥 Força o modo admin (para testar localmente)
const isAdmin = true;
const adminUID = "9PAzqlz8UacIi2Wsx7KZ1coV0An1";

// Faz login anônimo
signInAnonymously(auth).catch((err) => {
  console.error("Erro ao autenticar anonimamente:", err);
});

// Escuta mudanças no estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("Nenhum usuário autenticado. Tentando novamente...");
    return;
  }

  console.log("Usuário autenticado:", user.uid);

  // Se for admin (modo forçado ou UID verdadeiro)
  if (isAdmin || user.uid === adminUID) {
    console.log("✅ Acesso concedido ao painel admin. Carregando chamados...");

    // Atualização em tempo real
    onSnapshot(collection(window.db, "chamados"), (snapshot) => {
      renderizarChamados(snapshot);
    });

  } else {
    console.log("⚠️ Usuário não é admin. Acesso negado ao painel.");
    listaChamados.innerHTML = "<p style='color:red;'>Acesso restrito ao administrador.</p>";
  }
});

// Função para renderizar os chamados
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

// Funções globais
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
// Botão gerar relatório PDF
document.getElementById("btnRelatorio").addEventListener("click", () => {
  onSnapshot(collection(window.db, "chamados"), (snapshot) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório de Chamados", 14, 20);
    doc.setFontSize(12);

    let y = 30;
    snapshot.forEach((d, index) => {
      const c = d.data();
      doc.text(`${index+1}. ${c.nome} (${c.setor}) - ${c.status}`, 14, y);
      doc.text(`Descrição: ${c.descricao}`, 14, y + 6);
      doc.text(`E-mail: ${c.email} | Telefone: ${c.telefone}`, 14, y + 12);
      doc.text(`Responsável: ${c.responsavel} | Abertura: ${c.dataAbertura || '-'} | Encerramento: ${c.dataFechamento || '-'}`, 14, y + 18);
      y += 30;

      if (y > 270) { // adiciona nova página se ultrapassar limite
        doc.addPage();
        y = 20;
      }
    });

    doc.save("relatorio_chamados.pdf");
  });
});
