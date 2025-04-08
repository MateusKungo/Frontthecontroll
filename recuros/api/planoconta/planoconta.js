import API_CONFIG from "../urlbase/url.js";
let categoriasDeConta = [];

// ==============================================
// FUNÇÕES DE UTILIDADE
// ==============================================

function showAlert(message, type = "success") {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
    });

    Toast.fire({
        icon: type,
        title: message,
    });
}

async function apiRequest(url, method, body = null) {
    const token = localStorage.getItem("authToken");
    if (!token) {
        showAlert("Sessão expirada. Faça login novamente.", "error");
        window.location.href = "/login.html"; // Adapte para sua página de login
        throw new Error("Token não encontrado.");
    }

    const headers = {
        Authorization: `Bearer ${token}`,
    };
    // Só adiciona Content-Type se houver corpo
    if (body) {
         headers["Content-Type"] = "application/json";
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        // Tratamento especial para 401 Unauthorized
        if (response.status === 401) {
            localStorage.removeItem("authToken");
            showAlert("Sessão inválida ou expirada. Faça login.", "error");
            window.location.href = "/login.html"; // Adapte
            throw new Error("Não autorizado (401)"); // Interrompe a execução
        }

        // Para DELETE sucesso (204 No Content), retorna true
        if (response.status === 204) {
            return true;
        }

        // Tenta ler o corpo da resposta como JSON
        let responseData = null;
        try {
             // Verifica se há conteúdo antes de tentar parsear
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                 responseData = await response.json();
            } else {
                // Pode retornar o texto ou null se não for JSON
                 // responseData = await response.text();
                 responseData = null; // Ou trate como achar melhor
            }
        } catch (e) {
             console.warn("Não foi possível parsear a resposta como JSON.", e);
             responseData = null; // Falha no parse, trata como sem dados
        }


        if (!response.ok) {
            // Tenta pegar a mensagem de erro do corpo da resposta JSON
            let errorMessage = `Erro ${response.status}`;
            if (responseData && responseData.message) {
                errorMessage = responseData.message;
            } else if (typeof responseData === 'string' && responseData) {
                 errorMessage = responseData; // Se a resposta foi texto
            } else {
                 errorMessage = response.statusText || "Erro desconhecido";
            }
            console.error("Erro API:", { status: response.status, message: errorMessage, url, response: responseData });
            throw new Error(errorMessage);
        }

        // Retorna os dados (se houver) ou true para outros sucessos sem corpo JSON claro (ex: 200 OK sem json)
        return responseData !== null ? responseData : true;

    } catch (error) {
        console.error(`Erro na requisição ${method} ${url}:`, error);
         // Evita alerta duplicado se já foi tratado (401)
         if (!error.message.includes("401")) {
            showAlert(`Erro: ${error.message}`, "error");
         }
        throw error; // Re-lança para que a função chamadora saiba do erro
    }
}

// ==============================================
// FUNÇÕES DE BUSCA E RENDERIZAÇÃO
// ==============================================

async function fetchCategoriasFromAPI() {
    try {
        const result = await apiRequest(
            `${API_CONFIG.BASE_URL}/categoria-de-conta`,
            "GET"
        );
        console.log("API Response (/categoria-de-conta):", result); // DEBUG

        // Adaptação baseada na estrutura mais provável (array direto ou {data: [...]})
        if (Array.isArray(result)) {
            categoriasDeConta = result;
        } else if (result && Array.isArray(result.data)) {
             categoriasDeConta = result.data;
        } else {
            console.warn("Formato inesperado da API, esperando array ou {data: array}. Recebido:", result);
            categoriasDeConta = [];
        }

        carregarCategorias(); // Renderiza a lista

    } catch (error) {
        console.error("Falha ao buscar categorias:", error);
        // Limpa a lista na UI em caso de erro grave
        const contasBody = document.getElementById("contas-body");
        if (contasBody) {
            contasBody.innerHTML = `<p class="text-danger text-center p-3">Erro ao carregar categorias. Tente recarregar a página ou contate o suporte.</p>`;
        }
    }
}

function carregarCategorias() {
    const contasBody = document.getElementById("contas-body");
    if (!contasBody) {
        console.error("Elemento #contas-body não encontrado!");
        return;
    }

    contasBody.innerHTML = ''; // Limpa antes de renderizar

    if (categoriasDeConta.length === 0) {
        contasBody.innerHTML = '<p class="text-center text-muted p-3">Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.</p>';
        // Garante que os listeners sejam removidos ou não adicionados se não houver itens
        return;
    }

    let html = '<ul class="list-group">';
    categoriasDeConta.forEach(categoria => {
        if (categoria.status === "Desativa") return; // Pula desativadas

        html += `
            <li class="list-group-item" data-categoria-id="${categoria.idCategoriaDeConta}">
                <div class="d-flex align-items-center justify-content-between">
                    <!-- Nome e Controles de Edição Inline Categoria -->
                    <div class="flex-grow-1 me-3">
                        <span class="categoria-texto fw-bold" style="cursor: pointer;" onclick="console.log('Clicou na Categoria ID: ${categoria.idCategoriaDeConta}')">${categoria.nome}</span>
                        <div class="d-none categoria-edit-container mt-2">
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control categoria-input" value="${categoria.nome}">
                                <button class="btn btn-success btn-salvar-categoria-inline" data-id="${categoria.idCategoriaDeConta}" title="Salvar"><i class="fas fa-save"></i></button>
                                <button class="btn btn-secondary btn-cancelar-categoria-inline" data-id="${categoria.idCategoriaDeConta}" title="Cancelar"><i class="fas fa-times"></i></button>
                            </div>
                        </div>
                    </div>
                    <!-- Botões de Ação Categoria -->
                    <div class="action-buttons d-flex gap-1 flex-shrink-0">
                        <button class="btn btn-sm btn-outline-secondary btn-editar-categoria" title="Editar Categoria" data-id="${categoria.idCategoriaDeConta}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger btn-remover-categoria" title="Remover Categoria" data-id="${categoria.idCategoriaDeConta}"><i class="fas fa-trash"></i></button>
                        <button class="btn btn-sm btn-outline-primary btn-adicionar-conta" title="Adicionar Conta" data-id="${categoria.idCategoriaDeConta}"><i class="fas fa-plus"></i> Conta</button>
                    </div>
                </div>
                <!-- Lista de Contas -->
                <ul class="list-group mt-2 ms-3" id="sublista-cat-${categoria.idCategoriaDeConta}">`;

        if (categoria.contas && Array.isArray(categoria.contas)) {
            categoria.contas.forEach(conta => {
                if (conta.status === "Desativa") return;

                html += `
                    <li class="list-group-item" data-conta-id="${conta.id_conta}">
                        <div class="d-flex align-items-center justify-content-between">
                            <!-- Nome e Controles de Edição Inline Conta -->
                            <div class="flex-grow-1 me-3">
                                <span class="conta-texto" style="cursor: pointer;" onclick="console.log('Clicou na Conta ID: ${conta.id_conta}')">
                                    ${conta.nome} <span class="badge bg-${conta.tipo === 'Entradas' ? 'success' : 'danger'}">${conta.tipo}</span>
                                </span>
                                <div class="d-none conta-edit-container mt-2">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control conta-input" value="${conta.nome}">
                                        <select class="form-select conta-tipo" style="max-width: 100px;">
                                            <option value="Entradas" ${conta.tipo === "Entradas" ? "selected" : ""}>Entrada</option>
                                            <option value="Saídas" ${conta.tipo === "Saídas" ? "selected" : ""}>Saída</option>
                                        </select>
                                        <button class="btn btn-sm btn-success btn-salvar-conta-inline" data-id="${conta.id_conta}" title="Salvar"><i class="fas fa-save"></i></button>
                                        <button class="btn btn-sm btn-secondary btn-cancelar-conta-inline" data-id="${conta.id_conta}" title="Cancelar"><i class="fas fa-times"></i></button>
                                    </div>
                                </div>
                            </div>
                            <!-- Botões de Ação Conta -->
                            <div class="action-buttons d-flex gap-1 flex-shrink-0">
                                <button class="btn btn-sm btn-outline-secondary btn-editar-conta" title="Editar Conta" data-id="${conta.id_conta}"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-outline-danger btn-remover-conta" title="Remover Conta" data-id="${conta.id_conta}"><i class="fas fa-trash"></i></button>
                                <button class="btn btn-sm btn-outline-success btn-adicionar-subconta" title="Adicionar Subconta" data-id="${conta.id_conta}"><i class="fas fa-plus"></i> Sub</button>
                            </div>
                        </div>
                        <!-- Lista de Subcontas -->
                        <ul class="list-group mt-1 ms-3" id="subsublista-${conta.id_conta}">`;

                if (conta.subcontas && Array.isArray(conta.subcontas)) {
                    conta.subcontas.forEach(subconta => {
                        if (subconta.status === "Desativa") return;

                        html += `
                            <li class="list-group-item list-group-item-light py-1" data-subconta-id="${subconta.id_subconta}">
                                <div class="d-flex align-items-center justify-content-between">
                                    <!-- Nome e Controles de Edição Inline Subconta -->
                                    <div class="flex-grow-1 me-3">
                                        <span class="subconta-texto fst-italic" style="cursor: pointer;" onclick="console.log('Clicou na Subconta ID: ${subconta.id_subconta}')">${subconta.nome}</span>
                                        <div class="d-none subconta-edit-container mt-2">
                                            <div class="input-group input-group-sm">
                                                <input type="text" class="form-control subconta-input" value="${subconta.nome}">
                                                <button class="btn btn-sm btn-success btn-salvar-subconta-inline" data-id="${subconta.id_subconta}" title="Salvar"><i class="fas fa-save"></i></button>
                                                <button class="btn btn-sm btn-secondary btn-cancelar-subconta-inline" data-id="${subconta.id_subconta}" title="Cancelar"><i class="fas fa-times"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Botões de Ação Subconta -->
                                    <div class="action-buttons d-flex gap-1 flex-shrink-0">
                                        <button class="btn btn-sm btn-outline-secondary btn-editar-subconta" title="Editar Subconta" data-id="${subconta.id_subconta}"><i class="fas fa-edit"></i></button>
                                        <button class="btn btn-sm btn-outline-danger btn-remover-subconta" title="Remover Subconta" data-id="${subconta.id_subconta}"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            </li>`;
                    });
                } else if (conta.subcontas) {
                     console.warn(`'subcontas' da conta ID ${conta.id_conta} não é um array.`);
                }
                html += `</ul></li>`; // Fecha subsublista e li da conta
            });
        } else if (categoria.contas) {
             console.warn(`'contas' da categoria ID ${categoria.idCategoriaDeConta} não é um array.`);
        }
        html += `</ul></li>`; // Fecha sublista e li da categoria
    });
    html += "</ul>"; // Fecha ul principal
    contasBody.innerHTML = html;

    attachEventListeners(); // Adiciona listeners aos novos elementos
}

// ==============================================
// EVENT LISTENERS (Anexados após renderizar)
// ==============================================

function attachEventListeners() {
    // Botões "Adicionar"
    document.querySelectorAll('.btn-adicionar-conta').forEach(btn => {
        btn.addEventListener('click', handleAddContaClick);
    });
    document.querySelectorAll('.btn-adicionar-subconta').forEach(btn => {
        btn.addEventListener('click', handleAddSubcontaClick);
    });

    // Botões "Editar" (Inline)
    document.querySelectorAll('.btn-editar-categoria').forEach(btn => {
        btn.addEventListener('click', handleEditCategoriaClick);
    });
    document.querySelectorAll('.btn-editar-conta').forEach(btn => {
        btn.addEventListener('click', handleEditContaClick);
    });
    document.querySelectorAll('.btn-editar-subconta').forEach(btn => {
        btn.addEventListener('click', handleEditSubcontaClick);
    });

    // Botões "Salvar" (Inline)
    document.querySelectorAll('.btn-salvar-categoria-inline').forEach(btn => {
        btn.addEventListener('click', handleSaveCategoriaInlineClick);
    });
    document.querySelectorAll('.btn-salvar-conta-inline').forEach(btn => {
        btn.addEventListener('click', handleSaveContaInlineClick);
    });
     document.querySelectorAll('.btn-salvar-subconta-inline').forEach(btn => {
        btn.addEventListener('click', handleSaveSubcontaInlineClick);
    });

    // Botões "Cancelar" (Inline)
    document.querySelectorAll('.btn-cancelar-categoria-inline').forEach(btn => {
        btn.addEventListener('click', handleCancelCategoriaInlineClick);
    });
    document.querySelectorAll('.btn-cancelar-conta-inline').forEach(btn => {
        btn.addEventListener('click', handleCancelContaInlineClick);
    });
    document.querySelectorAll('.btn-cancelar-subconta-inline').forEach(btn => {
        btn.addEventListener('click', handleCancelSubcontaInlineClick);
    });

    // Botões "Remover"
     document.querySelectorAll('.btn-remover-categoria').forEach(btn => {
        btn.addEventListener('click', handleRemoveCategoriaClick);
    });
    document.querySelectorAll('.btn-remover-conta').forEach(btn => {
        btn.addEventListener('click', handleRemoveContaClick);
    });
    document.querySelectorAll('.btn-remover-subconta').forEach(btn => {
        btn.addEventListener('click', handleRemoveSubcontaClick);
    });
}

// ==============================================
// HANDLERS DE EVENTOS (Chamados pelos Listeners)
// ==============================================

// --- Handlers Adicionar ---
function handleAddContaClick(event) {
    const categoriaId = event.currentTarget.getAttribute('data-id');
    abrirModalConta(categoriaId); // Abre modal para nova conta
}
function handleAddSubcontaClick(event) {
    const contaId = event.currentTarget.getAttribute('data-id');
    abrirModalSubconta(contaId); // Abre modal para nova subconta
}

// --- Handlers Editar Inline ---
function handleEditCategoriaClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    habilitarEdicao('categoria', id);
}
function handleEditContaClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    habilitarEdicao('conta', id);
}
function handleEditSubcontaClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    habilitarEdicao('subconta', id);
}

// --- Handlers Salvar Inline ---
function handleSaveCategoriaInlineClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    salvarEdicaoCategoriaInline(id);
}
function handleSaveContaInlineClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    salvarEdicaoContaInline(id);
}
function handleSaveSubcontaInlineClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    salvarEdicaoSubcontaInline(id);
}

// --- Handlers Cancelar Inline ---
function handleCancelCategoriaInlineClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    cancelarEdicao('categoria', id);
}
function handleCancelContaInlineClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    cancelarEdicao('conta', id);
}
function handleCancelSubcontaInlineClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    cancelarEdicao('subconta', id);
}

// --- Handlers Remover ---
function handleRemoveCategoriaClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    removerItem('categoria', id);
}
function handleRemoveContaClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    removerItem('conta', id);
}
function handleRemoveSubcontaClick(event) {
    const id = event.currentTarget.getAttribute('data-id');
    removerItem('subconta', id);
}

// ==============================================
// LÓGICA DE EDIÇÃO INLINE
// ==============================================

function habilitarEdicao(tipo, id) {
    // Esconde todos os outros containers de edição abertos do mesmo tipo
    document.querySelectorAll(`.${tipo}-edit-container:not(.d-none)`).forEach(container => {
        const otherId = container.closest(`[data-${tipo}-id]`).getAttribute(`data-${tipo}-id`);
        if (otherId !== id) {
            cancelarEdicao(tipo, otherId);
        }
    });

    const item = document.querySelector(`[data-${tipo}-id="${id}"]`);
    if (!item) return;

    const texto = item.querySelector(`.${tipo}-texto`);
    const editContainer = item.querySelector(`.${tipo}-edit-container`);
    const input = item.querySelector(`.${tipo}-input`);

    if (texto && editContainer && input) {
        texto.classList.add("d-none");
        editContainer.classList.remove("d-none");
        setTimeout(() => input.focus(), 50); // Pequeno delay para garantir visibilidade
    }
}

function cancelarEdicao(tipo, id) {
    const item = document.querySelector(`[data-${tipo}-id="${id}"]`);
     if (!item) return;

    const texto = item.querySelector(`.${tipo}-texto`);
    const editContainer = item.querySelector(`.${tipo}-edit-container`);

    if (texto && editContainer) {
        editContainer.classList.add("d-none");
        texto.classList.remove("d-none");
        // Opcional: Resetar valor do input para o original (pode ser complexo)
    }
}

async function salvarEdicaoInline(tipo, id, endpoint, data) {
    try {
        const success = await apiRequest(
            `${API_CONFIG.BASE_URL}/${endpoint}/${id}`,
            "POST",
            data
        );

        if (success) {
            showAlert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} atualizada!`);
            await fetchCategoriasFromAPI(); // Recarrega TUDO para garantir consistência
             // cancelarEdicao(tipo, id); // Não é mais necessário se recarregar tudo
        } else {
             // A função apiRequest já deve ter mostrado o erro, mas podemos adicionar um fallback
             showAlert(`Falha ao atualizar ${tipo}. Verifique os dados.`, "error");
        }
    } catch (error) {
        // Erro já mostrado por apiRequest, pode focar no input se desejar
        const item = document.querySelector(`[data-${tipo}-id="${id}"]`);
        const input = item?.querySelector(`.${tipo}-input`);
        input?.focus();
    }
}

async function salvarEdicaoCategoriaInline(id) {
    const item = document.querySelector(`[data-categoria-id="${id}"]`);
    const input = item?.querySelector(".categoria-input");
    const novoNome = input?.value.trim();

    if (!novoNome) {
        showAlert("Nome da categoria não pode ser vazio.", "warning");
        input?.focus();
        return;
    }
    // Opcional: Verificar se mudou antes de salvar
    // const originalNome = item?.querySelector('.categoria-texto')?.textContent;
    // if(novoNome === originalNome) { cancelarEdicao('categoria', id); return; }

    await salvarEdicaoInline('categoria', id, 'categoria-de-conta', { nome: novoNome });
}

async function salvarEdicaoContaInline(id) {
    const item = document.querySelector(`[data-conta-id="${id}"]`);
    const inputNome = item?.querySelector(".conta-input");
    const selectTipo = item?.querySelector(".conta-tipo");
    const novoNome = inputNome?.value.trim();
    const novoTipo = selectTipo?.value;

    if (!novoNome) {
        showAlert("Nome da conta não pode ser vazio.", "warning");
        inputNome?.focus();
        return;
    }
    await salvarEdicaoInline('conta', id, 'conta', { nome: novoNome, tipo: novoTipo });
}

async function salvarEdicaoSubcontaInline(id) {
    const item = document.querySelector(`[data-subconta-id="${id}"]`);
    const input = item?.querySelector(".subconta-input");
    const novoNome = input?.value.trim();

    if (!novoNome) {
        showAlert("Nome da subconta não pode ser vazio.", "warning");
        input?.focus();
        return;
    }
     await salvarEdicaoInline('subconta', id, 'subconta', { nome: novoNome });
}


// ==============================================
// FUNÇÕES DE CADASTRO (MODAIS)
// ==============================================

// --- Abrir Modais ---
function abrirModal(modalId, modalTitle, bodyHtml, footerHtml) {
    // Remove modal anterior se existir
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }
    // Remove backdrop se existir
    document.querySelector('.modal-backdrop')?.remove();


    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${modalId}Label">${modalTitle}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${bodyHtml}
                    </div>
                    <div class="modal-footer">
                        ${footerHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalElement = document.getElementById(modalId);
    const modalInstance = new bootstrap.Modal(modalElement);

    // Listener para remover o modal do DOM após fechar
    modalElement.addEventListener('hidden.bs.modal', function () {
        modalInstance.dispose(); // Libera recursos do bootstrap
        modalElement.remove();
    });

    modalInstance.show();
}

function abrirModalCategoria() {
    const modalId = "categoriaModal";
    const modalTitle = "Nova Categoria";
    const bodyHtml = `
        <div class="mb-3">
            <label for="nomeNovaCategoria" class="form-label">Nome da Categoria</label>
            <input type="text" class="form-control" id="nomeNovaCategoria" placeholder="Digite o nome">
        </div>`;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" onclick="salvarNovaCategoria()">Salvar</button>`;
    abrirModal(modalId, modalTitle, bodyHtml, footerHtml);
}

function abrirModalConta(categoriaId) {
    const modalId = "contaModal";
    const modalTitle = "Nova Conta";
    const bodyHtml = `
        <div class="mb-3">
            <label for="nomeNovaConta" class="form-label">Nome da Conta</label>
            <input type="text" class="form-control" id="nomeNovaConta" placeholder="Digite o nome">
        </div>
        <div class="mb-3">
            <label for="tipoNovaConta" class="form-label">Tipo</label>
            <select class="form-select" id="tipoNovaConta">
                <option value="Entradas" selected>Entrada</option>
                <option value="Saídas">Saída</option>
            </select>
        </div>
        <input type="hidden" id="categoriaIdConta" value="${categoriaId}">`;
     const footerHtml = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" onclick="salvarNovaConta()">Salvar</button>`;
    abrirModal(modalId, modalTitle, bodyHtml, footerHtml);
}

function abrirModalSubconta(contaId) {
     const modalId = "subcontaModal";
    const modalTitle = "Nova Subconta";
    const bodyHtml = `
        <div class="mb-3">
            <label for="nomeNovaSubconta" class="form-label">Nome da Subconta</label>
            <input type="text" class="form-control" id="nomeNovaSubconta" placeholder="Digite o nome">
        </div>
        <input type="hidden" id="contaIdSubconta" value="${contaId}">`;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" onclick="salvarNovaSubconta()">Salvar</button>`;
    abrirModal(modalId, modalTitle, bodyHtml, footerHtml);
}

// --- Salvar Novos Itens ---
async function salvarNovoItem(tipo, endpoint, data, modalId) {
    try {
        const newItem = await apiRequest(
            `${API_CONFIG.BASE_URL}/${endpoint}`,
            "POST",
            data
        );

        if (newItem) {
             // Fecha o modal específico
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide(); // O listener 'hidden.bs.modal' removerá do DOM
                } else {
                    modalElement.remove(); // Fallback se a instância não for encontrada
                }
            }
            showAlert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} criada com sucesso!`);
            await fetchCategoriasFromAPI(); // Recarrega a lista
        }
        // Se não houve sucesso, apiRequest já mostrou o erro e o modal permanece aberto
    } catch (error) {
        // Erro já tratado e mostrado por apiRequest
        console.error(`Erro ao salvar ${tipo}:`, error);
    }
}

async function salvarNovaCategoria() {
    const nomeInput = document.getElementById("nomeNovaCategoria");
    const nome = nomeInput?.value.trim();
    if (!nome) {
        showAlert("Nome da categoria é obrigatório.", "warning");
        nomeInput?.focus();
        return;
    }
    await salvarNovoItem('categoria', 'categoria-de-conta', { nome: nome }, 'categoriaModal');
}

async function salvarNovaConta() {
    const nomeInput = document.getElementById("nomeNovaConta");
    const tipoSelect = document.getElementById("tipoNovaConta");
    const categoriaIdInput = document.getElementById("categoriaIdConta");

    const nome = nomeInput?.value.trim();
    const tipo = tipoSelect?.value;
    const categoriaId = categoriaIdInput?.value;

    if (!nome || !categoriaId) {
        showAlert("Nome e categoria são obrigatórios.", "warning");
        nomeInput?.focus();
        return;
    }
    const data = {
        idCategoriaDeConta: parseInt(categoriaId), // Garante que seja número
        nome: nome,
        tipo: tipo,
        // Adicione outros campos default se necessário pela API, ex:
        // descricao: "sem descrição",
        // status: "Ativa"
    };
    await salvarNovoItem('conta', 'conta', data, 'contaModal');
}

async function salvarNovaSubconta() {
    const nomeInput = document.getElementById("nomeNovaSubconta");
    const contaIdInput = document.getElementById("contaIdSubconta");

    const nome = nomeInput?.value.trim();
    const contaId = contaIdInput?.value;

     if (!nome || !contaId) {
        showAlert("Nome e conta são obrigatórios.", "warning");
        nomeInput?.focus();
        return;
    }
    const data = {
        id_conta: parseInt(contaId), // Garante que seja número
        nome: nome,
         // Adicione outros campos default se necessário pela API
    };
    await salvarNovoItem('subconta', 'subconta', data, 'subcontaModal');
}


// ==============================================
// FUNÇÕES DE REMOÇÃO
// ==============================================

async function removerItem(tipo, id) {
    const tipoCapitalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    const endpoints = {
        categoria: 'categoria-de-conta',
        conta: 'conta',
        subconta: 'subconta'
    };
    const endpoint = endpoints[tipo];

    if (!endpoint) {
        console.error("Tipo inválido para remoção:", tipo);
        return;
    }

    // Pega o nome para a confirmação (melhor UX)
    let nomeItem = `ID ${id}`;
     const itemElement = document.querySelector(`[data-${tipo}-id="${id}"]`);
     const textoElement = itemElement?.querySelector(`.${tipo}-texto`);
     if (textoElement) {
        // Tenta extrair o nome de forma mais limpa
        nomeItem = textoElement.textContent.split('<')[0].trim(); // Remove badge/outros elementos
        if (!nomeItem) nomeItem = `ID ${id}`; // Fallback
     }


    Swal.fire({
        title: `Excluir ${tipoCapitalizado}?`,
        html: `Tem certeza que deseja excluir "<b>${nomeItem}</b>"?<br/>Esta ação não pode ser desfeita!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const success = await apiRequest(
                    `${API_CONFIG.BASE_URL}/${endpoint}/${id}`,
                    "DELETE"
                );

                if (success) { // apiRequest retorna true para DELETE 204 OK
                    showAlert(`${tipoCapitalizado} removida com sucesso!`);
                    await fetchCategoriasFromAPI(); // Recarrega a lista
                }
                // Se não houve sucesso, apiRequest já mostrou o erro
            } catch (error) {
                // Erro já tratado e mostrado por apiRequest
                console.error(`Erro ao remover ${tipo} ID ${id}:`, error);
            }
        }
    });
}

// ==============================================
// INICIALIZAÇÃO e Funções Globais
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
        // Redirecionamento já tratado em apiRequest, mas podemos parar aqui
        console.log("Token não encontrado na inicialização.");
        window.location.href = "/login.html"; // Adapte
        return;
    }
    fetchCategoriasFromAPI();

    // Listener para o botão principal "Nova Categoria" (se existir fora da lista)
    const btnAddCategoriaGlobal = document.getElementById('btn-nova-categoria'); // Use um ID consistente
    if (btnAddCategoriaGlobal) {
        btnAddCategoriaGlobal.addEventListener('click', abrirModalCategoria);
    }
});

// Expor funções chamadas por 'onclick' no HTML para o escopo global
window.salvarNovaCategoria = salvarNovaCategoria;
window.salvarNovaConta = salvarNovaConta;
window.salvarNovaSubconta = salvarNovaSubconta;
// Funções de clique em texto (para debug ou futura ação) podem permanecer ou ser removidas
// window.mostrarId = (id, nome) => console.log(`Clicou em: ID=${id}, Nome=${nome}`);
