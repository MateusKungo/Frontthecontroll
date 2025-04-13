import API_CONFIG from "../urlbase/url.js";

document.addEventListener("DOMContentLoaded", function () {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
        console.error("⚠️ Token de autenticação não encontrado.");
        return;
    }

    console.log("✅ Token encontrado:", authToken);

    carregarClientes();
    carregarProjetos();
    carregarBancos();
});

// Função para buscar dados da API
async function buscarDados(apiUrl) {
    try {
        console.log(`🔍 Buscando dados da API: ${apiUrl}`);
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                "Content-Type": "application/json",
            },
        });

        console.log(`🔄 Resposta: ${response.status} - ${response.statusText}`);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
        const data = await response.json();
        console.log(`📊 Dados recebidos:`, data);
        return data.data ?? data;
    } catch (error) {
        console.error(`❌ Erro ao buscar dados de ${apiUrl}:`, error);
        return [];
    }
}

// Função genérica para preencher selects
function preencherSelect(selectElement, data, campoId, campoNome) {
    selectElement.innerHTML = '<option value="">Selecione</option>';
    if (!data.length) {
        console.warn(`⚠️ Nenhum dado para preencher #${selectElement.id}`);
        return;
    }
    data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[campoId];
        option.textContent = item[campoNome];
        selectElement.appendChild(option);
    });
    console.log(`✅ Select #${selectElement.id} preenchido.`);
}

// Função para carregar clientes
async function carregarClientes() {
    const apiUrl = `${API_CONFIG.BASE_URL}/cadastro-geral`;
    const selectCliente = document.getElementById("clienteId");
    const editSelectCliente = document.getElementById("edit_clienteId");

    if (!selectCliente && !editSelectCliente) {
        console.error("❌ Nenhum select encontrado (clienteId ou edit_clienteId).");
        return;
    }

    const defaultOption = `<option value="" disabled selected>Selecione um cliente</option>`;
    if (selectCliente) selectCliente.innerHTML = defaultOption;
    if (editSelectCliente) editSelectCliente.innerHTML = defaultOption;

    const carregarListaClientes = async () => {
        const clientes = await buscarDados(apiUrl);
        if (!clientes.length) {
            const noDataOption = `<option value="" disabled selected>Nenhum cliente disponível</option>`;
            if (selectCliente) selectCliente.innerHTML = noDataOption;
            if (editSelectCliente) editSelectCliente.innerHTML = noDataOption;
            return;
        }
        const clientesFiltrados = clientes.filter(
            (cliente) => cliente.tipo_usuario === "cliente" && (cliente.state === 0 || cliente.state === "0")
        );

        if (!clientesFiltrados.length) {
            const noValidOption = `<option value="" disabled selected>Nenhum cliente disponível</option>`;
            if (selectCliente) selectCliente.innerHTML = noValidOption;
            if (editSelectCliente) editSelectCliente.innerHTML = noValidOption;
            return;
        }

        if (selectCliente) preencherSelect(selectCliente, clientesFiltrados, "id", "nome");
        if (editSelectCliente) preencherSelect(editSelectCliente, clientesFiltrados, "id", "nome");
    };

    if (selectCliente) selectCliente.addEventListener("focus", carregarListaClientes, { once: true });
    if (editSelectCliente) editSelectCliente.addEventListener("focus", carregarListaClientes, { once: true });
}

// Função para carregar projetos
async function carregarProjetos() {
    const apiUrl = `${API_CONFIG.BASE_URL}/cadastro-de-projectos`;
    const selectProjeto = document.getElementById("projectoId");
    const editSelectProjeto = document.getElementById("edit_projectoId");

    if (!selectProjeto && !editSelectProjeto) {
        console.error("❌ Nenhum select encontrado (projectoId ou edit_projectoId).");
        return;
    }

    const defaultOption = "<option value='' hidden disabled selected>Selecione um projeto</option>";
    if (selectProjeto) selectProjeto.innerHTML = defaultOption;
    if (editSelectProjeto) editSelectProjeto.innerHTML = defaultOption;

    const handleFocus = async () => {
        const projetos = await buscarDados(apiUrl);
        const projetosFiltrados = projetos.filter(
            (projeto) => projeto.state === "0" || projeto.state === 0
        );

        if (!projetosFiltrados.length) {
            const noProjectsOption = "<option disabled selected>Nenhum projeto disponível</option>";
            if (selectProjeto) selectProjeto.innerHTML = noProjectsOption;
            if (editSelectProjeto) editSelectProjeto.innerHTML = noProjectsOption;
            return;
        }

        if (selectProjeto) preencherSelect(selectProjeto, projetosFiltrados, "id", "nomeProjecto");
        if (editSelectProjeto) preencherSelect(editSelectProjeto, projetosFiltrados, "id", "nomeProjecto");
    };

    if (selectProjeto) selectProjeto.addEventListener("focus", handleFocus, { once: true });
    if (editSelectProjeto) editSelectProjeto.addEventListener("focus", handleFocus, { once: true });
}

// Função para carregar bancos
async function carregarBancos() {
    const apiUrl = `${API_CONFIG.BASE_URL}/cadastro-de-bancos`;
    const selectBanco = document.getElementById("recebidoPeloBancoId");
    const editSelectBanco = document.getElementById("edit_recebidoPeloBancoId");

    if (!selectBanco && !editSelectBanco) {
        console.error("❌ Nenhum select encontrado (recebidoPeloBancoId ou edit_recebidoPeloBancoId).");
        return;
    }

    const defaultOption = "<option value='' hidden disabled selected>Selecione um banco</option>";
    if (selectBanco) selectBanco.innerHTML = defaultOption;
    if (editSelectBanco) editSelectBanco.innerHTML = defaultOption;

    const carregarListaBancos = async () => {
        const bancos = await buscarDados(apiUrl);
        const bancosFiltrados = bancos.filter(
            (banco) => banco.state === "0" || banco.state === 0
        );

        if (!bancosFiltrados.length) {
            const noValidOption = "<option disabled selected>Nenhum banco válido</option>";
            if (selectBanco) selectBanco.innerHTML = noValidOption;
            if (editSelectBanco) editSelectBanco.innerHTML = noValidOption;
            return;
        }

        if (selectBanco) preencherSelect(selectBanco, bancosFiltrados, "id", "nomeBanco");
        if (editSelectBanco) preencherSelect(editSelectBanco, bancosFiltrados, "id", "nomeBanco");
    };

    if (selectBanco) selectBanco.addEventListener("focus", carregarListaBancos, { once: true });
    if (editSelectBanco) editSelectBanco.addEventListener("focus", carregarListaBancos, { once: true });
}
