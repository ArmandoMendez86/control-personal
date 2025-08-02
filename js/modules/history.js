// js/modules/history.js
import { dbAction } from '../database.js';
import { renderReportTable } from './reports.js'; // Importamos la función para reusarla

/**
 * Inicializa la vista de periodos históricos.
 */
export function initHistoryView() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                loadClosedPeriodsList();
            }
        });
    });
    observer.observe(document.getElementById('periodos-historicos'), { attributes: true });
}

/**
 * Carga y muestra la lista de todos los periodos cerrados.
 */
async function loadClosedPeriodsList() {
    const container = document.getElementById('lista-periodos-historicos');
    container.innerHTML = '<tr><td colspan="3" class="text-center p-4">Cargando...</td></tr>';

    try {
        const closedPeriods = await dbAction('periodosCerrados', 'readonly', 'getAll');
        
        if (!closedPeriods || closedPeriods.length === 0) {
            container.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-gray-500">No hay periodos cerrados.</td></tr>';
            return;
        }

        // Ordenar por periodo, del más reciente al más antiguo
        closedPeriods.sort((a, b) => b.periodo.localeCompare(a.periodo));

        container.innerHTML = '';
        closedPeriods.forEach(period => {
            const tr = document.createElement('tr');
            const [year, week] = period.periodo.split('-W');
            const fechaCierre = new Date(period.fechaCierre).toLocaleString('es-MX', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">Semana ${week}, ${year}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${fechaCierre}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="view-report-btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                        Ver Reporte
                    </button>
                </td>
            `;

            tr.querySelector('.view-report-btn').addEventListener('click', () => {
                showHistoricReport(period);
            });

            container.appendChild(tr);
        });

    } catch (error) {
        console.error('Error cargando los periodos históricos:', error);
        container.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-red-500">Error al cargar los periodos.</td></tr>';
    }
}

/**
 * Muestra el detalle de un reporte histórico en un modal.
 * @param {object} periodData - Los datos del periodo cerrado.
 */
function showHistoricReport(periodData) {
    // Reutilizamos la lógica de renderizado de la tabla de reportes, pero en modo solo lectura.
    // Primero, preparamos el contenedor en el modal.
    const modalBody = document.getElementById('historic-report-content');
    modalBody.innerHTML = ''; // Limpiar contenido anterior

    // Creamos un div para que renderReportTable ponga la tabla dentro
    const reportContainer = document.createElement('div');
    reportContainer.id = 'historic-report-container'; // ID único para el contenedor
    modalBody.appendChild(reportContainer);
    
    // Llamamos a la función importada
    renderReportTable(periodData, periodData.conceptos, periodData.periodo, true);
    
    // Modificamos el título del modal
    const [year, week] = periodData.periodo.split('-W');
    document.getElementById('modal-title-historic-report').textContent = `Reporte de la Semana ${week}, ${year}`;
    
    // Abrimos el modal
    const modal = document.getElementById('historic-report-modal');
    if(modal) modal.classList.remove('hidden');
}
