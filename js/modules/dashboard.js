// js/modules/dashboard.js
import { db, dbAction } from '../database.js';
import { showToast, getTodayDateString, loadEmpleadosIntoSelect } from '../utils.js';

/**
 * Actualiza todos los componentes del dashboard (KPIs, actividad reciente).
 */
export async function updateDashboard() {
    loadEmpleadosIntoSelect('checador-empleado');
    updateKPIs();
    updateRecentActivity();
}

/**
 * Actualiza las tarjetas de indicadores clave de rendimiento (KPIs).
 */
async function updateKPIs() {
    try {
        const todayStr = getTodayDateString();
        const tx = db.transaction(['empleados', 'registrosAsistencia'], 'readonly');
        const empleados = await new Promise(r => tx.objectStore('empleados').getAll().onsuccess = e => r(e.target.result));
        const asistenciasHoy = await new Promise(r => tx.objectStore('registrosAsistencia').index('fecha').getAll(todayStr).onsuccess = e => r(e.target.result));

        const empleadosActivos = empleados.filter(e => e.activo);
        
        let presentes = 0;
        let retardos = 0;
        const presentesIds = new Set();
        
        asistenciasHoy.forEach(a => {
            if (!presentesIds.has(a.empleadoId)) {
                presentesIds.add(a.empleadoId);
                presentes++;
                const empleado = empleados.find(e => e.id === a.empleadoId);
                if (empleado && a.horaEntrada) {
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

/**
 * Actualiza la lista de actividad reciente.
 */
async function updateRecentActivity() {
    try {
        const allAsistencias = await dbAction('registrosAsistencia', 'readonly', 'getAll');
        const empleados = await dbAction('empleados', 'readonly', 'getAll');
        const empleadosMap = new Map(empleados.map(e => [e.id, e.nombreCompleto]));

        const actividadUl = document.getElementById('lista-actividad');
        actividadUl.innerHTML = '';
        
        allAsistencias.sort((a,b) => {
            const dateA = a.horaSalida ? new Date(a.horaSalida) : new Date(a.horaEntrada);
            const dateB = b.horaSalida ? new Date(b.horaSalida) : new Date(b.horaEntrada);
            return dateB - dateA;
        }).slice(0, 10).forEach(a => {
            const nombreEmpleado = empleadosMap.get(a.empleadoId);
            if(nombreEmpleado) {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between text-sm';
                let html;
                if (a.horaSalida) {
                     html = `<div class="flex items-center"><i class="fas fa-user-circle text-red-400 mr-3"></i><span><strong>${nombreEmpleado}</strong> registró salida</span></div><span class="text-gray-500">${new Date(a.horaSalida).toLocaleTimeString()}</span>`;
                } else {
                     html = `<div class="flex items-center"><i class="fas fa-user-circle text-green-400 mr-3"></i><span><strong>${nombreEmpleado}</strong> registró entrada</span></div><span class="text-gray-500">${new Date(a.horaEntrada).toLocaleTimeString()}</span>`;
                }
                li.innerHTML = html;
                actividadUl.appendChild(li);
            }
        });
    } catch (error) {
        console.error("Error actualizando actividad reciente:", error);
    }
}

/**
 * Maneja el registro de entrada/salida desde el panel de administrador.
 * @param {boolean} isCheckIn - True si es entrada, false si es salida.
 */
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
