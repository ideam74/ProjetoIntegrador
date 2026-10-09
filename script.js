// Banco de dados via LocalStorage
// Busca os dados salvos no navegador (LocalStorage) ao carregar a página​
// Se não houver nada salvo, inicializa como uma lista (array) vazia []
let salas = JSON.parse(localStorage.getItem('salas')) || [];
let reservas = JSON.parse(localStorage.getItem('reservas')) || [];

// Salva o estado atual das listas de 'salas' e 'reservas' no LocalStorage
// Converte os objetos JavaScript em texto (JSON) para que o navegador possa armazenar
function salvarDados() {
    localStorage.setItem('salas', JSON.stringify(salas));
    localStorage.setItem('reservas', JSON.stringify(reservas));
}

// REQUISITO 5: Verificar conflito de horário
​
// Verifica se uma nova reserva conflita com alguma reserva já existente para a mesma sala.​
// @param {string} salaId - ID da sala que está sendo avaliada.​
// @param {Date} inicioNovo - Objeto Date com o horário de início desejado.​
// @param {Date} fimNovo - Objeto Date com o horário de término desejado.​
// @returns {boolean} - Retorna true se houver conflito, ou false se o horário estiver livre.​
​
function existeConflito(salaId, inicioNovo, fimNovo) {
    // Percorre a lista de reservas procurando se PELO MENOS UMA (.some) gera conflito
    return reservas.some(reserva => {
        if (reserva.salaId !== salaId) return false;

        // Converte as datas salvas da reserva antiga de volta para objetos Date
        const resInicio = new Date(reserva.dataInicio);
        const resFim = new Date(reserva.dataFim);

        // Verifica se o novo início fica dentro de uma reserva existente
        const conflitoInicio = inicioNovo >= resInicio && inicioNovo < resFim;
        // Verifica se o novo fim fica dentro de uma reserva existente​
        const conflitoFim = fimNovo > resInicio && fimNovo <= resFim;
        // Verifica se o novo período engloba totalmente uma reserva existente
        const conflitoEnvolve = inicioNovo <= resInicio && fimNovo >= resFim;
        // Se qualquer uma das condições acima for verdadeiro, há conflito de horário
        return conflitoInicio || conflitoFim || conflitoEnvolve;
    });
}

// LÓGICA DE INTERFACE (DOM)

// Atualiza os selects e as listas na tela
/**​
* Atualiza visualmente todos os elementos da página HTML.​
* Limpa as listas antigas e redesenha as salas, reservas e opções do formulário​
* com base nos dados mais recentes da memória.​
*/​
function atualizarTela() {
    // Captura as referências dos elementos HTML que serão modificados
    const listaSalas = document.getElementById('lista-salas');
    const listaReservas = document.getElementById('lista-reservas');
    const selectSalas = document.getElementById('reserva-sala-id');

    // Limpar elementos
    listaSalas.innerHTML = '';
    listaReservas.innerHTML = '';
    // Reseta o menu de seleção com uma opção padrão vazia
    selectSalas.innerHTML = '<option value="">-- Escolha uma sala --</option>';

    // Renderizar Salas
    salas.forEach(sala => {
        listaSalas.innerHTML += `<li><strong>${sala.nome}</strong> (Capacidade: ${sala.capacidade} | ${sala.localizacao})</li>`;
        selectSalas.innerHTML += `<option value="${sala.id}">${sala.nome}</option>`;
    });

    // Renderizar Reservas
    reservas.forEach(reserva => {
        const sala = salas.find(s => s.id === reserva.salaId);
        const nomeSala = sala ? sala.nome : 'Sala Removida';
        const inicio = new Date(reserva.dataInicio).toLocaleString('pt-BR');
        const fim = new Date(reserva.dataFim).toLocaleString('pt-BR');

        listaReservas.innerHTML += `
            <li>
                <div>
                    <strong>${nomeSala}</strong><br>
                    <small>Por: ${reserva.colaborador}</small><br>
                    <small>Período: ${inicio} até ${fim}</small>
                </div>
                <button class="btn-danger" onclick="cancelarReserva('${reserva.id}')">Cancelar</button>
            </li>
        `;
    });
}

// Evento: Cadastrar Sala
document.getElementById('form-sala').addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('sala-nome').value;
    const capacidade = document.getElementById('sala-capacidade').value;
    const localizacao = document.getElementById('sala-local').value;

    const novaSala = { id: Date.now().toString(), nome, capacidade, localizacao };
    salas.push(novaSala);
    salvarDados();
    atualizarTela();
    this.reset();
});

// REQUISITO 2: Botão de verificar disponibilidade
document.getElementById('btn-verificar').addEventListener('click', function() {
    const salaId = document.getElementById('reserva-sala-id').value;
    const inicio = document.getElementById('reserva-inicio').value;
    const fim = document.getElementById('reserva-fim').value;

    if (!salaId || !inicio || !fim) {
        exibirStatus("Preencha a sala e os horários para verificar.", "error");
        return;
    }

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    if (dataInicio >= dataFim) {
        exibirStatus("O horário de início deve ser anterior ao fim.", "error");
        return;
    }

    if (existeConflito(salaId, dataInicio, dataFim)) {
        exibirStatus("❌ Indisponível! Já existe uma reserva neste horário.", "error");
    } else {
        exibirStatus("✅ Disponível! Você pode prosseguir com a reserva.", "success");
    }
});

// REQUISITO 3 e 5: Evento de Realizar Reserva
document.getElementById('form-reserva').addEventListener('submit', function(e) {
    e.preventDefault();
    const salaId = document.getElementById('reserva-sala-id').value;
    const colaborador = document.getElementById('reserva-colaborador').value;
    const inicio = document.getElementById('reserva-inicio').value;
    const fim = document.getElementById('reserva-fim').value;

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    if (dataInicio >= dataFim) {
        exibirStatus("O horário de início deve ser anterior ao fim.", "error");
        return;
    }

    if (existeConflito(salaId, dataInicio, dataFim)) {
        exibirStatus("❌ Erro: Não foi possível reservar devido a um conflito de horário.", "error");
        return;
    }

    const novaReserva = { id: Date.now().toString(), salaId, colaborador, dataInicio, dataFim };
    reservas.push(novaReserva);
    salvarDados();
    atualizarTela();
    this.reset();
    exibirStatus("🎉 Reserva realizada com sucesso!", "success");
});

// REQUISITO 4: Cancelar Reserva
function cancelarReserva(id) {
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
        reservas = reservas.filter(r => r.id !== id);
        salvarDados();
        atualizarTela();
    }
}

// Helper para mensagens de status
function exibirStatus(texto, classe) {
    const statusDiv = document.getElementById('status-reserva');
    statusDiv.innerText = texto;
    statusDiv.className = `status-msg ${classe}`;
    setTimeout(() => { statusDiv.className = 'status-msg'; }, 5000);
}

// Inicialização da tela ao carregar a página
atualizarTela();

