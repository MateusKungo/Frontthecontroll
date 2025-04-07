
import API_CONFIG from '../urlbase/url.js';
const authToken = localStorage.getItem("authToken");

// Função para buscar tipos de pagamento
async function fetchTiposPagamento() {
    try {
        if (!authToken) {
            throw new Error("Token de autenticação não encontrado.");
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/tipos-pagamento`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorDetail = await response.json().catch(() => null);
            throw new Error(
                `Erro ao buscar dados da API. Status: ${response.status}. Detalhes: ${
                    errorDetail ? JSON.stringify(errorDetail) : "Sem detalhes."
                }`
            );
        }

        const result = await response.json();
        const tiposPagamento = result.data || result;

        if (!Array.isArray(tiposPagamento)) {
            throw new Error("Os dados retornados pela API não são uma lista.");
        }

        console.log("Tipos de pagamento obtidos:", tiposPagamento);
        populateTable(tiposPagamento);
    } catch (error) {
        console.error("Erro ao buscar ou processar tipos de pagamento:", error.message);
        Swal.fire("Erro!", error.message, "error");
    }
}

// Função para preencher a tabela
function populateTable(tiposPagamento) {
    const tableBody = document.querySelector("#dataTable3 tbody");
    tableBody.innerHTML = "";

    // Filtrar tipos ativos (state !== 1)
    const activeTipos = tiposPagamento.filter(tipo => tipo.state !== 1);

    activeTipos.forEach((tipo) => {
        const row = `
            <tr>
                <td>${tipo.id}</td>
                <td>${tipo.nome || "Não informado"}</td>
                <td>${tipo.descricao || "Não informado"}</td>
                <td>
                    <ul class="d-flex justify-content-center">
                        <li class="mr-3">
                            <a href="#" class="btn btn-sm btn-primary btn-edit-tipo"
                                data-id="${tipo.id}"
                                data-nome="${tipo.nome}"
                                data-descricao="${tipo.descricao}">
                                <i class="fas fa-edit"></i>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="btn btn-sm btn-danger btn-delete-tipo" data-id="${tipo.id}">
                                <i class="fas fa-trash"></i>
                            </a>
                        </li>
                    </ul>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });

    addEditButtonsEvent();
}

// Função para adicionar eventos aos botões de edição
function addEditButtonsEvent() {
    document.querySelectorAll('.btn-edit-tipo').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const tipoId = button.getAttribute('data-id');
            const nomeTipo = button.getAttribute('data-nome');
            const descricaoTipo = button.getAttribute('data-descricao');

            document.getElementById('editProjectoId').value = tipoId;
            document.getElementById('edit_nometipopagamento').value = nomeTipo;
            document.getElementById('edit_descricaoTipopagamento').value = descricaoTipo;

            const editModal = new bootstrap.Modal(document.getElementById('editProjectoModal'));
            editModal.show();
        });
    });
}

// Evento de submit do formulário de edição
document.getElementById('editProjectoForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = document.getElementById('editProjectoForm');
    const tipoId = form.elements['projectoId'].value;
    const nome = form.elements['edit_nometipopagamento'].value;
    const descricao = form.elements['edit_descricaoTipopagamento'].value;

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/tipos-pagamento/${tipoId}`, {
            method: "POST", // Alterado para PUT (ou PATCH se apropriado)
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                nome: nome,
                descricao: descricao
            })
        });

        if (response.ok) {
            Swal.fire({
                icon: "success",
                title: "Sucesso!",
                text: "Tipo de pagamento atualizado com sucesso.",
                timer: 2000,
                showConfirmButton: false,
            }).then(() => {
                location.reload();
            });
        } else {
            const errorData = await response.json();
            Swal.fire("Erro!", errorData.message || "Erro ao atualizar", "error");
        }
    } catch (error) {
        console.error("Erro ao enviar:", error);
        Swal.fire("Erro!", "Erro de conexão com o servidor.", "error");
    }
});

// Evento para deletar tipos de pagamento
document.addEventListener('click', async function(e) {
    if (e.target.closest('.btn-delete-tipo')) {
        e.preventDefault();
        const button = e.target.closest('.btn-delete-tipo');
        const tipoId = button.getAttribute('data-id');
        const tipoNome = button.closest('tr').querySelector('td:nth-child(2)').textContent;

        const result = await Swal.fire({
            title: `Desativar Tipo de Pagamento <span style="color: #ff6b6b;">"${tipoNome}"</span>?`,
            html: `O tipo de pagamento <span style="color: #ff6b6b; font-weight: bold;">"${tipoNome}"</span> será desativado!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, desativar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/tipos-pagamento/${tipoId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    Swal.fire(
                        'Desativado!',
                        `O tipo de pagamento "${tipoNome}" foi desativado com sucesso.`,
                        'success'
                    );
                    fetchTiposPagamento();
                } else {
                    throw new Error('Erro ao desativar');
                }
            } catch (error) {
                Swal.fire(
                    'Erro!',
                    `Não foi possível desativar o tipo de pagamento "${tipoNome}".`,
                    'error'
                );
                console.error('Erro ao desativar:', error);
            }
        }
    }
});

// Carregar tipos de pagamento ao abrir a página
fetchTiposPagamento();
