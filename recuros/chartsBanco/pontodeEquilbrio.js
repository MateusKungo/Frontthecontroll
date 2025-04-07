document.addEventListener('DOMContentLoaded', function () {
    // Inicializa o gráfico
    const chart = echarts.init(document.getElementById('breakEvenChart'));

    // Dados simulados
    const units = Array.from({ length: 11 }, (_, i) => i * 10); // Produção de 0 a 100 unidades
    const fixedCosts = 1000; // Custos fixos em R$
    const variableCostPerUnit = 20; // Custo variável por unidade em R$
    const pricePerUnit = 50; // Preço por unidade em R$

    const totalCosts = units.map(unit => fixedCosts + unit * variableCostPerUnit);
    const totalRevenues = units.map(unit => unit * pricePerUnit);

    // Localiza o ponto de equilíbrio
    const breakEvenPoint = units.findIndex((_, i) => totalRevenues[i] >= totalCosts[i]);

    // Configuração do gráfico
    const option = {
        title: {
            text: '',
            subtext: 'Receitas Totais vs. Custos Totais',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: params => {
                const [cost, revenue] = params;
                return `
                    <strong>Unidades: ${cost.dataIndex * 10}</strong><br>
                    Custos Totais: R$ ${cost.value.toFixed(2)}<br>
                    Receitas Totais: R$ ${revenue.value.toFixed(2)}
                `;
            }
        },
        legend: {
            data: ['Custos Totais', 'Receitas Totais', 'Ponto de Equilíbrio'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            name: 'Unidades Produzidas',
            data: units
        },
        yAxis: {
            type: 'value',
            name: 'Valor (R$)'
        },
        series: [
            {
                name: 'Custos Totais',
                type: 'line',
                data: totalCosts,
                lineStyle: { color: '#FF5733' },
                smooth: true
            },
            {
                name: 'Receitas Totais',
                type: 'line',
                data: totalRevenues,
                lineStyle: { color: '#33FF57' },
                smooth: true
            },
            {
                name: 'Ponto de Equilíbrio',
                type: 'scatter',
                data: [
                    {
                        value: totalCosts[breakEvenPoint],
                        name: 'Ponto de Equilíbrio'
                    }
                ],
                symbolSize: 10,
                itemStyle: { color: '#FFD700' }
            }
        ]
    };

    // Aplica a configuração no gráfico
    chart.setOption(option);
});