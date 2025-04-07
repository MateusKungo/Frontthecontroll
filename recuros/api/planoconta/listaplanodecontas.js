
import API_CONFIG from "../urlbase/url.js";
//alert("Carregando lista de contas..."); // Mensagem para indicar que o script foi carregado
async function fetchContasFromAPI() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Token de autenticação não encontrado.");

        const response = await fetch(`${API_CONFIG.BASE_URL}/conta`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        console.log(response)

        if (!response.ok) {
            const errorDetail = await response.json().catch(() => null);

            throw new Error(
                `Erro ao buscar contas. Status: ${response.status}. Detalhes: ${
                    errorDetail ? JSON.stringify(errorDetail) : "Sem detalhes."
                }`
            );
        }

        let contas = await response.json();
        contas = contas.data || contas;

        // Filtrar apenas contas do tipo "Entradas" e com status diferente de "Desativa"
        const contasFiltradas = contas.filter(conta => conta.tipo === "Entradas" && conta.status !== "Desativa");

        console.log("✅ Contas filtradas:", contasFiltradas);

        // Carrega para ambos os selects
        carregarContasEsubcontas(contasFiltradas, "pcontas");
        carregarContasEsubcontas(contasFiltradas, "edit_pcontas");

    } catch (error) {
        console.error("❌ Erro ao buscar contas:", error.message);
        // Aplica mensagem de erro em ambos os selects
        const errorOption = "<option disabled selected>Erro ao carregar contas</option>";
        document.getElementById("pcontas").innerHTML = errorOption;
        document.getElementById("edit_pcontas").innerHTML = errorOption;
    }
}

// Função para preencher um select específico com contas e subcontas
function carregarContasEsubcontas(contas, selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.warn(`Elemento #${selectId} não encontrado`);
        return;
    }

    select.innerHTML = `<option value="" disabled selected>Selecione uma Subconta</option>`;

    contas.forEach(conta => {
        // Filtra subcontas válidas
        const subcontasValidas = (conta.subcontas || []).filter(
            subconta => subconta.status !== "Desativa"
        );

        // Só cria optgroup se houver subcontas válidas
        if (subcontasValidas.length > 0) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = conta.nome;

            subcontasValidas.forEach(subconta => {
                const option = document.createElement("option");
                option.value = subconta.id_subconta;
                option.textContent = subconta.nome;
                optgroup.appendChild(option);
            });

            select.appendChild(optgroup);
        }
    });

    // Se nenhuma opção foi adicionada além da inicial
    if (select.options.length === 1) {
        select.innerHTML = `<option disabled selected>Nenhuma subconta disponível</option>`;
    }
}

// Evento de focus para carregamento sob demanda
function setupContasFocusEvents() {
    const select1 = document.getElementById("pcontas");
    const select2 = document.getElementById("edit_pcontas");

    const handleFocus = () => {
        fetchContasFromAPI();
        // Remove os listeners após o primeiro carregamento
        if (select1) select1.removeEventListener("focus", handleFocus);
        if (select2) select2.removeEventListener("focus", handleFocus);
    };

    if (select1) select1.addEventListener("focus", handleFocus, { once: true });
    if (select2) select2.addEventListener("focus", handleFocus, { once: true });
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    // Configura os eventos de focus
    setupContasFocusEvents();

    // Opcional: carrega imediatamente se necessário
    // fetchContasFromAPI();
});
