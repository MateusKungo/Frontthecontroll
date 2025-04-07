// Função para buscar as subcontas e exibir na tabela
async function fetchSubContas() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Token de autenticação não encontrado.");

        // Buscar contas primeiro para mapear id_conta -> nome
        const contasMap = await fetchContasMap(token);

        // Buscar subcontas da API
        const response = await fetch("https://thecontroll.com/public/api/subconta", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorDetail = await response.json().catch(() => null);
            throw new Error(
                `Erro ao buscar subcontas. Status: ${response.status}. Detalhes: ${
                    errorDetail ? JSON.stringify(errorDetail) : "Sem detalhes."
                }`
            );
        }

        const result = await response.json();
        const subcontas = result.data || result;

        if (!Array.isArray(subcontas)) throw new Error("Os dados retornados pela API não são uma lista.");

        console.log("Subcontas obtidas:", subcontas);
        populateSubContaTable(subcontas, contasMap);
    } catch (error) {
        console.error("Erro ao buscar ou processar subcontas:", error.message);
    }
}

// Função para buscar as contas e criar um mapa { id_conta: nome }
async function fetchContasMap(token) {
    try {
        const response = await fetch("https://thecontroll.com/public/api/conta", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) return {};

        const result = await response.json();
        const contas = result.data || result;

        if (!Array.isArray(contas)) return {};

        // Criar um mapa para fácil acesso ao nome da conta pelo id_conta
        const contasMap = {};
        contas.forEach(conta => {
            contasMap[conta.id_conta] = conta.nome;
        });

        return contasMap;
    } catch (error) {
        console.error("Erro ao buscar contas:", error.message);
        return {};
    }
}

// Função para preencher a tabela com as subcontas
function populateSubContaTable(subcontas, contasMap) {
    const tableBody = document.querySelector(".dataTableSubContas tbody");
    tableBody.innerHTML = ""; // Limpa a tabela antes de preencher

    subcontas.forEach((subconta) => {
        // Substituir id_conta pelo nome da conta
        const nomeConta = contasMap[subconta.id_conta] || "Conta desconhecida";

        // Define a cor e o ícone com base no status
        const statusIcon = subconta.status === "Ativa"
            ? `<i class="fas fa-check-circle" style="color: green; font-size: 20px;"></i>`
            : `<i class="fas fa-times-circle" style="color: red; font-size: 20px;"></i>`;

        const row = `
            <tr>
                 <td>${subconta.id_subconta || "Não informado"}</td>
                <td>${nomeConta}</td> <!-- Substitui id_conta pelo nome -->
                <td>${subconta.nome || "Não informado"}</td>
                <td>${subconta.descricao || "Sem descrição"}</td>
                <td>${statusIcon} ${subconta.status || "Sem status"}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-subconta" data-id="${subconta.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-delete-subconta" data-id="${subconta.id}">
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
document.addEventListener("DOMContentLoaded", fetchSubContas);
