// js/tarjeta-digital.js

import { db, initDB, dbAction } from './database.js';

const REFRESH_INTERVAL_SECONDS = 120; // 2 minutos

let countdownInterval;

/**
 * Inicializa la página de la tarjeta digital.
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        const employeeUuid = getEmployeeIdentifierFromURL();

        if (!employeeUuid) {
            showError("Identificador de empleado (UUID) no encontrado en la URL.");
            return;
        }

        const employee = await getEmployeeByUuid(employeeUuid);
        if (!employee) {
            showError("Empleado no encontrado o identificador inválido.");
            return;
        }

        document.getElementById('loading-view').classList.add('hidden');
        document.getElementById('card-view').classList.remove('hidden');
        
        displayEmployeeInfo(employee);
        await generateAndDisplayBarcode(employee);

    } catch (error) {
        console.error('Error al inicializar la tarjeta digital:', error);
        showError("Error fatal al cargar la tarjeta.");
    }
});

/**
 * Obtiene el UUID del empleado desde el parámetro en la URL.
 * @returns {string|null}
 */
function getEmployeeIdentifierFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('uuid');
}

/**
 * Busca un empleado en la base de datos usando su UUID.
 * @param {string} uuid - El UUID del empleado.
 * @returns {Promise<object|null>} El objeto del empleado o null si no se encuentra.
 */
function getEmployeeByUuid(uuid) {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject("La base de datos no está inicializada para getEmployeeByUuid");
        }
        const transaction = db.transaction(['empleados'], 'readonly');
        const store = transaction.objectStore('empleados');
        const index = store.index('uuid');
        const request = index.get(uuid);

        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = (e) => {
            reject(e.target.error);
        };
    });
}

/**
 * Muestra la información básica del empleado en la tarjeta.
 * @param {object} employee - El objeto del empleado.
 */
function displayEmployeeInfo(employee) {
    document.getElementById('employee-name').textContent = employee.nombreCompleto;
    document.getElementById('user-initial').textContent = employee.nombreCompleto.charAt(0).toUpperCase();
}

/**
 * Genera un token corto, lo guarda en la BD, lo muestra como código de barras y reinicia el contador.
 * @param {object} employee - El objeto del empleado.
 */
async function generateAndDisplayBarcode(employee) {
    try {
        const token = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiryDate = new Date(Date.now() + REFRESH_INTERVAL_SECONDS * 1000);

        const updatedEmployee = { ...employee, token, tokenExpiry: expiryDate };
        await dbAction('empleados', 'readwrite', 'put', updatedEmployee);

        JsBarcode("#barcode", token, {
            format: "CODE128",
            lineColor: "#000",
            width: 3,
            height: 80,
            displayValue: true,
            fontSize: 20,
            margin: 10
        });

        startCountdown();

        setTimeout(() => generateAndDisplayBarcode(employee), REFRESH_INTERVAL_SECONDS * 1000);

    } catch (error) {
        console.error("Error generando el código de barras:", error);
        showError("No se pudo generar el código de barras.");
    }
}

/**
 * Inicia el contador regresivo en la interfaz.
 */
function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    let timeLeft = REFRESH_INTERVAL_SECONDS;
    const countdownElement = document.getElementById('countdown');

    const updateTimer = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    updateTimer();
    countdownInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        
        if (timeLeft < 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

/**
 * Muestra un mensaje de error en la interfaz.
 * @param {string} message - El mensaje de error.
 */
function showError(message) {
    document.getElementById('loading-view').classList.add('hidden');
    const cardView = document.getElementById('card-view');
    const errorView = document.getElementById('error-view');
    if (cardView && errorView) {
        cardView.classList.remove('hidden');
        cardView.querySelectorAll(':scope > *:not(#error-view)').forEach(el => el.classList.add('hidden'));
        errorView.textContent = message;
        errorView.classList.remove('hidden');
    } else {
        document.body.innerHTML = `<div class="text-center text-red-500 p-4">${message}</div>`;
    }
}
