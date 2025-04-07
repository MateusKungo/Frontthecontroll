async function listarContas() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch("https://thecontroll.com/public/api/conta", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar contas');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao listar contas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar a lista de contas. ' + error.message
        });
        return null;
    }
}

// Função para exibir as contas na interface
async function exibirContas() {
    const contas = await listarContas();
    if (!contas) return;

    const containerContas = document.getElementById('lista-contas');
    if (!containerContas) {
        console.error('Elemento lista-contas não encontrado');
        return;
    }

    containerContas.innerHTML = '';

    contas.forEach(conta => {
        const elementoConta = document.createElement('div');
        elementoConta.className = 'conta-item';
        elementoConta.innerHTML = `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${conta.nome || 'Sem nome'}</h5>
                    <p class="card-text">
                        <strong>Tipo:</strong> ${conta.tipo || 'Não especificado'}<br>
                        <strong>ID:</strong> ${conta.id || 'N/A'}
                    </p>
                </div>
            </div>
        `;
        containerContas.appendChild(elementoConta);
    });
}

// Chamar a função quando a página carregar
document.addEventListener('DOMContentLoaded', exibirContas);
