document.addEventListener('DOMContentLoaded', function() {
    const storedData = localStorage.getItem("credenciaEmpresa");
    const usernamesistem = document.getElementById('usernamesistem');
    const userInitials = document.getElementById('userInitials');

    if (storedData) {
        const parsedData = JSON.parse(storedData);

        if (usernamesistem) {
            const userName = parsedData.data.user_nome;
            usernamesistem.innerText = userName;

            // Generate and set initials
            if (userInitials) {
                const initials = userName
                    .split(' ')
                    .map(name => name[0])
                    .join('')
                    .substring(0, 2);
                userInitials.textContent = initials;
            }
        }
    } else {
        console.log("Nenhum dado encontrado no localStorage.");
        // Optionally redirect to login
        // window.location.href = '/login';
    }

    // Adicionar evento de clique para o logout
    document.getElementById('logoutButton').addEventListener('click', function(e) {
        e.preventDefault();

        // Mostrar confirmação antes de fazer logout
        Swal.fire({
            title: 'Tem certeza?',
            text: "Você realmente deseja terminar a sessão?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, terminar sessão',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Limpar o token de autenticação e outros dados do localStorage
                localStorage.removeItem('authToken');
                localStorage.removeItem('credenciaEmpresa');

                // Mostrar mensagem de sucesso
                Swal.fire({
                    title: 'Sessão terminada',
                    text: 'Você foi desconectado com sucesso.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Redirecionar para a página de login ou inicial
                    window.location.href = '/'; // Altere para sua URL de login
                });
            }
        });
    });
});


function updateSystemTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('systemTime').textContent = timeString;
}

// Update time every second
setInterval(updateSystemTime, 1000);
// Initial call
updateSystemTime();