document.addEventListener("DOMContentLoaded", function () {
    const contaSelect = document.getElementById("contaSelect");
    const token = localStorage.getItem("authToken"); // Obtendo o token do localStorage

    // Função para carregar as contas no select

    async function carregarContas() {
        const contaSelect = document.getElementById("contaSelect");
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire({
                icon: "error",
                title: "Erro",
                text: "Usuário não autenticado!",
            });
            return;
        }

        try {
            const response = await fetch(
                "https://thecontroll.com/public/api/conta",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok)
                throw new Error(
                    `Erro ${response.status}: ${response.statusText}`
                );

            const data = await response.json(); // Aqui recebemos a resposta JSON

            console.log("Resposta da API:", data); // 🔹 Veja no console o que a API está retornando

            // Se a API retornou um objeto, tente acessar a propriedade correta
            if (Array.isArray(data)) {
                preencherSelect(data);
            } else if (data.data && Array.isArray(data.data)) {
                preencherSelect(data.data); // Se a resposta estiver dentro de "data"
            } else {
                throw new Error(
                    "Formato inesperado da API. A resposta não contém uma lista."
                );
            }
        } catch (error) {
            console.error("Erro ao carregar contas:", error);
            Swal.fire({
                icon: "error",
                title: "Erro",
                text: "Não foi possível carregar as contas.",
            });
        }
    }

    // Função separada para preencher o <select>
    function preencherSelect(listaContas) {
        const contaSelect = document.getElementById("contaSelect");
        contaSelect.innerHTML = '<option value="">Selecione uma conta</option>';
        listaContas.forEach((conta) => {
            const option = document.createElement("option");
            option.value = conta.id_conta;
            option.textContent = conta.nome;
            contaSelect.appendChild(option);
        });
    }

    // Chama a função ao abrir o modal
    $("#subcontaModal").on("show.bs.modal", carregarContas);

    // Função para cadastrar subconta
    document
        .getElementById("salvarSubConta")
        .addEventListener("click", async function () {
            const contaId = contaSelect.value;
            const nomeSubConta = document.getElementById("nomeSubConta").value;
            const descricaoSubConta =
                document.getElementById("descricaoSubConta").value;

            if (!contaId || !nomeSubConta || !descricaoSubConta) {
                Swal.fire({
                    icon: "warning",
                    title: "Campos obrigatórios",
                    text: "Preencha todos os campos!",
                });
                return;
            }

            if (!token) {
                Swal.fire({
                    icon: "error",
                    title: "Erro",
                    text: "Usuário não autenticado!",
                });
                return;
            }

            const formData = new FormData();
            formData.append("id_conta", contaId);
            formData.append("nome", nomeSubConta);
            formData.append("descricao", descricaoSubConta);

            try {
                Swal.fire({
                    title: "Por favor, aguarde...",
                    text: "Salvando os dados.",
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });

                const response = await fetch(
                    "https://thecontroll.com/public/api/subconta",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    }
                );

                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "Sucesso!",
                        text: "SubConta cadastrada com sucesso.",
                    });
                    document.getElementById("userFormPost").reset();
                    $("#subcontaModal").modal("hide");
                } else {
                    const errorData = await response.json();
                    Swal.fire({
                        icon: "error",
                        title: "Erro",
                        text: errorData.message || "Ocorreu um problema.",
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Erro de Conexão",
                    text: "Erro ao conectar ao servidor.",
                });
                console.error("Erro:", error);
            }
        });
});
