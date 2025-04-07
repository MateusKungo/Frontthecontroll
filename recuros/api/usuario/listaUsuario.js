const apiUrl = "https://thecontroll.com/public/api/user"; // URL base da API
// URL base da API
import API_CONFIG from '../urlbase/url.js';
async function fetchUsers() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Token de autenticação não encontrado.");

        const response = await fetch(`${API_CONFIG.BASE_URL}/user`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error(`Erro ao buscar dados da API. Status: ${response.status}`);

        const result = await response.json();
        const users = result.data || result;

        if (!Array.isArray(users)) throw new Error("Os dados retornados pela API não são uma lista.");

        console.log("Usuários obtidos:", users);
        populateTable(users);
    } catch (error) {
        console.error("Erro ao buscar ou processar usuários:", error.message);


    }
}




// Função para preencher a tabela com os dados dos usuários
function populateTable(users) {
    const tableBody = document.querySelector('#dataTable3 tbody');
    tableBody.innerHTML = "";

    users.forEach(user => {
        const row = `
            <tr>

                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td>${user.telefone || 'Não informado'}</td>
                <td>${user.userType}</td>
                <td>
                    <ul class="d-flex justify-content-center">
                        <li class="mr-3">
                            <a href="#" class="btn btn-sm btn-primary btn-edit-user"
                                data-id="${user.id}"
                                data-nome="${user.nome}"
                                data-email="${user.email}"
                                data-telefone="${user.telefone || ''}"
                                data-categoria="${user.userType}">
                                <i class="fas fa-edit"></i>
                            </a>
                        </li>

                    </ul>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    addEditButtonsEvent();
    addDeleteButtonsEvent();
}

// Função para adicionar eventos aos botões de edição
function addEditButtonsEvent() {
    const editButtons = document.querySelectorAll('.btn-edit-user');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            const userNome = button.getAttribute('data-nome');
            const userEmail = button.getAttribute('data-email');
            const userTelefone = button.getAttribute('data-telefone');
            const userCategoria = button.getAttribute('data-categoria');

            // Preenche os campos do formulário de edição
            document.getElementById('editUserId').value = userId;
            document.getElementById('editNome').value = userNome;
            document.getElementById('editEmail').value = userEmail;
            document.getElementById('editTelefone').value = userTelefone;
            document.getElementById('editCategoria').value = userCategoria;

            // Abre o modal
            const editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
            editModal.show();
        });
    });
}

// Função para adicionar eventos aos botões de exclusão


// Evento de submissão do formulário de edição usando FormData
document.getElementById('editUserForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    Swal.fire({
        title: 'Aguarde...',
        text: 'Atualizando usuário...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const formData = new FormData(document.getElementById('editUserForm'));
    const userId = formData.get('userId');
    const authToken = localStorage.getItem("authToken");

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/user/${userId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            body: formData,
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Sucesso',
                text: 'Usuário atualizado com sucesso!'
            });


            fetchUsers();

        } else {
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: `Erro ao atualizar o usuário: ${errorData.message || "Erro desconhecido"}`
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

fetchUsers();


