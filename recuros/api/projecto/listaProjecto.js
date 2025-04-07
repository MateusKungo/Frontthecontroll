import API_CONFIG from '../urlbase/url.js';
const authToken = localStorage.getItem("authToken");
// Função para buscar projetos
async function fetchProjectos() {
    try {

        if (!authToken)
            throw new Error("Token de autenticação não encontrado.");

        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-de-projectos`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorDetail = await response.json().catch(() => null); // Captura detalhes do erro, se existirem
            throw new Error(
                `Erro ao buscar dados da API. Status: ${
                    response.status
                }. Detalhes: ${
                    errorDetail ? JSON.stringify(errorDetail) : "Sem detalhes."
                }`
            );
        }

        const result = await response.json();
        const projectos = result.data || result;

        if (!Array.isArray(projectos))
            throw new Error("Os dados retornados pela API não são uma lista.");

        console.log("Projetos obtidos:", projectos);
        populateTable(projectos);
    } catch (error) {
        console.error("Erro ao buscar ou processar projetos:", error.message);

    }
}

// Função para preencher a tabela com os dados dos projetos


function populateTable(projectos) {
    const tableBody = document.querySelector("#dataTable3 tbody");
    tableBody.innerHTML = "";

    // Filter out projects with state === 1
    const activeProjectos = projectos.filter(projecto => projecto.state !== 1);

    activeProjectos.forEach((projecto) => {
        const row = `
            <tr>
                <td>${projecto.id}</td>
                <td>${projecto.nomeProjecto || "Não informado"}</td>
                <td>${projecto.descricaoProjecto || "Não informado"}</td>
                <td>
                    <ul class="d-flex justify-content-center">
                        <li class="mr-3">
                            <a href="#" class="btn btn-sm btn-primary btn-edit-projecto"
                                data-id="${projecto.id}"
                                data-nome="${projecto.nomeProjecto}"
                                data-descricao="${projecto.descricaoProjecto}">
                                <i class="fas fa-edit"></i>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="btn btn-sm btn-danger btn-delete-user" data-id="${projecto.id}">
                                <i class="fas fa-trash"></i>
                            </a>
                        </li>
                    </ul>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });

    // Chamando a função para ativar os botões de edição
    addEditProjectButtonsEvent();
}




// Função para adicionar eventos aos botões de edição


function addEditProjectButtonsEvent() {
    document.querySelectorAll('.btn-edit-projecto').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); // Evita que o link navegue para outra página

            const projectoId = button.getAttribute('data-id');
            const nomeProjecto = button.getAttribute('data-nome');
            const descricaoProjecto = button.getAttribute('data-descricao');

            // Preenche os campos do modal
            document.getElementById('editProjectoId').value = projectoId;
            document.getElementById('editNomeProjecto').value = nomeProjecto;
            document.getElementById('editDescricaoProjecto').value = descricaoProjecto;

            // Abre o modal
            const editModal = new bootstrap.Modal(document.getElementById('editProjectoModal'));
            editModal.show();
        });
    });
}



document.getElementById('editProjectoForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita recarregar a página

    // Captura o formulário corretamente
    const form = document.getElementById('editProjectoForm');
    const formData = new FormData(form);
    console.log(`Dados: ${formData}`)
    // Exibir os dados para verificar se está correto
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    const projectoId = formData.get("projectoId");
    console.log(`ID: ${projectoId}`)


    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/cadastro-de-projectos/${projectoId}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: formData,
            }
        );

        if (response.ok) {
            Swal.fire({
                icon: "success",
                title: "Sucesso!",
                text: "O projeto foi atualizado com sucesso.",
                timer: 2000, // Fecha automaticamente após 2 segundos
                showConfirmButton: false,
            }).then(() => {
                location.reload();
            });

        } else {
            const errorData = await response.json();
            Swal.fire("Erro!", errorData.message || "Erro desconhecido.", "error");
        }
    } catch (error) {
        console.error("Erro ao enviar:", error);
        Swal.fire("Erro!", "Erro de conexão com o servidor.", "error");
    }
});














// Carregar projetos ao abrir a página
fetchProjectos();

// Add event listeners for delete buttons
document.addEventListener('click', async function(e) {
    if (e.target.closest('.btn-delete-user')) {
        e.preventDefault();
        const button = e.target.closest('.btn-delete-user');
        const projectoId = button.getAttribute('data-id');
        const projectName = button.closest('tr').querySelector('td:nth-child(2)').textContent;

        const result = await Swal.fire({
            title: `Desativar Projeto <span style="color: #ff6b6b;">"${projectName}"</span>?`,
            html: `O projeto <span style="color: #ff6b6b; font-weight: bold;">"${projectName}"</span> será desativado do sistema!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, desativar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(
                    `${API_CONFIG.BASE_URL}/cadastro-de-projectos/${projectoId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.ok) {
                    Swal.fire(
                        'Desativado!',
                        `O projeto "${projectName}" foi desativado com sucesso.`,
                        'success'
                    );
                    fetchProjectos();
                } else {
                    throw new Error('Erro ao desativar');
                }
            } catch (error) {
                Swal.fire(
                    'Erro!',
                    `Não foi possível desativar o projeto "${projectName}".`,
                    'error'
                );
                console.error('Erro ao desativar:', error);
            }
        }
    }
});
