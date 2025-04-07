document.addEventListener('DOMContentLoaded', function () {
    // Inicializa o gráfico
    const chart = echarts.init(document.getElementById('profitabilityChart'));

    // Dados simulados de receitas, despesas e lucro
    const categories = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']; // Meses
    const revenues = [12000, 15000, 14000, 18000, 17000, 20000]; // Receitas
    const expenses = [8000, 9000, 11000, 12000, 13000, 15000];  // Despesas
    const profits = revenues.map((rev, i) => rev - expenses[i]); // Lucro calculado

    // Configuração do gráfico
    const option = {
        title: {
            text: '',
            subtext: 'Comparação entre Receitas, Despesas e Lucro',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['Receitas', 'Despesas', 'Lucro'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
                rotate: 30 // Rotação dos rótulos, se necessário
            }
        },
        yAxis: {
            type: 'value',
            name: 'Valores (R$)'
        },
        series: [
            {
                name: 'Receitas',
                type: 'bar',
                data: revenues,
                itemStyle: {
                    color: '#4CAF50'
                }
            },
            {
                name: 'Despesas',
                type: 'bar',
                data: expenses,
                itemStyle: {
                    color: '#F44336'
                }
            },
            {
                name: 'Lucro',
                type: 'line',
                data: profits,
                itemStyle: {
                    color: '#2196F3'
                },
                lineStyle: {
                    width: 3
                },
                symbol: 'circle',
                symbolSize: 8
            }
        ]
    };

    // Aplica a configuração no gráfico
    chart.setOption(option);
});