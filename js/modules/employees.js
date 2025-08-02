// js/modules/employees.js
import { dbAction } from '../database.js';
import { showToast } from '../utils.js';
import { openModal, closeModal, renderEmptyState } from '../ui.js';

/**
 * Inicializa la vista de empleados, configurando listeners.
 */
export function initEmployeesView() {
    const newEmployeeBtn = document.getElementById('btn-nuevo-empleado');
    if (newEmployeeBtn) {
        newEmployeeBtn.addEventListener('click', () => openEmpleadoModal());
    }
    
    const employeeForm = document.getElementById('form-empleado');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleSaveEmpleado);
    }
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                loadEmpleadosTable();
            }
        });
    });
    const employeeView = document.getElementById('empleados');
    if (employeeView) {
        observer.observe(employeeView, { attributes: true });
    }
}

function openEmpleadoModal(empleado = null) {
    const form = document.getElementById('form-empleado');
    form.reset();
    document.getElementById('empleado-id').value = '';
    document.getElementById('modal-title-empleado').textContent = 'Nuevo Empleado';
    document.getElementById('pin-container').classList.add('hidden');

    if (empleado) {
        document.getElementById('modal-title-empleado').textContent = 'Editar Empleado';
        document.getElementById('empleado-id').value = empleado.id;
        document.getElementById('nombreCompleto').value = empleado.nombreCompleto;
        document.getElementById('sueldoSemanal').value = empleado.sueldoSemanal;
        document.getElementById('horarioEntrada').value = empleado.horarioEntrada;
        document.getElementById('horarioSalida').value = empleado.horarioSalida;
        document.getElementById('diasLaborales').value = empleado.diasLaborales;
        document.getElementById('pagoPorHoraExtra').value = empleado.pagoPorHoraExtra;
    }
    openModal('empleado-modal');
};

async function handleSaveEmpleado(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('empleado-id').value);
    const pin = document.getElementById('pin').value || Math.floor(1000 + Math.random() * 9000).toString();

    let existingEmployee = null;
    if (id) {
        existingEmployee = await dbAction('empleados', 'readonly', 'get', id);
    }

    const empleado = {
        nombreCompleto: document.getElementById('nombreCompleto').value,
        sueldoSemanal: parseFloat(document.getElementById('sueldoSemanal').value),
        pin: pin,
        horarioEntrada: document.getElementById('horarioEntrada').value,
        horarioSalida: document.getElementById('horarioSalida').value,
        diasLaborales: parseInt(document.getElementById('diasLaborales').value),
        pagoPorHoraExtra: parseFloat(document.getElementById('pagoPorHoraExtra').value),
        activo: true,
        uuid: existingEmployee ? existingEmployee.uuid : crypto.randomUUID(),
        token: existingEmployee ? existingEmployee.token : null,
        tokenExpiry: existingEmployee ? existingEmployee.tokenExpiry : null,
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

async function loadEmpleadosTable() {
    const container = document.getElementById('empleados-table-container');
    try {
        const empleados = await dbAction('empleados', 'readonly', 'getAll');
        
        // Migración silenciosa de UUID si es necesario
        const updatePromises = [];
        empleados.forEach(emp => {
            if (!emp.uuid) {
                console.log(`Migrando empleado: ${emp.nombreCompleto}, asignando nuevo UUID.`);
                emp.uuid = crypto.randomUUID();
                updatePromises.push(dbAction('empleados', 'readwrite', 'put', emp));
            }
        });
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            loadEmpleadosTable(); // Recargar después de la migración
            return;
        }

        if (!empleados || empleados.length === 0) {
            const buttonHTML = `<button id="btn-nuevo-empleado-vacio" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mx-auto shadow-sm hover:shadow-lg transition-shadow"><i class="fas fa-plus mr-2"></i> Agregar Primer Empleado</button>`;
            renderEmptyState(
                container,
                'fas fa-users-slash',
                'No hay empleados registrados',
                'Comienza por agregar a tu primer empleado para gestionar sus asistencias y nómina.',
                buttonHTML
            );
            document.getElementById('btn-nuevo-empleado-vacio').addEventListener('click', () => openEmpleadoModal());
            return;
        }

        let tableHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago H. Extra</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">`;

        empleados.forEach(emp => {
            tableHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${emp.nombreCompleto}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${emp.horarioEntrada} - ${emp.horarioSalida}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">$${emp.pagoPorHoraExtra.toFixed(2)}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="share-btn text-gray-400 hover:text-blue-600 p-2 rounded-full" title="Compartir Tarjeta" data-id="${emp.id}"><i class="fas fa-share-alt"></i></button>
                        <button class="card-btn text-gray-400 hover:text-green-600 p-2 rounded-full" title="Generar Tarjeta Digital" data-id="${emp.id}"><i class="fas fa-id-card"></i></button>
                        <button class="edit-btn text-gray-400 hover:text-indigo-600 p-2 rounded-full" title="Editar Empleado" data-id="${emp.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn text-gray-400 hover:text-red-600 p-2 rounded-full" title="Eliminar Empleado" data-id="${emp.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        });
        
        tableHTML += `</tbody></table>`;
        container.innerHTML = tableHTML;

        // Add event listeners
        container.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('click', () => handleShare(empleados.find(e => e.id === parseInt(btn.dataset.id)))));
        container.querySelectorAll('.card-btn').forEach(btn => btn.addEventListener('click', () => {
            const emp = empleados.find(e => e.id === parseInt(btn.dataset.id));
            if (!emp.uuid) {
                showToast('Error: No se pudo generar un identificador seguro para este empleado.', 'error');
                return;
            }
            window.open(`tarjeta-digital.html?uuid=${emp.uuid}`, '_blank', 'width=450,height=650,scrollbars=no,resizable=no');
        }));
        container.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEmpleadoModal(empleados.find(e => e.id === parseInt(btn.dataset.id)))));
        container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async () => {
            const emp = empleados.find(e => e.id === parseInt(btn.dataset.id));
            if (confirm(`¿Seguro que desea eliminar a ${emp.nombreCompleto}? Esta acción no se puede deshacer.`)) {
                await dbAction('empleados', 'readwrite', 'delete', emp.id);
                showToast('Empleado eliminado.', 'success');
                loadEmpleadosTable();
            }
        }));

    } catch (error) {
        console.error("Error cargando tabla de empleados:", error);
        renderEmptyState(container, 'fas fa-exclamation-triangle', 'Error', 'No se pudo cargar la lista de empleados.');
    }
};

async function handleShare(emp) {
    const shareUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}tarjeta-digital.html?uuid=${emp.uuid}`;
    const shareData = {
        title: `Tarjeta de Asistencia de ${emp.nombreCompleto}`,
        text: `¡Hola, ${emp.nombreCompleto.split(' ')[0]}! Aquí está tu tarjeta digital para registrar tu asistencia:`,
        url: shareUrl,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            throw new Error('Web Share API not supported.');
        }
    } catch (err) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('¡Enlace copiado al portapapeles!', 'success');
        }).catch(err => {
            showToast('Error al copiar el enlace.', 'error');
        });
    }
}
