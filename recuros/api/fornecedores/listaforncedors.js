import API_CONFIG from '../urlbase/url.js';
// Função para buscar usuários
async function fetchUsers() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            throw new Error("Token de autenticação não encontrado.");
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-geral`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Status da resposta:", response.status);

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Erro ao buscar dados da API. Status: ${response.status} - ${errorMessage}`);
        }

        const result = await response.json();
        console.log("Dados recebidos da API:", result);

        // Garante que os dados são um array antes de processar
        const clients = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);

        if (!clients.length) {
            console.warn("Nenhum cliente encontrado na API.");
        }

        populateTable(clients);
    } catch (error) {
        console.error("Erro ao buscar usuários:", error.message);

    }
}

// Função para preencher a tabela com os dados dos usuários
function populateTable(clients) {
    const tableBody = document.querySelector("#dataTable3 tbody");

    if (!tableBody) {
        console.error("Elemento da tabela não encontrado!");
        return;
    }

    tableBody.innerHTML = "";

    // Filter suppliers by type and state
    const clientes = clients.filter(client =>
        client.tipo_usuario?.toLowerCase() === "fornecedor" &&
        client.state !== 1
    );

    console.log("Clientes filtrados:", clientes);

    if (clientes.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center">Nenhum fornecedor encontrado.</td></tr>`;
        return;
    }

    clientes.forEach(client => {
        const row = `
            <tr>
                <td>${client.id}</td>
                <td>${client.nome}</td>
                <td>${client.endereco || "Não informado"}</td>
                <td>${client.cidade || "Não informado"}</td>
                <td>${client.uf || "Não informado"}</td>
                <td>${client.telefone1 || "Não informado"}</td>
                <td>${client.email}</td>
                <td>${client.nome_contato || "Não informado"}</td>
                <td>${client.tipo_pessoa || "Não informado"}</td>
                <td>${client.cnpj_cpf || "Não informado"}</td>

                <td>
                    <ul class="d-flex justify-content-center">
                        <li class="mr-3">
                            <a href="#" class="btn btn-sm btn-primary btn-edit-user"
                                data-id="${client.id}"
                                data-nome="${client.nome}"
                                data-endereco="${client.endereco || ''}"
                                data-cidade="${client.cidade || ''}"
                                data-uf="${client.uf || ''}"
                                data-telefone="${client.telefone1 || ''}"
                                data-email="${client.email}"
                                data-nome_contato="${client.nome_contato || ''}"
                                data-tipo_pessoa="${client.tipo_pessoa || ''}"
                                data-cnpj_cpf="${client.cnpj_cpf || ''}">
                                <i class="fas fa-edit"></i>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="btn btn-sm btn-danger btn-delete-user" data-id="${client.id}">
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
    addDeleteButtonsEvent();
}


// Adiciona eventos aos botões de deletar
function addDeleteButtonsEvent() {
    document.querySelectorAll(".btn-delete-user").forEach(button => {
        button.addEventListener("click", async event => {
            event.preventDefault();
            const userId = button.dataset.id;

            const result = await Swal.fire({
                title: "Você tem certeza?",
                text: "Essa ação não pode ser desfeita!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Sim, deletar!"
            });

            if (result.isConfirmed) {
                deleteUser(userId);
            }
        });
    });
}

// Função para deletar usuário
async function deleteUser(userId) {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            throw new Error("Token de autenticação não encontrado.");
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-geral/${userId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao deletar usuário. Status: ${response.status}`);
        }

        Swal.fire({
            icon: "success",
            title: "Deletado!",
            text: "Usuário deletado com sucesso.",
        });

        fetchUsers(); // Atualiza a lista após deletar
    } catch (error) {
        console.error("Erro ao deletar usuário:", error.message);
        Swal.fire({
            icon: "error",
            title: "Erro",
            text: "Não foi possível deletar o usuário. Por favor, tente novamente.",
        });
    }
}



function addEditButtonsEvent() {
    const editButtons = document.querySelectorAll('.btn-edit-user');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Captura os dados do cliente a partir dos atributos do botão
            document.getElementById('editNome').value = button.getAttribute('data-nome');
            document.getElementById('editEndereco').value = button.getAttribute('data-endereco') || "";
            document.getElementById('editCidade').value = button.getAttribute('data-cidade') || "";
            document.getElementById('editUf').value = button.getAttribute('data-uf') || "";
            document.getElementById('editTelefone1').value = button.getAttribute('data-telefone') || "";
            document.getElementById('editEmail').value = button.getAttribute('data-email');
            document.getElementById('editNomeContato').value = button.getAttribute('data-nome_contato') || "";
            document.getElementById('editTipoPessoa').value = button.getAttribute('data-tipo_pessoa') || "";
            document.getElementById('editCnpjCpf').value = button.getAttribute('data-cnpj_cpf') || "";
            document.getElementById('editClientForm').setAttribute('data-client-id', button.getAttribute('data-id'));

            // Abre o modal
            const editModal = new bootstrap.Modal(document.getElementById('clientesModal'));
            editModal.show();
        });
    });
}

// Evento de submissão do formulário de edição

document.getElementById('editClientForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    Swal.fire({
        title: 'Aguarde...',
        text: 'Atualizando cliente...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const clientId = document.getElementById('editClientForm').getAttribute('data-client-id');
    const formData = new FormData(document.getElementById('editClientForm'));
    const authToken = localStorage.getItem("authToken");

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-geral/${clientId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${authToken}`,
            },
            body: formData,
        });

        if (response.ok) {

            Swal.fire({
                icon: 'success',
                title: 'Sucesso',
                text: 'Fornecedor atualizado com sucesso!',
                timer: 2000, // Fecha automaticamente após 2 segundos
                showConfirmButton: false,
            }).then(() => {
                location.reload();
            });




            console.log("Dados enviados:", formData);

            // Recarregar os clientes após edição
            fetchUsers();
        } else {
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: `Erro ao atualizar o cliente: ${errorData.message || "Erro desconhecido"}`
            });
        }
    } catch (error) {
        Swal.close();
        console.error("Erro ao enviar a atualização:", error.message);
        Swal.fire({
            icon: 'error',
            title: 'Erro de conexão',
            text: 'Erro ao conectar com o servidor.'
        });
    }
});

// Chama a função ao carregar a página
fetchUsers();
