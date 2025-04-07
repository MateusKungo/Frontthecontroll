import API_CONFIG from '../urlbase/url.js';

async function fetchCountryCodes() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();
        const select = document.getElementById('country-code');
        select.innerHTML = '';

        const countryList = countries
            .filter(country => country.idd && country.idd.root)
            .map(country => {
                const code = country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : '');
                return { name: country.name.common, code };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        countryList.forEach(({ name, code }) => {
            const option = document.createElement('option');
            option.value = code.replace('+', ''); // Remove o "+" ao definir o value
            option.textContent = `${code} - ${name}`;
            select.appendChild(option);
        });

        select.addEventListener('change', updatePhoneNumber);
        document.getElementById('phone-input').addEventListener('input', updatePhoneNumber);
    } catch (error) {
        console.error('Erro ao buscar os códigos de país:', error);
    }
}

function updatePhoneNumber() {
    const countryCode = document.getElementById('country-code').value;
    const phoneNumber = document.getElementById('phone-input').value;
    document.getElementById('phone-number').textContent = `Número completo: +${countryCode} ${phoneNumber}`;
}

fetchCountryCodes();

document.getElementById('clientes').addEventListener('submit', async function(event) {
    event.preventDefault();

    Swal.fire({
        title: 'Por favor, aguarde...',
        text: 'Processando os dados.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    const countryCode = document.getElementById('country-code').value;
    const phoneNumber = document.getElementById('telefone1').value;
    const fullPhoneNumber = `${countryCode.replace('+', '')} ${phoneNumber}`; // Remove o "+" antes de enviar

    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('endereco', document.getElementById('endereco').value);
    formData.append('cidade', document.getElementById('cidade').value);
    formData.append('uf', document.getElementById('uf').value);
    formData.append('telefone1', fullPhoneNumber);
    formData.append('nome_contato', document.getElementById('nome_contato').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('tipo_pessoa', document.getElementById('tipo_pessoa').value);
    formData.append('cnpj_cpf', document.getElementById('cnpj_cpf').value);
    formData.append('tipo_usuario', "cliente");

    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-geral`, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: formData,
        });

        if (response.ok) {
            Swal.close();
            const result = await response.json();
            Swal.fire({
                icon: 'success',
                title: 'Cliente cadastrado!',
                text: 'Cliente cadastrado com sucesso. A página será atualizada.',
                timer: 2000,
                showConfirmButton: false,
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.close();
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Erro ao cadastrar',
                text: errorData.message || 'Ocorreu um erro ao processar sua solicitação.',
            });
            console.error('Erro do servidor:', errorData);
        }
    } catch (error) {
        Swal.close();
        Swal.fire({
            icon: 'error',
            title: 'Erro de Conexão',
            text: `Erro ao conectar com o servidor: ${error.message}`,
        });
        console.error('Erro de conexão:', error);
    }
});
