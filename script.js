let participantes = JSON.parse(localStorage.getItem("participantes")) || [];
let indiceAtual = 0;
let turno = 1;
let popupCondicaoTarget = null;
let popupConcentracaoTarget = null;
let popupEditarIndex = null;
let draggedRow = null;

// Arrastar Lista
function adicionarEventosDrag(row) {
  row.addEventListener("dragstart", () => {
    draggedRow = row;
    row.style.opacity = "0.5";
  });

  row.addEventListener("dragend", () => {
    row.style.opacity = "";
    salvarOrdemAPartirDaTabela();  // Salva nova ordem após o arraste
  });

  row.addEventListener("dragover", (e) => {
    e.preventDefault();
    const tbody = row.parentNode;
    const bounding = row.getBoundingClientRect();
    const offset = bounding.y + bounding.height / 2;
    if (e.clientY - offset > 0) {
      tbody.insertBefore(draggedRow, row.nextSibling);
    } else {
      tbody.insertBefore(draggedRow, row);
    }
  });
}

function salvarOrdemAPartirDaTabela() {
  const novasLinhas = Array.from(document.getElementById("lista").children);
  const novaOrdem = novasLinhas.map(tr => {
    const nome = tr.children[1].textContent;
    return participantes.find(p => p.nome === nome);
  });
  participantes = novaOrdem;
  atualizarLista();
}




function atualizarLista() {
const tbody = document.getElementById("lista");
tbody.innerHTML = "";

participantes.forEach((p, i) => {
const tr = document.createElement("tr");
tr.draggable = true;


tr.innerHTML += `<td>${p.iniciativa}</td>`;
tr.innerHTML += `<td>${p.nome}</td>`;
tr.innerHTML += `<td>${p.ca}</td>`;

const tdVida = document.createElement("td");
// Cria o input de vida atual
const inputVida = document.createElement('input');
inputVida.type = 'number';
inputVida.value = p.vidaAtual;
// Quando o valor mudar, atualiza a propriedade corretamente
inputVida.addEventListener('change', function () {

  if(this.value != ''){
    participantes[i].vidaAtual = Number(this.value);
  }

});
inputVida.addEventListener('focus', function () {
  this.value = '';
});
inputVida.addEventListener('blur', function () {
  // Se o campo estiver vazio quando o usuário sair, restaura o valor original
  if (this.value.trim() === '') {
    this.value = p.vidaAtual;
  }
});

// Adiciona o input e o texto da vida máxima na célula
tdVida.appendChild(inputVida);
tdVida.append(' / ' + p.vidaMaxima);
tr.appendChild(tdVida);


const tdConc = document.createElement("td");
if (p.concentracao) {
  tdConc.innerHTML = `${p.concentracao.texto} (${p.concentracao.turnos}) <button onclick="cancelarConcentracao(${i})">X</button>`;
} else {
  tdConc.innerHTML = `<button onclick="abrirPopup('concentracao',${i})" title="Concentração">Concentração</button>`;
}
tr.appendChild(tdConc);

// Para Ação, Ação Bônus e Reação
const tdAcoes = document.createElement("td");

// Botões de Ação
for (let o = 0; o < p.acoes.acao.total; o++) {
  const btn = document.createElement("button"); 
  btn.className = p.acoes.acao.usadas > o ? "ativo" : ""; 
  btn.innerText = btn.className === 'ativo' ? "⬛" : "⬜";
  btn.onclick = function () {
    if (btn.className === 'ativo') {
      participantes[i].acoes.acao.usadas--;
      console.log(participantes[i].acoes.acao.usadas)
    } else {
      participantes[i].acoes.acao.usadas++;
    }
    atualizarLista();
  };
  tdAcoes.appendChild(btn);
}

// Botões de Ação Bônus
for (let o = 0; o < p.acoes.bonus.total; o++) {
  const btn = document.createElement("button"); 
  btn.className = p.acoes.bonus.usadas > o ? "ativo" : ""; 
  btn.innerText = btn.className === 'ativo' ? "⚫" : "⚪";
  btn.onclick = function () {
    if (btn.className === 'ativo') {
      participantes[i].acoes.bonus.usadas--;
      console.log(participantes[i].acoes.bonus.usadas)
    } else {
      participantes[i].acoes.bonus.usadas++;
    }
    atualizarLista();
  };
  tdAcoes.appendChild(btn);
}
// Botões de Reação
for (let o = 0; o < p.acoes.reacao.total; o++) {
  const btn = document.createElement("button"); 
  btn.className = p.acoes.reacao.usadas > o ? "ativo" : ""; 
  btn.innerText = btn.className === 'ativo' ? "🔷" : "🔶";
  btn.onclick = function () {
    if (btn.className === 'ativo') {
      participantes[i].acoes.reacao.usadas--;
      console.log(participantes[i].acoes.reacao.usadas)
    } else {
      participantes[i].acoes.reacao.usadas++;
    }
    atualizarLista();
  };
  tdAcoes.appendChild(btn);
}

tr.appendChild(tdAcoes);


const tdConds = document.createElement("td");
p.condicoes.forEach((c, ci) => {
  const span = document.createElement("span");
  span.innerHTML = `${c.nome} (${c.turnos}) <button onclick="removerCondicao(${i}, ${ci})">X</button><br>`;
  tdConds.appendChild(span);
});
tdConds.innerHTML += `<button onclick="abrirPopup('condicao',${i})">+</button>`;
tr.appendChild(tdConds);


const tdOpcoes = document.createElement("td");
tdOpcoes.innerHTML = `
  <button onclick="abrirPopupEditar(${i})" title="Editar">✏️</button>
  <button onclick="excluir(${i})" title="Excluir">❌</button>
`;
tr.appendChild(tdOpcoes);


adicionarEventosDrag(tr);
tbody.appendChild(tr);


});

document.getElementById("jogadorAtual").innerText = participantes[indiceAtual]?.nome || "-";
document.getElementById("turno").innerText = turno;
salvarEstado();
}

function adicionarParticipante() {
const nome = document.getElementById("nome").value;
const iniciativa = parseInt(document.getElementById("iniciativa").value);
const ca = parseInt(document.getElementById("ca").value);
const vidaMaxima = parseInt(document.getElementById("vidaMaxima").value);
if (!nome || isNaN(iniciativa) || isNaN(ca) || isNaN(vidaMaxima)) return;

participantes.push({
  nome, 
  iniciativa, 
  ca, 
  vidaMaxima,
  vidaAtual: vidaMaxima,
  concentracao: null,
  acoes: {
    acao: { total: 1, usadas: 0 },   // 1 Ação inicial
    bonus: { total: 1, usadas: 0 },  // 1 Ação Bônus inicial
    reacao: { total: 1, usadas: 0 }  // 1 Reação inicial
  },
  condicoes: []
});


participantes.sort((a, b) => b.iniciativa - a.iniciativa);

document.getElementById("nome").value = "";
document.getElementById("iniciativa").value = "";
document.getElementById("ca").value = "";
document.getElementById("vidaMaxima").value = "";

atualizarLista();
}

function proximoTurno() {
  indiceAtual++;
  if (indiceAtual >= participantes.length) {
    indiceAtual = 0;
    turno++;
    participantes.forEach(p => {
      // Resetando ações usadas
      p.acoes.acao.usadas = 0;
      p.acoes.bonus.usadas = 0;
      p.acoes.reacao.usadas = 0;
      
      // Reduzindo turnos das condições e concentrações
      p.condicoes.forEach(c => c.turnos--);
      if (p.concentracao) p.concentracao.turnos--;
    });
    
    // Remover condições expiradas
    participantes.forEach(p => {
      p.condicoes = p.condicoes.filter(c => c.turnos > 0);
      if (p.concentracao && p.concentracao.turnos <= 0) p.concentracao = null;
    });
  }
  atualizarLista();
}


function excluir(index) {
participantes.splice(index, 1);
if (indiceAtual >= participantes.length) indiceAtual = 0;
atualizarLista();
}

function limparFila() {
if (confirm("Tem certeza que deseja limpar tudo?")) {
participantes = [];
indiceAtual = 0;
turno = 1;
localStorage.removeItem("participantes");
atualizarLista();
}
}


function abrirPopupCondicao(index) {
popupCondicaoTarget = index;
document.getElementById("popup-condicao").style.display = "flex";
}



function abrirPopup(tipo,index){


  popupConcentracaoTarget = tipo == 'concentracao' ? index : ''
  popupCondicaoTarget = tipo == 'condicao' ? index : ''
  popupEditarIndex = tipo == 'editar' ? index : ''
  

  const popup = document.getElementById(`popup-${tipo}`)
  console.log(popup)
  if (popup) {
    popup.classList.add('show');
    
  }
}

function fecharTodosPopups() {
  document.querySelectorAll('.popup').forEach(p => {
    p.classList.remove('show');
    p.querySelectorAll("input").forEach(input => input.value = "");
  });
}

// Popup Condição
function confirmarCondicao() {
const nome = document.getElementById("condicaoSelect").value;
const turnos = parseInt(document.getElementById("condicaoTurnos").value);
if (!nome || isNaN(turnos)) return;
participantes[popupCondicaoTarget].condicoes.push({ nome, turnos });
fecharTodosPopups();
atualizarLista();
}

function removerCondicao(pi, ci) {
participantes[pi].condicoes.splice(ci, 1);
atualizarLista();
}
// Popup Concentração
function confirmarConcentracao() {
const texto = document.getElementById("concentracaoTexto").value;
const turnos = parseInt(document.getElementById("concentracaoTurnos").value);
if (!texto || isNaN(turnos)) return;
participantes[popupConcentracaoTarget].concentracao = { texto, turnos };
fecharTodosPopups();
atualizarLista();
}

function cancelarConcentracao(index) {
participantes[index].concentracao = null;
atualizarLista();
}

// Popup Editar

function abrirPopupEditar(index) {
  const jogador = participantes[index];

  // Preencher os campos de edição com os dados do jogador
  document.getElementById("editarNome").value = jogador.nome;
  document.getElementById("editarIniciativa").value = jogador.iniciativa;
  document.getElementById("editarCA").value = jogador.ca;
  document.getElementById("editarVidaMaxima").value = jogador.vidaMaxima;
  document.getElementById("editarVidaAtual").value = jogador.vidaAtual;

  // Preencher os campos de ações, bônus e reações
  document.getElementById("editarAcoes").value = jogador.acoes.acao.total;
  document.getElementById("editarAcoesBonus").value = jogador.acoes.bonus.total;
  document.getElementById("editarReacoes").value = jogador.acoes.reacao.total;

  abrirPopup('editar',index);
}

// Popup Edição
function confirmarEdicao() {
  const p = participantes[popupEditarIndex];
  p.nome = document.getElementById("editarNome").value;
  p.iniciativa = parseInt(document.getElementById("editarIniciativa").value);
  p.ca = parseInt(document.getElementById("editarCA").value);
  p.vidaMaxima = parseInt(document.getElementById("editarVidaMaxima").value);
  p.vidaAtual = parseInt(document.getElementById("editarVidaAtual").value);
  p.acoes.acao.total = parseInt(document.getElementById("editarAcoes").value);
  p.acoes.bonus.total = parseInt(document.getElementById("editarAcoesBonus").value);
  p.acoes.reacao.total = parseInt(document.getElementById("editarReacoes").value);

  // Resetar as ações usadas
  p.acoes.acao.usadas = 0;
  p.acoes.bonus.usadas = 0;
  p.acoes.reacao.usadas = 0;

  fecharTodosPopups();
  participantes.sort((a, b) => b.iniciativa - a.iniciativa);
  atualizarLista();
}

function salvarEstado() {
localStorage.setItem("participantes", JSON.stringify(participantes));
}



atualizarLista();