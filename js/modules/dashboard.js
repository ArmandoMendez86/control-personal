// js/modules/dashboard.js
//import { db, dbAction } from '../database.js'; // Se importa 'db' de nuevo.
import { showToast, getTodayDateString, loadEmpleadosIntoSelect } from '../utils.js';
import { renderEmptyState } from '../ui.js';

// ... (El resto del archivo usa 'db' directamente, sin abrir/cerrar conexiones)

export async function updateDashboard() {
    loadEmpleadosIntoSelect('checador-empleado');
    updateKPIs();
    updateRecentActivity();
}

async function updateKPIs() {
    try {
        const todayStr = getTodayDateString();
        // Se usa 'db' directamente, que fue inicializada en main.js
        const tx = db.transaction(['empleados', 'registrosAsistencia'], 'readonly');
        const empleadosStore = tx.objectStore('empleados');
        const asistenciaStore = tx.objectStore('registrosAsistencia');
        
        const empleados = await new Promise((resolve, reject) => {
            const request = empleadosStore.getAll();
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => reject(e.target.error);
        });
        
        const asistenciasHoy = await new Promise((resolve, reject) => {
            const request = asistenciaStore.index('fecha').getAll(todayStr);
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => reject(e.target.error);
        });

        const empleadosActivos = empleados.filter(e => e.activo);
        
        let presentes = 0;
        let retardos = 0;
        const presentesIds = new Set();
        
        asistenciasHoy.forEach(a => {
            if (a.horaEntrada && !presentesIds.has(a.empleadoId)) {
                presentesIds.add(a.empleadoId);
                presentes++;
                const empleado = empleados.find(e => e.id === a.empleadoId);
                if (empleado && empleado.horarioEntrada) {
                    const horaEntradaOficial = new Date(`${a.fecha}T${empleado.horarioEntrada}`);
                    const horaEntradaReal = new Date(a.horaEntrada);
                    horaEntradaOficial.setMinutes(horaEntradaOficial.getMinutes() + 1);
                    if (horaEntradaReal > horaEntradaOficial) {
                        retardos++;
                    }
                }
            }
        });

        document.getElementById('kpi-presentes').textContent = presentes;
        document.getElementById('kpi-ausentes').textContent = empleadosActivos.length - presentes;
        document.getElementById('kpi-retardos').textContent = retardos;
    } catch (error) {
        console.error("Error actualizando KPIs:", error);
    }
}

async function updateRecentActivity() {
    const actividadContainer = document.getElementById('lista-actividad');
    try {
        const allAsistencias = await dbAction('registrosAsistencia', 'readonly', 'getAll');
        const empleados = await dbAction('empleados', 'readonly', 'getAll');
        const empleadosMap = new Map(empleados.map(e => [e.id, e.nombreCompleto]));

        actividadContainer.innerHTML = '';
        
        const sortedActivities = allAsistencias.sort((a,b) => {
            const dateA = a.horaSalida ? new Date(a.horaSalida) : new Date(a.horaEntrada);
            const dateB = b.horaSalida ? new Date(b.horaSalida) : new Date(b.horaEntrada);
            return dateB - dateA;
        });

        if (sortedActivities.length === 0) {
            renderEmptyState(
                actividadContainer,
                'fas fa-history',
                'Sin Actividad Reciente',
                'Los registros de entrada y salida de los empleados aparecerán aquí.'
            );
            actividadContainer.querySelector('.empty-state-container').classList.add('py-10');
        } else {
            sortedActivities.slice(0, 10).forEach(a => {
                const nombreEmpleado = empleadosMap.get(a.empleadoId);
                if(nombreEmpleado) {
                    const li = document.createElement('li');
                    li.className = 'flex items-center justify-between text-sm pb-3 border-b border-gray-100';
                    let html;
                    if (a.horaSalida) {
                         html = `<div class="flex items-center"><i class="fas fa-sign-out-alt text-red-500 mr-4"></i><div><span class="font-semibold text-gray-800">${nombreEmpleado}</span><span class="text-gray-500"> registró salida</span></div></div><span class="text-gray-500 text-xs">${new Date(a.horaSalida).toLocaleTimeString()}</span>`;
                    } else {
                         html = `<div class="flex items-center"><i class="fas fa-sign-in-alt text-green-500 mr-4"></i><div><span class="font-semibold text-gray-800">${nombreEmpleado}</span><span class="text-gray-500"> registró entrada</span></div></div><span class="text-gray-500 text-xs">${new Date(a.horaEntrada).toLocaleTimeString()}</span>`;
                    }
                    li.innerHTML = html;
                    actividadContainer.appendChild(li);
                }
            });
        }
    } catch (error) {
        console.error("Error actualizando actividad reciente:", error);
        renderEmptyState(actividadContainer, 'fas fa-exclamation-triangle', 'Error', 'No se pudo cargar la actividad reciente.');
    }
}

async function handleAdminCheckInOut(isCheckIn) {
    const empleadoId = parseInt(document.getElementById('checador-empleado').value);
    if (!empleadoId) {
        showToast('Por favor, seleccione un empleado.', 'warning');
        return;
    }
    
    const todayStr = getTodayDateString();
    const statusDiv = document.getElementById('checador-status');
    statusDiv.innerHTML = '';

    try {
        const transaction = db.transaction(['registrosAsistencia'], 'readwrite');
        const store = transaction.objectStore('registrosAsistencia');
        const index = store.index('empleado_fecha');
        const request = index.getAll([empleadoId, todayStr]);

        request.onsuccess = (e) => {
            const registrosHoy = e.target.result;
            let registro = registrosHoy.length > 0 ? registrosHoy[registrosHoy.length - 1] : null;

            if (isCheckIn) {
                if (registro && registro.horaEntrada && !registro.horaSalida) {
                    showToast('Este empleado ya tiene una entrada registrada sin salida.', 'warning');
                    statusDiv.innerHTML = `<p class="text-yellow-600">Entrada ya registrada sin salida.</p>`;
                } else {
                    const nuevoRegistro = { empleadoId, fecha: todayStr, horaEntrada: new Date(), horaSalida: null };
                    store.add(nuevoRegistro).onsuccess = () => { 
                        showToast('Entrada registrada.', 'success'); 
                        statusDiv.innerHTML = `<p class="text-green-600">Entrada registrada a las ${new Date().toLocaleTimeString()}</p>`;
                        updateDashboard(); 
                    };
                }
            } else { // Es Check-out
                if (!registro || !registro.horaEntrada || registro.horaSalida) {
                    showToast('No hay entrada pendiente de salida para este empleado hoy.', 'warning');
                    statusDiv.innerHTML = `<p class="text-yellow-600">No hay entrada que registrar.</p>`;
                } else {
                    registro.horaSalida = new Date();
                    store.put(registro).onsuccess = () => { 
                        showToast('Salida registrada.', 'success'); 
                        statusDiv.innerHTML = `<p class="text-red-600">Salida registrada a las ${new Date().toLocaleTimeString()}</p>`;
                        updateDashboard(); 
                    };
                }
            }
        };
    } catch (error) {
        console.error("Error en registro de admin:", error);
        showToast('Error al registrar asistencia.', 'error');
    }
};

export const handleAdminCheckIn = () => handleAdminCheckInOut(true);
export const handleAdminCheckOut = () => handleAdminCheckInOut(false);
