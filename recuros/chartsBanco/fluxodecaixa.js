const dataFluxocaixa = {
    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'], // Meses
    datasets: [
        {
            label: 'Recetas (R$)',
            data: [5000, 7000, 6000, 8000, 9000, 8500], // Valores de entrada
            backgroundColor: 'rgba(76, 175, 80, 0.7)', // Verde Claro
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 1,
        },
        {
            label: 'Gasto Total (R$)',
            data: [3000, 4000, 4500, 3000, 3500, 4000], // Valores de saída
            backgroundColor: 'rgba(255, 159, 64, 0.7)', // Laranja
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
        },
    ],
};

// Configuração do gráfico
const config = {
    type: 'bar', // Tipo de gráfico (bar - barra)
    data: dataFluxocaixa,
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top', // Posição da legenda
                labels: {
                    font: {
                        size: 14,
                        family: 'Poppins', // Definindo a fonte
                    }
                }
            },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#333',
                bodyColor: '#333',
                borderColor: '#ddd',
                borderWidth: 1,
                callbacks: {
                    label: function(tooltipItem) {
                        return `R$ ${tooltipItem.raw.toLocaleString()}`;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return `R$ ${value.toLocaleString()}`;
                    },
                },
            },
        },
    },
};

// Renderizando o gráfico
const ctxs = document.getElementById('fluxoCaixaChart').getContext('2d');
new Chart(ctxs, config);

// Simulando resposta de sucesso após renderização do gráfico
function displayMessage(message, type) {
    const responseMessage = document.getElementById('responseMessage');
    responseMessage.style.display = 'block';
    responseMessage.textContent = message;

    if (type === 'success') {
        responseMessage.classList.add('alert-success');
        responseMessage.classList.remove('alert-error');
    } else {
        responseMessage.classList.add('alert-error');
        responseMessage.classList.remove('alert-success');
    }
}

// Exemplo de chamada após renderização
setTimeout(() => {
    displayMessage('Gráfico de fluxo de caixa carregado com sucesso!', 'success');
}, 1000); // Mensagem de sucesso após 1 segundo