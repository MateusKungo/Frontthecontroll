

document.addEventListener('DOMContentLoaded', function() {
    const formAdicionarConta = document.getElementById('formAdicionarConta');

    if (formAdicionarConta) {
        formAdicionarConta.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nome = document.getElementById('nome').value;
            const tipo = document.getElementById('tipo').value;

            const formData = {
                nome: nome,
                tipo: tipo,
                descricao: 'sem descrição',
            };

            try {
                const token = localStorage.getItem('authToken');
                console.log('Token:', token); // Debug

                const response = await fetch('https://thecontroll.com/public/api/conta', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });

                console.log('Response status:', response.status); // Debug
                const data = await response.json();
                console.log('Response data:', data); // Debug

                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao cadastrar conta');
                }

                // Mostra mensagem de sucesso
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Conta cadastrada com sucesso!',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Limpa o formulário
                formAdicionarConta.reset();

                // Fecha o modal (corrected for Bootstrap 5)
                const modalElement = document.getElementById('modalAdicionarConta');
                const modal = new bootstrap.Modal(modalElement);
                modal.hide();

                // Recarrega a lista de contas
                carregarContas();

            } catch (error) {
                console.error('Erro detalhado:', error); // Debug
                Swal.fire({
                    icon: 'error',
                    title: 'Erro!',
                    text: error.message || 'Erro ao cadastrar conta. Tente novamente.'
                });
            }
        });
    }
});
