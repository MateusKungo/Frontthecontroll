const ctx = document.getElementById('graficoReceitaDespesa').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [
            {
                label: 'Receita',
                data: [8000, 8200, 9000, 9500, 11000, 12000],
                borderColor: 'green',
                fill: false
            },
            {
                label: 'Despesa',
                data: [3000, 3100, 3200, 3300, 3400, 3500],
                borderColor: 'red',
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
