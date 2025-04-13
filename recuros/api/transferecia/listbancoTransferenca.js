
import API_CONFIG from '../urlbase/url.js';

async function fetchBancos() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Token de autenticação não encontrado.");


        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-de-bancos`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) throw new Error(`Erro na API. Status: ${response.status}`);

        const result = await response.json();
        let bancos = result.data || result;

        if (!Array.isArray(bancos)) throw new Error("Os dados da API não são uma lista válida.");

        // Filter out banks with state 1
        bancos = bancos.filter(banco => banco.state !== 1);
        console.log("Bancos filtrados:", bancos);

        window.bancosDisponiveis = bancos;
        populateSelects(bancos);
    } catch (error) {
        console.error("Erro ao buscar bancos:", error.message);
    }
}

function populateSelects(bancos) {
    let selectSaiuNoBanco = document.getElementById("saiuNoBanco");
    let selectEntrouNoBanco = document.getElementById("entrouNoBanco");

    if (!selectSaiuNoBanco || !selectEntrouNoBanco) {
        console.error("Os selects não foram encontrados no DOM.");
        return;
    }

    selectSaiuNoBanco.innerHTML = '<option value="">Selecione</option>';
    selectEntrouNoBanco.innerHTML = '<option value="">Selecione</option>';

    // Only show banks without state 1
    bancos.forEach(banco => {
        let option = document.createElement("option");
        option.value = banco.id;
        option.textContent = banco.nomeBanco;
        selectSaiuNoBanco.appendChild(option);
    });

    selectSaiuNoBanco.addEventListener("change", function () {
        atualizarEntrouNoBanco(parseInt(this.value));
    });

    atualizarEntrouNoBanco(null);
}

function atualizarEntrouNoBanco(bancoSelecionadoId) {
    let selectEntrouNoBanco = document.getElementById("entrouNoBanco");

    if (!selectEntrouNoBanco) return;

    selectEntrouNoBanco.innerHTML = '<option value="">Selecione</option>';

    window.bancosDisponiveis.forEach(banco => {
        if (banco.id !== bancoSelecionadoId) {
            let option = document.createElement("option");
            option.value = banco.id;
            option.textContent = banco.nomeBanco;
            selectEntrouNoBanco.appendChild(option);
        }
    });
}

// 🚀 Função para realizar o POST de transferência
document.getElementById("formTransferencia").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Mostrar loading
    const swalInstance = Swal.fire({
        title: "Processando...",
        html: "Enviando transferência",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        // Coletar dados do formulário
        const formData = new FormData();
        formData.append("dataTransferencia", document.getElementById("dataTransferencia").value);
        formData.append("saiuNoBanco", document.getElementById("saiuNoBanco").value);
        formData.append("entrouNoBanco", document.getElementById("entrouNoBanco").value);
        formData.append("descricao", document.getElementById("descricao").value);
        formData.append("valorTransferencia", document.getElementById("valorTransferencia").value);

        // Adicionar arquivo se existir
        const comprovanteFile = document.getElementById("ComprovativoTransferencia").files[0];
        if (comprovanteFile) {
            formData.append("comprovativo", comprovanteFile); // Nome do campo que o backend espera
            console.log("Arquivo preparado para envio:", comprovanteFile);
        }

        // Validar bancos diferentes
        if (formData.get("saiuNoBanco") === formData.get("entrouNoBanco")) {
            throw new Error("Selecione bancos diferentes para saída e entrada");
        }

        // Verificar token
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Usuário não autenticado");

        // Debug: mostrar dados que serão enviados
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        // Enviar para o backend
        const response = await fetch(`${API_CONFIG.BASE_URL}/transferencia`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${authToken}`
                // Não definir Content-Type - o browser vai definir automaticamente
            },
            body: formData
        });

        const result = await response.json();
        console.log("Resposta completa do servidor:", result);

        if (!response.ok) {
            throw new Error(result.message || "Erro ao processar transferência");
        }

        // Sucesso
        await Swal.fire({
            icon: "success",
            title: "Sucesso!",
            text: "Transferência registrada com comprovante",
           // timer: 2000
        });
        //location.reload();

    } catch (error) {
        console.error("Erro completo:", error);
        Swal.fire({
            icon: "error",
            title: "Erro",
            text: error.message
        });
    } finally {
        swalInstance.close();
    }
});

// Chamar a função ao abrir o modal
document.addEventListener("DOMContentLoaded", function () {
    let modalTransferencia = document.getElementById("modalTransferencia");

    if (modalTransferencia) {
        modalTransferencia.addEventListener("shown.bs.modal", fetchBancos);
    } else {
        console.error("Modal não encontrado no DOM.");
    }
});

// Carregar os bancos ao iniciar
fetchBancos();
