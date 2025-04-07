

document.addEventListener("DOMContentLoaded", async function () {
    const form = document.querySelector("#formcontaPagar"); // Alterado o seletor para #formcontaPagar

    if (!form) {
        console.error("❌ Erro: Formulário não encontrado.");
        return;
    }

    const valorInput = document.getElementById("valor");
    const parcelasInput = document.getElementById("parcelas");
    let valorOriginal = 0;

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

        for (let i = 0; i < numParcelas; i++) {
            const formData = new FormData();
            const campos = [
                "projectoId", "fornecedorId", "pagoPeloBancoId", "dataDocumento", "ndocumento",
                "pcontas", "parcelas", "documento", "tipoPagamento", "frequenciaRecorrencia",
                "descricao", "valor", "dataRecebimento", "dataVencimento"
            ];

            const camposNumericos = ["projectoId", "fornecedorId", "pagoPeloBancoId", "parcelas", "pcontas", "valor"];

            console.log("📤 Campos do formulário:", campos);

            campos.forEach((campo) => {
                const elemento = document.getElementById(campo);
                if (elemento && elemento.value.trim() !== "") {
                    let valor = camposNumericos.includes(campo) ? Number(elemento.value) : elemento.value;
                    formData.append(campo, valor);
                } else {
                    console.warn(`⚠️ Aviso: O campo "${campo}" não foi encontrado ou está vazio.`);
                }
            });

            const token = localStorage.getItem("authToken");
            console.log("📤 Dados enviados:", Object.fromEntries(formData.entries()));
            console.log("🔑 Token:", token);

            try {
                const response = await fetch("https://thecontroll.com/public/api/contaAPagar", {
                    method: 'POST',
                    headers: {
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: formData,
                });

                const result = await response.json();

                if (response.ok) {
                    console.log("✅ Resposta do servidor:", result);
                } else {
                    throw new Error(result.message || 'Erro no servidor');
                }
            } catch (error) {
                console.error("❌ Erro de conexão:", error);
            }
        }

        Swal.close();
        Swal.fire({
            icon: "success",
            title: "Dados enviados!",
            text: "Lançamento Relizdo com sucesso.",
            timer: 2000, // Tempo antes de fechar automaticamente
            showConfirmButton: false,
        }).then(() => {
            location.reload();
        });
        form.reset();
    });
});

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
