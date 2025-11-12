const listaChamados = document.getElementById("listaChamados");

function mostrarChamados() {
  const chamados = JSON.parse(localStorage.getItem("chamados")) || [];
  listaChamados.innerHTML = "";

  if (chamados.length === 0) {
    listaChamados.innerHTML = "<p>Nenhum chamado registrado ainda.</p>";
    return;
  }

  chamados.forEach(chamado => {
    const div = document.createElement("div");
    div.classList.add("card");

    // evita erro de data inválida
    const dataConclusaoValue =
      chamado.dataConclusao && chamado.dataConclusao !== "—"
        ? (() => {
            const data = new Date(chamado.dataConclusao);
            if (isNaN(data)) return "";
            return data.toISOString().slice(0, 16);
          })()
        : "";

    div.innerHTML = `
      <strong>${chamado.nome}</strong> (${chamado.setor})<br>
      <b>Descrição:</b> ${chamado.descricao}<br>
      <b>E-mail:</b> ${chamado.email}<br>
      <b>Telefone:</b> ${chamado.telefone}<br>
      <b>Status atual:</b> ${chamado.status}<br>
      <b>Responsável:</b> ${chamado.responsavel}<br>
      <b>Abertura:</b> ${chamado.dataAbertura}<br>
      <b>Conclusão:</b> ${chamado.dataConclusao || "—"}<br><br>

      <label>Alterar status:</label>
      <select id="status-${chamado.id}">
        <option value="Aberto" ${chamado.status === "Aberto" ? "selected" : ""}>Aberto</option>
        <option value="Em andamento" ${chamado.status === "Em andamento" ? "selected" : ""}>Em andamento</option>
        <option value="Em espera" ${chamado.status === "Em espera" ? "selected" : ""}>Em espera</option>
        <option value="Concluído" ${chamado.status === "Concluído" ? "selected" : ""}>Concluído</option>
      </select><br><br>

      <label>Responsável:</label>
      <input type="text" id="resp-${chamado.id}" value="${chamado.responsavel}"><br><br>

      <label>Data de conclusão:</label>
      <input type="datetime-local" id="dataFim-${chamado.id}" value="${dataConclusaoValue}">
      <br><br>

      <button onclick="salvarAlteracoes(${chamado.id})">Salvar alterações</button>
      <button onclick="deletarChamado(${chamado.id})">Excluir</button>
    `;

    listaChamados.appendChild(div);
  });
}

function salvarAlteracoes(id) {
  let chamados = JSON.parse(localStorage.getItem("chamados")) || [];
  const index = chamados.findIndex(c => c.id === id);

  if (index !== -1) {
    chamados[index].status = document.getElementById(`status-${id}`).value;
    chamados[index].responsavel = document.getElementById(`resp-${id}`).value;

    const dataFimInput = document.getElementById(`dataFim-${id}`).value;
    if (dataFimInput) {
      const dataFormatada = new Date(dataFimInput).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
      });
      chamados[index].dataConclusao = dataFormatada;
    }

    localStorage.setItem("chamados", JSON.stringify(chamados));
    mostrarChamados();
  }
}

function deletarChamado(id) {
  let chamados = JSON.parse(localStorage.getItem("chamados")) || [];
  chamados = chamados.filter(c => c.id !== id);
  localStorage.setItem("chamados", JSON.stringify(chamados));
  mostrarChamados();
}

mostrarChamados();
