// js/modules/kiosk.js
//import { db, dbAction } from '../database.js'; // Se importa 'db'

let kioskClockInterval;
let html5QrCode;
let currentScannedEmployee = null;

const KIOSK_RESET_TIMEOUT = 5000;

export function initKioskMode() {
    if (kioskClockInterval) clearInterval(kioskClockInterval);
    kioskClockInterval = setInterval(updateKioskClock, 1000);
    updateKioskClock();
    showScannerView();
}

export async function stopKioskMode() {
    if (kioskClockInterval) clearInterval(kioskClockInterval);
    if (html5QrCode && html5QrCode.isScanning) {
        try {
            await html5QrCode.stop();
        } catch (err) {
            console.warn("Error al detener el scanner de QR:", err);
        }
    }
}

function updateKioskClock() {
    const now = new Date();
    const clockElement = document.getElementById('kiosk-clock');
    const dateElement = document.getElementById('kiosk-date');
    if (clockElement) clockElement.textContent = now.toLocaleTimeString('es-MX');
    if (dateElement) dateElement.textContent = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function showScannerView() {
    currentScannedEmployee = null;
    const mainContent = document.getElementById('kiosk-main-content');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <h2 class="text-3xl font-light text-gray-700 mb-4">Escanear Tarjeta Digital</h2>
        <div id="qr-reader" class="w-full max-w-md mx-auto border-4 border-gray-300 rounded-lg overflow-hidden"></div>
        <div id="qr-reader-status" class="mt-4 text-gray-600">Iniciando cámara...</div>
    `;
    startScanner();
}

function startScanner() {
    if (html5QrCode && html5QrCode.isScanning) return;
    html5QrCode = new Html5Qrcode("qr-reader");
    const qrCodeSuccessCallback = (decodedText) => {
        if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => handleTokenScanned(decodedText)).catch(err => console.error("Fallo al detener el scanner", err));
        }
    };
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const statusDiv = document.getElementById('qr-reader-status');
    html5QrCode.start({ facingMode: { exact: "environment" } }, config, qrCodeSuccessCallback)
        .catch(() => {
            if(statusDiv) statusDiv.textContent = 'Cámara trasera no encontrada. Intentando con la frontal...';
            html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback)
                .catch((err) => {
                    console.error("No se pudo iniciar ninguna cámara.", err);
                    if(statusDiv) statusDiv.innerHTML = `<p class="text-red-500">Error: No se pudo acceder a ninguna cámara.</p>`;
                });
        });
}

async function handleTokenScanned(token) {
    try {
        const mainContent = document.getElementById('kiosk-main-content');
        mainContent.innerHTML = `<div class="flex justify-center items-center"><div class="loader"></div><p class="ml-4">Validando...</p></div>`;
        
        // Cambiamos a llamada al backend
        const response = await dbAction('asistencias', 'readwrite', 'add', {
            action: 'validate-token',
            token: token
        });

        if (response.success && response.employee) {
            currentScannedEmployee = response.employee;
            showKioskActions();
        } else {
            showKioskMessage(response.message || "Token inválido o no encontrado.", true);
        }
    } catch (error) {
        console.error("Error al validar el token:", error);
        showKioskMessage("Ocurrió un error al validar. Intente de nuevo.", true);
    }
}

async function handleKioskCheckInOut(isCheckIn) {
    if (!currentScannedEmployee) return;
    
    try {
        const mainContent = document.getElementById('kiosk-main-content');
        mainContent.innerHTML = `<div class="flex justify-center items-center"><div class="loader"></div><p class="ml-4">Registrando...</p></div>`;
        
        // Cambiamos a llamada al backend
        const response = await dbAction('asistencias', 'readwrite', 'add', {
            action: isCheckIn ? 'check-in' : 'check-out',
            empleadoId: currentScannedEmployee.id
        });

        if (response.success) {
            showKioskMessage(response.message, false);
        } else {
            showKioskMessage(response.message || "Ocurrió un error al registrar.", true);
        }
    } catch (error) {
        console.error("Error en registro de Kiosko:", error);
        showKioskMessage("Ocurrió un error al registrar. Intente de nuevo.", true);
    }
}

function showKioskActions() {
    const mainContent = document.getElementById('kiosk-main-content');
    if (!mainContent || !currentScannedEmployee) return;
    mainContent.innerHTML = `
        <div id="kiosk-actions">
            <h2 class="text-4xl font-light text-gray-700">¡Hola, ${currentScannedEmployee.nombreCompleto.split(' ')[0]}!</h2>
            <p class="text-xl text-gray-500 mt-2">¿Qué deseas hacer?</p>
            <div class="flex flex-col md:flex-row justify-center gap-6 mt-8">
                <button id="kiosk-btn-check-in" class="text-2xl font-bold bg-green-500 text-white rounded-lg shadow-lg w-full md:w-64 h-40 flex flex-col items-center justify-center kiosk-card">
                    <i class="fas fa-fingerprint text-5xl mb-2"></i>Registrar Entrada
                </button>
                <button id="kiosk-btn-check-out" class="text-2xl font-bold bg-red-500 text-white rounded-lg shadow-lg w-full md:w-64 h-40 flex flex-col items-center justify-center kiosk-card">
                    <i class="fas fa-sign-out-alt text-5xl mb-2"></i>Registrar Salida
                </button>
            </div>
             <button id="kiosk-actions-back" class="mt-8 text-gray-600 hover:text-gray-800"><i class="fas fa-arrow-left mr-2"></i>Cancelar</button>
        </div>`;
    document.getElementById('kiosk-btn-check-in').addEventListener('click', () => handleKioskCheckInOut(true));
    document.getElementById('kiosk-btn-check-out').addEventListener('click', () => handleKioskCheckInOut(false));
    document.getElementById('kiosk-actions-back').addEventListener('click', showScannerView);
}



function showKioskMessage(message, isError = false) {
    const mainContent = document.getElementById('kiosk-main-content');
    if (mainContent) {
        const textColor = isError ? 'text-red-500' : 'text-gray-700';
        mainContent.innerHTML = `<div class="text-center"><h2 class="text-4xl font-light ${textColor}">${message}</h2></div>`;
    }
    setTimeout(showScannerView, KIOSK_RESET_TIMEOUT);
}
