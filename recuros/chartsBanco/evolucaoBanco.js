document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o gráfico com ECharts
    const chart = echarts.init(document.getElementById('bankEvolutionChart'));

    // Configuração do gráfico de evolução de saldo de cada banco
    const option = {
        title: {
            text: 'Evolução do Saldo Bancário',
            subtext: 'Análise ao longo dos anos',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line' // Tooltip acompanha a linha
            }
        },
        legend: {
            data: ['Saldo Banco A'],
            bottom: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['2018', '2019', '2020', '2021', '2022', '2023'],
            axisLabel: {
                rotate: 30 // Rotaciona os rótulos para melhor visualização
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: 'R$ {value}' // Formata valores como moeda
            }
        },
        
        series: [
            {
                name: 'Saldo Banco A',
                type: 'line',
                data: [100000, 120000, 140000, 160000, 180000, 30000],
                itemStyle: {
                    color: '#4caf50' // Cor da linha do saldo
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: 'R$ {c}' // Exibe o valor acima da linha
                },
                smooth: true // Linha suave para melhor visualização
            }
        ]
    };

    // Renderiza o gráfico
    chart.setOption(option);
});
