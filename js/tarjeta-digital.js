// js/tarjeta-digital.js

import { dbAction } from './database.js';

const REFRESH_INTERVAL_SECONDS = 120; // 2 minutos

let countdownInterval;

document.addEventListener('DOMContentLoaded', async () => {
    try {
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

function getEmployeeIdentifierFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('uuid');
}

async function getEmployeeByUuid(uuid) {
    try {
        const response = await dbAction('empleados', 'readonly', 'get', uuid);
        return response;
    } catch (error) {
        console.error("Error al obtener empleado:", error);
        throw error;
    }
}

function displayEmployeeInfo(employee) {
    document.getElementById('employee-name').textContent = employee.nombreCompleto;
    document.getElementById('user-initial').textContent = employee.nombreCompleto.charAt(0).toUpperCase();
}

async function generateAndDisplayBarcode(employee) {
    try {
        const token = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiryDate = new Date(Date.now() + REFRESH_INTERVAL_SECONDS * 1000);

        const response = await dbAction('empleados', 'readwrite', 'put', {
            id: employee.id,
            token: token,
            tokenExpiry: expiryDate.toISOString()
        });

        if (!response.success) {
            throw new Error("No se pudo actualizar el token");
        }

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