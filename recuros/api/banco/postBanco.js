import API_CONFIG from '../urlbase/url.js';
document.getElementById('formCadastroBanco').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Exibir o loading
    Swal.fire({
        title: 'Por favor, aguarde...',
        text: 'Processando os dados.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    // Obter os dados do formulário
    const formData = new FormData();
    formData.append('nomeBanco', document.getElementById('nomeBanco').value);
    formData.append('valorConta', document.getElementById('valorBanco')?.value || '');

    // Buscar o token do localStorage
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-de-bancos`, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
                'Accept': 'application/json'
            },
            body: formData,
        });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            result = { message: "Erro desconhecido no servidor" };
        }

        Swal.close();

        if (response.ok) {

            showAlert('Banco cadastrado com sucesso.', 'success');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erro ao cadastrar',
                text: result.message || 'Ocorreu um erro ao processar sua solicitação.',
            });
            console.error('Erro do servidor:', result);
        }
    } catch (error) {
        Swal.close();
        showAlert('Erro ao conectar com o servidor.', 'error');

        console.error('Erro de conexão:', error);
    }
});


function showAlert(message, type = 'success') {
    Swal.fire({
        html: message, // Permite HTML no conteúdo
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    }).then(() => {
        location.reload();
    }); ;
}
