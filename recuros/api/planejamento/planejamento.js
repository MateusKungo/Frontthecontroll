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

// Função para salvar os valores planejados
function savePlanejado(categoriaNome, contaNome, subcontaNome, mes, valor) {
    const chave = `planejado_${categoriaNome}_${contaNome}_${subcontaNome}_${mes}`;
    localStorage.setItem(chave, valor);
    console.log(`Planejado salvo: ${chave} = ${valor}`);
}

// Função para carregar os valores planejados
function loadPlanejado(categoriaNome, contaNome, subcontaNome, mes) {
    const chave = `planejado_${categoriaNome}_${contaNome}_${subcontaNome}_${mes}`;
    const valor = localStorage.getItem(chave);
    return valor ? Number(valor) : 0;
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

        // Inicializa o fluxo de caixa com "planejado" vazio
        categorias.forEach(categoria => {
            fluxoDeCaixa[categoria.nome] = {
                contas: {},
                totalPlanejado: Array(13).fill(0),
                totalRealizado: Array(13).fill(0)
            };
            if (categoria.contas && categoria.contas.length > 0) {
                categoria.contas.forEach(conta => {
                    fluxoDeCaixa[categoria.nome].contas[conta.nome] = {
                        subcontas: {},
                        totalPlanejado: Array(13).fill(0),
                        totalRealizado: Array(13).fill(0)
                    };
                    if (conta.subcontas && conta.subcontas.length > 0) {
                        conta.subcontas.forEach(subconta => {
                            fluxoDeCaixa[categoria.nome].contas[conta.nome].subcontas[subconta.nome] = {
                                planejado: Array(13).fill(0), // Initialize empty
                                realizado: Array(13).fill(0)
                            };
                        });
                    }
                });
            }
        });

        // Processa contas a receber (populates "Realizado")
        contasAReceber.forEach(conta => {
            const dataRecebimento = conta.dataRecebimento && !isNaN(new Date(conta.dataRecebimento)) ? new Date(conta.dataRecebimento) : null;
            const valor = Number(conta.valor) || 0;
            const subcontaNome = conta.pcontas;

            if (!dataRecebimento) {
                console.log(`Transação a Receber ignorada - Data inválida: ${conta.dataRecebimento}, Valor: ${valor}, Subconta: ${subcontaNome}`);
                return;
            }

            const ano = dataRecebimento.getFullYear();
            const mes = dataRecebimento.getMonth() + 1;
            console.log(`Processando Receber - Data: ${conta.dataRecebimento}, Ano: ${ano}, Mês: ${mes}, Valor: ${valor}, Subconta: ${subcontaNome}, Projeto: ${conta.projectoId}`);

            if (!filtroAno || ano === parseInt(filtroAno)) {
                if (!filtroProjeto || conta.projectoId === filtroProjeto) {
                    for (const categoriaNome in fluxoDeCaixa) {
                        for (const contaNome in fluxoDeCaixa[categoriaNome].contas) {
                            if (subcontaNome in fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas) {
                                fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome].realizado[mes] += valor;
                                fluxoDeCaixa[categoriaNome].contas[contaNome].totalRealizado[mes] += valor;
                                fluxoDeCaixa[categoriaNome].totalRealizado[mes] += valor;
                                console.log(`Adicionado ${valor} (Realizado) em ${categoriaNome}/${contaNome}/${subcontaNome} no índice ${mes}`);
                            }
                        }
                    }
                }
            }
        });

        // Processa contas a pagar (populates "Realizado")
        contasAPagar.forEach(conta => {
            const dataPagamento = conta.dataRecebimento && !isNaN(new Date(conta.dataRecebimento)) ? new Date(conta.dataRecebimento) : null;
            const valor = Number(conta.valor) || 0;
            const subcontaNome = conta.pcontas;

            if (!dataPagamento) {
                console.log(`Transação a Pagar ignorada - Data inválida: ${conta.dataRecebimento}, Valor: ${valor}, Subconta: ${subcontaNome}`);
                return;
            }

            const ano = dataPagamento.getFullYear();
            const mes = dataPagamento.getMonth() + 1;
            console.log(`Processando Pagar - Data: ${conta.dataRecebimento}, Ano: ${ano}, Mês: ${mes}, Valor: ${valor}, Subconta: ${subcontaNome}, Projeto: ${conta.projectoId}`);

            if (!filtroAno || ano === parseInt(filtroAno)) {
                if (!filtroProjeto || conta.projectoId === filtroProjeto) {
                    for (const categoriaNome in fluxoDeCaixa) {
                        for (const contaNome in fluxoDeCaixa[categoriaNome].contas) {
                            if (subcontaNome in fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas) {
                                fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[subcontaNome].realizado[mes] -= valor;
                                fluxoDeCaixa[categoriaNome].contas[contaNome].totalRealizado[mes] -= valor;
                                fluxoDeCaixa[categoriaNome].totalRealizado[mes] -= valor;
                                console.log(`Subtraído ${valor} (Realizado) em ${categoriaNome}/${contaNome}/${subcontaNome} no índice ${mes}`);
                            }
                        }
                    }
                }
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

    // Calcular totais mensais para AV
    const totaisMensaisPlanejado = Array(13).fill(0);
    const totaisMensaisRealizado = Array(13).fill(0);
    for (let mes = 1; mes <= 12; mes++) {
        for (const categoriaNome in fluxoDeCaixa) {
            totaisMensaisPlanejado[mes] += fluxoDeCaixa[categoriaNome].totalPlanejado[mes];
            totaisMensaisRealizado[mes] += fluxoDeCaixa[categoriaNome].totalRealizado[mes];
        }
    }
    console.log("Totais Mensais Planejado:", totaisMensaisPlanejado.slice(1, 13));
    console.log("Totais Mensais Realizado:", totaisMensaisRealizado.slice(1, 13));

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

        const totalPlanejadoCategoria = fluxoDeCaixa[categoriaNome].totalPlanejado;
        const totalRealizadoCategoria = fluxoDeCaixa[categoriaNome].totalRealizado;

        for (let mes = 1; mes <= 12; mes++) {
            const planejado = Number(totalPlanejadoCategoria[mes]) || 0;
            const realizado = Number(totalRealizadoCategoria[mes]) || 0;
            const diffPlanejadoRealizado = planejado - realizado;
            const realPercent = planejado !== 0 ? (realizado / planejado) * 100 : 0;
            const avPlanejado = totaisMensaisPlanejado[mes] !== 0 ? (planejado / totaisMensaisPlanejado[mes]) * 100 : 0;

            rowCategoria.appendChild(createTableCell(planejado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowCategoria.appendChild(createTableCell(realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowCategoria.appendChild(createTableCell(diffPlanejadoRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
            rowCategoria.appendChild(createTableCell(`${realPercent.toFixed(2)}%`));
            rowCategoria.appendChild(createTableCell(`${avPlanejado.toFixed(2)}%`));
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

            const totalPlanejadoConta = fluxoDeCaixa[categoriaNome].contas[contaNome].totalPlanejado;
            const totalRealizadoConta = fluxoDeCaixa[categoriaNome].contas[contaNome].totalRealizado;

            for (let mes = 1; mes <= 12; mes++) {
                const planejado = Number(totalPlanejadoConta[mes]) || 0;
                const realizado = Number(totalRealizadoConta[mes]) || 0;
                const diffPlanejadoRealizado = planejado - realizado;
                const realPercent = planejado !== 0 ? (realizado / planejado) * 100 : 0;
                const avPlanejado = totalPlanejadoCategoria[mes] !== 0 ? (planejado / totalPlanejadoCategoria[mes]) * 100 : 0;

                rowConta.appendChild(createTableCell(planejado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowConta.appendChild(createTableCell(realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowConta.appendChild(createTableCell(diffPlanejadoRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                rowConta.appendChild(createTableCell(`${realPercent.toFixed(2)}%`));
                rowConta.appendChild(createTableCell(`${avPlanejado.toFixed(2)}%`));
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

                for (let mes = 1; mes <= 12; mes++) {
                    const planejado = loadPlanejado(categoriaNome, contaNome, subcontaNome, mes);
                    const realizado = Number(subcontaData.realizado[mes]) || 0;
                    const diffPlanejadoRealizado = planejado - realizado;
                    const realPercent = planejado !== 0 ? (realizado / planejado) * 100 : 0;
                    const avPlanejado = totalPlanejadoConta[mes] !== 0 ? (planejado / totalPlanejadoConta[mes]) * 100 : 0;

                    // Input for "Projetado" column
                    const cellPlanejado = document.createElement("td");
                    const inputPlanejado = document.createElement("input");
                    inputPlanejado.type = "number";
                    inputPlanejado.value = planejado;
                    inputPlanejado.style.width = "100px";
                    inputPlanejado.dataset.categoria = categoriaNome;
                    inputPlanejado.dataset.conta = contaNome;
                    inputPlanejado.className = "form-control";
                    inputPlanejado.dataset.subconta = subcontaNome;
                    inputPlanejado.dataset.mes = mes;
                    inputPlanejado.addEventListener("change", (e) => {
                        const novoValor = Number(e.target.value) || 0;
                        subcontaData.planejado[mes] = novoValor;
                        savePlanejado(categoriaNome, contaNome, subcontaNome, mes, novoValor);

                        // Update totals
                        totalPlanejadoConta[mes] = 0;
                        for (const sub in fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas) {
                            totalPlanejadoConta[mes] += fluxoDeCaixa[categoriaNome].contas[contaNome].subcontas[sub].planejado[mes];
                        }
                        totalPlanejadoCategoria[mes] = 0;
                        for (const c in fluxoDeCaixa[categoriaNome].contas) {
                            totalPlanejadoCategoria[mes] += fluxoDeCaixa[categoriaNome].contas[c].totalPlanejado[mes];
                        }

                        // Re-render table
                        preencherTabelaFluxoDeCaixa(fluxoDeCaixa);
                    });
                    cellPlanejado.appendChild(inputPlanejado);
                    rowSubconta.appendChild(cellPlanejado);

                    // Static "Realizado" column
                    rowSubconta.appendChild(createTableCell(realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                    rowSubconta.appendChild(createTableCell(diffPlanejadoRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
                    rowSubconta.appendChild(createTableCell(`${realPercent.toFixed(2)}%`));
                    rowSubconta.appendChild(createTableCell(`${avPlanejado.toFixed(2)}%`));
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
    atualizarFluxoDeCaixa();

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