import API_CONFIG from "../urlbase/url.js";
// Função para buscar subcategorias (subcontas)
async function fetchSubcontas() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/subconta`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) throw new Error(`Erro ao buscar subcontas: ${response.status}`);
        const result = await response.json();
        return Object.fromEntries((Array.isArray(result.data) ? result.data : []).map(s => [s.id_subconta, s.nome]));
    } catch (error) {
        console.error("Erro ao buscar subcontas:", error.message);
        return {};
    }
}

// Função para buscar o plano de contas
async function fetchPlanodeContas() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Token de autenticação não encontrado.");

        const response = await fetch(`${API_CONFIG.BASE_URL}/categoria-de-conta`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) throw new Error(`Erro ao buscar dados da API. Status: ${response.status}`);
        const result = await response.json();
        return result.data || result;
    } catch (error) {
        console.error("Erro ao buscar plano de contas:", error.message);
        return [];
    }
}

// Função para buscar contas a receber
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

        if (!contasResponse.ok) throw new Error(`Erro ao buscar contas. Status: ${contasResponse.status}`);
        const result = await contasResponse.json();
        let contas = Array.isArray(result.data) ? result.data : [];
        contas = contas.filter(conta => conta.state !== 1);

        contas.forEach(conta => {
            conta.pcontas = subcontasMap[conta.pcontas] || "N/A";
        });

        return contas;
    } catch (error) {
        console.error("Erro ao buscar contas a receber:", error.message);
        return [];
    }
}

// Função para buscar contas a pagar
async function fetchContasAPagar() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Token de autenticação não encontrado.");

        const [contasResponse, subcontasMap] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}/contaAPagar`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            }),
            fetchSubcontas(),
        ]);

        if (!contasResponse.ok) throw new Error(`Erro ao buscar contas. Status: ${contasResponse.status}`);
        const result = await contasResponse.json();
        let contas = Array.isArray(result.data) ? result.data : [];
        contas = contas.filter(conta => conta.state !== 1);

        contas.forEach(conta => {
            conta.pcontas = subcontasMap[conta.pcontas] || "N/A";
        });

        return contas;
    } catch (error) {
        console.error("Erro ao buscar contas a pagar:", error.message);
        return [];
    }
}

// Função para buscar projetos (exemplo fictício, ajuste conforme sua API)
async function fetchProjetos() {
    try {
        const authToken = localStorage.getItem("authToken");
        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-de-projectos`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) throw new Error(`Erro ao buscar projetos: ${response.status}`);
        const result = await response.json();
        return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
        console.error("Erro ao buscar projetos:", error.message);
        return [];
    }
}

// Função para criar o select de categorias (apenas uma vez)
function criarSelectCategoria(fluxoDeCaixa) {
    const tbody = document.getElementById("tabela-contas-body");
    const existingSelect = document.getElementById("select-categoria");
    if (existingSelect) return; // Não recria se já existe

    const container = document.createElement("div");
    const selectCategoria = document.createElement("select");
    selectCategoria.id = "select-categoria";
    selectCategoria.className="form-control";
    const optionTodas = document.createElement("option");
    optionTodas.value = "todas";
    optionTodas.textContent = "Todas as Categorias";
    selectCategoria.appendChild(optionTodas);

    for (const categoriaNome in fluxoDeCaixa) {
        const option = document.createElement("option");
        option.value = categoriaNome;
        option.textContent = categoriaNome;
        selectCategoria.appendChild(option);
    }

    container.appendChild(selectCategoria);
    tbody.parentElement.insertBefore(container, tbody);

    selectCategoria.addEventListener("change", function () {
        const selectedCategoria = this.value;
        const rows = tbody.querySelectorAll("tr");

        rows.forEach(row => {
            const categoriaRow = row.classList.contains("categoria");
            const contaRow = row.classList.contains("conta");
            const subcontaRow = row.classList.contains("subconta");

            if (categoriaRow) {
                const nomeCategoria = row.querySelector("td label").textContent;
                row.style.display = (selectedCategoria === "todas" || nomeCategoria === selectedCategoria) ? "table-row" : "none";
            } else if (contaRow || subcontaRow) {
                const categoriaPai = row.dataset.categoria;
                row.style.display = (selectedCategoria === "todas" || categoriaPai === selectedCategoria) ? "table-row" : "none";
            }
        });
    });
}

// Função para atualizar o fluxo de caixa com filtros
async function atualizarFluxoDeCaixa(filtroAno = null, filtroProjeto = null, tipoRelatorio = "Realizado") {
    try {
        const [categorias, contasAReceber, contasAPagar, projetos] = await Promise.all([
            fetchPlanodeContas(),
            fetchContasAReceber(),
            fetchContasAPagar(),
            fetchProjetos()
        ]);

        const fluxoDeCaixa = {};
        const anoAtual = new Date().getFullYear(); // 2025

        // Preenche o select de anos
        const selectAno = document.getElementById("country-code-ano");
        selectAno.innerHTML = '<option value="">Selecione um ano</option>';
        for (let ano = 2020; ano <= anoAtual; ano++) {
            const option = document.createElement("option");
            option.value = ano;
            option.textContent = ano;
            selectAno.appendChild(option);
        }
        if (filtroAno) selectAno.value = filtroAno;

        // Preenche o select de projetos
        const selectProjeto = document.getElementById("projectoId");
        selectProjeto.innerHTML = '<option value="">Todos os Projetos</option>';
        projetos.forEach(projeto => {
            const option = document.createElement("option");
            option.value = projeto.id; // Ajuste conforme o campo da API
            option.textContent = projeto.nomeProjecto; // Ajuste conforme o campo da API
            selectProjeto.appendChild(option);
        });
        if (filtroProjeto) selectProjeto.value = filtroProjeto;

        // Inicializa o fluxo de caixa
        categorias.forEach(categoria => {
            fluxoDeCaixa[categoria.nome] = { contas: {}, total: Array(12).fill().map(() => ({ projetado: 0, realizado: 0, av: 0, ah: 0 })) };
            if (categoria.contas && categoria.contas.length > 0) {
                categoria.contas.forEach(conta => {
                    fluxoDeCaixa[categoria.nome].contas[conta.nome] = { subcontas: {}, total: Array(12).fill().map(() => ({ projetado: 0, realizado: 0, av: 0, ah: 0 })) };
                    if (conta.subcontas && conta.subcontas.length > 0) {
                        conta.subcontas.forEach(subconta => {
                            fluxoDeCaixa[categoria.nome].contas[conta.nome].subcontas[subconta.nome] = Array(12).fill().map(() => ({ projetado: 0, realizado: 0, av: 0, ah: 0 }));
                        });
                    }
                });
            }
        });

        // Processa contas a receber com filtros
        contasAReceber.forEach(conta => {
            const anoRecebimento = conta.dataRecebimento ? new Date(conta.dataRecebimento).getFullYear() : null;
            const anoVencimento = conta.data_vencimento ? new Date(conta.data_vencimento).getFullYear() : null;
            const ano = tipoRelatorio === "Realizado" ? anoRecebimento : anoVencimento;

            if (!filtroAno || (filtroAno && ano === parseInt(filtroAno))) {
                if (!filtroProjeto || (filtroProjeto && conta.projectoId === filtroProjeto)) {
                    const subcontaNome = conta.pcontas;
                    const valor = Number(conta.valor) || 0;
                    const mes = tipoRelatorio === "Realizado"
                        ? (conta.dataRecebimento ? new Date(conta.dataRecebimento).getMonth() : null)
                        : (conta.data_vencimento ? new Date(conta.data_vencimento).getMonth() : null);

                    if (mes !== null) {
                        for (const categoriaNome in fluxoDeCaixa) {
                            for (const contaNome in fluxoDeCaixa[categoriaNome].contas) {
                                if (subcontaNome in fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas) {
                                    if (tipoRelatorio === "Realizado") {
                                        fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome][mes].realizado += valor;
                                        fluxoDeCaixa[categoriaNome].contas[contaNome].total[mes].realizado += valor;
                                        fluxoDeCaixa[categoriaNome].total[mes].realizado += valor;
                                    } else {
                                        fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome][mes].projetado += valor;
                                        fluxoDeCaixa[categoriaNome].contas[contaNome].total[mes].projetado += valor;
                                        fluxoDeCaixa[categoriaNome].total[mes].projetado += valor;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Processa contas a pagar com filtros
        contasAPagar.forEach(conta => {
            const anoPagamento = conta.data_pagamento ? new Date(conta.data_pagamento).getFullYear() : null;
            const anoVencimento = conta.data_vencimento ? new Date(conta.data_vencimento).getFullYear() : null;
            const ano = tipoRelatorio === "Realizado" ? anoPagamento : anoVencimento;

            if (!filtroAno || (filtroAno && ano === parseInt(filtroAno))) {
                if (!filtroProjeto || (filtroProjeto && conta.projectoId === filtroProjeto)) {
                    const subcontaNome = conta.pcontas;
                    const valor = Number(conta.valor) || 0;
                    const mes = tipoRelatorio === "Realizado"
                        ? (conta.data_pagamento ? new Date(conta.data_pagamento).getMonth() : null)
                        : (conta.data_vencimento ? new Date(conta.data_vencimento).getMonth() : null);

                    if (mes !== null) {
                        for (const categoriaNome in fluxoDeCaixa) {
                            for (const contaNome in fluxoDeCaixa[categoriaNome].contas) {
                                if (subcontaNome in fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas) {
                                    if (tipoRelatorio === "Realizado") {
                                        fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome][mes].realizado -= valor;
                                        fluxoDeCaixa[categoriaNome].contas[contaNome].total[mes].realizado -= valor;
                                        fluxoDeCaixa[categoriaNome].total[mes].realizado -= valor;
                                    } else {
                                        fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome][mes].projetado -= valor;
                                        fluxoDeCaixa[categoriaNome].contas[contaNome].total[mes].projetado -= valor;
                                        fluxoDeCaixa[categoriaNome].total[mes].projetado -= valor;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        criarSelectCategoria(fluxoDeCaixa); // Cria o select apenas uma vez
        preencherTabelaFluxoDeCaixa(fluxoDeCaixa, tipoRelatorio);

    } catch (error) {
        console.error("Erro ao atualizar fluxo de caixa:", error.message);
    }
}

// Função para preencher a tabela de fluxo de caixa (sem recriar o select)
function preencherTabelaFluxoDeCaixa(fluxoDeCaixa, tipoRelatorio) {
    const tbody = document.getElementById("tabela-contas-body");
    tbody.innerHTML = ''; // Limpa o conteúdo existente da tabela

    for (const categoriaNome in fluxoDeCaixa) {
        const rowCategoria = document.createElement("tr");
        rowCategoria.classList.add("categoria");
        rowCategoria.style.backgroundColor = "#000000";
        rowCategoria.style.color = "#FFFFFF";
        const categoriaCell = document.createElement("td");

        const checkboxCategoria = document.createElement("input");
        checkboxCategoria.type = "checkbox";
        checkboxCategoria.checked = true;
        checkboxCategoria.id = `checkbox-categoria-${categoriaNome}`;
        checkboxCategoria.style.marginRight = "5px";

        const labelCategoria = document.createElement("label");
        labelCategoria.htmlFor = `checkbox-categoria-${categoriaNome}`;
        labelCategoria.textContent = categoriaNome;
        labelCategoria.style.fontWeight = "bold";

        categoriaCell.appendChild(checkboxCategoria);
        categoriaCell.appendChild(labelCategoria);
        rowCategoria.appendChild(categoriaCell);

        const totalCategoria = fluxoDeCaixa[categoriaNome].total;
        let totalProjetadoCat = 0;
        let totalRealizadoCat = 0;
        let totalAVCat = 0;
        let totalAHCat = 0;
        const valoresMensais = totalCategoria.map(mes => tipoRelatorio === "Realizado" ? Number(mes.realizado) || 0 : Number(mes.projetado) || 0);
        totalRealizadoCat = valoresMensais.reduce((acc, val) => acc + val, 0);

        for (let mes = 0; mes < 12; mes++) {
            const dadosMes = totalCategoria[mes];
            const projetado = Number(dadosMes.projetado) || 0;
            const realizado = Number(dadosMes.realizado) || 0;
            const valor = tipoRelatorio === "Realizado" ? realizado : projetado;
            const av = totalRealizadoCat !== 0 ? (valor / totalRealizadoCat) * 100 : 0;
            const mesAnterior = mes > 0 ? valoresMensais[mes - 1] : 0;
            const ah = mesAnterior !== 0 ? ((valor - mesAnterior) / Math.abs(mesAnterior)) * 100 : 0;

            rowCategoria.appendChild(createTableCell(projetado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowCategoria.appendChild(createTableCell(realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowCategoria.appendChild(createTableCell(`${av.toFixed(2)}%`));
            rowCategoria.appendChild(createTableCell(`${ah.toFixed(2)}%`));

            totalProjetadoCat += projetado;
            totalRealizadoCat += realizado;
            totalAVCat += av;
            totalAHCat += ah;
        }

        rowCategoria.appendChild(createTableCell(totalProjetadoCat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
        rowCategoria.appendChild(createTableCell(totalRealizadoCat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
        rowCategoria.appendChild(createTableCell(`${totalAVCat.toFixed(2)}%`));
        rowCategoria.appendChild(createTableCell(`${totalAHCat.toFixed(2)}%`));

        tbody.appendChild(rowCategoria);

        for (const contaNome in fluxoDeCaixa[categoriaNome].contas) {
            const rowConta = document.createElement("tr");
            rowConta.classList.add("conta");
            rowConta.dataset.categoria = categoriaNome;
            rowConta.style.backgroundColor = "#303641";
            rowConta.style.color = "#FFFFFF";
            const contaCell = document.createElement("td");

            const checkboxConta = document.createElement("input");
            checkboxConta.type = "checkbox";
            checkboxConta.checked = true;
            checkboxConta.id = `checkbox-conta-${categoriaNome}-${contaNome}`;
            checkboxConta.style.marginRight = "5px";

            const labelConta = document.createElement("label");
            labelConta.htmlFor = `checkbox-conta-${categoriaNome}-${contaNome}`;
            labelConta.textContent = contaNome;
            labelConta.style.paddingLeft = "20px";

            contaCell.appendChild(checkboxConta);
            contaCell.appendChild(labelConta);
            rowConta.appendChild(contaCell);

            const totalConta = fluxoDeCaixa[categoriaNome].contas[contaNome].total;
            let totalProjetadoConta = 0;
            let totalRealizadoConta = 0;
            let totalAVConta = 0;
            let totalAHConta = 0;
            const valoresMensaisConta = totalConta.map(mes => tipoRelatorio === "Realizado" ? Number(mes.realizado) || 0 : Number(mes.projetado) || 0);
            totalRealizadoConta = valoresMensaisConta.reduce((acc, val) => acc + val, 0);

            for (let mes = 0; mes < 12; mes++) {
                const dadosMes = totalConta[mes];
                const projetado = Number(dadosMes.projetado) || 0;
                const realizado = Number(dadosMes.realizado) || 0;
                const valor = tipoRelatorio === "Realizado" ? realizado : projetado;
                const av = totalRealizadoConta !== 0 ? (valor / totalRealizadoConta) * 100 : 0;
                const mesAnterior = mes > 0 ? valoresMensaisConta[mes - 1] : 0;
                const ah = mesAnterior !== 0 ? ((valor - mesAnterior) / Math.abs(mesAnterior)) * 100 : 0;

                rowConta.appendChild(createTableCell(projetado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowConta.appendChild(createTableCell(realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowConta.appendChild(createTableCell(`${av.toFixed(2)}%`));
                rowConta.appendChild(createTableCell(`${ah.toFixed(2)}%`));

                totalProjetadoConta += projetado;
                totalRealizadoConta += realizado;
                totalAVConta += av;
                totalAHConta += ah;
            }

            rowConta.appendChild(createTableCell(totalProjetadoConta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowConta.appendChild(createTableCell(totalRealizadoConta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowConta.appendChild(createTableCell(`${totalAVConta.toFixed(2)}%`));
            rowConta.appendChild(createTableCell(`${totalAHConta.toFixed(2)}%`));

            tbody.appendChild(rowConta);

            for (const subcontaNome in fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas) {
                const rowSubconta = document.createElement("tr");
                rowSubconta.classList.add("subconta");
                rowSubconta.dataset.categoria = categoriaNome;
                rowSubconta.dataset.conta = contaNome;
                const subcontaCell = document.createElement("td");
                subcontaCell.textContent = subcontaNome;
                subcontaCell.style.paddingLeft = "40px";
                rowSubconta.appendChild(subcontaCell);

                const subcontaData = fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome];
                let totalProjetadoSub = 0;
                let totalRealizadoSub = 0;
                let totalAVSub = 0;
                let totalAHSub = 0;
                const valoresMensaisSub = subcontaData.map(mes => tipoRelatorio === "Realizado" ? Number(mes.realizado) || 0 : Number(mes.projetado) || 0);
                totalRealizadoSub = valoresMensaisSub.reduce((acc, val) => acc + val, 0);

                for (let mes = 0; mes < 12; mes++) {
                    const dadosMes = subcontaData[mes];
                    const projetado = Number(dadosMes.projetado) || 0;
                    const realizado = Number(dadosMes.realizado) || 0;
                    const valor = tipoRelatorio === "Realizado" ? realizado : projetado;
                    const av = totalRealizadoSub !== 0 ? (valor / totalRealizadoSub) * 100 : 0;
                    const mesAnterior = mes > 0 ? valoresMensaisSub[mes - 1] : 0;
                    const ah = mesAnterior !== 0 ? ((valor - mesAnterior) / Math.abs(mesAnterior)) * 100 : 0;

                    rowSubconta.appendChild(createTableCell(projetado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                    rowSubconta.appendChild(createTableCell(realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                    rowSubconta.appendChild(createTableCell(`${av.toFixed(2)}%`));
                    rowSubconta.appendChild(createTableCell(`${ah.toFixed(2)}%`));

                    totalProjetadoSub += projetado;
                    totalRealizadoSub += realizado;
                    totalAVSub += av;
                    totalAHSub += ah;
                }

                rowSubconta.appendChild(createTableCell(totalProjetadoSub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowSubconta.appendChild(createTableCell(totalRealizadoSub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowSubconta.appendChild(createTableCell(`${totalAVSub.toFixed(2)}%`));
                rowSubconta.appendChild(createTableCell(`${totalAHSub.toFixed(2)}%`));

                tbody.appendChild(rowSubconta);
            }

            checkboxConta.addEventListener("change", function () {
                const isChecked = this.checked;
                const rows = tbody.querySelectorAll(`tr[data-conta="${contaNome}"][data-categoria="${categoriaNome}"]`);
                rows.forEach(row => {
                    row.style.display = isChecked ? "table-row" : "none";
                });
            });
        }

        checkboxCategoria.addEventListener("change", function () {
            const isChecked = this.checked;
            const rows = tbody.querySelectorAll(`tr[data-categoria="${categoriaNome}"]`);
            rows.forEach(row => {
                row.style.display = isChecked ? "table-row" : "none";
                if (row.classList.contains("conta")) {
                    const checkboxConta = row.querySelector("input[type='checkbox']");
                    if (checkboxConta) checkboxConta.checked = isChecked;
                }
            });
        });
    }
}

// Função auxiliar para criar células da tabela
function createTableCell(content) {
    const cell = document.createElement("td");
    cell.textContent = content;
    return cell;
}

// Configuração do filtro
document.addEventListener('DOMContentLoaded', () => {
    atualizarFluxoDeCaixa(); // Carrega inicialmente sem filtros

    const btnFiltrar = document.getElementById("btnFiltrar");
    btnFiltrar.addEventListener("click", () => {
        const filtroAno = document.getElementById("country-code-ano").value;
        const filtroProjeto = document.getElementById("projectoId").value || null;
        const tipoRelatorio = document.getElementById("tipo-relatorio").value;

        if (!filtroAno) {
            alert("Por favor, selecione um ano.");
            return;
        }

        atualizarFluxoDeCaixa(filtroAno, filtroProjeto, tipoRelatorio);
    });
});