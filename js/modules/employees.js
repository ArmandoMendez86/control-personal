// js/modules/employees.js
import { dbAction } from '../database.js';
import { showToast } from '../utils.js';
import { openModal, closeModal } from '../ui.js';

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
    try {
        const empleados = await dbAction('empleados', 'readonly', 'getAll');
        
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
            loadEmpleadosTable(); 
            return;
        }

        const tbody = document.getElementById('tabla-empleados');
        tbody.innerHTML = '';
        if (!empleados || empleados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-500">No hay empleados registrados.</td></tr>';
            return;
        }
        empleados.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900">${emp.nombreCompleto}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">${emp.horarioEntrada} - ${emp.horarioSalida}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">$${emp.pagoPorHoraExtra.toFixed(2)}</div></td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button class="share-btn text-blue-600 hover:text-blue-800" title="Compartir Tarjeta">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="card-btn text-white bg-green-600 hover:bg-green-700 font-bold py-1 px-3 rounded-lg text-xs ml-4" title="Generar Tarjeta Digital">
                        <i class="fas fa-id-card"></i> Tarjeta
                    </button>
                    <button class="edit-btn text-indigo-600 hover:text-indigo-900 ml-4" title="Editar Empleado"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn text-red-600 hover:text-red-900 ml-4" title="Eliminar Empleado"><i class="fas fa-trash"></i></button>
                </td>`;
            
            tr.querySelector('.share-btn').addEventListener('click', () => handleShare(emp));
            
            tr.querySelector('.card-btn').addEventListener('click', () => {
                if (!emp.uuid) {
                    showToast('Error: No se pudo generar un identificador seguro para este empleado.', 'error');
                    return;
                }
                window.open(`tarjeta-digital.html?uuid=${emp.uuid}`, '_blank', 'width=450,height=600,scrollbars=no,resizable=no');
            });

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
            console.log('URL compartida exitosamente');
        } else {
            throw new Error('Web Share API not supported.');
        }
    } catch (err) {
        console.warn('Error al usar Web Share API, usando fallback:', err);
        const tempInput = document.createElement('input');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('¡Enlace copiado al portapapeles!', 'success');
    }
}
