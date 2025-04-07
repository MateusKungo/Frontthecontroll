import { getToken } from '../utility/dadoslocal.js';

// Função para buscar as contas da API e exibir na tabela
async function fetchContas() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Token de autenticação não encontrado.");

        const response = await fetch("https://thecontroll.com/public/api/conta", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorDetail = await response.json().catch(() => null);
            throw new Error(
                `Erro ao buscar contas. Status: ${response.status}. Detalhes: ${
                    errorDetail ? JSON.stringify(errorDetail) : "Sem detalhes."
                }`
            );
        }

        const result = await response.json();
        const contas = result.data || result;

        if (!Array.isArray(contas)) throw new Error("Os dados retornados pela API não são uma lista.");

        console.log("Contas obtidas:", contas);
        populateTable(contas);
    } catch (error) {
        console.error("Erro ao buscar ou processar contas:", error.message);

    }
}

// Função para preencher a tabela com as contas cadastradas

function populateTable(contas) {
    const tableBody = document.querySelector(".dataTableContas tbody");
    tableBody.innerHTML = ""; // Limpa a tabela antes de preencher

    contas.forEach((conta) => {
        // Define a cor e o ícone com base no status
        const statusIcon = conta.status === "Ativa"
            ? `<i class="fas fa-check-circle" style="color: green; font-size: 20px;"></i>`
            : `<i class="fas fa-times-circle" style="color: red; font-size: 20px;"></i>`;

        const row = `
            <tr>
                <td>${conta.id_conta}</td>
                <td>${conta.nome || "Não informado"}</td>
                <td>${conta.tipo || "Não informado"}</td>
                <td>${conta.descricao || "Sem descrição"}</td>
                <td>${statusIcon} ${conta.status || "Sem status"}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-conta" data-id="${conta.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-delete-conta" data-id="${conta.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });

    // Adiciona eventos aos botões
    addEditDeleteEvents();
}


// Chama a função ao carregar a página
document.addEventListener("DOMContentLoaded", fetchContas);

async function carregarContas() {
    try {
        const token = getToken();
        console.log('Token na listagem:', token); // Debug

        const response = await fetch('/api/contas', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        console.log('Response status:', response.status); // Debug
        const contas = await response.json();
        console.log('Contas recebidas:', contas); // Debug

        if (!response.ok) {
            throw new Error('Erro ao carregar contas');
        }

        // Atualiza a tabela de contas
        const contasBody = document.getElementById('contas-body');
        if (contasBody) {
            contasBody.innerHTML = contas.map(conta => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="me-2">${conta.nome}</span>
                            <span class="badge ${conta.tipo === 'Entrada' ? 'bg-success' : 'bg-danger'}">
                                ${conta.tipo}
                            </span>
                        </div>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="editarConta(${conta.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirConta(${conta.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Erro ao carregar contas. Tente novamente.'
        });
    }
}

// Carrega as contas quando a página é carregada
document.addEventListener('DOMContentLoaded', function() {
    carregarContas();
});

// Exporta as funções para uso global
window.carregarContas = carregarContas;

// Função para editar conta
window.editarConta = async function(id) {
    try {
        const token = getToken();
        const response = await fetch(`/api/contas/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados da conta');
        }

        const conta = await response.json();

        // Preenche o modal com os dados da conta
        document.getElementById('nome').value = conta.nome;
        document.getElementById('tipo').value = conta.tipo;

        // Abre o modal
        const modal = new bootstrap.Modal(document.getElementById('modalAdicionarConta'));
        modal.show();
    } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Erro ao carregar dados da conta.'
        });
    }
};

// Função para excluir conta
window.excluirConta = async function(id) {
    try {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "Esta ação não poderá ser revertida!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const token = getToken();
            const response = await fetch(`/api/contas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir conta');
            }

            Swal.fire(
                'Excluído!',
                'Conta excluída com sucesso.',
                'success'
            );

            // Recarrega a lista de contas
            carregarContas();
        }
    } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Erro ao excluir conta.'
        });
    }
};
