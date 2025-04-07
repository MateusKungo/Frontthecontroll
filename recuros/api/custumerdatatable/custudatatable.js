$(document).ready(function() {
    if ($.fn.DataTable.isDataTable('#dataTable3')) {
        $('#dataTable3').DataTable().destroy();
    }

    $('#dataTable3').DataTable({
        paging: false,
        searching: false,
        language: {
            decimal: ",",
            thousands: ".",
            lengthMenu: "Mostrar _MENU_ registros por página",
            zeroRecords: "Nenhum registro encontrado",
            info: "",
            infoEmpty: "",
            infoFiltered: "(filtrado de _MAX_ registros no total)",
          //  search: "Pesquisar:",
            paginate: {
                first: "Primeiro",
                last: "Último",
                next: "Próximo",
                previous: "Anterior"
            }
        },
        columnDefs: [{
                orderable: false,
                targets: '_all'
            } // Desativa a ordenação para todas as colunas
        ]
    });

    // Remover as classes de ordenação após inicializar o DataTable
    $('#dataTable3 th').removeClass('sorting sorting_asc sorting_desc');
});
