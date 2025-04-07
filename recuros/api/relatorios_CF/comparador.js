import API_CONFIG from "../urlbase/url.js";

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

        if (!contasResponse.ok) {
            throw new Error(`Erro ao buscar contas. Status: ${contasResponse.status}`);
        }

        const result = await contasResponse.json();
        let contas = Array.isArray(result.data) ? result.data : [];
        contas = contas.filter((conta) => conta.state !== 1);

        contas.forEach((conta) => {
            conta.nomeConta = subcontasMap[conta.pcontas] || "N/A";
            conta.tipo = "Receber";
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

        if (!contasResponse.ok) {
            throw new Error(`Erro ao buscar contas. Status: ${contasResponse.status}`);
        }

        const result = await contasResponse.json();
        let contas = Array.isArray(result.data) ? result.data : [];
        contas = contas.filter((conta) => conta.state !== 1);

        contas.forEach((conta) => {
            conta.nomeConta = subcontasMap[conta.pcontas] || "N/A";
            conta.tipo = "Pagar";
        });

        return contas;
    } catch (error) {
        console.error("Erro ao buscar contas a pagar:", error.message);
        return [];
    }
}

// Função para buscar subcontas
async function fetchSubcontas() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("Token de autenticação não encontrado.");

        const response = await fetch(`${API_CONFIG.BASE_URL}/subconta`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar subcontas. Status: ${response.status}`);
        }

        const result = await response.json();
        const subcontas = Array.isArray(result.data) ? result.data : [];

        const subcontasMap = {};
        subcontas.forEach((subconta) => {
            subcontasMap[subconta.id] = subconta.nome;
        });

        return subcontasMap;
    } catch (error) {
        console.error("Erro ao buscar subcontas:", error.message);
        return {};
    }
}

// Função para processar os dados para o formato da tabela
function processarDadosParaTabela(contas) {
    const dataCorte = new Date();
    dataCorte.setMonth(dataCorte.getMonth() - 3); // Período A: últimos 3 meses

    // Agrupa contas por tipo e nomeConta
    const agrupadas = contas.reduce((acc, conta) => {
        const key = `${conta.tipo}-${conta.nomeConta}`;
        if (!acc[key]) {
            acc[key] = {
                tipo: conta.tipo,
                nomeConta: conta.nomeConta,
                periodoA: { total: 0, count: 0 },
                periodoB: { total: 0, count: 0 }
            };
        }

        const dataConta = new Date(conta.dataVencimento || conta.dataDocumento);
        if (dataConta < dataCorte) {
            acc[key].periodoA.total += parseFloat(conta.valor) || 0;
            acc[key].periodoA.count++;
        } else {
            acc[key].periodoB.total += parseFloat(conta.valor) || 0;
            acc[key].periodoB.count++;
        }

        return acc;
    }, {});

    // Converte para o formato da tabela
    return Object.values(agrupadas).map(item => {
        const mediaA = item.periodoA.count > 0 ? item.periodoA.total / item.periodoA.count : 0;
        const mediaB = item.periodoB.count > 0 ? item.periodoB.total / item.periodoB.count : 0;

        const totalGeral = item.periodoA.total + item.periodoB.total;
        const avA = totalGeral !== 0 ? (item.periodoA.total / totalGeral) * 100 : 0;
        const avB = totalGeral !== 0 ? (item.periodoB.total / totalGeral) * 100 : 0;
        const ah = item.periodoA.total !== 0 ?
            ((item.periodoB.total - item.periodoA.total) / Math.abs(item.periodoA.total)) * 100 : 0;

        return {
            tipo: item.tipo,
            nome: item.nomeConta,
            totalA: item.periodoA.total,
            mediaA: mediaA,
            avA: avA,
            ah: ah,
            totalB: item.periodoB.total,
            mediaB: mediaB,
            avB: avB
        };
    });
}

// Função para popular a tabela
function populateComparativeTable(dados) {
    const tbody = document.querySelector("#dataTable3s tbody");
    tbody.innerHTML = '';

    // Agrupa por tipo (Pagar/Receber)
    const porTipo = dados.reduce((acc, item) => {
        if (!acc[item.tipo]) {
            acc[item.tipo] = [];
        }
        acc[item.tipo].push(item);
        return acc;
    }, {});

    // Adiciona categorias principais e subcategorias
    for (const [tipo, itens] of Object.entries(porTipo)) {
        // Calcula totais por tipo
        const totalTipoA = itens.reduce((sum, item) => sum + item.totalA, 0);
        const totalTipoB = itens.reduce((sum, item) => sum + item.totalB, 0);
        const mediaTipoA = totalTipoA / itens.length;
        const mediaTipoB = totalTipoB / itens.length;

        // AV e AH para a categoria principal
        const totalGeralTipo = totalTipoA + totalTipoB;
        const avTipoA = totalGeralTipo !== 0 ? (totalTipoA / totalGeralTipo) * 100 : 0;
        const avTipoB = totalGeralTipo !== 0 ? (totalTipoB / totalGeralTipo) * 100 : 0;
        const ahTipo = totalTipoA !== 0 ? ((totalTipoB - totalTipoA) / Math.abs(totalTipoA)) * 100 : 0;

        // Cria linha da categoria principal
        const categoriaId = tipo === 'Receber' ? 1 : 2;
        const catRow = document.createElement('tr');
        catRow.className = 'category';
        catRow.setAttribute('data-category', categoriaId);
        catRow.innerHTML = `
            <td><i class="fa fa-plus-circle"></i> ${tipo === 'Receber' ? 'Receitas' : 'Despesas'}</td>
            <td>${formatCurrency(totalTipoA)}</td>
            <td>${formatCurrency(mediaTipoA)}</td>
            <td>${avTipoA.toFixed(1)}%</td>
            <td>${ahTipo.toFixed(1)}%</td>
            <td>${formatCurrency(totalTipoB)}</td>
            <td>${formatCurrency(mediaTipoB)}</td>
            <td>${avTipoB.toFixed(1)}%</td>
            <td>${ahTipo.toFixed(1)}%</td>
        `;
        tbody.appendChild(catRow);

        // Adiciona subcategorias (itens individuais)
        itens.forEach((item) => {
            const subRow = document.createElement('tr');
            subRow.className = 'subcategory';
            subRow.setAttribute('data-parent', categoriaId);
            subRow.style.display = 'none';
            subRow.innerHTML = `
                <td style="padding-left: 30px;">${item.nome}</td>
                <td>${formatCurrency(item.totalA)}</td>
                <td>${formatCurrency(item.mediaA)}</td>
                <td>${item.avA.toFixed(1)}%</td>
                <td>${item.ah.toFixed(1)}%</td>
                <td>${formatCurrency(item.totalB)}</td>
                <td>${formatCurrency(item.mediaB)}</td>
                <td>${item.avB.toFixed(1)}%</td>
                <td>${item.ah.toFixed(1)}%</td>
            `;
            tbody.appendChild(subRow);
        });
    }

    // Adiciona eventos de clique para expandir/recolher
    document.querySelectorAll('.category').forEach(row => {
        row.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-category');
            const subcategories = document.querySelectorAll(`.subcategory[data-parent="${categoryId}"]`);
            const icon = this.querySelector('i');

            subcategories.forEach(sub => {
                sub.style.display = sub.style.display === 'none' ? 'table-row' : 'none';
            });

            icon.classList.toggle('fa-plus-circle');
            icon.classList.toggle('fa-minus-circle');
        });
    });
}

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value).replace('R$', '').trim();
}

// Função principal para carregar os dados
async function loadData() {
    try {
        const [contasReceber, contasPagar] = await Promise.all([
            fetchContasAReceber(),
            fetchContasAPagar()
        ]);

        const dadosTabela = processarDadosParaTabela([...contasReceber, ...contasPagar]);
        populateComparativeTable(dadosTabela);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
