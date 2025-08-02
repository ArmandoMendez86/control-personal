// js/utils.js
import { dbAction } from './database.js';

/**
 * Muestra una notificación toast en la pantalla.
 * @param {string} message - El mensaje a mostrar.
 * @param {'info'|'success'|'warning'|'error'} type - El tipo de notificación.
 */
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;

    toast.classList.remove('opacity-0');

    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-500',
        info: 'bg-gray-800'
    };
    
    Object.values(colors).forEach(colorClass => toast.classList.remove(colorClass));
    
    toast.classList.add(colors[type]);
    toastMessage.textContent = message;

    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 3000);
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD.
 * @returns {string}
 */
export const getTodayDateString = () => new Date().toISOString().split('T')[0];

/**
 * Carga la lista de empleados activos en un elemento <select>.
 * @param {string} selectId - El ID del elemento select.
 * @param {string} [firstOptionText='Seleccione...'] - El texto para la primera opción (deshabilitada).
 */
export const loadEmpleadosIntoSelect = async (selectId, firstOptionText = 'Seleccione...') => {
    try {
        const empleados = await dbAction('empleados', 'readonly', 'getAll');
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = `<option value="">${firstOptionText}</option>`;
        empleados
            .filter(e => e.activo)
            .forEach(emp => {
                select.innerHTML += `<option value="${emp.id}">${emp.nombreCompleto}</option>`;
            });
    } catch (error) {
        console.error("Error cargando empleados en el select:", error);
    }
};

/**
 * Obtiene el número de la semana para una fecha dada.
 * @param {Date} d - La fecha.
 * @returns {number}
 */
export const getWeekNumber = d => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Obtiene un array con todas las fechas (YYYY-MM-DD) de una semana específica.
 * @param {string} weekInput - La semana en formato 'YYYY-W##'.
 * @returns {string[]}
 */
export const getDatesOfWeek = weekInput => {
    const [year, week] = weekInput.split('-W').map(Number);
    const d = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 1 - day); // Ir al lunes de esa semana
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(d);
        date.setUTCDate(d.getUTCDate() + i);
        return date.toISOString().split('T')[0];
    });
};
