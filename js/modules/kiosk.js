// js/modules/kiosk.js
import { db, dbAction } from '../database.js'; // <--- CAMBIO: Se importa "db"

let kioskClockInterval;
let selectedKioskEmployee = null;
let currentPin = '';

/**
 * Inicializa el modo Kiosko, incluyendo el reloj y la carga de empleados.
 */
export function initKioskMode() {
    if (kioskClockInterval) clearInterval(kioskClockInterval);
    kioskClockInterval = setInterval(updateKioskClock, 1000);
    updateKioskClock();
    
    showKioskWelcome();
    loadKioskEmployeeGrid();
}

/**
 * Detiene los procesos del modo Kiosko (como el intervalo del reloj).
 */
export function stopKioskMode() {
    if (kioskClockInterval) clearInterval(kioskClockInterval);
}

function updateKioskClock() {
    const now = new Date();
    const clockElement = document.getElementById('kiosk-clock');
    const dateElement = document.getElementById('kiosk-date');
    if (clockElement) clockElement.textContent = now.toLocaleTimeString('es-MX');
    if (dateElement) dateElement.textContent = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadKioskEmployeeGrid() {
    const mainContent = document.getElementById('kiosk-main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div id="kiosk-welcome">
             <h2 class="text-4xl font-light text-gray-700">Selecciona tu nombre para comenzar</h2>
             <div id="kiosk-employee-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
                <!-- Las tarjetas de empleados se insertarán aquí -->
             </div>
        </div>`;

    try {
        const empleados = await dbAction('empleados', 'readonly', 'getAll');
        const grid = document.getElementById('kiosk-employee-grid');
        grid.innerHTML = '';
        empleados.filter(e => e.activo).forEach(emp => {
            const card = document.createElement('div');
            card.className = 'kiosk-card bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center cursor-pointer';
            card.innerHTML = `
                <div class="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mb-3">
                    <span class="text-3xl font-bold text-gray-600">${emp.nombreCompleto.charAt(0)}</span>
                </div>
                <p class="font-semibold text-gray-800">${emp.nombreCompleto}</p>
            `;
            card.addEventListener('click', () => selectKioskEmployee(emp));
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar empleados en el kiosko:", error);
    }
}

function selectKioskEmployee(empleado) {
    selectedKioskEmployee = empleado;
    showKioskPinEntry();
}

function showKioskWelcome() {
    selectedKioskEmployee = null;
    currentPin = '';
    loadKioskEmployeeGrid();
}

function showKioskPinEntry() {
    const mainContent = document.getElementById('kiosk-main-content');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <div id="kiosk-pin-entry">
            <h2 class="text-4xl font-light text-gray-700" id="kiosk-pin-welcome-name">¡Hola, ${selectedKioskEmployee.nombreCompleto.split(' ')[0]}!</h2>
            <p class="text-xl text-gray-500 mt-2">Ingresa tu PIN de 4 dígitos</p>
            <div id="pin-dots" class="flex justify-center gap-4 my-6">
                <div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div>
            </div>
            <div id="pin-keypad" class="grid grid-cols-3 gap-4 max-w-xs mx-auto"></div>
            <div id="pin-error" class="text-red-500 font-bold mt-4 h-6"></div>
            <button id="kiosk-pin-back" class="mt-4 text-gray-600 hover:text-gray-800"><i class="fas fa-arrow-left mr-2"></i>Volver a la lista</button>
        </div>`;
    
    document.getElementById('kiosk-pin-back').addEventListener('click', showKioskWelcome);
    generateKeypad();
}

function showKioskActions() {
    const mainContent = document.getElementById('kiosk-main-content');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <div id="kiosk-actions">
            <h2 class="text-4xl font-light text-gray-700">¡Hola, ${selectedKioskEmployee.nombreCompleto.split(' ')[0]}!</h2>
            <p class="text-xl text-gray-500 mt-2">¿Qué deseas hacer?</p>
            <div class="flex justify-center gap-6 mt-8">
                <button id="kiosk-btn-check-in" class="text-2xl font-bold bg-green-500 text-white rounded-lg shadow-lg w-64 h-40 flex flex-col items-center justify-center kiosk-card">
                    <i class="fas fa-fingerprint text-5xl mb-2"></i>Registrar Entrada
                </button>
                <button id="kiosk-btn-check-out" class="text-2xl font-bold bg-red-500 text-white rounded-lg shadow-lg w-64 h-40 flex flex-col items-center justify-center kiosk-card">
                    <i class="fas fa-sign-out-alt text-5xl mb-2"></i>Registrar Salida
                </button>
            </div>
             <button id="kiosk-actions-back" class="mt-8 text-gray-600 hover:text-gray-800"><i class="fas fa-arrow-left mr-2"></i>Volver a la lista</button>
        </div>`;

    document.getElementById('kiosk-btn-check-in').addEventListener('click', () => handleKioskCheckInOut(true));
    document.getElementById('kiosk-btn-check-out').addEventListener('click', () => handleKioskCheckInOut(false));
    document.getElementById('kiosk-actions-back').addEventListener('click', showKioskWelcome);
}

function generateKeypad() {
    const keypad = document.getElementById('pin-keypad');
    if (!keypad) return;
    keypad.innerHTML = '';
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '<i class="fas fa-backspace"></i>', '0', 'Borrar'];
    keys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'keypad-btn bg-white rounded-lg shadow-md h-20 text-3xl font-bold text-gray-700 flex items-center justify-center';
        btn.innerHTML = key;
        btn.addEventListener('click', () => handlePinKeyPress(key));
        keypad.appendChild(btn);
    });
}

function handlePinKeyPress(key) {
    const pinError = document.getElementById('pin-error');
    if (pinError) pinError.textContent = '';

    if (key === 'Borrar') {
        currentPin = '';
    } else if (key.includes('backspace')) {
        currentPin = currentPin.slice(0, -1);
    } else if (currentPin.length < 4) {
        currentPin += key;
    }
    
    updatePinDots();

    if (currentPin.length === 4) {
        verifyPin();
    }
}

function updatePinDots() {
    const dots = document.querySelectorAll('#pin-dots .pin-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('filled', index < currentPin.length);
    });
}

async function verifyPin() {
    if (currentPin === selectedKioskEmployee.pin) {
        showKioskActions();
    } else {
        const pinError = document.getElementById('pin-error');
        const pinDots = document.getElementById('pin-dots');
        if(pinError) pinError.textContent = 'PIN Incorrecto. Intenta de nuevo.';
        if(pinDots) {
            pinDots.classList.add('animate-shake');
            setTimeout(() => {
                pinDots.classList.remove('animate-shake');
                currentPin = '';
                updatePinDots();
            }, 800);
        }
    }
}

async function handleKioskCheckInOut(isCheckIn) {
    if (!selectedKioskEmployee) return;
    const empleadoId = selectedKioskEmployee.id;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
        const transaction = db.transaction(['registrosAsistencia'], 'readwrite'); // Esto ahora funcionará
        const store = transaction.objectStore('registrosAsistencia');
        const index = store.index('empleado_fecha');
        const request = index.getAll([empleadoId, todayStr]);

        request.onsuccess = (e) => {
            const registrosHoy = e.target.result;
            let registro = registrosHoy.length > 0 ? registrosHoy[registrosHoy.length - 1] : null; // Tomar el último registro del día
            let message = '';
            
            if (isCheckIn) {
                if (registro && registro.horaEntrada && !registro.horaSalida) {
                    message = `Ya tienes una entrada registrada sin salida.`;
                } else {
                    const nuevoRegistro = { empleadoId, fecha: todayStr, horaEntrada: new Date(), horaSalida: null };
                    store.add(nuevoRegistro);
                    message = `Entrada registrada a las ${nuevoRegistro.horaEntrada.toLocaleTimeString()}. ¡Que tengas un buen día!`;
                }
            } else { // Es Check-out
                if (!registro || !registro.horaEntrada || registro.horaSalida) {
                    message = 'Debes registrar tu entrada primero o ya registraste tu salida.';
                } else {
                    registro.horaSalida = new Date();
                    store.put(registro);
                    message = `Salida registrada a las ${registro.horaSalida.toLocaleTimeString()}. ¡Hasta mañana!`;
                }
            }
            
            const mainContent = document.getElementById('kiosk-main-content');
            if (mainContent) {
                 mainContent.innerHTML = `<div class="text-center"><h2 class="text-4xl font-light text-gray-700">${message}</h2></div>`;
            }
            setTimeout(initKioskMode, 4000); // Volver al inicio después de 4 segundos
        };
    } catch (error) {
        console.error("Error en registro de Kiosko:", error);
    }
}
