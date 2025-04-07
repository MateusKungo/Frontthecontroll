// Recupera os dados do localStorage
const credenciaEmpresa = localStorage.getItem('credenciaEmpresa');

if (credenciaEmpresa) {
    // Converte a string JSON para objeto
    const dados = JSON.parse(credenciaEmpresa);

    // Obtém o valor da moeda principal
    const moedaPrincipal = dados.data.empresa_moeda_principal;

    // Seleciona todos os elementos com id "moedaPais"
    const elementosMoeda = document.querySelectorAll('#moedaPais');

    // Atualiza o texto de cada elemento
    elementosMoeda.forEach((elemento) => {
        elemento.textContent = moedaPrincipal;
    });
} else {
    console.error("Dados não encontrados no localStorage.");
}

export function getToken() {
    const token = localStorage.getItem('token');
    console.log('Token recuperado:', token); // Debug
    return token;
}

export function setToken(token) {
    localStorage.setItem('token', token);
    console.log('Token salvo:', token); // Debug
}
