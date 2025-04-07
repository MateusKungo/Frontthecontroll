// Função para carregar contas de saída no select
let contas = [
    {
      "nome": "Receita/Faturamento",
      "tipo": "Entrada",
      "subcontas": [

        { "nome": "Receita com Produtos" },
        { "nome": "Fabricação Própria" },
        { "nome": "Cópias" },
        { "nome": "Receita com Reformas" },
        { "nome": "Receita com Serviços" },
        { "nome": "Consultoria Start Financeiro" },
        { "nome": "Consultoria Preço Certo" },
        { "nome": "Imersão Preço Certo" },
        { "nome": "Palestras" },
        { "nome": "Cursos" },
        { "nome": "Treinamentos" },
        { "nome": "Receitas com Terceiros" },
        { "nome": "Outras Receitas" },
        { "nome": "Cartão de Crédito" },
        { "nome": "Entradas Não Operacionais" },
        { "nome": "Empréstimos obtidos" },
        { "nome": "Juros de Aplicações" },
        { "nome": "Capitalização dos sócios" },
        { "nome": "Venda de equipamentos usados" },
        { "nome": "Fretes" }
      ]
    },
    {
      "nome": "Custos Variáveis",
      "tipo": "Saída",
      "subcontas": [
        { "nome": "Custos Tributários ou Financeiros" },
        { "nome": "Simples Nacional" },
        { "nome": "Taxas de Cartões" },
        { "nome": "Taxas de Boleto" },
        { "nome": "PIS" },
        { "nome": "Confis" },
        { "nome": "ISS" },
        { "nome": "IPI" },
        { "nome": "ICMS" },
        { "nome": "Custo de Produtos" },
        { "nome": "Fornecedores de Insumos (Matéria Prima)" },
        { "nome": "Fornecedores de Revenda de Produtos" },
        { "nome": "Custos com Embalagem" },
        { "nome": "Custos com Sacolas" },
        { "nome": "Copos Plásticos" },
        { "nome": "Custos com Vendas" },
        { "nome": "Comissão interna" },
        { "nome": "Comissão externa" },
        { "nome": "Frete" },
        { "nome": "Outros Custos Variáveis" },
        { "nome": "Taxas Bancárias" },
        { "nome": "Taxa TED/DOC" },
        { "nome": "Aluguel de Máquinas de Cartão" }
      ]
    },
    {
      "nome": "Despesas Administrativas",
      "tipo": "Saída",
      "subcontas": [
        { "nome": "Água" },
        { "nome": "Aluguel" },
        { "nome": "Condomínio" },
        { "nome": "Telefone + Internet" },
        { "nome": "IPTU" },
        { "nome": "Limpeza e Conservação" },
        { "nome": "Energia Elétrica" },
        { "nome": "Celular" },
        { "nome": "Táxi / Uber" },
        { "nome": "Almoço / Supermercado / Lanches" },
        { "nome": "Correios" },
        { "nome": "Mensalidade de Softwares" },
        { "nome": "Alarme Monitorado / Segurança" }
      ]
    },
    {
      "nome": "Despesas com Pessoal",
      "tipo": "Saída",
      "subcontas": [
        { "nome": "Pró-Labore" },
        { "nome": "Salário de Funcionários" },
        { "nome": "Bolsa de Estágio" },
        { "nome": "Vale Transporte" },
        { "nome": "Vale Refeição" },
        { "nome": "INSS - Federação - Sindicato - IR" },
        { "nome": "13º e Férias" },
        { "nome": "FGTS" },
        { "nome": "Plano de Saúde" }
      ]
    },
    {
      "nome": "Investimentos",
      "tipo": "Saída",
      "subcontas": [
        { "nome": "Investimentos em Marketing" },
        { "nome": "Papelaria (folder, cartão visitas, etc.)" },
        { "nome": "Site / Internet" },
        { "nome": "Mídias/ Propaganda" },
        { "nome": "Realização Eventos" },
        { "nome": "Prestadores de serviços de marketing" },
        { "nome": "Investimentos em Bens" },
        { "nome": "Compra de Equipamentos de Informática" },
        { "nome": "Reformas / Estrutura" },
        { "nome": "Compra de Veículos" },
        { "nome": "Investimentos em Desenvolvimento" },
        { "nome": "Consultorias" },
        { "nome": "Treinamentos" },
        { "nome": "Cursos" },
        { "nome": "Outros Investimentos" }
      ]
    }
  ];

// Function to generate IDs for all accounts
function gerarIds(contas, prefixoPai = '') {
    let contadorLocal = 1;
    let contadorPrincipal = 0;
    return contas.map(conta => {
        // For main categories (no prefix)
        if (!prefixoPai) {
            const baseNumber = conta.tipo === "Entrada" ? "3.1" : `4.${contadorPrincipal}`;
            contadorPrincipal++;

            const novaConta = {
                ...conta,
                id: baseNumber,
                numeroConta: baseNumber
            };

            if (novaConta.subcontas && novaConta.subcontas.length > 0) {
                novaConta.subcontas = gerarIds(novaConta.subcontas, baseNumber);
            }

            return novaConta;
        }

        // For subcategories (with prefix)
        const id = `${prefixoPai}.${String(contadorLocal).padStart(2, '0')}`;
        contadorLocal++;

        const novaConta = {
            ...conta,
            id: id,
            numeroConta: id
        };

        if (novaConta.subcontas && novaConta.subcontas.length > 0) {
            novaConta.subcontas = gerarIds(novaConta.subcontas, id);
        }

        return novaConta;
    });
}

function adicionarContasRecursivamente(contas, nivel = 0) {
    contas.forEach(conta => {
        const option = document.createElement('option');
        const tab = '\u00A0\u00A0\u00A0\u00A0'.repeat(nivel);

        if (nivel === 0) {
            option.textContent = `${conta.numeroConta} - ${conta.nome.toUpperCase()}`;
            option.classList.add('conta-principal');
            option.disabled = true;
            option.value = '';
        } else {
            const isCategory = conta.subcontas && conta.subcontas.length > 0;
            option.textContent = `${tab}${conta.numeroConta} - ${conta.nome}`;
            option.classList.add('subconta');
            option.classList.add(`nivel-${nivel}`);
            if (isCategory) {
                option.classList.add('categoria');
            }
            option.disabled = false;
            option.value = conta.id;
        }

        select.appendChild(option);

        if (conta.subcontas && conta.subcontas.length > 0) {
            adicionarContasRecursivamente(conta.subcontas, nivel + 1);
        }
    });
}

function carregarContasSaida() {
    const select = document.getElementById('contaId');
    if (!select) {
        console.error('Elemento select não encontrado');
        return;
    }

    // Limpar o select
    select.innerHTML = '<option value="">Selecione uma conta</option>';

    // Generate IDs for contas array
    const contasComIds = gerarIds(contas);

    // Filtrar contas de entrada
    const contasEntrada = contasComIds.filter(conta => conta.tipo === "Saída");

    // Função recursiva para adicionar contas e subcontas
    function adicionarContasRecursivamente(contas, nivel = 0) {
        contas.forEach(conta => {
            const option = document.createElement('option');
            const tab = '\u00A0\u00A0\u00A0\u00A0'.repeat(nivel);

            if (nivel === 0) {
                // Main titles with number
                option.textContent = `${conta.numeroConta} - ${conta.nome.toUpperCase()}`;
                option.classList.add('conta-principal');
                option.disabled = true;
                option.value = '';
            } else {
                const isCategory = conta.subcontas && conta.subcontas.length > 0;
                option.textContent = `${tab}${conta.numeroConta} - ${conta.nome}`;
                option.classList.add('subconta');
                option.classList.add(`nivel-${nivel}`);
                if (isCategory) {
                    option.classList.add('categoria');
                }
                option.disabled = false;
                option.value = conta.id;
            }

            select.appendChild(option);

            if (conta.subcontas && conta.subcontas.length > 0) {
                adicionarContasRecursivamente(conta.subcontas, nivel + 1);
            }
        });
    }

    // Iniciar adição recursiva das contas
    adicionarContasRecursivamente(contasEntrada);
}

// Adicionar estilo para melhorar a visualização das opções
const style = document.createElement('style');
style.textContent = `
    #contaId {
        font-family: system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
        font-size: 1rem;
        line-height: 1.5;
    }

    #contaId option {
        padding: 0.375rem 0.75rem;
    }

    #contaId option:disabled {
        color: var(--bs-gray-600);
    }

    #contaId option.conta-principal,
    #contaId option.categoria {
        font-weight: 700;
    }

    #contaId option.nivel-1:not(:disabled) {
        color: var(--bs-primary);
        font-weight: 500;
    }

    #contaId option.nivel-2 {
        padding-left: 3rem;
        font-style: italic;
    }
`;
document.head.appendChild(style);

// Chamar a função quando a página carregar
// Add this before the DOMContentLoaded event listener
document.getElementById('contaId').addEventListener('change', function() {
    const selectedId = this.value;

});

document.addEventListener('DOMContentLoaded', carregarContasSaida);
