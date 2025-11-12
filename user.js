import { collection, addDoc, onSnapshot, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

emailjs.init("01yuXGwmVTOcPB5fb");

const form = document.getElementById("formChamado");
const listaChamados = document.getElementById("listaChamados");
const auth = getAuth();

signInAnonymously(auth).catch(err => console.error(err));

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const uid = user.uid;
  const chamadosCollection = collection(window.db, "chamados");

  // Atualização em tempo real
  onSnapshot(chamadosCollection, snapshot => {
    listaChamados.innerHTML = "";
    snapshot.forEach(doc => {
      const c = doc.data();
      if (c.uid === uid) {
        const div = document.createElement("div");
        div.classList.add("card");

        // converte Timestamp para Date se necessário
        const dataFormatada = c.dataAbertura.toDate ? c.dataAbertura.toDate().toLocaleString() : new Date(c.dataAbertura).toLocaleString();

        div.innerHTML = `
          <strong>${c.nome}</strong> (${c.setor})<br>
          <b>Descrição:</b> ${c.descricao}<br>
          <b>Status:</b> ${c.status}<br>
          <b>Responsável:</b> ${c.responsavel}<br>
          <b>Data de abertura:</b> ${dataFormatada}
        `;
        listaChamados.appendChild(div);
      }
    });
  });

  // Envio de chamado
  form.addEventListener("submit", async e => {
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
      dataAbertura: Timestamp.now() // salva corretamente como Timestamp
    };

    try {
      await addDoc(chamadosCollection, chamado);
      form.reset();

      emailjs.send("service_7jso602", "template_79t3rx9", {
        nome: chamado.nome,
        setor: chamado.setor,
        descricao: chamado.descricao,
        responsavel: chamado.responsavel,
        dataAbertura: new Date().toLocaleString()
      })
      .then(() => console.log("E-mail enviado!"))
      .catch(err => console.error("Erro ao enviar e-mail:", err));
    } catch (err) {
      console.error(err);
      alert("Não foi possível criar o chamado.");
    }
  });
});

// Função para gerar relatório PDF com datas corretas
async function gerarRelatorio() {
  const snapshot = await getDocs(collection(window.db, "chamados"));
  const chamados = snapshot.docs.map(d => d.data());
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const chamadosMes = chamados.filter(c => {
    if (!c.dataAbertura) return false;
    const data = c.dataAbertura.toDate ? c.dataAbertura.toDate() : new Date(c.dataAbertura);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  }).length;

  console.log("Chamados deste mês:", chamadosMes);
}

window.gerarRelatorio = gerarRelatorio;
