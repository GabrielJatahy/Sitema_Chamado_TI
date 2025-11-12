import { collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Inicializa EmailJS (substitua pela sua Public Key)
emailjs.init("01yuXGwmVTOcPB5fb");

const form = document.getElementById("formChamado");
const listaChamados = document.getElementById("listaChamados");
const auth = getAuth();

// Login anônimo
signInAnonymously(auth).catch(err => console.error("Erro ao autenticar anonimamente:", err));

// Escuta mudanças de autenticação
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("Nenhum usuário autenticado.");
    return;
  }

  const uid = user.uid;
  const chamadosCollection = collection(window.db, "chamados");

  console.log("Usuário autenticado:", uid);

  // Atualização em tempo real: mostra apenas chamados do usuário atual
  onSnapshot(chamadosCollection, (snapshot) => {
    listaChamados.innerHTML = "";
    snapshot.forEach((doc) => {
      const chamado = doc.data();
      if (chamado.uid === uid) {
        const dataFormatada = chamado.dataAbertura instanceof Object && chamado.dataAbertura.toDate
          ? chamado.dataAbertura.toDate().toLocaleString() // Timestamp Firestore
          : new Date(chamado.dataAbertura).toLocaleString(); // Date normal

        const div = document.createElement("div");
        div.classList.add("card");
        div.innerHTML = `
          <strong>${chamado.nome}</strong> (${chamado.setor})<br>
          <b>Descrição:</b> ${chamado.descricao}<br>
          <b>Status:</b> ${chamado.status}<br>
          <b>Responsável:</b> ${chamado.responsavel}<br>
          <b>Data de abertura:</b> ${dataFormatada}
        `;
        listaChamados.appendChild(div);
      }
    });
  });

  // Enviar novo chamado
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const chamado = {
      uid: uid,
      nome: document.getElementById("nome").value,
      setor: document.getElementById("setor").value,
      descricao: document.getElementById("descricao").value,
      email: document.getElementById("email").value,
      telefone: document.getElementById("telefone").value,
      status: "Aberto",
      responsavel: "Não atribuído",
      dataAbertura: new Date() // salva como Date ou Timestamp
    };

    try {
      // Salva no Firestore
      await addDoc(chamadosCollection, chamado);
      form.reset();

      // Envia notificação por e-mail via EmailJS
      emailjs.send("service_7jso602", "template_79t3rx9", {
        nome: chamado.nome,
        setor: chamado.setor,
        descricao: chamado.descricao,
        responsavel: chamado.responsavel || "Não atribuído",
        dataAbertura: chamado.dataAbertura.toLocaleString()
      })
      .then(() => console.log("E-mail de notificação enviado com sucesso!"))
      .catch(err => console.error("Erro ao enviar e-mail:", err));

    } catch (err) {
      console.error("Erro ao criar chamado:", err);
      alert("Não foi possível enviar o chamado. Verifique as permissões e tente novamente.");
    }
  });
});

// Função para gerar relatório PDF (ajustada para datas)
async function gerarRelatorio() {
  const snapshot = await getDocs(collection(window.db, "chamados"));
  const doc = new window.jspdf.jsPDF();

  const chamados = snapshot.docs.map(d => d.data());
  const totalChamados = chamados.length;
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  // Chamados do mês atual
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

  // Cabeçalho e estatísticas
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

  // Tabela detalhada com jsPDF-AutoTable
  const tableData = snapshot.docs.map((d, index) => {
    const c = d.data();
    const dataAbertura = c.dataAbertura.toDate ? c.dataAbertura.toDate().toLocaleString() : new Date(c.dataAbertura).toLocaleString();
    const dataFechamento = c.dataFechamento ? (c.dataFechamento.toDate ? c.dataFechamento.toDate().toLocaleString() : new Date(c.dataFechamento).toLocaleString()) : "-";

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
}

// Botão para gerar relatório
document.getElementById("btnRelatorio").addEventListener("click", gerarRelatorio);
