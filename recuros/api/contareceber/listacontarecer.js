
import API_CONFIG from "../urlbase/url.js";
document.addEventListener("DOMContentLoaded", function () {
    //const apiUrl = "https://thecontroll.com/public/api/contaAReceber";
    //const subcontaUrl = "https://thecontroll.com/public/api/subconta";

    async function fetchSubcontas() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/subconta`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                        "authToken"
                    )}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar subcontas: ${response.status}`);
            }

            const result = await response.json();
            const subcontas = Array.isArray(result.data) ? result.data : [];

            // Criar um mapa de IDs das subcontas para seus respectivos nomes
            return Object.fromEntries(
                subcontas.map((s) => [s.id_subconta, s.nome])
            );
        } catch (error) {
            console.error("Erro ao buscar subcontas:", error.message);
            return {};
        }
    }

    async function fetchContasAReceber() {
        try {
            const authToken = localStorage.getItem("authToken");
            if (!authToken)
                throw new Error("Token de autenticação não encontrado.");

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
                throw new Error(
                    `Erro ao buscar contas. Status: ${contasResponse.status}`
                );
            }

            const result = await contasResponse.json();
            let contas = Array.isArray(result.data) ? result.data : [];

            // Filtra as contas para remover aquelas com state igual a 1
            contas = contas.filter((conta) => conta.state !== 1);

            console.log("Contas a receber:", contas);

            // Atualiza as contas para mostrar o nome da subconta ao invés do ID
            contas.forEach((conta) => {
                conta.pcontas = subcontasMap[conta.pcontas] || "N/A";
            });

            populateTable(contas);
        } catch (error) {
            console.error("Erro ao buscar contas:", error.message);
        }
    }

    fetchContasAReceber();
    function verificarStatusVencimento(dataVencimento) {
        if (!dataVencimento) return { status: "Sem data", dias: 0 };

        // Converter a data de vencimento para objeto Date
        const partesData = dataVencimento.split('-');
        const dataVenc = new Date(partesData[0], partesData[1] - 1, partesData[2]);

        // Data atual
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Calcular diferença em dias
        const diffTime = dataVenc - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Determinar status
        if (diffDays < 0) {
            return {
                status: "Atrasado",
                dias: Math.abs(diffDays),
                texto: `Atrasado ${Math.abs(diffDays)} dia(s)`
            };
        } else if (diffDays === 0) {
            return {
                status: "Vence hoje",
                dias: 0,
                texto: "Vence hoje"
            };
        } else {
            return {
                status: "Aberto",
                dias: diffDays,
                texto: `Vence em ${diffDays} dia(s)`
            };
        }
    }

    function populateTable(contas) {
        const tableBody = document.querySelector("#dataTable3 tbody");
        if (!tableBody)
            return console.error("Elemento da tabela não encontrado!");

        // Agrupa as contas pelo campo 'documento' (ou outro campo que identifique o lançamento)
        const contasAgrupadas = agruparContas(contas, "documento"); // Use 'ndocumento' se for o caso

        let tableRowsHtml = ""; // Acumula as linhas da tabela

        for (const documento in contasAgrupadas) {
            const grupoContas = contasAgrupadas[documento];
            const totalParcelas = grupoContas.length;

            // Para cada conta no grupo, gera a linha da tabela com a numeração correta
            grupoContas.forEach((conta, index) => {
                const numeroParcela = index + 1; // Calcula o número da parcela dentro do grupo

                // Verifica o status do vencimento
                const statusVencimento = verificarStatusVencimento(conta.dataVencimento);
                const statusFinal = conta.statusDePagemanto === "Concluido" ?
                    "Concluido" :
                    statusVencimento.status;

                const valorFormatado = new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                }).format(parseFloat(conta.valor || 0));
                const dataVencimento = formatarData(conta.dataVencimento);
                const clienteNome = conta.cliente?.nome || "N/A";
                const telefones = [
                    conta.cliente?.telefone1,
                    conta.cliente?.telefone2,
                ].filter((tel) => tel);

                // Atualiza o texto do WhatsApp com base no status
                let whatsappMessage = "";
                if (statusFinal === "Atrasado") {
                    whatsappMessage = `Olá%20${clienteNome},%20seu%20boleto%20está%20atrasado%20há%20${statusVencimento.dias}%20dia(s).%20Pedimos%20que%20regularize%20o%20pagamento%20o%20quanto%20antes.`;
                } else if (statusFinal === "Vence hoje") {
                    whatsappMessage = `Olá%20${clienteNome},%20lembramos%20que%20seu%20boleto%20vence%20hoje.%20Agradecemos%20o%20pagamento.`;
                } else if (statusFinal === "Aberto") {
                    whatsappMessage = `Olá%20${clienteNome},%20lembramos%20que%20seu%20boleto%20vence%20em%20${statusVencimento.dias}%20dia(s).`;
                } else {
                    whatsappMessage = `Olá%20${clienteNome},%20mensagem%20sobre%20seu%20boleto.`;
                }

                const whatsappButtons = telefones.length
                    ? telefones
                          .map(
                              (tel) => `
                            <a href="https://wa.me/${tel}?text=${whatsappMessage}" class="btn btn-sm btn-success mx-1" target="_blank">
                                <i class="fab fa-whatsapp"></i>
                            </a>
                        `
                          )
                          .join("")
                    : `<span class="text-muted">Sem contato</span>`;

                tableRowsHtml += `
                    <tr>
                        <td style="text-transform: capitalize;">${conta.idContaAReceber || "sem Informação"}</td>
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
                        <td style="">${numeroParcela} de ${totalParcelas} </td>
                        <td style="text-transform: capitalize;">${dataVencimento}</td>
                        <td style="text-transform: capitalize;">${formatarData(conta.dataRecebimento)}</td>
                        <td>
                            <button style="
                                text-transform: capitalize;
                                background-color: ${
                                    statusFinal === "Aberto"
                                        ? "#d4edff"
                                        : statusFinal === "Atrasado" || statusFinal === "Vence hoje"
                                        ? "#ffd4d4"
                                        : statusFinal === "Concluido"
                                        ? "#d4ffdf"
                                        : "#f0f0f0"
                                };
                                color: ${
                                    statusFinal === "Aberto"
                                        ? "#1a5a8a"
                                        : statusFinal === "Atrasado" || statusFinal === "Vence hoje"
                                        ? "#8a1a1a"
                                        : statusFinal === "Concluido"
                                        ? "#1a8a2e"
                                        : "#333"
                                };
                                border: none;
                                padding: 6px 12px;
                                border-radius: 4px;
                                cursor: default;
                                font-weight: 500;
                                box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
                            ">
                                ${statusFinal === "Atrasado" ? statusVencimento.texto : statusFinal}
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
                                    data-tipoPagamento="${conta.tipoPagamento}"
                                    data-descricao="${conta.descricao}"
                                    data-valor="${conta.valor}"
                                    data-frequenciaRecorrencia="${
                                        conta.frequenciaRecorrencia
                                    }"
                                    data-parcelas="${conta.parcelas}"
                                    data-dataVencimento="${
                                        conta.dataVencimento
                                    }"http://127.0.0.1:8000/dashboard
                                    data-dataRecebimento="${
                                        conta.dataRecebimento
                                    }"
                                    data-statusDePagamento="${
                                        conta.statusDePagemanto
                                    }">
                                    <i class="fas fa-edit"></i>
                                </a>
                                 <button href="#" class="btn btn-sm btn-danger btn-delete-user" data-id="${
                                     conta.idContaAReceber
                                 }">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        tableBody.innerHTML = tableRowsHtml; // Insere todas as linhas na tabela

        addEditButtonsEvent();
        addDeleteButtonsEvent();
    }


    // Função para agrupar um array de objetos por um campo específico
    function agruparContas(contas, campo) {
        return contas.reduce((acumulador, conta) => {
            const chave = conta[campo];
            if (!acumulador[chave]) {
                acumulador[chave] = [];
            }
            acumulador[chave].push(conta);
            return acumulador;
        }, {});
    }

    function formatarData(data) {
        if (!data) return "N/A";
        const partes = data.split("-");
        return partes.length === 3
            ? `${partes[2]}/${partes[1]}/${partes[0]}`
            : data;
    }

    function addEditButtonsEvent() {
        document.querySelectorAll(".btn-edit-conta").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                document.getElementById("edit_contaReceberId").value =
                    button.getAttribute("data-id");
                document.getElementById("edit_dataDocumento").value =
                    button.getAttribute("data-dataDocumento");
                document.getElementById("edit_documento").value =
                    button.getAttribute("data-documento");
                document.getElementById("edit_ndocumento").value =
                    button.getAttribute("data-ndocumento");
                document.getElementById("edit_pcontas").value =
                    button.getAttribute("data-pcontas");
                document.getElementById("edit_projectoId").value =
                    button.getAttribute("data-projectoId");
                document.getElementById("edit_clienteId").value =
                    button.getAttribute("data-clienteId");
                document.getElementById("edit_tipoPagamento").value =
                    button.getAttribute("data-tipoPagamento");
                document.getElementById("edit_frequenciaRecorrencia").value =
                    button.getAttribute("data-frequenciaRecorrencia");
                document.getElementById("edit_valor").value =
                    button.getAttribute("data-valor");
                document.getElementById("edit_parcelas").value =
                    button.getAttribute("data-parcelas");
                document.getElementById("edit_recebidoPeloBancoId").value =
                    button.getAttribute("data-recebidoPeloBancoId");
                document.getElementById("edit_descricao").value =
                    button.getAttribute("data-descricao");
                document.getElementById("edit_dataVencimento").value =
                    button.getAttribute("data-dataVencimento");
                document.getElementById("edit_dataRecebimento").value =
                    button.getAttribute("data-dataRecebimento");

                const editModal = new bootstrap.Modal(
                    document.getElementById("modalEditarContaReceber")
                );
                editModal.show();
            });
        });
    }

    function addDeleteButtonsEvent() {
        document.querySelectorAll(".btn-delete-user").forEach((button) => {
            button.addEventListener("click", async (event) => {
                event.preventDefault();
                const idContaAReceber = button.getAttribute("data-id");

                // Mostrar mensagem de confirmação
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

                // Se o usuário confirmar, prosseguir com a exclusão
                if (confirmacao.isConfirmed) {
                    try {
                        await deleteUser(idContaAReceber);
                        // Recarregar a lista após a exclusão
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
            if (!authToken) {
                throw new Error("Token de autenticação não encontrado.");
            }

            const response = await fetch(
                `${API_CONFIG.BASE_URL}/contaAReceber/${idContaAReceber}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Verifica se a resposta está vazia (comum em respostas DELETE)
            if (response.status === 204) {
                Swal.fire({
                    icon: "success",
                    title: "Deletado!",
                    text: "Lançamento deletado com sucesso.",
                });
                return; // Sai da função após sucesso
            }

            // Tenta parsear como JSON apenas se houver conteúdo
            const responseData =
                response.status !== 204 ? await response.json() : null;

            if (!response.ok) {
                throw new Error(
                    responseData?.message ||
                        `Erro ao deletar conta. Status: ${response.status}`
                );
            }

            Swal.fire({
                icon: "success",
                title: "Deletado!",
                text: "Lançamento deletado com sucesso.",
            });

            // Chama a função correta para atualizar a lista
            await fetchContasAReceber();
        } catch (error) {
            console.error("Erro ao deletar usuário:", error);
            Swal.fire({
                icon: "error",
                title: "Erro",
                text:
                    error.message ||
                    "Não foi possível deletar o Lançamento. Por favor, tente novamente.",
            });
            throw error; // Rejeita a promise para que o chamador saiba que houve erro
        }
    }

    document
        .getElementById("formEditarContaReceber")
        .addEventListener("submit", async (event) => {
            event.preventDefault();

            Swal.fire({
                title: "Aguarde...",
                text: "Atualizando conta a receber...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const idContaAReceber =
                document.getElementById("edit_contaReceberId").value ||
                document
                    .getElementById("edit_contaReceberId")
                    .getAttribute("data-id");

            const dataDocumento =
                document.getElementById("edit_dataDocumento").value;
            const documento = document.getElementById("edit_documento").value;
            const ndocumento = document.getElementById("edit_ndocumento").value;
            const pcontas = document.getElementById("edit_pcontas").value;
            const tipoPagamento =
                document.getElementById("edit_tipoPagamento").value;
            const frequenciaRecorrencia = document.getElementById(
                "edit_frequenciaRecorrencia"
            ).value;
            const valor = document.getElementById("edit_valor").value;
            const parcelas = document.getElementById("edit_parcelas").value;
            const descricao = document.getElementById("edit_descricao").value;
            const dataVencimento = document.getElementById(
                "edit_dataVencimento"
            ).value;
            const dataRecebimento = document.getElementById(
                "edit_dataRecebimento"
            ).value;

            // Coleta os dados do formulário
            const formData = new FormData(
                document.getElementById("formEditarContaReceber")
            );
            const data = {
                dataDocumento: dataDocumento,
                documento: documento,
                ndocumento: ndocumento,
                pcontas: pcontas,
                tipoPagamento: tipoPagamento,
                frequenciaRecorrencia: frequenciaRecorrencia,
                valor: valor,
                parcelas: parcelas,
                descricao: descricao,
                dataVencimento: dataVencimento,
                dataRecebimento: dataRecebimento,
            };
            console.log("Data:", data);
            const authToken = localStorage.getItem("authToken");

            try {
                const response = await fetch(
                    `${API_CONFIG.BASE_URL}/contaAReceber/${parseInt(
                        idContaAReceber
                    )}`,
                    {
                        method: "POST", // ou "PATCH"
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            // "Content-Type": "application/json", // Indique que você está enviando JSON
                        },
                        body: formData, // Converte os dados para JSON
                    }
                );



                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "Sucesso!",
                        timer: 2000,
                        showConfirmButton: false,
                    }).then(() => {
                        location.reload();
                    });
                    fetchContasAReceber(); // Recarrega os dados
                } else {
                    const errorData = await response.json();
                    Swal.fire({
                        icon: "error",
                        title: "Erro",
                        text: `Erro ao atualizar a conta a receber: ${
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

    fetchContasAReceber();
});

/**
 *
 * @param {date} dataInicial
 * @param {string} frequencia
 * @param {int} parcelas
 * @returns {date[]}
 */
function calcularDatasDeVencimento(dataInicial, frequencia, parcelas) {
    const datasDeVencimento = [];
    let data = new Date(dataInicial);

    for (let i = 0; i < parcelas; i++) {
        datasDeVencimento.push(new Date(data)); // Adiciona uma cópia da data para evitar problemas de referência

        if (frequencia === "mensal") {
            data.setMonth(data.getMonth() + 1);
        } else if (frequencia === "quinzenal") {
            data.setDate(data.getDate() + 15);
        } else if (frequencia === "semanal") {
            data.setDate(data.getDate() + 7);
        }
        // Adicione outras frequências conforme necessário
    }

    return datasDeVencimento;
}
