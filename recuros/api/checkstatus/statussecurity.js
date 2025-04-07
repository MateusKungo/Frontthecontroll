
import API_CONFIG from "../urlbase/url.js";
async function checkApiStatus() {
    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            console.warn("Token de autenticação não encontrado. Redirecionando para login...");
            window.location.href = "/";
            return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-geral`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Status da resposta:", response.status);

        if (response.status === 401) {
            console.warn("Token inválido ou expirado. Redirecionando para login...");
            window.location.href = "/login.html";
        } else if (response.status === 500) {
            console.error("Erro interno no servidor. Tente novamente mais tarde.");
            window.location.href = "/";
        } else if (!response.ok) {
            console.error(`Erro ao conectar à API. Status: ${response.status}`);
        } else {
            console.log("API está acessível.");
        }
    } catch (error) {
        console.error("Erro ao verificar o status da API:", error.message);
    }
}

// Chama a função ao carregar a página
checkApiStatus();

// Atualiza a página a cada 3 minutos
setInterval(() => {
    location.reload();
}, 180000);
