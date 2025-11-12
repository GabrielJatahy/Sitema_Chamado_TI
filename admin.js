import { collection, onSnapshot, updateDoc, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const listaChamados = document.getElementById("listaChamados");
const auth = getAuth();

// 🔥 Força o modo admin (para testar localmente)
const isAdmin = true;
const adminUID = "9PAzqlz8UacIi2Wsx7KZ1coV0An1";

// Login anônimo
signInAnonymously(auth).catch(err => console.error("Erro ao autenticar anonimamente:", err));

// Observa autenticação
onAuthStateChanged(auth, user => {
  if (!user) return console.log("Nenhum usuário autenticado.");
  console.log("Usuário autenticado:", user.uid);

  if (isAdmin || user.uid === adminUID) {
    console.log("✅ Acesso concedido ao painel admin. Carregando chamados...");
    onSnapshot(collection(window.db, "chamados"), snapshot => {
      renderizarChamados(snapshot);
    });
  } else {
    listaChamados.innerHTML = "<p style='color:red;'>Acesso restrito ao administrador.</p>";
  }
});

// Renderiza chamados
function renderizarChamados(snapshot) {
  listaChamados.innerHTML = "";

  // Cria array com docs + id
  const chamadosArray = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Ordena do mais recente para o mais antigo
  chamadosArray.sort((a, b) => {
    const dataA = a.dataAbertura?.toDate ? a.dataAbertura.toDate() : new Date(a.dataAbertura);
    const dataB = b.dataAbertura?.toDate ? b.dataAbertura.toDate() : new Date(b.dataAbertura);
    return dataB - dataA;
  });

  chamadosArray.forEach(chamado => {
    const dataAbertura = chamado.dataAbertura?.toDate
      ? chamado.dataAbertura.toDate().toLocaleString()
      : chamado.dataAbertura
      ? new Date(chamado.dataAbertura).toLocaleString()
      : "-";

    const dataFechamento = chamado.dataFechamento?.toDate
      ? chamado.dataFechamento.toDate().toLocaleString()
      : chamado.dataFechamento
      ? new Date(chamado.dataFechamento).toLocaleString()
      : "-";

    const div = document.createElement("div");
    div.classList.add("card");

    // Destaque para chamados abertos
    if (chamado.status === "Aberto") div.classList.add("aberto");

    // Badge de status
    const badge = document.createElement("span");
    badge.classList.add("status-badge");
    if (chamado.status === "Aberto") badge.classList.add("status-aberto");
    else if (chamado.status === "Em andamento") badge.classList.add("status-em-andamento");
    else if (chamado.status === "Em espera") badge.classList.add("status-em-espera");
    else if (chamado.status === "Concluído") badge.classList.add("status-concluido");
    badge.textContent = chamado.status;
    div.appendChild(badge);

    div.innerHTML += `
      <strong>${chamado.nome}</strong> (${chamado.setor})<br>
      <b>Descrição:</b> ${chamado.descricao}<br>
      <b>E-mail:</b> ${chamado.email}<br>
      <b>Telefone:</b> ${chamado.telefone}<br>
      <b>Responsável:</b> ${chamado.responsavel}<br>
      <b>Data abertura:</b> ${dataAbertura}<br>
      <b>Data encerramento:</b> ${dataFechamento}<br><br>

      <label>Alterar status:</label>
      <select id="status-${chamado.id}">
        <option value="Aberto" ${chamado.status === "Aberto" ? "selected" : ""}>Aberto</option>
        <option value="Em andamento" ${chamado.status === "Em andamento" ? "selected" : ""}>Em andamento</option>
        <option value="Em espera" ${chamado.status === "Em espera" ? "selected" : ""}>Em espera</option>
        <option value="Concluído" ${chamado.status === "Concluído" ? "selected" : ""}>Concluído</option>
      </select><br><br>

      <label>Responsável:</label>
      <input type="text" id="resp-${chamado.id}" value="${chamado.responsavel}"><br><br>

      <button onclick="salvarAlteracoes('${chamado.id}')">Salvar alterações</button>
      <button onclick="deletarChamado('${chamado.id}')">Excluir</button>
    `;

    listaChamados.appendChild(div);
  });
}

// Funções globais
window.salvarAlteracoes = async function(id) {
  const status = document.getElementById(`status-${id}`).value;
  const responsavel = document.getElementById(`resp-${id}`).value;
  const chamadoRef = doc(window.db, "chamados", id);

  const updateData = { status, responsavel };
  if (status === "Concluído") updateData.dataFechamento = new Date();

  await updateDoc(chamadoRef, updateData);
};

window.deletarChamado = async function(id) {
  await deleteDoc(doc(window.db, "chamados", id));
};

// Gerar PDF
document.getElementById("btnRelatorio").addEventListener("click", async () => {
  const snapshot = await getDocs(collection(window.db, "chamados"));
  const doc = new window.jspdf.jsPDF();

  const chamados = snapshot.docs.map(d => d.data());
  const totalChamados = chamados.length;
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const chamadosMes = chamados.filter(c => {
    if (!c.dataAbertura) return false;
    const data = c.dataAbertura.toDate ? c.dataAbertura.toDate() : new Date(c.dataAbertura);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  }).length;

  const abertosPorUsuario = {};
  const atendidosPorResponsavel = {};

  chamados.forEach(c => {
    if (!abertosPorUsuario[c.nome]) abertosPorUsuario[c.nome] = 0;
    abertosPorUsuario[c.nome]++;

    const resp = c.responsavel || "Não atribuído";
    if (!atendidosPorResponsavel[resp]) atendidosPorResponsavel[resp] = 0;
    atendidosPorResponsavel[resp]++;
  });

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185);
  doc.text("Relatório de Chamados", 14, 20);
  doc.setLineWidth(0.5);
  doc.line(14, 24, 196, 24);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  let y = 30;
  doc.text(`Total de chamados: ${totalChamados}`, 14, y); y += 8;
  doc.text(`Chamados abertos neste mês: ${chamadosMes}`, 14, y); y += 8;

  doc.text("Chamados abertos por usuário:", 14, y); y += 8;
  for (const nome in abertosPorUsuario) {
    doc.text(`- ${nome}: ${abertosPorUsuario[nome]}`, 16, y);
    y += 6;
  }

  y += 4;
  doc.text("Chamados atendidos por responsável:", 14, y); y += 8;
  for (const resp in atendidosPorResponsavel) {
    doc.text(`- ${resp}: ${atendidosPorResponsavel[resp]}`, 16, y);
    y += 6;
  }

  y += 10;

  const tableData = snapshot.docs.map((d, index) => {
    const c = d.data();
    const dataAbertura = c.dataAbertura?.toDate ? c.dataAbertura.toDate().toLocaleString() : new Date(c.dataAbertura).toLocaleString();
    const dataFechamento = c.dataFechamento?.toDate ? c.dataFechamento.toDate().toLocaleString() : c.dataFechamento ? new Date(c.dataFechamento).toLocaleString() : "-";

    return [
      index + 1,
      c.nome,
      c.setor,
      c.status,
      c.responsavel || "-",
      dataAbertura,
      dataFechamento,
      c.email,
      c.telefone
    ];
  });

  doc.autoTable({
    startY: y,
    head: [["#", "Usuário", "Setor", "Status", "Responsável", "Abertura", "Encerramento", "Email", "Telefone"]],
    body: tableData,
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
    theme: 'grid'
  });

  doc.save("relatorio_chamados.pdf");
});
