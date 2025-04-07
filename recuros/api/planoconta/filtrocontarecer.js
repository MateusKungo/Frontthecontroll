
// Function to generate IDs for all accounts
function gerarIds(contas, prefixoPai = '') {
    let contadorLocal = 1;
    return contas.map(conta => {
        // Start revenue accounts with 3.1 and others with their sequential numbers
        const baseNumber = conta.tipo === "Entrada" ? "3.1" : String(contadorLocal);
        const id = prefixoPai ? `${prefixoPai}.${String(contadorLocal).padStart(2, '0')}` : baseNumber;
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

    select.innerHTML = '<option value="">Selecione uma conta</option>';
    const contasComIds = gerarIds(contas);
    const contasEntrada = contasComIds.filter(conta => conta.tipo === "Entrada");

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
