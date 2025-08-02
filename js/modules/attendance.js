// js/modules/attendance.js
//import { db, dbAction } from '../database.js'; // Se importa 'db'
import { showToast, getTodayDateString, loadEmpleadosIntoSelect } from '../utils.js';
import { openModal, closeModal, renderEmptyState } from '../ui.js';

/**
 * Initializes the attendance view, setting up listeners.
 */
export function initAttendanceView() {
    const searchBtn = document.getElementById('btn-buscar-asistencias');
    if (searchBtn) {
        searchBtn.addEventListener('click', loadAsistenciasTable);
    }

    const attendanceForm = document.getElementById('form-asistencia');
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', handleSaveAsistencia);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                loadInitialAttendanceView();
            }
        });
    });
    const attendanceView = document.getElementById('asistencias');
    if (attendanceView) {
        observer.observe(attendanceView, { attributes: true });
    }
}

function loadInitialAttendanceView() {
    document.getElementById('filtro-fecha-asistencia').value = getTodayDateString();
    loadEmpleadosIntoSelect('filtro-empleado-asistencia', 'Todos los empleados');
    loadAsistenciasTable();
};

function openAsistenciaModal(asistencia, nombre) {
    document.getElementById('modal-title-asistencia').textContent = `Editar Asistencia de ${nombre}`;
    document.getElementById('asistencia-id').value = asistencia.id;
    document.getElementById('asistencia-empleado-nombre').textContent = nombre;
    document.getElementById('asistencia-fecha').value = asistencia.fecha;
    const formatTime = (dateStr) => dateStr ? new Date(dateStr).toTimeString().slice(0, 5) : '';
    document.getElementById('asistencia-entrada').value = formatTime(asistencia.horaEntrada);
    document.getElementById('asistencia-salida').value = formatTime(asistencia.horaSalida);
    openModal('asistencia-modal');
};

async function handleSaveAsistencia(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('asistencia-id').value);
    const fecha = document.getElementById('asistencia-fecha').value;
    const entrada = document.getElementById('asistencia-entrada').value;
    const salida = document.getElementById('asistencia-salida').value;

    try {
        const registroOriginal = await dbAction('registrosAsistencia', 'readonly', 'get', id);
        const registroActualizado = {
            ...registroOriginal,
            fecha: fecha,
            horaEntrada: entrada ? new Date(`${fecha}T${entrada}`) : null,
            horaSalida: salida ? new Date(`${fecha}T${salida}`) : null,
        };
        await dbAction('registrosAsistencia', 'readwrite', 'put', registroActualizado);
        showToast('Registro actualizado.', 'success');
        closeModal();
        loadAsistenciasTable();
    } catch (error) {
        showToast('Error al actualizar registro.', 'error');
        console.error(error);
    }
};

async function loadAsistenciasTable() {
    const container = document.getElementById('asistencias-table-container');
    try {
        const fecha = document.getElementById('filtro-fecha-asistencia').value;
        const empleadoId = parseInt(document.getElementById('filtro-empleado-asistencia').value);
        
        const tx = db.transaction(['registrosAsistencia', 'empleados'], 'readonly');
        const asistenciaStore = tx.objectStore('registrosAsistencia');
        const empleados = await new Promise(r => tx.objectStore('empleados').getAll().onsuccess = e => r(e.target.result));
        const empleadosMap = new Map(empleados.map(e => [e.id, e.nombreCompleto]));

        let asistencias;
        if (fecha) {
            asistencias = await new Promise(r => asistenciaStore.index('fecha').getAll(fecha).onsuccess = e => r(e.target.result));
            if (empleadoId) {
                asistencias = asistencias.filter(a => a.empleadoId === empleadoId);
            }
        } else if (empleadoId) {
            asistencias = await new Promise(r => {
                const request = asistenciaStore.index('empleado_fecha').getAll(IDBKeyRange.bound([empleadoId, ''], [empleadoId, '\uffff']));
                request.onsuccess = e => r(e.target.result);
            });
        } else {
            asistencias = await new Promise(r => asistenciaStore.getAll().onsuccess = e => r(e.target.result));
        }
        
        if (!asistencias || asistencias.length === 0) {
            renderEmptyState(
                container,
                'fas fa-calendar-times',
                'No se encontraron registros',
                'Intenta cambiar la fecha, seleccionar otro empleado o registrar una nueva asistencia.'
            );
            return;
        }

        let tableHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">`;
        
        asistencias.sort((a, b) => {
            const dateA = a.horaEntrada ? new Date(a.horaEntrada) : new Date(a.fecha);
            const dateB = b.horaEntrada ? new Date(b.horaEntrada) : new Date(b.fecha);
            return dateB - dateA;
        }).forEach(a => {
            const nombreEmpleado = empleadosMap.get(a.empleadoId) || 'Empleado Desconocido';
            tableHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${nombreEmpleado}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${a.fecha}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${a.horaEntrada ? new Date(a.horaEntrada).toLocaleTimeString() : '---'}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${a.horaSalida ? new Date(a.horaSalida).toLocaleTimeString() : '---'}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="edit-btn text-gray-400 hover:text-indigo-600 p-2 rounded-full" data-id="${a.id}" data-nombre="${nombreEmpleado}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn text-gray-400 hover:text-red-600 p-2 rounded-full" data-id="${a.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        });
        tableHTML += `</tbody></table>`;
        container.innerHTML = tableHTML;

        container.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => {
            const asistencia = asistencias.find(a => a.id === parseInt(btn.dataset.id));
            openAsistenciaModal(asistencia, btn.dataset.nombre);
        }));
        container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async () => {
            if (confirm('¿Seguro que desea eliminar este registro de asistencia?')) {
                await dbAction('registrosAsistencia', 'readwrite', 'delete', parseInt(btn.dataset.id));
                showToast('Registro eliminado.', 'success');
                loadAsistenciasTable();
            }
        }));

    } catch (error) {
        console.error("Error cargando tabla de asistencias:", error);
        renderEmptyState(container, 'fas fa-exclamation-triangle', 'Error', 'No se pudo cargar la lista de asistencias.');
    }
};
