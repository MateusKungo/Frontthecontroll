import API_CONFIG from '../urlbase/url.js';

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede o envio padrão do formulário

    // Captura os dados do formulário
    const email = document.getElementById('exampleInputEmail1').value;
    const password = document.getElementById('exampleInputPassword1').value;

    // Valida os campos do formulário
    if (!email || !password) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos obrigatórios',
            text: 'Por favor, preencha todos os campos.',
        });
        return;
    }

    // Cria um objeto FormData e adiciona os dados
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    // Captura o token existente, se houver
    const token = localStorage.getItem('authToken');

    try {
        // Exibe um loading enquanto a solicitação está em andamento
        Swal.fire({
            title: 'Aguarde',
            text: 'Realizando login...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        // Envia a solicitação POST para o endpoint
        const response = await fetch(`${API_CONFIG.BASE_URL}/user/login`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });

        // Verifica se a resposta é bem-sucedida
        if (response.ok) {
            Swal.close(); // Fecha o loading
            const result = await response.json();

            console.log('Resposta do servidor:', result);





            // Mostra o tipo de usuário no console (ou na interface, se preferir)
            responseMessage.innerHTML = `<div class="alert alert-success">Login bem-sucedido!</div>`;


            // Salva o token e tipo de usuário no armazenamento local
            localStorage.setItem('credenciaEmpresa', JSON.stringify(result));
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userType', result.data.user_userType);

            // Opcional: Redirecionar para outra página após o login


            //const dashboardUrl = "{{route('dashboard')}}";

            // Redirecionar para a rota do dashboard
            window.location.href = '../../../painel.html';

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
                        text: 'Email ou senha incorretos.',
                    });
                    break;
                case 403:
                    Swal.fire({
                        icon: 'warning',
                        title: 'Acesso Negado',
                        text: 'Você não tem permissão para realizar esta ação.',
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
            document.getElementById('responseMessage').innerHTML = `<div class="alert alert-danger">Erro ao conectar ao servidor</div>`;

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
