// js/modules/employees.js
import { dbAction } from '../database.js';
import { showToast } from '../utils.js';
import { openModal, closeModal } from '../ui.js';

/**
 * Inicializa la vista de empleados, configurando listeners.
 */
export function initEmployeesView() {
    document.getElementById('btn-nuevo-empleado').addEventListener('click', () => openEmpleadoModal());
    document.getElementById('form-empleado').addEventListener('submit', handleSaveEmpleado);
    
    // Cargar la tabla cuando se navega a la vista
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                loadEmpleadosTable();
            }
        });
    });
    observer.observe(document.getElementById('empleados'), { attributes: true });
}

/**
 * Abre el modal para crear o editar un empleado.
 * @param {object|null} empleado - El objeto empleado para editar, o null para crear uno nuevo.
 */
function openEmpleadoModal(empleado = null) {
    const form = document.getElementById('form-empleado');
    form.reset();
    document.getElementById('empleado-id').value = '';
    document.getElementById('modal-title-empleado').textContent = 'Nuevo Empleado';
    if (empleado) {
        document.getElementById('modal-title-empleado').textContent = 'Editar Empleado';
        document.getElementById('empleado-id').value = empleado.id;
        document.getElementById('nombreCompleto').value = empleado.nombreCompleto;
        document.getElementById('sueldoSemanal').value = empleado.sueldoSemanal;
        document.getElementById('pin').value = empleado.pin;
        document.getElementById('horarioEntrada').value = empleado.horarioEntrada;
        document.getElementById('horarioSalida').value = empleado.horarioSalida;
        document.getElementById('diasLaborales').value = empleado.diasLaborales;
        document.getElementById('pagoPorHoraExtra').value = empleado.pagoPorHoraExtra;
    }
    openModal('empleado-modal');
};

/**
 * Maneja el guardado de un empleado desde el formulario del modal.
 * @param {Event} e - El evento de submit del formulario.
 */
async function handleSaveEmpleado(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('empleado-id').value);
    const empleado = {
        nombreCompleto: document.getElementById('nombreCompleto').value,
        sueldoSemanal: parseFloat(document.getElementById('sueldoSemanal').value),
        pin: document.getElementById('pin').value,
        horarioEntrada: document.getElementById('horarioEntrada').value,
        horarioSalida: document.getElementById('horarioSalida').value,
        diasLaborales: parseInt(document.getElementById('diasLaborales').value),
        pagoPorHoraExtra: parseFloat(document.getElementById('pagoPorHoraExtra').value),
        activo: true
    };
    try {
        const action = id ? 'put' : 'add';
        const data = id ? { ...empleado, id } : empleado;
        await dbAction('empleados', 'readwrite', action, data);
        showToast(`Empleado ${id ? 'actualizado' : 'guardado'}.`, 'success');
        closeModal();
        loadEmpleadosTable();
    } catch (error) {
        showToast('Error al guardar empleado.', 'error');
        console.error(error);
    }
};

/**
 * Carga y renderiza la tabla de empleados.
 */
async function loadEmpleadosTable() {
    try {
        const empleados = await dbAction('empleados', 'readonly', 'getAll');
        const tbody = document.getElementById('tabla-empleados');
        tbody.innerHTML = '';
        if (!empleados || empleados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">No hay empleados registrados.</td></tr>';
            return;
        }
        empleados.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900">${emp.nombreCompleto}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">${emp.pin ? '****' : 'Sin PIN'}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">${emp.horarioEntrada} - ${emp.horarioSalida}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">$${emp.pagoPorHoraExtra.toFixed(2)}</div></td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button class="edit-btn text-indigo-600 hover:text-indigo-900"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn text-red-600 hover:text-red-900 ml-4"><i class="fas fa-trash"></i></button>
                </td>`;
            tr.querySelector('.edit-btn').addEventListener('click', () => openEmpleadoModal(emp));
            tr.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm('¿Seguro que desea eliminar a este empleado? Esta acción no se puede deshacer.')) {
                    await dbAction('empleados', 'readwrite', 'delete', emp.id);
                    showToast('Empleado eliminado.', 'success');
                    loadEmpleadosTable();
                }
            });
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error cargando tabla de empleados:", error);
    }
};
