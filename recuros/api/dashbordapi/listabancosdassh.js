//const apiUrl = "https://thecontroll.com/public/api/"; // URL da API de bancos
import API_CONFIG from "../urlbase/url.js";
// Função para buscar e listar os bancos na tabela
async function fetchBancos() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken)
            throw new Error("Token de autenticação não encontrado.");

        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-de-bancos`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok)
            throw new Error(
                `Erro ao buscar dados da API. Status: ${response.status}`
            );

        const result = await response.json();
        const bancos = result.data || result; // Algumas APIs retornam {data: []}, outras diretamente []

        if (!Array.isArray(bancos))
            throw new Error("Os dados retornados pela API não são uma lista.");

        console.log("Bancos obtidos:", bancos);
        populateBancosTable(bancos);
    } catch (error) {
        console.error("Erro ao buscar ou processar bancos:", error.message);
        /*  Swal.fire({
            icon: "error",
            title: "Erro",
            text: "Não foi possível carregar os bancos. Por favor, tente novamente.",
        }); */
    }
}

// Função para preencher a tabela com os bancos
function populateBancosTable(bancos) {
    const tableBody = document.querySelector("#listabancoDashBord tbody");
    tableBody.innerHTML = ""; // Limpa a tabela antes de adicionar novos dados

    // Recupera a moeda principal do localStorage
    const credenciaEmpresa = localStorage.getItem("credenciaEmpresa");
    let moedaPrincipal = "R$"; // Valor padrão

    if (credenciaEmpresa) {
        try {
            const dados = JSON.parse(credenciaEmpresa);
            moedaPrincipal = dados.data.empresa_moeda_principal || "R$";
        } catch (error) {
            console.error("Erro ao recuperar a moeda principal:", error);
        }
    }

    let totalSaldo = 0; // Adiciona contador para o total

    bancos.forEach((banco) => {
        const saldo = parseFloat(banco.valorConta);
        totalSaldo += saldo; // Acumula o total

        const row = `
            <tr>
                <td class="text-uppercase">${banco.nomeBanco}</td>
                <td class="text-uppercase">${moedaPrincipal} ${saldo.toFixed(2)}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });

    // Atualiza o total na tabela
    const totalContasElement = document.querySelector("#listabancoDashBord tfoot tr td:last-child");
    if (totalContasElement) {
        totalContasElement.className = 'text-end text-primary';
        totalContasElement.textContent = `${moedaPrincipal} ${totalSaldo.toFixed(2)}`;
    }

    // Atualiza APENAS o saldo atual no card principal
    const saldoAtualElement = document.getElementById("saldoAtual");
    if (saldoAtualElement) {
        saldoAtualElement.className = 'text-white value-animation card-value';
        saldoAtualElement.textContent = `${moedaPrincipal} ${totalSaldo.toFixed(2)}`;
    }

    // Mantém os outros valores zerados ou com valores padrão
    const receitasElement = document.getElementById("receitasMes");
    if (receitasElement) {
        receitasElement.textContent = `${moedaPrincipal} 0,00`;
    }

    const despesasElement = document.getElementById("despesasMes");
    if (despesasElement) {
        despesasElement.textContent = `${moedaPrincipal} 0,00`;
    }

    const resultadoElement = document.getElementById("resultadoMes");
    if (resultadoElement) {
        resultadoElement.textContent = `${moedaPrincipal} 0,00`;
    }

    addEditButtonsEvent();
    addDeleteButtonsEvent();
}

// Configuração do novo gráfico de Fluxo de Caixa
function initFluxoCaixaChart() {
    const ctx = document.getElementById('fluxoCaixaChart').getContext('2d');

    // Dados de exemplo (substitua pelos dados reais da sua API)
    const dados = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        entradas: [50000, 65000, 55000, 70000, 65000, 80000],
        saidas: [40000, 45000, 50000, 55000, 60000, 65000],
        saldo: [10000, 20000, 5000, 15000, 5000, 15000]
    };

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.labels,
            datasets: [
                {
                    label: 'Entradas',
                    data: dados.entradas,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: '#22C55E',
                    borderWidth: 1,
                    borderRadius: 5,
                    stack: 'Stack 0'
                },
                {
                    label: 'Saídas',
                    data: dados.saidas,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#EF4444',
                    borderWidth: 1,
                    borderRadius: 5,
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' +
                                new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                notation: 'compact'
                            }).format(value);
                        },
                        font: {
                            size: 11
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Função para atualizar os totais
function updateTotals(entradas, saidas) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const totalEntradas = entradas.reduce((a, b) => a + b, 0);
    const totalSaidas = saidas.reduce((a, b) => a + b, 0);
    const saldoPeriodo = totalEntradas - totalSaidas;

    document.getElementById('totalEntradas').textContent = formatCurrency(totalEntradas);
    document.getElementById('totalSaidas').textContent = formatCurrency(totalSaidas);
    document.getElementById('saldoPeriodo').textContent = formatCurrency(saldoPeriodo);
}

// Inicializa o gráfico quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    initFluxoCaixaChart();

    // Adiciona interatividade aos botões de período
    document.querySelectorAll('[data-range]').forEach(button => {
        button.addEventListener('click', function() {
            const days = parseInt(this.dataset.range);

            // Atualiza estado ativo dos botões
            document.querySelectorAll('[data-range]').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            // Aqui você pode adicionar a lógica para buscar novos dados baseado no período
            // Por exemplo:
            // fetchDadosFluxoCaixa(days);
        });
    });
});

fetchBancos();
