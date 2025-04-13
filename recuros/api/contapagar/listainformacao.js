import API_CONFIG from '../urlbase/url.js';
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
    //carregarContas(); // Adicionado para listar as contas
    carregarSubcontas();
});

// Função para buscar dados da API
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

    // Seleciona os dois selects (pode ser que apenas um exista)
    const selectCliente = document.getElementById("fornecedorId");
    const editSelectCliente = document.getElementById("edit_fornecedorId");

    // Se nenhum select existir, mostra erro
    if (!selectCliente && !editSelectCliente) {
        console.error("❌ Nenhum select encontrado (IDs: clienteId ou edit_clienteId)");
        return;
    }

    // Define a opção padrão para os selects
    const defaultOption = `<option value="" disabled selected>Selecione um cliente</option>`;

    if (selectCliente) selectCliente.innerHTML = defaultOption;
    if (editSelectCliente) editSelectCliente.innerHTML = defaultOption;

    // Função que carrega os clientes (executada apenas uma vez)
    const carregarListaClientes = async () => {
        console.log("🔄 Buscando clientes na API...");

        try {
            const clientes = await buscarDados(apiUrl);

            if (!clientes?.length) {
                console.warn("⚠️ Nenhum cliente retornado pela API.");
                const noDataOption = `<option value="" disabled selected>Nenhum cliente disponível</option>`;
                if (selectCliente) selectCliente.innerHTML = noDataOption;
                if (editSelectCliente) editSelectCliente.innerHTML = noDataOption;
                return;
            }

            // Filtra apenas clientes ativos (state = 0 ou "0") e tipo_usuario = "cliente"
            const clientesFiltrados = clientes.filter(
                cliente => cliente.tipo_usuario === "fornecedor" && (cliente.state === 0 || cliente.state === "0")
            );

            if (clientesFiltrados.length === 0) {
                console.warn("⚠️ Nenhum cliente válido após filtro.");
                const noValidOption = `<option value="" disabled selected>Nenhum cliente disponível</option>`;
                if (selectCliente) selectCliente.innerHTML = noValidOption;
                if (editSelectCliente) editSelectCliente.innerHTML = noValidOption;
                return;
            }

            console.log("✅ Clientes filtrados:", clientesFiltrados);

            // Preenche os selects (se existirem)
            if (selectCliente) preencherSelect(selectCliente, clientesFiltrados, "id", "nome");
            if (editSelectCliente) preencherSelect(editSelectCliente, clientesFiltrados, "id", "nome");

        } catch (error) {
            console.error("❌ Erro ao carregar clientes:", error);
            const errorOption = "<option disabled selected>Erro ao carregar</option>";
            if (selectCliente) selectCliente.innerHTML = errorOption;
            if (editSelectCliente) editSelectCliente.innerHTML = errorOption;
        }
    };

    // Adiciona o evento de focus (carrega apenas uma vez)
    if (selectCliente) {
        selectCliente.addEventListener("focus", carregarListaClientes, { once: true });
    }
    if (editSelectCliente) {
        editSelectCliente.addEventListener("focus", carregarListaClientes, { once: true });
    }
}


// Chama a função quando a página carregar ou quando necessário
document.addEventListener("DOMContentLoaded", carregarClientes);



async function carregarProjetos() {
    const apiUrl = `${API_CONFIG.BASE_URL}/cadastro-de-projectos`;

    // Seleciona ambos os selects
    const selectProjeto = document.getElementById("projectoId");
    const editSelectProjeto = document.getElementById("edit_projectoId");

    // Verifica se pelo menos um dos selects existe
    if (!selectProjeto && !editSelectProjeto) {
        console.error("❌ Nenhum elemento select encontrado (projectoId ou edit_projectoId).");
        return;
    }

    // Define o conteúdo inicial dos selects (se existirem)
    const defaultOption = "<option value='' hidden disabled selected>Selecione um projeto</option>";
    if (selectProjeto) selectProjeto.innerHTML = defaultOption;
    if (editSelectProjeto) editSelectProjeto.innerHTML = defaultOption;

    // Função para carregar os projetos quando um dos selects receber foco
    const handleFocus = async () => {
        console.log("🔄 Carregando projetos...");

        try {
            const projetos = await buscarDados(apiUrl);

            if (projetos?.length > 0) {
                // Filtra apenas projetos ativos (state === 0 ou "0")
                const projetosFiltrados = projetos.filter(projeto =>
                    projeto.state === "0" || projeto.state === 0
                );

                console.log("✅ Projetos após o filtro:", projetosFiltrados);

                if (projetosFiltrados.length > 0) {
                    // Preenche os selects que existem
                    if (selectProjeto) preencherSelect(selectProjeto, projetosFiltrados, "id", "nomeProjecto");
                    if (editSelectProjeto) preencherSelect(editSelectProjeto, projetosFiltrados, "id", "nomeProjecto");
                } else {
                    console.warn("⚠️ Nenhum projeto válido encontrado.");
                    const noProjectsOption = "<option disabled selected>Nenhum projeto disponível</option>";
                    if (selectProjeto) selectProjeto.innerHTML = noProjectsOption;
                    if (editSelectProjeto) editSelectProjeto.innerHTML = noProjectsOption;
                }
            } else {
                console.warn("⚠️ Nenhum projeto encontrado.");
                const noProjectsOption = "<option disabled selected>Nenhum projeto disponível</option>";
                if (selectProjeto) selectProjeto.innerHTML = noProjectsOption;
                if (editSelectProjeto) editSelectProjeto.innerHTML = noProjectsOption;
            }
        } catch (error) {
            console.error("❌ Erro ao carregar projetos:", error);
            const errorOption = "<option disabled selected>Erro ao carregar</option>";
            if (selectProjeto) selectProjeto.innerHTML = errorOption;
            if (editSelectProjeto) editSelectProjeto.innerHTML = errorOption;
        }

        // Remove os event listeners após a primeira execução
        if (selectProjeto) selectProjeto.removeEventListener("focus", handleFocus);
        if (editSelectProjeto) editSelectProjeto.removeEventListener("focus", handleFocus);
    };

    // Adiciona o evento de focus a ambos os selects (se existirem)
    if (selectProjeto) selectProjeto.addEventListener("focus", handleFocus, { once: true });
    if (editSelectProjeto) editSelectProjeto.addEventListener("focus", handleFocus, { once: true });
}

// Função auxiliar para preencher selects (reutilizável)


// Chama a função quando a página carregar
document.addEventListener("DOMContentLoaded", carregarProjetos);
// Função para carregar bancos
async function carregarBancos() {
    const apiUrl = `${API_CONFIG.BASE_URL}/cadastro-de-bancos`;

    // Seleciona ambos os selects
    const selectBanco = document.getElementById("pagoPeloBancoId");
    const editSelectBanco = document.getElementById("edit_pagoPeloBancoId");

    // Verifica se pelo menos um dos selects existe
    if (!selectBanco && !editSelectBanco) {
        console.error("❌ Nenhum elemento select encontrado (recebidoPeloBancoId ou edit_recebidoPeloBancoId)");
        return;
    }

    // Define o conteúdo inicial dos selects
    const defaultOption = "<option value='' hidden disabled selected>Selecione um banco</option>";
    if (selectBanco) selectBanco.innerHTML = defaultOption;
    if (editSelectBanco) editSelectBanco.innerHTML = defaultOption;

    // Função para carregar os bancos (executada apenas uma vez)
    const carregarListaBancos = async () => {
        console.log("🔄 Buscando bancos na API...");

        try {
            const bancos = await buscarDados(apiUrl);

            if (!bancos?.length) {
                console.warn("⚠️ Nenhum banco retornado pela API.");
                const noDataOption = "<option disabled selected>Nenhum banco disponível</option>";
                if (selectBanco) selectBanco.innerHTML = noDataOption;
                if (editSelectBanco) editSelectBanco.innerHTML = noDataOption;
                return;
            }

            // Filtra apenas bancos ativos (state = 0 ou "0")
            const bancosFiltrados = bancos.filter(
                banco => banco.state === "0" || banco.state === 0
            );

            if (bancosFiltrados.length === 0) {
                console.warn("⚠️ Nenhum banco válido após filtro.");
                const noValidOption = "<option disabled selected>Nenhum banco válido</option>";
                if (selectBanco) selectBanco.innerHTML = noValidOption;
                if (editSelectBanco) editSelectBanco.innerHTML = noValidOption;
                return;
            }

            console.log("✅ Bancos filtrados:", bancosFiltrados);

            // Preenche os selects (se existirem)
            if (selectBanco) preencherSelect(selectBanco, bancosFiltrados, "id", "nomeBanco");
            if (editSelectBanco) preencherSelect(editSelectBanco, bancosFiltrados, "id", "nomeBanco");

        } catch (error) {
            console.error("❌ Erro ao carregar bancos:", error);
            const errorOption = "<option disabled selected>Erro ao carregar</option>";
            if (selectBanco) selectBanco.innerHTML = errorOption;
            if (editSelectBanco) editSelectBanco.innerHTML = errorOption;
        }
    };

    // Adiciona o evento de focus (carrega apenas uma vez)
    if (selectBanco) {
        selectBanco.addEventListener("focus", carregarListaBancos, { once: true });
    }
    if (editSelectBanco) {
        editSelectBanco.addEventListener("focus", carregarListaBancos, { once: true });
    }
}

// Certifique-se que a função preencherSelect existe (reutilizada das outras funções)


// Chama a função quando a página carregar
document.addEventListener("DOMContentLoaded", carregarBancos);




