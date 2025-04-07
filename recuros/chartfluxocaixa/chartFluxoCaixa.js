var ctx = document.getElementById('fluxoCaixaChart').getContext('2d');
var fluxoCaixaChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [
            {
                label: 'Entradas (R$)',
                data: [1500, 2500, 3200, 1800, 2200, 2800],
                borderColor: '#22C55E',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#22C55E',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Saídas (R$)',
                data: [800, 1200, 1500, 1000, 900, 1500],
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#EF4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Saldo (R$)',
                data: [700, 1300, 1700, 800, 1300, 1300],
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4F46E5',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
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
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
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
