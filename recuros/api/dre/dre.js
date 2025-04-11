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
        alert("Não foi possível carregar as subcategorias. Tente novamente mais tarde.");
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
        alert("Não foi possível carregar o plano de contas. Tente novamente mais tarde.");
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

        console.log("Contas a Receber retornadas:", contas);
        return contas;
    } catch (error) {
        console.error("Erro ao buscar contas a receber:", error.message);
        alert("Não foi possível carregar as contas a receber. Tente novamente mais tarde.");
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

        console.log("Contas a Pagar retornadas:", contas);
        return contas;
    } catch (error) {
        console.error("Erro ao buscar contas a pagar:", error.message);
        alert("Não foi possível carregar as contas a pagar. Tente novamente mais tarde.");
        return [];
    }
}

// Função para buscar projetos
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
        alert("Não foi possível carregar os projetos. Tente novamente mais tarde.");
        return [];
    }
}

// Função para criar o select de categorias
function criarSelectCategoria(fluxoDeCaixa) {
    const tbody = document.getElementById("tabela-contas-body");
    const existingSelect = document.getElementById("select-categoria");
    if (existingSelect) return;

    const container = document.createElement("div");
    const selectCategoria = document.createElement("select");
    selectCategoria.id = "select-categoria";
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

// Função para atualizar o fluxo de caixa
async function atualizarFluxoDeCaixa(filtroAno = null, filtroProjeto = null) {
    try {
        const [categorias, contasAReceber, contasAPagar, projetos] = await Promise.all([
            fetchPlanodeContas(),
            fetchContasAReceber(),
            fetchContasAPagar(),
            fetchProjetos()
        ]);

        const fluxoDeCaixa = {};
        const anoAtual = new Date().getFullYear();

        // Preenche o select de anos
        const selectAno = document.getElementById("country-code-ano");
        selectAno.innerHTML = '<option value="">Selecione um ano</option>';
        for (let ano = 2020; ano <= anoAtual + 1; ano++) {
            const option = document.createElement("option");
            option.value = ano;
            option.textContent = ano;
            selectAno.appendChild(option);
        }
        if (filtroAno) selectAno.value = filtroAno;
        console.log("Filtro de Ano selecionado:", filtroAno);

        // Preenche o select de projetos
        const selectProjeto = document.getElementById("projectoId");
        selectProjeto.innerHTML = '<option value="">Todos os Projetos</option>';
        projetos.forEach(projeto => {
            const option = document.createElement("option");
            option.value = projeto.id;
            option.textContent = projeto.nomeProjecto;
            selectProjeto.appendChild(option);
        });
        if (filtroProjeto) selectProjeto.value = filtroProjeto;
        console.log("Filtro de Projeto selecionado:", filtroProjeto);

        // Inicializa o fluxo de caixa com 13 elementos (0 a 12), índice 0 não usado
        categorias.forEach(categoria => {
            fluxoDeCaixa[categoria.nome] = { contas: {}, total: Array(13).fill(0) };
            if (categoria.contas && categoria.contas.length > 0) {
                categoria.contas.forEach(conta => {
                    fluxoDeCaixa[categoria.nome].contas[conta.nome] = { subcontas: {}, total: Array(13).fill(0) };
                    if (conta.subcontas && conta.subcontas.length > 0) {
                        conta.subcontas.forEach(subconta => {
                            fluxoDeCaixa[categoria.nome].contas[conta.nome].subcontas[subconta.nome] = Array(13).fill(0);
                        });
                    }
                });
            }
        });

        // Processa contas a receber com base em dataRecebimento
        contasAReceber.forEach(conta => {
            const dataRecebimento = conta.dataRecebimento && !isNaN(new Date(conta.dataRecebimento)) ? new Date(conta.dataRecebimento) : null;
            const valor = Number(conta.valor) || 0;
            const subcontaNome = conta.pcontas;

            if (!dataRecebimento) {
                console.log(`Transação a Receber ignorada - Data inválida: ${conta.dataRecebimento}, Valor: ${valor}, Subconta: ${subcontaNome}`);
                return;
            }

            const ano = dataRecebimento.getFullYear();
            const mes = dataRecebimento.getMonth() + 1; // Janeiro = 1, Abril = 4, Dezembro = 12
            console.log(`Processando Receber - Data: ${conta.dataRecebimento}, Ano: ${ano}, Mês: ${mes}, Valor: ${valor}, Subconta: ${subcontaNome}, Projeto: ${conta.projectoId}`);

            if (!filtroAno || ano === parseInt(filtroAno)) {
                if (!filtroProjeto || conta.projectoId === filtroProjeto) {
                    for (const categoriaNome in fluxoDeCaixa) {
                        for (const contaNome in fluxoDeCaixa[categoriaNome].contas) {
                            if (subcontaNome in fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas) {
                                fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome][mes] += valor;
                                fluxoDeCaixa[categoriaNome].contas[contaNome].total[mes] += valor;
                                fluxoDeCaixa[categoriaNome].total[mes] += valor;
                                console.log(`Adicionado ${valor} em ${categoriaNome}/${contaNome}/${subcontaNome} no índice ${mes}`);
                            }
                        }
                    }
                } else {
                    console.log(`Transação a Receber filtrada por projeto - Projeto: ${conta.projectoId}, Filtro: ${filtroProjeto}`);
                }
            } else {
                console.log(`Transação a Receber filtrada por ano - Ano: ${ano}, Filtro: ${filtroAno}`);
            }
        });

        // Processa contas a pagar com base em dataRecebimento
        contasAPagar.forEach(conta => {
            const dataPagamento = conta.dataRecebimento && !isNaN(new Date(conta.dataRecebimento)) ? new Date(conta.dataRecebimento) : null;
            const valor = Number(conta.valor) || 0;
            const subcontaNome = conta.pcontas;

            if (!dataPagamento) {
                console.log(`Transação a Pagar ignorada - Data inválida: ${conta.dataRecebimento}, Valor: ${valor}, Subconta: ${subcontaNome}`);
                return;
            }

            const ano = dataPagamento.getFullYear();
            const mes = dataPagamento.getMonth() + 1; // Janeiro = 1, Abril = 4, Dezembro = 12
            console.log(`Processando Pagar - Data: ${conta.dataRecebimento}, Ano: ${ano}, Mês: ${mes}, Valor: ${valor}, Subconta: ${subcontaNome}, Projeto: ${conta.projectoId}`);

            if (!filtroAno || ano === parseInt(filtroAno)) {
                if (!filtroProjeto || conta.projectoId === filtroProjeto) {
                    for (const categoriaNome in fluxoDeCaixa) {
                        for (const contaNome in fluxoDeCaixa[categoriaNome].contas) {
                            if (subcontaNome in fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas) {
                                fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome][mes] -= valor;
                                fluxoDeCaixa[categoriaNome].contas[contaNome].total[mes] -= valor;
                                fluxoDeCaixa[categoriaNome].total[mes] -= valor;
                                console.log(`Subtraído ${valor} em ${categoriaNome}/${contaNome}/${subcontaNome} no índice ${mes}`);
                            }
                        }
                    }
                } else {
                    console.log(`Transação a Pagar filtrada por projeto - Projeto: ${conta.projectoId}, Filtro: ${filtroProjeto}`);
                }
            } else {
                console.log(`Transação a Pagar filtrada por ano - Ano: ${ano}, Filtro: ${filtroAno}`);
            }
        });

        criarSelectCategoria(fluxoDeCaixa);
        preencherTabelaFluxoDeCaixa(fluxoDeCaixa);

        console.log("Fluxo de Caixa final:", fluxoDeCaixa);

    } catch (error) {
        console.error("Erro ao atualizar fluxo de caixa:", error.message);
        alert("Erro ao carregar o fluxo de caixa. Tente novamente mais tarde.");
    }
}

// Função para preencher a tabela de fluxo de caixa
function preencherTabelaFluxoDeCaixa(fluxoDeCaixa) {
    const tbody = document.getElementById("tabela-contas-body");
    const fragment = document.createDocumentFragment();

    // Calcular os totais mensais de entradas ou saídas para AV
    const totaisMensais = Array(13).fill(0); // Índice 0 não usado
    for (let mes = 1; mes <= 12; mes++) {
        for (const categoriaNome in fluxoDeCaixa) {
            totaisMensais[mes] += fluxoDeCaixa[categoriaNome].total[mes];
        }
    }
    console.log("Totais Mensais para AV:", totaisMensais.slice(1, 13));

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
        console.log(`Categoria ${categoriaNome} - Valores por mês:`, totalCategoria.slice(1, 13));

        for (let mes = 1; mes <= 12; mes++) {
            const valor = Number(totalCategoria[mes]) || 0;
            // AV: proporção do valor da categoria em relação ao total mensal (todas as categorias)
            const av = totaisMensais[mes] !== 0 ? (valor / totaisMensais[mes]) * 100 : 0;
            // AH: comparação com o mês anterior
            const mesAnterior = mes > 1 ? totalCategoria[mes - 1] : 0;
            const ah = mesAnterior !== 0 ? ((valor - mesAnterior) / Math.abs(mesAnterior)) * 100 : 0;

            rowCategoria.appendChild(createTableCell(valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowCategoria.appendChild(createTableCell(`${av.toFixed(2)}%`));
            rowCategoria.appendChild(createTableCell(`${ah.toFixed(2)}%`));
        }

        fragment.appendChild(rowCategoria);

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
            console.log(`Conta ${contaNome} - Valores por mês:`, totalConta.slice(1, 13));

            for (let mes = 1; mes <= 12; mes++) {
                const valor = Number(totalConta[mes]) || 0;
                // AV: proporção do valor da conta em relação ao total da categoria no mesmo mês
                const av = totalCategoria[mes] !== 0 ? (valor / totalCategoria[mes]) * 100 : 0;
                // AH: comparação com o mês anterior
                const mesAnterior = mes > 1 ? totalConta[mes - 1] : 0;
                const ah = mesAnterior !== 0 ? ((valor - mesAnterior) / Math.abs(mesAnterior)) * 100 : 0;

                rowConta.appendChild(createTableCell(valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowConta.appendChild(createTableCell(`${av.toFixed(2)}%`));
                rowConta.appendChild(createTableCell(`${ah.toFixed(2)}%`));
            }

            fragment.appendChild(rowConta);

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
                console.log(`Subconta ${subcontaNome} - Valores por mês:`, subcontaData.slice(1, 13));

                for (let mes = 1; mes <= 12; mes++) {
                    const valor = Number(subcontaData[mes]) || 0;
                    // AV: proporção do valor da subconta em relação ao total da conta no mesmo mês
                    const av = totalConta[mes] !== 0 ? (valor / totalConta[mes]) * 100 : 0;
                    // AH: comparação com o mês anterior
                    const mesAnterior = mes > 1 ? subcontaData[mes - 1] : 0;
                    const ah = mesAnterior !== 0 ? ((valor - mesAnterior) / Math.abs(mesAnterior)) * 100 : 0;

                    rowSubconta.appendChild(createTableCell(valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                    rowSubconta.appendChild(createTableCell(`${av.toFixed(2)}%`));
                    rowSubconta.appendChild(createTableCell(`${ah.toFixed(2)}%`));
                }

                fragment.appendChild(rowSubconta);
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

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

// Função auxiliar para criar células da tabela
function createTableCell(content) {
    const cell = document.createElement("td");
    cell.textContent = content;
    return cell;
}

// Configuração do filtro
document.addEventListener('DOMContentLoaded', () => {
    atualizarFluxoDeCaixa(); // Carrega sem filtro inicial

    const btnFiltrar = document.getElementById("btnFiltrar");
    btnFiltrar.addEventListener("click", () => {
        const filtroAno = document.getElementById("country-code-ano").value;
        const filtroProjeto = document.getElementById("projectoId").value || null;

        if (!filtroAno) {
            alert("Por favor, selecione um ano.");
            return;
        }

        atualizarFluxoDeCaixa(filtroAno, filtroProjeto);
    });
});