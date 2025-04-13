
import API_CONFIG from '../urlbase/url.js';
// URL da API de bancos

// Função para buscar e listar os bancos na tabela
async function fetchBancos() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken)
            throw new Error("Token de autenticação não encontrado.");

        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-de-bancos`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok)
            throw new Error(
                `Erro ao buscar dados da API. Status: ${response.status}`
            );

        const result = await response.json();
        const bancos = result.data || result; // Algumas APIs retornam {data: []}, outras diretamente []

        if (!Array.isArray(bancos))
            throw new Error("Os dados retornados pela API não são uma lista.");

        console.log("Bancos obtidos:", bancos);
        populateBancosTable(bancos);
    } catch (error) {
        console.error("Erro ao buscar ou processar bancos:", error.message);
        /*  Swal.fire({
            icon: "error",
            title: "Erro",
            text: "Não foi possível carregar os bancos. Por favor, tente novamente.",
        }); */
    }
}

// Função para preencher a tabela com os bancos
function populateBancosTable(bancos) {
    const tableBody = document.querySelector("#dataTable3 tbody");
    tableBody.innerHTML = "";

    // Filter out banks with state === 1
    const activeBanks = bancos.filter(banco => banco.state !== 1);

    const credenciaEmpresa = localStorage.getItem("credenciaEmpresa");
    let moedaPrincipal = "R$";

    if (credenciaEmpresa) {
        try {
            const dados = JSON.parse(credenciaEmpresa);
            moedaPrincipal = dados.data.empresa_moeda_principal || "R$";
        } catch (error) {
            console.error("Erro ao recuperar a moeda principal:", error);
        }
    }

    activeBanks.forEach((banco, index) => {
        const row = `
            <tr>
                <td>#00${index+1}</td>
                <td>${banco.nomeBanco}</td>
                <td>${moedaPrincipal} ${parseFloat(banco.valorConta).toFixed(2)}</td>

                <td>
                    <ul class="d-flex justify-content-center">
                        <li class="mr-3">
                            <a href="#" class="btn btn-sm btn-primary btn-edit-banco"
                                data-id="${banco.id}"
                                data-nome="${banco.nomeBanco}"
                                data-valor="${banco.valorConta}">
                                <i class="fas fa-edit"></i>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="btn btn-sm btn-danger btn-delete-banco"
                                data-id="${banco.id}">
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


function addEditButtonsEvent() {
    document.querySelectorAll(".btn-edit-banco").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();

            console.log("Botão Editar clicado!"); // Teste no Console

            const bancoId = button.getAttribute("data-id");
            const bancoNome = button.getAttribute("data-nome");
            const bancoValor = button.getAttribute("data-valor");

            document.getElementById("editBancoId").value = bancoId;
            document.getElementById("editNomeBanco").value = bancoNome;
            document.getElementById("editValorBanco").value = parseFloat(bancoValor).toFixed(2);

            const modalElement = document.getElementById("editBancoModal");
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
        });
    });
}


document
    .getElementById("formEditBanco")
    .addEventListener("submit", async (event) => {
        event.preventDefault();

        Swal.fire({
            title: "Aguarde...",
            text: "Atualizando banco...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        const bancoId = document.getElementById("editBancoId").value;
        const nomeBanco = document.getElementById("editNomeBanco").value;
        const valorBanco = document.getElementById("editValorBanco").value;
        const authToken = localStorage.getItem("authToken");

        const formData = new FormData();
        formData.append("nomeBanco", nomeBanco);
        formData.append("valorConta", valorBanco);

        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/cadastro-de-bancos/${bancoId}`,
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
                    title: "Sucesso",
                    text: "Banco atualizado com sucesso!",
                }).then(() => {
                    location.reload(); // Recarrega a página para atualizar a tabela
                });
            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Erro",
                    text: `Erro ao atualizar o banco: ${
                        errorData.message || "Erro desconhecido"
                    }`,
                });
            }
        } catch (error) {
            Swal.close();
            console.error("Erro ao enviar a atualização:", error.message);
            Swal.fire({
                icon: "error",
                title: "Erro de conexão",
                text: "Erro ao conectar com o servidor.",
            });
        }
    });

// Chamando a função para carregar os bancos ao iniciar a página

fetchBancos();

// Add the delete button event handler function
function addDeleteButtonsEvent() {
    document.querySelectorAll(".btn-delete-banco").forEach((button) => {
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            const bancoId = button.getAttribute("data-id");
            const bancName = button.closest('tr').querySelector('td:nth-child(2)').textContent;

            const result = await Swal.fire({
                title: `Deletar Banco "${bancName}"?`,
                text: "Esta ação não poderá ser revertida!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Sim, deletar!",
                cancelButtonText: "Cancelar"
            });

            if (result.isConfirmed) {
                await deleteBanco(bancoId, bancName);
            }
        });
    });
}

// Add the delete function
async function deleteBanco(bancoId, bancName) {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            throw new Error("Token de autenticação não encontrado.");
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-de-bancos/${bancoId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao deletar banco. Status: ${response.status}`);
        }

        Swal.fire({
            icon: "success",
            title: "Deletado!",
            text: `O banco "${bancName}" foi deletado com sucesso.`
        });

        fetchBancos(); // Refresh the table
    } catch (error) {
        console.error("Erro ao deletar banco:", error.message);
        Swal.fire({
            icon: "error",
            title: "Erro",
            text: "Não foi possível deletar o banco. Por favor, tente novamente."
        });
    }
}
