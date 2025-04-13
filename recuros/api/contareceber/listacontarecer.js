import API_CONFIG from "../urlbase/url.js";

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

document.addEventListener("DOMContentLoaded", function () {
    async function fetchSubcontas() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/subconta`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar subcontas: ${response.status}`);
            }

            const result = await response.json();
            const subcontas = Array.isArray(result.data) ? result.data : [];
            return Object.fromEntries(subcontas.map((s) => [s.id_subconta, s.nome]));
        } catch (error) {
            console.error("Erro ao buscar subcontas:", error.message);
            return {};
        }
    }

    async function fetchContasAReceber() {
        try {
            const authToken = localStorage.getItem("authToken");
            if (!authToken) throw new Error("Token de autenticação não encontrado.");

            const [contasResponse, subcontasMap] = await Promise.all([
                fetch(`${API_CONFIG.BASE_URL}/contaAReceber`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }),
                fetchSubcontas(),
            ]);

            if (!contasResponse.ok) {
                throw new Error(`Erro ao buscar contas. Status: ${contasResponse.status}`);
            }

            const result = await contasResponse.json();
            let contas = Array.isArray(result.data) ? result.data : [];
            contas = contas.filter((conta) => conta.state !== 1);

            contas.forEach((conta) => {
                conta.pcontas = subcontasMap[conta.pcontas] || "N/A";
            });

            populateTable(contas);
        } catch (error) {
            console.error("Erro ao buscar contas:", error.message);
        }
    }

    function verificarStatusVencimento(dataVencimento) {
        if (!dataVencimento) return { status: "Sem data", texto: "Sem data" };

        const partesData = dataVencimento.split('-');
        const dataVenc = new Date(partesData[0], partesData[1] - 1, partesData[2]);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const diffTime = dataVenc - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { status: "Atrasado", texto: "Atrasado" };
        } else if (diffDays === 0) {
            return { status: "Vence hoje", texto: "Vence hoje" };
        } else {
            return { status: "Aberto", texto: "Aberto" };
        }
    }

    function calcularDiasParaVencimento(dataVencimento) {
        if (!dataVencimento) return "N/A";

        const partesData = dataVencimento.split("-");
        const dataVenc = new Date(partesData[0], partesData[1] - 1, partesData[2]);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const diffTime = dataVenc - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `Atrasado há ${Math.abs(diffDays)} dias`;
        } else if (diffDays > 30) {
            const meses = Math.floor(diffDays / 30);
            return `Faltam ${meses} ${meses > 1 ? "meses" : "mês"} para vencer o pagamento`;
        } else {
            return `Faltam ${diffDays} dias para vencer o pagamento`;
        }
    }

    function populateTable(contas) {
        const tableBody = document.querySelector("#dataTable3 tbody");
        if (!tableBody) return console.error("Elemento da tabela não encontrado!");

        const contasAgrupadas = agruparContas(contas, "documento");
        let tableRowsHtml = "";
        let index2=0
        for (const documento in contasAgrupadas) {
            const grupoContas = contasAgrupadas[documento];
            const totalParcelas = grupoContas.length;

            grupoContas.forEach((conta, index) => {
                const numeroParcela = index + 1;
                const statusVencimento = verificarStatusVencimento(conta.dataVencimento);
                const diasParaVencimento = calcularDiasParaVencimento(conta.dataVencimento);
                const statusFinal = conta.statusDePagemanto === "Concluido" ? "Concluido" : statusVencimento.status;

                const valorFormatado = new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                }).format(parseFloat(conta.valor || 0));
                const dataVencimento = formatarData(conta.dataVencimento);
                const clienteNome = conta.cliente?.nome || "N/A";
                const telefones = [conta.cliente?.telefone1, conta.cliente?.telefone2].filter((tel) => tel);

                let whatsappMessage = "";
                if (statusFinal === "Atrasado") {
                    const diffDays = Math.abs(Math.ceil((new Date(conta.dataVencimento) - new Date()) / (1000 * 60 * 60 * 24)));
                    whatsappMessage = `Olá%20${clienteNome},%20seu%20boleto%20está%20atrasado%20há%20${diffDays}%20dia(s).%20Pedimos%20que%20regularize%20o%20pagamento%20o%20quanto%20antes.`;
                } else if (statusFinal === "Vence hoje") {
                    whatsappMessage = `Olá%20${clienteNome},%20lembramos%20que%20seu%20boleto%20vence%20hoje.%20Agradecemos%20o%20pagamento.`;
                } else if (statusFinal === "Aberto") {
                    const diffDays = Math.ceil((new Date(conta.dataVencimento) - new Date()) / (1000 * 60 * 60 * 24));
                    whatsappMessage = `Olá%20${clienteNome},%20lembramos%20que%20seu%20boleto%20vence%20em%20${diffDays > 30 ? Math.floor(diffDays / 30) + " mês(es)" : diffDays + " dia(s)"}.`;
                } else {
                    whatsappMessage = `Olá%20${clienteNome},%20mensagem%20sobre%20seu%20boleto.`;
                }

                const whatsappButtons = telefones.length
                    ? telefones.map((tel) => `
                        <a href="https://wa.me/${tel}?text=${whatsappMessage}" class="btn btn-sm btn-success mx-1" target="_blank">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    `).join("")
                    : `<span class="text-muted">Sem contato</span>`;

                tableRowsHtml += `
                    <tr>
                        <td style="text-transform: capitalize;">#00${++index2 || "sem Informação"}</td>
                        <td style="text-transform: capitalize;">${formatarData(conta.dataDocumento)}</td>
                        <td style="text-transform: capitalize;">${conta.documento || "sem Informação"}</td>
                        <td style="text-transform: capitalize;">${conta.ndocumento || "sem Informação"}</td>
                        <td style="text-transform: capitalize;">${conta.pcontas || "sem Informação"}</td>
                        <td style="text-transform: capitalize;">${conta.projecto?.nomeProjecto || "sem Informação"}</td>
                        <td style="text-transform: capitalize;">${conta.tipoPagamento || "sem Informação"}</td>
                        <td style="text-transform: capitalize;">${clienteNome}</td>
                        <td style="text-transform: capitalize;">${conta.descricao || "sem Informação"}</td>
                        <td style="text-transform: capitalize;">${conta.banco?.nomeBanco || "sem Informação"}</td>
                        <td style="font-weight: bold;">${valorFormatado}</td>
                        <td style="text-transform: capitalize;">${conta.frequenciaRecorrencia || "sem Informação"}</td>
                        <td style="">${numeroParcela} de ${totalParcelas}</td>
                        <td style="text-transform: capitalize;">${diasParaVencimento}</td>
                        <td style="text-transform: capitalize;">${dataVencimento}</td>
                        <td style="text-transform: capitalize;">${formatarData(conta.dataRecebimento)}</td>
                        <td>
                            <button style="
                                text-transform: capitalize;
                                background-color: ${
                                    statusFinal === "Aberto" ? "#d4edff" :
                                    statusFinal === "Atrasado" || statusFinal === "Vence hoje" ? "#ffd4d4" :
                                    statusFinal === "Concluido" ? "#d4ffdf" : "#f0f0f0"
                                };
                                color: ${
                                    statusFinal === "Aberto" ? "#1a5a8a" :
                                    statusFinal === "Atrasado" || statusFinal === "Vence hoje" ? "#8a1a1a" :
                                    statusFinal === "Concluido" ? "#1a8a2e" : "#333"
                                };
                                border: none; padding: 6px 12px; border-radius: 4px; cursor: default; font-weight: 500; box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);">
                                ${statusFinal}
                            </button>
                        </td>
                        <td>
                            <div class="d-flex flex-row align-items-center">
                                ${whatsappButtons}
                                <a href="#" class="btn btn-sm btn-secondary mr-2 btn-edit-conta"
                                    data-id="${conta.idContaAReceber || ""}"
                                    data-dataDocumento="${conta.dataDocumento}"
                                    data-documento="${conta.documento}"
                                    data-ndocumento="${conta.ndocumento}"
                                    data-pcontas="${conta.pcontas}"
                                    data-projectoId="${conta.projectoId}"
                                    data-clienteId="${conta.clienteId}"
                                    data-recebidoPeloBancoId="${conta.recebidoPeloBancoId}"
                                    data-tipoPagamento="${conta.tipoPagamento}"
                                    data-descricao="${conta.descricao}"
                                    data-valor="${conta.valor}"
                                    data-frequenciaRecorrencia="${conta.frequenciaRecorrencia}"
                                    data-parcelas="${conta.parcelas}"
                                    data-dataVencimento="${conta.dataVencimento}"
                                    data-dataRecebimento="${conta.dataRecebimento}"
                                    data-statusDePagamento="${conta.statusDePagemanto}">
                                    <i class="fas fa-edit"></i>
                                </a>
                                <button class="btn btn-sm btn-danger btn-delete-user" data-id="${conta.idContaAReceber}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        console.log(contas)
        tableBody.innerHTML = tableRowsHtml;
        addEditButtonsEvent();
        addDeleteButtonsEvent();
    }

    function agruparContas(contas, campo) {
        return contas.reduce((acumulador, conta) => {
            const chave = conta[campo];
            if (!acumulador[chave]) acumulador[chave] = [];
            acumulador[chave].push(conta);
            return acumulador;
        }, {});
    }

    function formatarData(data) {
        if (!data) return "N/A";
        const partes = data.split("-");
        return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : data;
    }

    function addEditButtonsEvent() {
        document.querySelectorAll(".btn-edit-conta").forEach((button) => {
            button.addEventListener("click", async (event) => {
                event.preventDefault();
                
                // Preencher os campos básicos
                document.getElementById("edit_contaReceberId").value = button.getAttribute("data-id");
                document.getElementById("edit_dataDocumento").value = button.getAttribute("data-dataDocumento");
                document.getElementById("edit_documento").value = button.getAttribute("data-documento");
                document.getElementById("edit_ndocumento").value = button.getAttribute("data-ndocumento");
                document.getElementById("edit_tipoPagamento").value = button.getAttribute("data-tipoPagamento");
                document.getElementById("edit_frequenciaRecorrencia").value = button.getAttribute("data-frequenciaRecorrencia");
                document.getElementById("edit_valor").value = button.getAttribute("data-valor");
                document.getElementById("edit_parcelas").value = button.getAttribute("data-parcelas");
                document.getElementById("edit_descricao").value = button.getAttribute("data-descricao");
                document.getElementById("edit_dataVencimento").value = button.getAttribute("data-dataVencimento");
                document.getElementById("edit_dataRecebimento").value = button.getAttribute("data-dataRecebimento");

                // Carregar e preencher os selects
                try {
                    // Carregar plano de contas
                    const subcontas = await buscarDados(`${API_CONFIG.BASE_URL}/subconta`);
                    const subcontasFiltradas = subcontas.filter(subconta => subconta.state === "0" || subconta.state === 0);
                    preencherSelect(document.getElementById("edit_pcontas"), subcontasFiltradas, "id_subconta", "nome");
                    document.getElementById("edit_pcontas").value = button.getAttribute("data-pcontas");

                    // Carregar clientes
                    const clientes = await buscarDados(`${API_CONFIG.BASE_URL}/cadastro-geral`);
                    const clientesFiltrados = clientes.filter(cliente => cliente.tipo_usuario === "cliente" && (cliente.state === 0 || cliente.state === "0"));
                    preencherSelect(document.getElementById("edit_clienteId"), clientesFiltrados, "id", "nome");
                    document.getElementById("edit_clienteId").value = button.getAttribute("data-clienteId");

                    // Carregar projetos
                    const projetos = await buscarDados(`${API_CONFIG.BASE_URL}/cadastro-de-projectos`);
                    const projetosFiltrados = projetos.filter(projeto => projeto.state === "0" || projeto.state === 0);
                    preencherSelect(document.getElementById("edit_projectoId"), projetosFiltrados, "id", "nomeProjecto");
                    document.getElementById("edit_projectoId").value = button.getAttribute("data-projectoId");

                    // Carregar bancos
                    const bancos = await buscarDados(`${API_CONFIG.BASE_URL}/cadastro-de-bancos`);
                    const bancosFiltrados = bancos.filter(banco => banco.state === "0" || banco.state === 0);
                    preencherSelect(document.getElementById("edit_recebidoPeloBancoId"), bancosFiltrados, "id", "nomeBanco");
                    document.getElementById("edit_recebidoPeloBancoId").value = button.getAttribute("data-recebidoPeloBancoId");

                    // Abrir o modal após carregar todos os dados
                    const editModal = new bootstrap.Modal(document.getElementById("modalEditarContaReceber"));
                    editModal.show();
                } catch (error) {
                    console.error("Erro ao carregar dados para edição:", error);
                    Swal.fire({
                        icon: "error",
                        title: "Erro",
                        text: "Não foi possível carregar os dados para edição. Por favor, tente novamente.",
                    });
                }
            });
        });
    }

    function addDeleteButtonsEvent() {
        document.querySelectorAll(".btn-delete-user").forEach((button) => {
            button.addEventListener("click", async (event) => {
                event.preventDefault();
                const idContaAReceber = button.getAttribute("data-id");

                const confirmacao = await Swal.fire({
                    title: "Tem certeza?",
                    text: "Você está prestes a eliminar esta conta. Esta ação não pode ser desfeita!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Sim, eliminar!",
                    cancelButtonText: "Cancelar",
                });

                if (confirmacao.isConfirmed) {
                    try {
                        await deleteUser(idContaAReceber);
                        await fetchContasAReceber();
                    } catch (error) {
                        console.error("Erro ao eliminar conta:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Erro",
                            text: "Não foi possível eliminar a conta. Por favor, tente novamente.",
                        });
                    }
                }
            });
        });
    }

    async function deleteUser(idContaAReceber) {
        try {
            const authToken = localStorage.getItem("authToken");
            if (!authToken) throw new Error("Token de autenticação não encontrado.");

            const response = await fetch(`${API_CONFIG.BASE_URL}/contaAReceber/${idContaAReceber}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 204) {
                Swal.fire({
                    icon: "success",
                    title: "Deletado!",
                    text: "Lançamento deletado com sucesso.",
                });
                return;
            }

            const responseData = response.status !== 204 ? await response.json() : null;
            if (!response.ok) {
                throw new Error(responseData?.message || `Erro ao deletar conta. Status: ${response.status}`);
            }

            Swal.fire({
                icon: "success",
                title: "Deletado!",
                text: "Lançamento deletado com sucesso.",
            });
            await fetchContasAReceber();
        } catch (error) {
            console.error("Erro ao deletar usuário:", error);
            Swal.fire({
                icon: "error",
                title: "Erro",
                text: error.message || "Não foi possível deletar o Lançamento. Por favor, tente novamente.",
            });
            throw error;
        }
    }

    document.getElementById("formEditarContaReceber").addEventListener("submit", async (event) => {
        event.preventDefault();

        Swal.fire({
            title: "Aguarde...",
            text: "Atualizando conta a receber...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        const idContaAReceber = document.getElementById("edit_contaReceberId").value ||
            document.getElementById("edit_contaReceberId").getAttribute("data-id");

        const formData = new FormData(document.getElementById("formEditarContaReceber"));
        const data = {
            dataDocumento: document.getElementById("edit_dataDocumento").value,
            documento: document.getElementById("edit_documento").value,
            ndocumento: document.getElementById("edit_ndocumento").value,
            pcontas: document.getElementById("edit_pcontas").value,
            tipoPagamento: document.getElementById("edit_tipoPagamento").value,
            frequenciaRecorrencia: document.getElementById("edit_frequenciaRecorrencia").value,
            valor: document.getElementById("edit_valor").value,
            parcelas: document.getElementById("edit_parcelas").value,
            descricao: document.getElementById("edit_descricao").value,
            dataVencimento: document.getElementById("edit_dataVencimento").value,
            dataRecebimento: document.getElementById("edit_dataRecebimento").value,
        };

        const authToken = localStorage.getItem("authToken");

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/contaAReceber/${parseInt(idContaAReceber)}`, {
                method: "POST", // ou "PATCH" dependendo da API
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: formData,
            });

            if (response.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => location.reload());
                fetchContasAReceber();
            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Erro",
                    text: `Erro ao atualizar a conta a receber: ${errorData.message || "Erro desconhecido"}`,
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

    fetchContasAReceber();
});

function calcularDatasDeVencimento(dataInicial, frequencia, parcelas) {
    const datasDeVencimento = [];
    let data = new Date(dataInicial);

    for (let i = 0; i < parcelas; i++) {
        datasDeVencimento.push(new Date(data));
        if (frequencia === "mensal") data.setMonth(data.getMonth() + 1);
        else if (frequencia === "quinzenal") data.setDate(data.getDate() + 15);
        else if (frequencia === "semanal") data.setDate(data.getDate() + 7);
    }

    return datasDeVencimento;
}