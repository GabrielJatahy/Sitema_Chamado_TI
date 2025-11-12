import { collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const form = document.getElementById("formChamado");
const listaChamados = document.getElementById("listaChamados");
const auth = getAuth();

// Se não estiver autenticado, loga anonimamente
signInAnonymously(auth).catch((err) => {
  console.error("Erro ao autenticar anonimamente:", err);
});

// Quando o estado de autenticação mudar
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("Nenhum usuário autenticado (tente novamente).");
    return;
  }

  const uid = user.uid;
  const chamadosCollection = collection(window.db, "chamados");

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

  // Enviar novo chamado (associando uid anônimo)
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
      await addDoc(chamadosCollection, chamado);
      form.reset();
    } catch (err) {
      console.error("Erro ao criar chamado:", err);
      alert("Não foi possível enviar o chamado. Verifique as permissões e tente novamente.");
    }
  });
});
