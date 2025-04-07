import API_CONFIG from '../urlbase/url.js';



// Certifique-se de incluir o SweetAlert2
document.getElementById('userForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Exibir o loading
    Swal.fire({
        title: 'Por favor, aguarde...',
        text: 'Processando os dados.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(); // Mostra o loading
        },
    });

    // Obter os dados do formulário
    const formData = new FormData();
    formData.append('nome', document.getElementById('exampleInputName1').value);
    formData.append('cnpj', document.getElementById('exampleInputCNPJ1').value);
    formData.append('endereco', document.getElementById('endereco').value);
    formData.append('telefone', document.getElementById('telefone').value);
    formData.append('email', document.getElementById('exampleInputEmail1').value);
    formData.append('moeda_principal', document.getElementById('moedaPrimicipal').value);
    formData.append('userType', 'administrador'); // Valor fixo para userType
    formData.append('password', document.getElementById('exampleInputPassword1').value);

    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    // Preparação para o token (ainda não usado)
    const token = localStorage.getItem('authToken');
    // Substitua por seu token quando disponível

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/empresa`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });

        if (response.ok) {
            // Fechar o loading e exibir mensagem de sucesso
            Swal.close();
            const result = await response.json();
            console.log('Resposta do servidor:', result);
            Swal.fire({
                icon: 'success',
                title: 'Usuário cadastrado!',
                text: 'Usuário cadastrado com sucesso.',
            }).then(() => {
                window.location.href = '/';
            });
            console.log('Resposta do servidor:', result);
            document.getElementById('userForm').reset();

        } else {
            // Fechar o loading e lidar com erros HTTP
            Swal.close();
            const errorData = await response.json();

            // Tratamento detalhado por status
            switch (response.status) {
                case 400:
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro de Solicitação',
                        text: errorData.message || 'Dados inválidos.',
                    });
                    break;
                case 401:
                    Swal.fire({
                        icon: 'warning',
                        title: 'Erro de Autenticação',
                        text: 'Você não tem permissão para realizar esta ação.',
                    });
                    break;
                case 403:
                    Swal.fire({
                        icon: 'warning',
                        title: 'Acesso Negado',
                        text: 'Verifique suas permissões.',
                    });
                    break;
                case 404:
                    Swal.fire({
                        icon: 'error',
                        title: 'Recurso Não Encontrado',
                        text: 'A URL da API pode estar incorreta.',
                    });
                    break;
                case 422:
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro de Validação',
                        text: errorData.errors
                            ? JSON.stringify(errorData.errors)
                            : errorData.message || 'Confira os dados enviados.',
                    });
                    break;
                case 429:
                    Swal.fire({
                        icon: 'warning',
                        title: 'Muitas Solicitações',
                        text: 'Você atingiu o limite de requisições, tente novamente mais tarde.',
                    });
                    break;
                case 500:
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro Interno do Servidor',
                        text: 'Tente novamente mais tarde.',
                    });
                    break;
                case 503:
                    Swal.fire({
                        icon: 'warning',
                        title: 'Serviço Indisponível',
                        text: 'O servidor está sobrecarregado ou em manutenção.',
                    });
                    break;
                default:
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro Desconhecido',
                        text: errorData.message || 'Ocorreu um problema.',
                    });
            }

            console.error('Erro do servidor:', errorData);
        }
    } catch (error) {
        // Fechar o loading e lidar com erros de rede ou outras exceções
        Swal.close();
        Swal.fire({
            icon: 'error',
            title: 'Erro de Conexão',
            text: 'Erro ao conectar com o servidor: ' + error.message,
        });
        console.error('Erro de conexão:', error);
    }
});
