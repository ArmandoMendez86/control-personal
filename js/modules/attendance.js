// js/modules/attendance.js
import { db, dbAction } from '../database.js';
import { showToast, getTodayDateString, loadEmpleadosIntoSelect } from '../utils.js';
import { openModal, closeModal } from '../ui.js';

/**
 * Inicializa la vista de asistencias, configurando listeners.
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
        
        const tbody = document.getElementById('tabla-asistencias');
        tbody.innerHTML = '';
        if (!asistencias || asistencias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">No se encontraron registros con los filtros seleccionados.</td></tr>';
            return;
        }

        asistencias.sort((a, b) => {
            const dateA = a.horaEntrada ? new Date(a.horaEntrada) : new Date(a.fecha);
            const dateB = b.horaEntrada ? new Date(b.horaEntrada) : new Date(b.fecha);
            return dateB - dateA;
        }).forEach(a => {
            const tr = document.createElement('tr');
            const nombreEmpleado = empleadosMap.get(a.empleadoId) || 'Empleado Desconocido';
            tr.innerHTML = `
                <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900">${nombreEmpleado}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">${a.fecha}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">${a.horaEntrada ? new Date(a.horaEntrada).toLocaleTimeString() : '---'}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">${a.horaSalida ? new Date(a.horaSalida).toLocaleTimeString() : '---'}</div></td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button class="edit-btn text-indigo-600 hover:text-indigo-900"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn text-red-600 hover:text-red-900 ml-4"><i class="fas fa-trash"></i></button>
                </td>`;
            tr.querySelector('.edit-btn').addEventListener('click', () => openAsistenciaModal(a, nombreEmpleado));
            tr.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm('¿Seguro que desea eliminar este registro de asistencia?')) {
                    await dbAction('registrosAsistencia', 'readwrite', 'delete', a.id);
                    showToast('Registro eliminado.', 'success');
                    loadAsistenciasTable();
                }
            });
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error cargando tabla de asistencias:", error);
    }
};
