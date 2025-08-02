// js/modules/reports.js
import { dbAction } from '../database.js';
import { showToast, getWeekNumber, getDatesOfWeek } from '../utils.js';
import { openModal, closeModal, renderEmptyState } from '../ui.js';

let currentReportData = [];
let currentReportConcepts = [];

export function initReportsView() {
    const generateBtn = document.getElementById('btn-generar-reporte');
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePayrollReport);
    }
    
    const exportBtn = document.getElementById('btn-exportar-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReportToCSV);
    }

    const justifyForm = document.getElementById('form-justificar');
    if (justifyForm) {
        justifyForm.addEventListener('submit', handleSaveJustificaciones);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                setCurrentWeek();
                initializeReportView();
            }
        });
    });
    const reportsView = document.getElementById('reportes');
    if (reportsView) {
        observer.observe(reportsView, { attributes: true });
    }
}

function initializeReportView() {
    const container = document.getElementById('reporte-container');
    renderEmptyState(
        container,
        'fas fa-file-invoice-dollar',
        'Reporte de Pre-Nómina',
        'Seleccione una semana y haga clic en "Generar Reporte" para ver el desglose de pagos.',
    );
    document.getElementById('btn-exportar-csv').classList.add('hidden');
}

function setCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    const weekInput = document.getElementById('semana-reporte');
    if (weekInput) {
        weekInput.value = `${year}-W${String(week).padStart(2, '0')}`;
    }
};

async function generatePayrollReport() {
    const weekInput = document.getElementById('semana-reporte').value;
    if (!weekInput) {
        showToast('Por favor, seleccione una semana.', 'warning');
        return;
    }
    
    const container = document.getElementById('reporte-container');
    container.innerHTML = '<div class="flex justify-center items-center p-8"><div class="loader"></div><p class="ml-4">Generando reporte...</p></div>';
    
    try {
        const response = await fetch(`http://localhost/control-personal/api/reportes?periodo=${weekInput}`);
        if (!response.ok) {
            throw new Error('La respuesta de la API de reportes no fue exitosa.');
        }
        const reportData = await response.json();
        const conceptos = await dbAction('conceptos', 'readonly', 'getAll');
        
        currentReportData = reportData;
        currentReportConcepts = conceptos.filter(c => c.activo);
        renderReportTable(currentReportData, currentReportConcepts, weekInput);
        document.getElementById('btn-exportar-csv').classList.remove('hidden');

    } catch (error) {
        console.error("Error generando el reporte:", error);
        showToast("Error al generar el reporte.", "error");
        renderEmptyState(container, 'fas fa-exclamation-triangle', 'Error', 'Ocurrió un error al generar el reporte.');
    }
};

function renderReportTable(data, conceptos, periodo) {
    const container = document.getElementById('reporte-container');
    container.innerHTML = '';
    
    if (data.length === 0) {
        renderEmptyState(container, 'fas fa-users-slash', 'No hay empleados activos', 'No se puede generar un reporte sin empleados activos.');
        return;
    }

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'bg-white shadow-md rounded-xl overflow-hidden';

    let tableHTML = `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200" id="report-table">
        <thead class="bg-gray-50"><tr>
            <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persona</th>
            <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sueldo Base</th>
            <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faltas</th>
            <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Extras</th>`;
    conceptos.forEach(c => tableHTML += `<th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${c.nombre}</th>`);
    tableHTML += `<th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Pago Semana</th></tr></thead>
        <tbody class="bg-white divide-y divide-gray-200">`;

    data.forEach(item => {
        const pagoHorasExtras = parseFloat(item.horas_extras_totales) * parseFloat(item.pago_por_hora_extra);
        const faltasNoJustificadas = item.faltas.filter(f => !f.justificada).length;
        const faltasJustificadas = item.faltas.length - faltasNoJustificadas;
        const sueldoDiario = item.dias_laborales > 0 ? parseFloat(item.sueldo_semanal) / item.dias_laborales : 0;
        const descuentoPorFaltas = faltasNoJustificadas * sueldoDiario;

        tableHTML += `<tr data-empleado-id="${item.empleado_id}">
            <td class="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900" data-value="${item.nombre_completo}">${item.nombre_completo}</td>
            <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-500" data-value="${item.sueldo_semanal}">$${parseFloat(item.sueldo_semanal).toFixed(2)}</td>
            <td class="px-2 py-2 whitespace-nowrap text-sm text-red-500 font-bold" data-value="${-descuentoPorFaltas}">
                ${item.faltas.length > 0 ? `<button class="faltas-btn bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200">
                    ${faltasNoJustificadas} (-$${descuentoPorFaltas.toFixed(2)}) 
                    <span class="text-green-600 font-normal">${faltasJustificadas > 0 ? ` / ${faltasJustificadas} just.` : ''}</span>
                </button>` : '0'}
            </td>
            <td class="px-2 py-2 whitespace-nowrap text-sm text-green-600" data-value="${pagoHorasExtras}">
                <div>${parseFloat(item.horas_extras_totales).toFixed(2)} hrs</div>
                <div class="font-bold">$${pagoHorasExtras.toFixed(2)}</div>
            </td>`;
        conceptos.forEach(c => {
            const monto = item.transacciones[c.id] || 0;
            const isChecked = monto > 0;
            const isReadOnly = c.monto_fijo > 0;
            const textColor = c.tipo === 'PERCEPCION' ? 'text-green-700' : 'text-red-700';
            
            tableHTML += `<td class="px-1 py-1" data-value="${c.tipo === 'PERCEPCION' ? monto : -monto}"><div class="flex items-center space-x-1">
                <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 concept-checkbox" data-concepto-id="${c.id}" ${isChecked ? 'checked' : ''}>
                <input type="number" class="w-24 p-1 border rounded-md report-input font-semibold ${textColor}" data-concepto-id="${c.id}" data-monto-fijo="${c.monto_fijo}" data-tipo="${c.tipo}" value="${parseFloat(monto).toFixed(2)}" ${!isChecked || isReadOnly ? 'disabled' : ''} ${isReadOnly ? 'bg-gray-100' : ''}>
            </div></td>`;
        });
        tableHTML += `<td class="pago-semana px-2 py-2 whitespace-nowrap text-sm font-bold text-gray-800" data-value="0"></td></tr>`;
    });

    tableHTML += `</tbody><tfoot class="bg-gray-100 font-bold"><tr>
        <td class="px-2 py-3 text-right">TOTALES</td>
        <td id="total-sueldo" class="px-2 py-3"></td>
        <td id="total-faltas" class="px-2 py-3 text-red-600"></td>
        <td id="total-extras" class="px-2 py-3 text-green-600"></td>`;
    conceptos.forEach(c => {
        const textColor = c.tipo === 'PERCEPCION' ? 'text-green-700' : 'text-red-700';
        tableHTML += `<td id="total-concepto-${c.id}" class="px-2 py-3 ${textColor}"></td>`
    });
    tableHTML += `<td id="gran-total" class="px-2 py-3 text-lg"></td></tr></tfoot></table></div>`;
    
    tableWrapper.innerHTML = tableHTML;
    container.appendChild(tableWrapper);

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'p-4 flex justify-end bg-white rounded-b-xl';
    actionsWrapper.innerHTML = `<button id="btn-guardar-nomina" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>`;
    tableWrapper.appendChild(actionsWrapper);
    
    container.querySelectorAll('.concept-checkbox').forEach(cb => cb.addEventListener('change', handleConceptCheckboxChange));
    container.querySelectorAll('.report-input').forEach(input => {
        input.addEventListener('input', e => {
            const inputEl = e.target;
            const cell = inputEl.closest('td');
            const tipo = inputEl.dataset.tipo;
            const monto = parseFloat(inputEl.value) || 0;
            cell.dataset.value = tipo === 'PERCEPCION' ? monto : -monto;
            updateRowTotal(inputEl.closest('tr'));
        });
    });
    container.querySelectorAll('.faltas-btn').forEach(btn => btn.addEventListener('click', e => {
        const row = e.target.closest('tr');
        const empleadoId = parseInt(row.dataset.empleadoId);
        const empleadoNombre = row.cells[0].textContent;
        const faltasData = data.find(d => d.empleado_id === empleadoId).faltas;
        openJustificarModal(empleadoId, empleadoNombre, faltasData);
    }));
    document.getElementById('btn-guardar-nomina').addEventListener('click', () => savePayrollChanges(periodo));
    
    container.querySelectorAll('#report-table tbody tr').forEach(updateRowTotal);
}

function handleConceptCheckboxChange(e) {
    const checkbox = e.target;
    const row = checkbox.closest('tr');
    const input = row.querySelector(`.report-input[data-concepto-id="${checkbox.dataset.conceptoId}"]`);
    const montoFijo = parseFloat(input.dataset.montoFijo);
    const isReadOnly = montoFijo > 0;

    if (checkbox.checked) {
        if (!isReadOnly) input.disabled = false;
        if (montoFijo > 0 && parseFloat(input.value) === 0) {
            input.value = montoFijo.toFixed(2);
        }
        if (!isReadOnly) input.focus();
    } else {
        input.disabled = true;
        input.value = "0.00";
    }
    const cell = input.closest('td');
    const tipo = input.dataset.tipo;
    const monto = parseFloat(input.value) || 0;
    cell.dataset.value = tipo === 'PERCEPCION' ? monto : -monto;
    updateRowTotal(row);
};

function updateRowTotal(row) {
    if (!row) return;
    let pagoNeto = 0;
    row.querySelectorAll('td[data-value]').forEach(cell => {
        if (!cell.classList.contains('pago-semana') && !isNaN(parseFloat(cell.dataset.value))) {
            pagoNeto += parseFloat(cell.dataset.value);
        }
    });
    const pagoSemanaCell = row.querySelector('.pago-semana');
    pagoSemanaCell.textContent = `$${pagoNeto.toFixed(2)}`;
    pagoSemanaCell.dataset.value = pagoNeto;
    updateTableTotals();
};

function updateTableTotals() {
    const table = document.getElementById('report-table');
    if (!table) return;
    const headers = Array.from(table.querySelectorAll('thead th'));
    const totals = new Array(headers.length).fill(0);

    table.querySelectorAll('tbody tr').forEach(row => {
        row.querySelectorAll('td').forEach((cell, index) => {
            if (index > 0 && !isNaN(parseFloat(cell.dataset.value))) {
                totals[index] += parseFloat(cell.dataset.value);
            }
        });
    });

    headers.forEach((header, index) => {
        if (index > 0) {
            const totalCell = table.querySelector(`tfoot td:nth-child(${index + 1})`);
            if (totalCell) totalCell.textContent = `$${totals[index].toFixed(2)}`;
        }
    });
};

async function savePayrollChanges(periodo) {
    const rows = document.querySelectorAll('#report-table tbody tr');
    const transacciones = [];
    rows.forEach(row => {
        const empleadoId = parseInt(row.dataset.empleadoId);
        row.querySelectorAll('.report-input').forEach(input => {
            transacciones.push({
                empleado_id: empleadoId,
                concepto_id: parseInt(input.dataset.conceptoId),
                monto: parseFloat(input.value) || 0
            });
        });
    });

    try {
        await fetch('http://localhost/control-personal/api/transacciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ periodo, transacciones })
        });
        showToast('Cambios en la nómina guardados.', 'success');
    } catch (error) {
        showToast('Error al guardar cambios en la nómina.', 'error');
    }
}

function openJustificarModal(empleadoId, empleadoNombre, faltasData) {
    document.getElementById('modal-title-justificar').textContent = `Gestionar Faltas de ${empleadoNombre}`;
    document.getElementById('justificar-empleado-id').value = empleadoId;
    const container = document.getElementById('lista-faltas');
    container.innerHTML = '';
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    faltasData.forEach(falta => {
        const fechaObj = new Date(falta.fecha + 'T00:00:00');
        const diaSemana = dias[fechaObj.getUTCDay()];
        container.innerHTML += `<div class="p-2 border rounded-md">
            <div class="flex items-center justify-between">
                <label for="justificar-${falta.fecha}" class="flex items-center cursor-pointer">
                    <input type="checkbox" id="justificar-${falta.fecha}" data-fecha="${falta.fecha}" class="h-4 w-4 rounded border-gray-300 justificacion-cb" ${falta.justificada ? 'checked' : ''}>
                    <span class="ml-3 font-medium">${diaSemana}, ${falta.fecha}</span>
                </label>
            </div>
            <div class="mt-2">
                <label for="motivo-${falta.fecha}" class="text-sm text-gray-600">Motivo:</label>
                <input type="text" id="motivo-${falta.fecha}" value="${falta.motivo || ''}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm justificacion-motivo" ${!falta.justificada ? 'disabled' : ''}>
            </div>
        </div>`;
    });
    
    container.querySelectorAll('.justificacion-cb').forEach(cb => cb.addEventListener('change', e => {
        const motivoInput = container.querySelector(`#motivo-${e.target.dataset.fecha}`);
        motivoInput.disabled = !e.target.checked;
        if(!e.target.checked) motivoInput.value = '';
    }));

    openModal('justificar-modal');
};

async function handleSaveJustificaciones(e) {
    e.preventDefault();
    const empleadoId = parseInt(document.getElementById('justificar-empleado-id').value);
    const faltas = [];
    document.querySelectorAll('#lista-faltas .justificacion-cb').forEach(cb => {
        faltas.push({
            fecha: cb.dataset.fecha,
            justificada: cb.checked,
            motivo: document.getElementById(`motivo-${cb.dataset.fecha}`).value
        });
    });

    try {
        await fetch('http://localhost/control-personal/api/justificaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empleado_id: empleadoId, faltas: faltas })
        });
        showToast('Justificaciones guardadas.', 'success');
        closeModal();
        generatePayrollReport();
    } catch (error) {
        showToast("Error al guardar justificaciones.", "error");
    }
};

function exportReportToCSV() {
    if (currentReportData.length === 0) {
        showToast("No hay datos para exportar.", "warning");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = Array.from(document.querySelectorAll('#report-table thead th')).map(th => `"${th.textContent.trim()}"`);
    csvContent += headers.join(",") + "\r\n";
    document.querySelectorAll('#report-table tbody tr').forEach(row => {
        const csvRow = [];
        row.querySelectorAll('td').forEach((cell) => {
            csvRow.push(`"${cell.textContent.trim().replace(/"/g, '""')}"`);
        });
        csvContent += csvRow.join(",") + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const weekInput = document.getElementById('semana-reporte').value;
    link.setAttribute("download", `prenomina_${weekInput}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
