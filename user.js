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
      dataAbertura: new Date().toLocaleString()
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
  dataAbertura: chamado.dataAbertura
})
.then(() => console.log("E-mail de notificação enviado com sucesso!"))
.catch(err => console.error("Erro ao enviar e-mail:", err));


    } catch (err) {
      console.error("Erro ao criar chamado:", err);
      alert("Não foi possível enviar o chamado. Verifique as permissões e tente novamente.");
    }
  });
});
