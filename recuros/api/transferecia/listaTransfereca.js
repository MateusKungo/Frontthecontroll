import API_CONFIG from "../urlbase/url.js";
// 🚀 Função para buscar bancos e armazená-los em um mapa (ID → Nome)
async function fetchBancos() {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) throw new Error("Token de autenticação não encontrado.");

    const response = await fetch(`${API_CONFIG.BASE_URL}/cadastro-de-bancos`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok)
      throw new Error(`Erro na API. Status: ${response.status}`);

    const result = await response.json();
    const bancos = result.data || result;

    if (!Array.isArray(bancos))
      throw new Error("Os dados da API não são uma lista válida.");

    // Criar um mapa { idBanco: nomeBanco }
    const bancosMap = {};
    bancos.forEach((banco) => {
      bancosMap[banco.id] = banco.nomeBanco;
    });

    return bancosMap;
  } catch (error) {
    console.error("Erro ao buscar bancos:", error.message);
    return {};
  }
}

// 🚀 Função para buscar e listar transferências na tabela
async function fetchTransferencias() {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) throw new Error("Token de autenticação não encontrado.");

    // 🔥 Buscar bancos primeiro para usar os nomes
    const bancosMap = await fetchBancos();

    const response = await fetch(`${API_CONFIG.BASE_URL}/transferencia`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok)
      throw new Error(`Erro na API. Status: ${response.status}`);

    const result = await response.json();
    const transferencias = result.data || result;

    if (!Array.isArray(transferencias))
      throw new Error("Os dados da API não são uma lista válida.");

    console.log("Transferências obtidas:", transferencias);
    populateTransferenciasTable(transferencias, bancosMap);
  } catch (error) {
    console.error("Erro ao buscar transferências:", error.message);
  }
}

// 🚀 Função para preencher a tabela com as transferências
function populateTransferenciasTable(transferencias, bancosMap) {
  const tableBody = document.querySelector("#dataTable3 tbody");
  tableBody.innerHTML = "";

  // Filter out transfers with state
  const filteredTransferencias = transferencias.filter(
    (transferencia) => !transferencia.state
  );

  // Recupera a moeda principal do localStorage
  const credenciaEmpresa = localStorage.getItem("credenciaEmpresa");
  let moedaPrincipal = "R$"; // Valor padrão

  if (credenciaEmpresa) {
    try {
      const dados = JSON.parse(credenciaEmpresa);
      moedaPrincipal = dados.data.empresa_moeda_principal || "R$";
    } catch (error) {
      console.error("Erro ao recuperar a moeda principal:", error);
    }
  }

  filteredTransferencias.forEach((transferencia, index) => {
    const nomeBancoSaida =
      bancosMap[transferencia.saiuNoBanco] || "Desconhecido";
    const nomeBancoEntrada =
      bancosMap[transferencia.entrouNoBanco] || "Desconhecido";

    const row = `
            <tr>
                <td>#00${index+1}</td>
                <td>${formatDate(transferencia.dataTransferencia) || "N/A"}</td>
                <td>
                    <i class="fa fa-arrow-up text-danger mr-2"></i> ${nomeBancoSaida}
                </td>
                <td>
                    <i class="fa fa-arrow-down text-success mr-2"></i> ${nomeBancoEntrada}
                </td>
                <td>${transferencia.descricao || "Sem descrição"}</td>

                <td>${moedaPrincipal} ${parseFloat(
      transferencia.valorTransferencia
    ).toFixed(2)}</td>

                <td>
                    <ul class="d-flex justify-content-center">

                        <li class="mr-2">
                            <a href="#" class="btn btn-sm btn-danger btn-delete-user" data-id="${
                              transferencia.id
                            }">
                                <i class="fas fa-trash"></i>
                            </a>
                        </li>
                        <li class="mr-2">
                            <a href="#" class="btn btn-sm btn-secondary  btn-update-user" data-toggle="modal" data-target=".editTransfer" data-id="${
                              transferencia.id
                            }">
                               <i class="fas fa-edit"></i>
                            </a>
                        </li>
                         <li>
                            <a href="#" class="btn btn-sm btn-primary  btn-read-user"  data-id="${
                              transferencia.id
                            }">
                                <i class="fas fa-file-pdf"></i>
                            </a>
                        </li>
                    </ul>
                </td>
            </tr>
        `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });

  // Remove addEditButtonsEvent() since it's not needed
  addDeleteButtonsEvent();
  addUpdateButtonsEvent();
  addReadComprivativoButtonsEvent();
}

// Update the delete button event handler
function addDeleteButtonsEvent() {
  const deleteButtons = document.querySelectorAll(".btn-delete-user");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      const id = button.dataset.id;
      console.log("Attempting to delete transfer:", id);

      const result = await Swal.fire({
        title: "Você tem certeza?",
        text: "Esta transferência será excluída permanentemente!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sim, deletar!",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        try {
          const authToken = localStorage.getItem("authToken");
          const response = await fetch(
            `${API_CONFIG.BASE_URL}/transferencia/${id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          await Swal.fire({
            icon: "success",
            title: "Sucesso!",
            text: "Transferência excluída com sucesso!",
          });

          // Refresh the table
          await fetchTransferencias();
        } catch (error) {
          console.error("Error:", error);
          Swal.fire({
            icon: "error",
            title: "Erro!",
            text: "Não foi possível excluir a transferência.",
          });
        }
      }
    });
  });
}
function addUpdateButtonsEvent() {
  const updateButtons = document.querySelectorAll(".btn-update-user");
  updateButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      const id = button.dataset.id;
      console.log(id);

      try {
        const authToken = localStorage.getItem("authToken");
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/transferencia/${id}}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        transferDados = JSON.parse(response);

        /*const response2 = await fetch(`${API_CONFIG.BASE_URL}/transferencia/pegarComprovativo/${filename}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });*/

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        /*await Swal.fire({
                        icon: 'success',
                        title: 'Sucesso!',
                        text: 'Transferência excluída com sucesso!'
                    });*/

        // Refresh the table
        await fetchTransferencias();
      } catch (error) {}
    });
  });
}
function addReadComprivativoButtonsEvent() {
  const readButtons = document.querySelectorAll(".btn-read-user");

  readButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;

      try {
        const authToken = localStorage.getItem("authToken");

        // Busca os dados da transferência
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/transferencia/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Aqui pegamos o nome do comprovativo do JSON retornado
        const filename = data.data.comprovativo;

        console.log(data.data.comprovativo)
        // Monta a URL para o arquivo
        //fileUrl  = `${API_CONFIG.BASE_URL}/transferencia/pegarComprovativo/${filename}`;

        // Abre em nova aba
        //console.log(fileUrl);
        window.open(`${API_CONFIG.BASE_URL}/transferencia/pegarComprovativo/${filename}`, '_blank');
      } catch (error) {
        console.error("Erro ao tentar abrir o comprovativo:", error);
      }
    });
  });
}

// 🚀 Carregar as transferências ao iniciar
document.addEventListener("DOMContentLoaded", fetchTransferencias);

// Add this function at the end of the file
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
