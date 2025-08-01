// js/modules/reports.js
import { db, dbAction } from '../database.js'; // <--- CAMBIO: Se importa "db"
import { showToast, getWeekNumber, getDatesOfWeek } from '../utils.js';
import { openModal, closeModal } from '../ui.js';

let currentReportData = [];
let currentReportConcepts = [];

/**
 * Inicializa la vista de reportes, configurando listeners.
 */
export function initReportsView() {
    document.getElementById('btn-generar-reporte').addEventListener('click', generatePayrollReport);
    document.getElementById('btn-exportar-csv').addEventListener('click', exportReportToCSV);
    document.getElementById('form-justificar').addEventListener('submit', handleSaveJustificaciones);

    // Cargar la vista cuando se navega a ella
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                setCurrentWeek();
            }
        });
    });
    observer.observe(document.getElementById('reportes'), { attributes: true });
}

/**
 * Establece el input de semana al valor de la semana actual.
 */
function setCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    const weekInput = document.getElementById('semana-reporte');
    if (weekInput) {
        weekInput.value = `${year}-W${String(week).padStart(2, '0')}`;
    }
};

/**
 * Genera y muestra el reporte de pre-nómina para la semana seleccionada.
 */
async function generatePayrollReport() {
    const weekInput = document.getElementById('semana-reporte').value;
    if (!weekInput) {
        showToast('Por favor, seleccione una semana.', 'warning');
        return;
    }
    
    const container = document.getElementById('reporte-container');
    container.innerHTML = '<div class="flex justify-center items-center p-8"><div class="loader"></div><p class="ml-4">Generando reporte...</p></div>';

    try {
        const datesOfWeek = getDatesOfWeek(weekInput);
        const periodo = weekInput;

        const tx = db.transaction(['empleados', 'registrosAsistencia', 'conceptos', 'transaccionesNomina', 'justificaciones'], 'readonly'); // Esto ahora funcionará
        const empleados = await new Promise(r => tx.objectStore('empleados').getAll().onsuccess = e => r(e.target.result));
        const conceptos = await new Promise(r => tx.objectStore('conceptos').getAll().onsuccess = e => r(e.target.result));
        const asistenciaStore = tx.objectStore('registrosAsistencia');
        const transaccionesStore = tx.objectStore('transaccionesNomina');
        const justificacionesStore = tx.objectStore('justificaciones');
        
        const reportData = [];
        for (const empleado of empleados.filter(e => e.activo)) {
            let horasExtrasTotales = 0;
            let fechasDeFaltas = [];

            for (let i = 0; i < empleado.diasLaborales; i++) {
                const fecha = datesOfWeek[i];
                const registrosDelDia = await new Promise(r => asistenciaStore.index('empleado_fecha').getAll([empleado.id, fecha]).onsuccess = e => r(e.target.result));
                
                if (registrosDelDia.length > 0) {
                    const ultimoRegistro = registrosDelDia[registrosDelDia.length - 1];
                    if (ultimoRegistro.horaSalida) {
                        const horaSalidaOficial = new Date(`${ultimoRegistro.fecha}T${empleado.horarioSalida}`);
                        const horaSalidaReal = new Date(ultimoRegistro.horaSalida);
                        if (horaSalidaReal > horaSalidaOficial) {
                            horasExtrasTotales += (horaSalidaReal - horaSalidaOficial) / 3600000;
                        }
                    }
                } else {
                    const justificacion = await new Promise(r => justificacionesStore.index('empleado_fecha').get([empleado.id, fecha]).onsuccess = e => r(e.target.result));
                    fechasDeFaltas.push({fecha, justificada: !!justificacion, motivo: justificacion ? justificacion.motivo : ''});
                }
            }
            
            const transacciones = await new Promise(r => transaccionesStore.index('empleado_periodo_concepto').getAll(IDBKeyRange.bound([empleado.id, periodo, 0], [empleado.id, periodo, Infinity])).onsuccess = e => r(e.target.result));
            const transaccionesMap = transacciones.reduce((acc, t) => { acc[t.conceptoId] = t.monto; return acc; }, {});

            reportData.push({ 
                empleado, 
                fechasDeFaltas,
                horasExtras: horasExtrasTotales,
                transacciones: transaccionesMap 
            });
        }
        
        currentReportData = reportData;
        currentReportConcepts = conceptos.filter(c => c.activo);
        renderReportTable(currentReportData, currentReportConcepts, periodo);
        document.getElementById('btn-exportar-csv').classList.remove('hidden');
    } catch (error) {
        console.error("Error generando el reporte:", error);
        showToast("Error al generar el reporte.", "error");
        container.innerHTML = '<div class="p-8 text-center text-red-500">Ocurrió un error al generar el reporte.</div>';
    }
};

/**
 * Renderiza la tabla del reporte de pre-nómina.
 * @param {Array} data - Los datos del reporte.
 * @param {Array} conceptos - La lista de conceptos activos.
 * @param {string} periodo - El periodo del reporte.
 */
function renderReportTable(data, conceptos, periodo) {
    const container = document.getElementById('reporte-container');
    let tableHTML = `<table class="min-w-full divide-y divide-gray-200" id="report-table"><thead class="bg-gray-50"><tr>
        <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persona</th>
        <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sueldo Base</th>
        <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faltas</th>
        <th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Extras</th>`;
    conceptos.forEach(c => tableHTML += `<th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${c.nombre}</th>`);
    tableHTML += `<th class="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Pago Semana</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

    data.forEach(item => {
        const pagoHorasExtras = item.horasExtras * item.empleado.pagoPorHoraExtra;
        const faltasNoJustificadas = item.fechasDeFaltas.filter(f => !f.justificada).length;
        const faltasJustificadas = item.fechasDeFaltas.length - faltasNoJustificadas;
        
        tableHTML += `<tr data-empleado-id="${item.empleado.id}" data-sueldo-base="${item.empleado.sueldoSemanal}" data-sueldo-diario="${item.empleado.diasLaborales > 0 ? item.empleado.sueldoSemanal / item.empleado.diasLaborales : 0}" data-faltas-no-justificadas="${faltasNoJustificadas}" data-pago-horas-extras="${pagoHorasExtras}">
            <td class="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${item.empleado.nombreCompleto}</td>
            <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-500">$${item.empleado.sueldoSemanal.toFixed(2)}</td>
            <td class="px-2 py-2 whitespace-nowrap text-sm text-red-500 font-bold">
                ${item.fechasDeFaltas.length > 0 ? `<button class="faltas-btn bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200">
                    ${item.fechasDeFaltas.length} Faltas <span class="text-green-600 font-normal">${faltasJustificadas > 0 ? `(${faltasJustificadas} just.)` : ''}</span>
                </button>` : '0'}
            </td>
            <td class="px-2 py-2 whitespace-nowrap text-sm text-green-600">
                <div>${item.horasExtras.toFixed(2)} hrs</div>
                <div class="font-bold">$${pagoHorasExtras.toFixed(2)}</div>
            </td>`;
        conceptos.forEach(c => {
            const monto = item.transacciones[c.id] || 0;
            const isChecked = monto > 0;
            tableHTML += `<td class="px-1 py-1"><div class="flex items-center space-x-1">
                <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 concept-checkbox" data-concepto-id="${c.id}" ${isChecked ? 'checked' : ''}>
                <input type="number" class="w-24 p-1 border rounded-md report-input" data-concepto-id="${c.id}" data-monto-fijo="${c.montoFijo}" data-tipo="${c.tipo}" value="${monto.toFixed(2)}" ${!isChecked ? 'disabled' : ''}>
            </div></td>`;
        });
        tableHTML += `<td class="pago-semana px-2 py-2 whitespace-nowrap text-sm font-bold text-gray-800"></td></tr>`;
    });

    tableHTML += `</tbody><tfoot><tr class="bg-gray-100"><td colspan="${4 + conceptos.length}" class="px-2 py-3 text-right font-bold text-gray-700">TOTAL GENERAL</td><td id="gran-total" class="px-2 py-3 font-extrabold text-lg text-gray-900"></td></tr></tfoot></table>
        <div class="p-4 flex justify-end"><button id="btn-guardar-nomina" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Cambios</button></div>`;
    container.innerHTML = tableHTML;
    
    // Add event listeners
    container.querySelectorAll('.concept-checkbox').forEach(cb => cb.addEventListener('change', handleConceptCheckboxChange));
    container.querySelectorAll('.report-input').forEach(input => input.addEventListener('input', e => updateRowTotal(e.target.closest('tr'))));
    container.querySelectorAll('.faltas-btn').forEach(btn => btn.addEventListener('click', e => {
        const row = e.target.closest('tr');
        const empleadoId = parseInt(row.dataset.empleadoId);
        const empleadoNombre = row.cells[0].textContent;
        const faltasData = data.find(d => d.empleado.id === empleadoId).fechasDeFaltas;
        openJustificarModal(empleadoId, empleadoNombre, faltasData);
    }));
    document.getElementById('btn-guardar-nomina').addEventListener('click', () => savePayrollChanges(periodo));
    
    container.querySelectorAll('#report-table tbody tr').forEach(updateRowTotal);
}

function handleConceptCheckboxChange(e) {
    const checkbox = e.target;
    const row = checkbox.closest('tr');
    const input = row.querySelector(`.report-input[data-concepto-id="${checkbox.dataset.conceptoId}"]`);
    if (checkbox.checked) {
        input.disabled = false;
        const montoFijo = parseFloat(input.dataset.montoFijo);
        if (montoFijo > 0 && parseFloat(input.value) === 0) {
            input.value = montoFijo.toFixed(2);
        }
        input.focus();
    } else {
        input.disabled = true;
        input.value = "0.00";
    }
    updateRowTotal(row);
};

function updateRowTotal(row) {
    if (!row) return;
    const sueldoBase = parseFloat(row.dataset.sueldoBase);
    const sueldoDiario = parseFloat(row.dataset.sueldoDiario);
    const faltas = parseInt(row.dataset.faltasNoJustificadas);
    const pagoHorasExtras = parseFloat(row.dataset.pagoHorasExtras);
    let pagoNeto = sueldoBase - (faltas * sueldoDiario) + pagoHorasExtras;
    
    row.querySelectorAll('.report-input:not(:disabled)').forEach(input => {
        const valor = parseFloat(input.value) || 0;
        pagoNeto += input.dataset.tipo === 'PERCEPCION' ? valor : -valor;
    });

    row.querySelector('.pago-semana').textContent = `$${pagoNeto.toFixed(2)}`;
    updateGranTotal();
};

function updateGranTotal() {
    let total = 0;
    document.querySelectorAll('.pago-semana').forEach(cell => {
        const value = parseFloat(cell.textContent.replace('$', ''));
        if (!isNaN(value)) total += value;
    });
    document.getElementById('gran-total').textContent = `$${total.toFixed(2)}`;
};

async function savePayrollChanges(periodo) {
    const rows = document.querySelectorAll('#report-table tbody tr');
    const tx = db.transaction(['transaccionesNomina'], 'readwrite');
    const store = tx.objectStore('transaccionesNomina');
    const index = store.index('empleado_periodo_concepto');
    const promises = [];

    rows.forEach(row => {
        const empleadoId = parseInt(row.dataset.empleadoId);
        row.querySelectorAll('.report-input').forEach(input => {
            const conceptoId = parseInt(input.dataset.conceptoId);
            const monto = parseFloat(input.value) || 0;

            const promise = new Promise((resolve, reject) => {
                const request = index.get([empleadoId, periodo, conceptoId]);
                request.onerror = reject;
                request.onsuccess = () => {
                    const existing = request.result;
                    if (existing) {
                        if (monto > 0) {
                            existing.monto = monto;
                            store.put(existing).onsuccess = resolve;
                        } else {
                            store.delete(existing.id).onsuccess = resolve;
                        }
                    } else if (monto > 0) {
                        const transaccion = { empleadoId, periodo, conceptoId, monto };
                        store.add(transaccion).onsuccess = resolve;
                    } else {
                        resolve(); // No hacer nada si no existe y el monto es 0
                    }
                };
            });
            promises.push(promise);
        });
    });

    try {
        await Promise.all(promises);
        tx.oncomplete = () => {
             showToast('Cambios en la nómina guardados exitosamente.', 'success');
        }
    } catch (error) {
        console.error("Error guardando cambios de nómina:", error);
        showToast('Error al guardar los cambios.', 'error');
        tx.abort();
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
    const tx = db.transaction(['justificaciones'], 'readwrite'); // Esto ahora funcionará
    const store = tx.objectStore('justificaciones');
    const index = store.index('empleado_fecha');
    const promises = [];

    document.querySelectorAll('#lista-faltas .justificacion-cb').forEach(cb => {
        const fecha = cb.dataset.fecha;
        const motivo = document.getElementById(`motivo-${fecha}`).value;
        
        const promise = new Promise((resolve, reject) => {
            const request = index.get([empleadoId, fecha]);
            request.onerror = reject;
            request.onsuccess = e => {
                const existing = e.target.result;
                if (cb.checked) {
                    const data = { empleadoId, fecha, motivo: motivo || 'Justificado' };
                    if (existing) {
                        data.id = existing.id;
                        store.put(data).onsuccess = resolve;
                    } else {
                        store.add(data).onsuccess = resolve;
                    }
                } else {
                    if (existing) {
                        store.delete(existing.id).onsuccess = resolve;
                    } else {
                        resolve();
                    }
                }
            };
        });
        promises.push(promise);
    });

    try {
        await Promise.all(promises);
        tx.oncomplete = () => {
            showToast('Justificaciones guardadas.', 'success');
            closeModal();
            generatePayrollReport(); // Recargar el reporte para ver los cambios
        }
    } catch (error) {
        console.error("Error guardando justificaciones:", error);
        showToast("Error al guardar justificaciones.", "error");
        tx.abort();
    }
};

function exportReportToCSV() {
    if (currentReportData.length === 0) {
        showToast("No hay datos para exportar.", "warning");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    const headers = ["Empleado", "Sueldo Base", "Faltas No Justificadas", "Pago Horas Extras"];
    currentReportConcepts.forEach(c => headers.push(c.nombre));
    headers.push("Pago Neto");
    csvContent += headers.join(",") + "\r\n";

    // Rows
    document.querySelectorAll('#report-table tbody tr').forEach(row => {
        const csvRow = [];
        
        csvRow.push(`"${row.cells[0].textContent}"`); // Empleado
        csvRow.push(parseFloat(row.dataset.sueldoBase).toFixed(2)); // Sueldo Base
        csvRow.push(parseInt(row.dataset.faltasNoJustificadas)); // Faltas
        csvRow.push(parseFloat(row.dataset.pagoHorasExtras).toFixed(2)); // Pago Horas Extras

        row.querySelectorAll('.report-input').forEach(input => {
            csvRow.push(parseFloat(input.value || 0).toFixed(2));
        });

        csvRow.push(parseFloat(row.querySelector('.pago-semana').textContent.replace('$', '')).toFixed(2)); // Pago Neto
        
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
