document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem('authToken');

    if (!token) {
        // Redireciona para a página de login se o usuário não estiver autenticado
        //window.location.href = "/";
    }
});
