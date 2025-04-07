var ctx = document.getElementById('metasFinancierasChart').getContext('2d');
var metasFinancierasChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Progresso das Metas',
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                max: 100
            }
        },
        responsive: true,
        plugins: {
            legend: {
                position: 'top'
            }
        }
    }
});

// Função para adicionar nova meta
function addMeta(event) {
    event.preventDefault();

    const titulo = document.getElementById('metaTitulo').value;
    const descricao = document.getElementById('metaDescricao').value;
    const progresso = document.getElementById('metaProgresso').value;
    const cor = document.getElementById('metaCor').value;

    // Atualizando o gráfico
    metasFinancierasChart.data.labels.push(titulo);
    metasFinancierasChart.data.datasets[0].data.push(progresso);
    metasFinancierasChart.data.datasets[0].backgroundColor.push(cor);
    metasFinancierasChart.data.datasets[0].borderColor.push(darkenColor(cor)); // Cor mais escura para a borda
    metasFinancierasChart.update();

    // Adicionando nova meta na visualização de cards
    addMetaCard(titulo, descricao, progresso, cor);

    // Fechar modal
    $('#addMetaModal').modal('hide');

    // Resetar o formulário
    document.getElementById('formAddMeta').reset();
}

// Função para adicionar card de meta
function addMetaCard(titulo, descricao, progresso, cor) {
    const metasContainer = document.getElementById('metasContainer');
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';

    card.innerHTML = `
        <div class="card">
            <div class="card-header" style="background-color: ${cor}; color: white;">
                ${titulo}
            </div>
            <div class="card-body">
                <p>${descricao}</p>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: ${progresso}%; background-color: ${cor};"
                        aria-valuenow="${progresso}" aria-valuemin="0" aria-valuemax="100">${progresso}%</div>
                </div>
                <small class="form-text text-muted">Progresso: ${progresso}%</small>
            </div>
        </div>
    `;

    metasContainer.appendChild(card);
}

// Função para escurecer a cor (para borda do gráfico)
function darkenColor(color) {
    let hex = color.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, r - 30);
    g = Math.max(0, g - 30);
    b = Math.max(0, b - 30);

    return `rgb(${r}, ${g}, ${b})`;
}