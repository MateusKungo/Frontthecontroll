import API_CONFIG from "../urlbase/url.js";


// Funções de busca (mantidas iguais)
async function fetchSubcontas() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/subconta`, { method: "GET", headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}`, "Content-Type": "application/json" } });
        if (!response.ok) throw new Error(`Erro ao buscar subcontas: ${response.status}`);
        const result = await response.json();
        return Object.fromEntries((Array.isArray(result.data) ? result.data : []).map(s => [s.id_subconta, s.nome]));
    } catch (error) {
        console.error("Erro ao buscar subcontas:", error.message);
        return {};
    }
}

async function fetchPlanodeContas() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Token de autenticação não encontrado.");
        const response = await fetch(`${API_CONFIG.BASE_URL}/categoria-de-conta`, { method: "GET", headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" } });
        if (!response.ok) throw new Error(`Erro ao buscar dados da API. Status: ${response.status}`);
        const result = await response.json();
        return result.data || result;
    } catch (error) {
        console.error("Erro ao buscar plano de contas:", error.message);
        return [];
    }
}

async function fetchContasAReceber() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Token de autenticação não encontrado.");
        const [contasResponse, subcontasMap] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}/contaAReceber`, { method: "GET", headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" } }),
            fetchSubcontas(),
        ]);
        if (!contasResponse.ok) throw new Error(`Erro ao buscar contas. Status: ${contasResponse.status}`);
        const result = await contasResponse.json();
        let contas = Array.isArray(result.data) ? result.data : [];
        contas = contas.filter(conta => conta.state !== 1);
        contas.forEach(conta => conta.pcontas = subcontasMap[conta.pcontas] || "N/A");
        return contas;
    } catch (error) {
        console.error("Erro ao buscar contas a receber:", error.message);
        return [];
    }
}

async function fetchContasAPagar() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Token de autenticação não encontrado.");
        const [contasResponse, subcontasMap] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}/contaAPagar`, { method: "GET", headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" } }),
            fetchSubcontas(),
        ]);
        if (!contasResponse.ok) throw new Error(`Erro ao buscar contas. Status: ${contasResponse.status}`);
        const result = await contasResponse.json();
        let contas = Array.isArray(result.data) ? result.data : [];
        contas = contas.filter(conta => conta.state !== 1);
        contas.forEach(conta => conta.pcontas = subcontasMap[conta.pcontas] || "N/A");
        return contas;
    } catch (error) {
        console.error("Erro ao buscar contas a pagar:", error.message);
        return [];
    }
}

// Função para processar dados do fluxo de caixa para um período
function processarFluxoDeCaixa(categorias, contasAReceber, contasAPagar, inicioMesAno, fimMesAno, tipoRelatorio = "Realizado") {
    const fluxoDeCaixa = {};

    categorias.forEach(categoria => {
        fluxoDeCaixa[categoria.nome] = { contas: {}, total: Array(12).fill().map(() => ({ projetado: 0, realizado: 0 })) };
        if (categoria.contas && categoria.contas.length > 0) {
            categoria.contas.forEach(conta => {
                fluxoDeCaixa[categoria.nome].contas[conta.nome] = { subcontas: {}, total: Array(12).fill().map(() => ({ projetado: 0, realizado: 0 })) };
                if (conta.subcontas && conta.subcontas.length > 0) {
                    conta.subcontas.forEach(subconta => {
                        fluxoDeCaixa[categoria.nome].contas[conta.nome].subcontas[subconta.nome] = Array(12).fill().map(() => ({ projetado: 0, realizado: 0 }));
                    });
                }
            });
        }
    });

    const [inicioAno, inicioMes] = inicioMesAno.split("-").map(Number);
    const [fimAno, fimMes] = fimMesAno.split("-").map(Number);
    const inicioDate = new Date(inicioAno, inicioMes - 1);
    const fimDate = new Date(fimAno, fimMes);

    contasAReceber.forEach(conta => {
        const data = tipoRelatorio === "Realizado" ? conta.dataRecebimento : conta.data_vencimento;
        if (!data) return;

        const dataConta = new Date(data);
        if (dataConta >= inicioDate && dataConta <= fimDate) {
            const subcontaNome = conta.pcontas;
            const valor = Number(conta.valor) || 0;
            const mes = dataConta.getMonth();

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
    });

    contasAPagar.forEach(conta => {
        const data = tipoRelatorio === "Realizado" ? conta.data_pagamento : conta.data_vencimento;
        if (!data) return;

        const dataConta = new Date(data);
        if (dataConta >= inicioDate && dataConta <= fimDate) {
            const subcontaNome = conta.pcontas;
            const valor = Number(conta.valor) || 0;
            const mes = dataConta.getMonth();

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
    });

    return fluxoDeCaixa;
}

// Função para criar o select de categorias
function criarSelectCategoria(fluxoDeCaixa) {
    const tbody = document.getElementById("dataTable3s").querySelector("tbody");
    const existingSelect = document.getElementById("select-categoria-comparador");
    if (existingSelect) return;

    const container = document.createElement("div");
    const selectCategoria = document.createElement("select");
    selectCategoria.id = "select-categoria-comparador";
    selectCategoria.className = "form-control";
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

// Função para preencher a tabela comparativa
function preencherTabelaComparativa(fluxoA, fluxoB) {
    const tbody = document.getElementById("dataTable3s").querySelector("tbody");
    tbody.innerHTML = '';

    criarSelectCategoria(fluxoA);

    for (const categoriaNome in fluxoA) {
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

        // Período A
        const totalA = fluxoA[categoriaNome].total.reduce((acc, mes) => acc + mes.realizado, 0);
        const mediaA = totalA / 12;
        const valoresMensaisA = fluxoA[categoriaNome].total.map(mes => mes.realizado);
        const avA = totalA !== 0 ? 100 : 0;
        const ahA = valoresMensaisA[0] !== 0 ? ((totalA - valoresMensaisA[0]) / Math.abs(valoresMensaisA[0])) * 100 : 0;

        rowCategoria.appendChild(createTableCell(totalA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
        rowCategoria.appendChild(createTableCell(mediaA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
        rowCategoria.appendChild(createTableCell(`${avA.toFixed(2)}%`));
        rowCategoria.appendChild(createTableCell(`${ahA.toFixed(2)}%`));

        // Período B
        const totalB = fluxoB[categoriaNome].total.reduce((acc, mes) => acc + mes.realizado, 0);
        const mediaB = totalB / 12;
        const valoresMensaisB = fluxoB[categoriaNome].total.map(mes => mes.realizado);
        const avB = totalB !== 0 ? 100 : 0;
        const ahB = valoresMensaisB[0] !== 0 ? ((totalB - valoresMensaisB[0]) / Math.abs(valoresMensaisB[0])) * 100 : 0;

        rowCategoria.appendChild(createTableCell(totalB.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
        rowCategoria.appendChild(createTableCell(mediaB.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
        rowCategoria.appendChild(createTableCell(`${avB.toFixed(2)}%`));
        rowCategoria.appendChild(createTableCell(`${ahB.toFixed(2)}%`));

        tbody.appendChild(rowCategoria);

        for (const contaNome in fluxoA[categoriaNome].contas) {
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

            // Período A
            const totalContaA = fluxoA[categoriaNome].contas[contaNome].total.reduce((acc, mes) => acc + mes.realizado, 0);
            const mediaContaA = totalContaA / 12;
            const valoresMensaisContaA = fluxoA[categoriaNome].contas[contaNome].total.map(mes => mes.realizado);
            const avContaA = totalA !== 0 ? (totalContaA / totalA) * 100 : 0;
            const ahContaA = valoresMensaisContaA[0] !== 0 ? ((totalContaA - valoresMensaisContaA[0]) / Math.abs(valoresMensaisContaA[0])) * 100 : 0;

            rowConta.appendChild(createTableCell(totalContaA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowConta.appendChild(createTableCell(mediaContaA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowConta.appendChild(createTableCell(`${avContaA.toFixed(2)}%`));
            rowConta.appendChild(createTableCell(`${ahContaA.toFixed(2)}%`));

            // Período B
            const totalContaB = fluxoB[categoriaNome].contas[contaNome].total.reduce((acc, mes) => acc + mes.realizado, 0);
            const mediaContaB = totalContaB / 12;
            const valoresMensaisContaB = fluxoB[categoriaNome].contas[contaNome].total.map(mes => mes.realizado);
            const avContaB = totalB !== 0 ? (totalContaB / totalB) * 100 : 0;
            const ahContaB = valoresMensaisContaB[0] !== 0 ? ((totalContaB - valoresMensaisContaB[0]) / Math.abs(valoresMensaisContaB[0])) * 100 : 0;

            rowConta.appendChild(createTableCell(totalContaB.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowConta.appendChild(createTableCell(mediaContaB.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowConta.appendChild(createTableCell(`${avContaB.toFixed(2)}%`));
            rowConta.appendChild(createTableCell(`${ahContaB.toFixed(2)}%`));

            tbody.appendChild(rowConta);

            for (const subcontaNome in fluxoA[categoriaNome].contas[contaNome].subcontas) {
                const rowSubconta = document.createElement("tr");
                rowSubconta.classList.add("subconta");
                rowSubconta.dataset.categoria = categoriaNome;
                rowSubconta.dataset.conta = contaNome;
                const subcontaCell = document.createElement("td");
                subcontaCell.textContent = subcontaNome;
                subcontaCell.style.paddingLeft = "40px";
                rowSubconta.appendChild(subcontaCell);

                // Período A
                const totalSubcontaA = fluxoA[categoriaNome].contas[contaNome].subcontas[subcontaNome].reduce((acc, mes) => acc + mes.realizado, 0);
                const mediaSubcontaA = totalSubcontaA / 12;
                const valoresMensaisSubcontaA = fluxoA[categoriaNome].contas[contaNome].subcontas[subcontaNome].map(mes => mes.realizado);
                const avSubcontaA = totalContaA !== 0 ? (totalSubcontaA / totalContaA) * 100 : 0;
                const ahSubcontaA = valoresMensaisSubcontaA[0] !== 0 ? ((totalSubcontaA - valoresMensaisSubcontaA[0]) / Math.abs(valoresMensaisSubcontaA[0])) * 100 : 0;

                rowSubconta.appendChild(createTableCell(totalSubcontaA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowSubconta.appendChild(createTableCell(mediaSubcontaA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowSubconta.appendChild(createTableCell(`${avSubcontaA.toFixed(2)}%`));
                rowSubconta.appendChild(createTableCell(`${ahSubcontaA.toFixed(2)}%`));

                // Período B
                const totalSubcontaB = fluxoB[categoriaNome].contas[contaNome].subcontas[subcontaNome].reduce((acc, mes) => acc + mes.realizado, 0);
                const mediaSubcontaB = totalSubcontaB / 12;
                const valoresMensaisSubcontaB = fluxoB[categoriaNome].contas[contaNome].subcontas[subcontaNome].map(mes => mes.realizado);
                const avSubcontaB = totalContaB !== 0 ? (totalSubcontaB / totalContaB) * 100 : 0;
                const ahSubcontaB = valoresMensaisSubcontaB[0] !== 0 ? ((totalSubcontaB - valoresMensaisSubcontaB[0]) / Math.abs(valoresMensaisSubcontaB[0])) * 100 : 0;

                rowSubconta.appendChild(createTableCell(totalSubcontaB.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowSubconta.appendChild(createTableCell(mediaSubcontaB.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowSubconta.appendChild(createTableCell(`${avSubcontaB.toFixed(2)}%`));
                rowSubconta.appendChild(createTableCell(`${ahSubcontaB.toFixed(2)}%`));

                tbody.appendChild(rowSubconta);
            }

            checkboxConta.addEventListener("change", function () {
                const isChecked = this.checked;
                const rows = tbody.querySelectorAll(`tr[data-conta="${contaNome}"][data-categoria="${categoriaNome}"]`);
                rows.forEach(row => row.style.display = isChecked ? "table-row" : "none");
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

// Configuração inicial e filtros
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega dados iniciais
    const [categorias, contasAReceber, contasAPagar] = await Promise.all([
        fetchPlanodeContas(),
        fetchContasAReceber(),
        fetchContasAPagar()
    ]);

    // Valores padrão da imagem
    const fluxoA = processarFluxoDeCaixa(categorias, contasAReceber, contasAPagar, "2025-03", "2025-03", "Realizado");
    const fluxoB = processarFluxoDeCaixa(categorias, contasAReceber, contasAPagar, "2025-04", "2025-04", "Realizado");
    preencherTabelaComparativa(fluxoA, fluxoB);

    // Evento de filtragem
    const btnFiltrar = document.getElementById("btnFiltrar");
    btnFiltrar.addEventListener("click", async () => {
        const periodoAInicio = document.getElementById("periodo-a-inicio").value;
        const periodoAFim = document.getElementById("periodo-a-fim").value;
        const periodoBInicio = document.getElementById("periodo-b-inicio").value;
        const periodoBFim = document.getElementById("periodo-b-fim").value;

        if (!periodoAInicio || !periodoAFim || !periodoBInicio || !periodoBFim) {
            alert("Por favor, selecione todos os períodos.");
            return;
        }

        const fluxoA = processarFluxoDeCaixa(categorias, contasAReceber, contasAPagar, periodoAInicio, periodoAFim, "Realizado");
        const fluxoB = processarFluxoDeCaixa(categorias, contasAReceber, contasAPagar, periodoBInicio, periodoBFim, "Realizado");
        preencherTabelaComparativa(fluxoA, fluxoB);
    });
});