document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o gráfico
    const chart = echarts.init(document.getElementById('expensesChart'));

    // Dados simulados de maiores despesas
    const data = [
        { value: 1500, name: 'Aluguel' },
        { value: 1200, name: 'Salários' },
        { value: 800, name: 'Manutenção' },
        { value: 600, name: 'Marketing' },
        { value: 500, name: 'Serviços' },
    ];

    // Configuração do gráfico
    const option = {
        title: {
            text: '',
            subtext: 'Categorias principais',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: '0',
            data: data.map(item => item.name)
        },
        series: [
            {
                name: 'Despesas',
                type: 'pie',
                radius: '50%',
                data: data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                label: {
                    formatter: '{b}: {c} ({d}%)',
                    fontSize: 14
                }
            }
        ]
    };

    // Aplica a configuração no gráfico
    chart.setOption(option);
});