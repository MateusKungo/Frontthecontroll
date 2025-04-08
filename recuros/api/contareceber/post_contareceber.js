import API_CONFIG from '../urlbase/url.js';

document.addEventListener("DOMContentLoaded", async function () {
    const formReceber = document.querySelector("#formcontaReceber");

    if (!formReceber) {
        console.error("❌ Erro: Formulário não encontrado.");
        return;
    }

    const processForm = async (form, apiUrl) => {
        const valorInput = form.querySelector("#valor");
        const parcelasInput = form.querySelector("#parcelas");
        const frequenciaRecorrenciaInput = form.querySelector("#frequenciaRecorrencia");
        const dataVencimentoInput = form.querySelector("#dataVencimento");
        const dataRecebimentoInput = form.querySelector("#dataRecebimento"); // Adicionado
        let valorOriginal = parseFloat(valorInput?.value) || 0;

        if (valorInput && parcelasInput) {
            valorInput.addEventListener("input", function () {
                valorOriginal = parseFloat(valorInput.value) || 0;
            });

            parcelasInput.addEventListener("input", function () {
                const numParcelas = parseInt(parcelasInput.value) || 1;
                if (numParcelas > 0 && valorOriginal > 0) {
                    const valorParcela = valorOriginal / numParcelas;
                    valorInput.value = valorParcela.toFixed(2);
                }
            });
        }

        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            Swal.fire({
                title: "Por favor, aguarde...",
                text: "Processando os dados.",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const numParcelas = parseInt(parcelasInput.value) || 1;
            const frequenciaRecorrencia = frequenciaRecorrenciaInput.value;
            const dataVencimentoInicial = dataVencimentoInput.value;
            const dataRecebimento = dataRecebimentoInput.value; // Captura o valor do campo dataRecebimento

            const token = localStorage.getItem("authToken");
            if (!token) {
                showAlert("Erro de autenticação. Faça login novamente.", "error");
                return;
            }

            for (let i = 0; i < numParcelas; i++) {
                const formData = new FormData();
                const campos = [
                    "projectoId",
                    "clienteId",
                    "recebidoPeloBancoId",
                    "dataDocumento",
                    "ndocumento",
                    "pcontas",
                    "parcelas",
                    "documento",
                    "tipoPagamento",
                    "frequenciaRecorrencia",
                    "descricao",
                    "valor",
                    "dataRecebimento",
                    "statusDePagemanto", // Corrigido para "statusDePagamento" se necessário, mas mantive como no original
                ];

                const camposNumericos = [
                    "projectoId",
                    "clienteId",
                    "recebidoPeloBancoId",
                    "parcelas",
                    "pcontas",
                    "valor",
                ];

                campos.forEach((campo) => {
                    const elemento = form.querySelector(`#${campo}`);
                    if (elemento && elemento.value.trim() !== "") {
                        let valor = camposNumericos.includes(campo)
                            ? Number(elemento.value)
                            : elemento.value;
                        formData.append(campo, valor);
                    } else {
                        console.warn(`⚠️ Aviso: O campo "${campo}" não foi encontrado ou está vazio.`);
                    }
                });

                // Calcular a data de vencimento para cada parcela
                const dataVencimentoCalculada = calcularDataRecebimento(
                    dataVencimentoInicial,
                    frequenciaRecorrencia,
                    i
                );
                formData.set("dataVencimento", dataVencimentoCalculada);

                // Se dataRecebimento estiver preenchida, definir statusDePagemanto como "Concluido"
                if (dataRecebimento && dataRecebimento.trim() !== "") {
                    formData.set("statusDePagemanto", "Concluido");
                    formData.set("dataRecebimento", dataRecebimento); // Usa a data informada no formulário
                } else {
                    // Se não houver dataRecebimento, não sobrescreve o campo (deixa como está ou vazio)
                    formData.delete("statusDePagemanto"); // Remove se já foi adicionado anteriormente
                }

                console.log("📤 Dados enviados:", Object.fromEntries(formData.entries()));
                console.log("🔑 Token:", token);

                try {
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || "Erro no servidor");
                    }

                    console.log("✅ Resposta do servidor:", result);
                } catch (error) {
                    console.error("❌ Erro de conexão:", error);
                    showAlert("Erro ao enviar os dados.", "error");
                    return;
                }
            }

            Swal.close();
            showAlert("Lançamento realizado com sucesso.", "success");
            form.reset();
        });
    };

    processForm(formReceber, `${API_CONFIG.BASE_URL}/contaAReceber`);
});

function showAlert(message, type = "success") {
    Swal.fire({
        html: message,
        icon: type,
        toast: true,
        position: "top-end",
    }).then(() => {
        // location.reload();
    });
}

function preencherSelect(selectElement, items, valueKey, textKey) {
    selectElement.innerHTML = '<option value="">Selecione uma opção</option>';

    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[valueKey];
        option.textContent = item[textKey];
        selectElement.appendChild(option);
    });

    if (items.length > 0) {
        selectElement.value = items[0][valueKey];
    }
}

function calcularDataRecebimento(dataVencimentoInicial, frequenciaRecorrencia, parcela) {
    if (!dataVencimentoInicial) {
        console.warn("Data de vencimento inicial está vazia. Retornando null.");
        return null;
    }

    const dataVencimento = new Date(dataVencimentoInicial);

    if (isNaN(dataVencimento.getTime())) {
        console.error("Data de vencimento inicial inválida:", dataVencimentoInicial);
        return null;
    }

    switch (frequenciaRecorrencia) {
        case "diaria":
            dataVencimento.setDate(dataVencimento.getDate() + parcela);
            break;
        case "semanal":
            dataVencimento.setDate(dataVencimento.getDate() + parcela * 7);
            break;
        case "quinzenal":
            dataVencimento.setDate(dataVencimento.getDate() + parcela * 15);
            break;
        case "mensal":
            dataVencimento.setMonth(dataVencimento.getMonth() + parcela);
            break;
        case "bimestral":
            dataVencimento.setMonth(dataVencimento.getMonth() + parcela * 2);
            break;
        case "trimestral":
            dataVencimento.setMonth(dataVencimento.getMonth() + parcela * 3);
            break;
        case "semestral":
            dataVencimento.setMonth(dataVencimento.getMonth() + parcela * 6);
            break;
        case "anual":
            dataVencimento.setFullYear(dataVencimento.getFullYear() + parcela);
            break;
        default:
            console.warn("Frequência de recorrência desconhecida:", frequenciaRecorrencia);
            break;
    }

    const ano = dataVencimento.getFullYear();
    const mes = String(dataVencimento.getMonth() + 1).padStart(2, "0");
    const dia = String(dataVencimento.getDate()).padStart(2, "0");
    const dataFormatada = `${ano}-${mes}-${dia}`;

    return dataFormatada;
}