// js/main.js

import { initDB, dbAction } from './database.js';
import { renderLayout, openModal, closeModal } from './ui.js';
import { showToast, getWeekNumber } from './utils.js';
import { initKioskMode, stopKioskMode } from './modules/kiosk.js';
import { updateDashboard, handleAdminCheckIn, handleAdminCheckOut } from './modules/dashboard.js';
import { initEmployeesView } from './modules/employees.js';
import { initConceptsView } from './modules/concepts.js';
import { initAttendanceView } from './modules/attendance.js';
import { initReportsView } from './modules/reports.js';

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        renderLayout();
        await seedInitialData(); // Cargar datos de prueba si es necesario
        setupEventListeners();
        
        // Iniciar en modo Kiosko por defecto
        loadKioskView();

    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showToast('Error fatal al cargar la aplicación. Revise la consola.', 'error');
    }
});

/**
 * Configura los event listeners principales de la aplicación.
 */
function setupEventListeners() {
    // Navegación principal
    window.addEventListener('hashchange', () => navigateTo(window.location.hash));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
            // Ocultar menú en móvil después de hacer clic
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        });
    });

    // Botón de menú móvil
    document.getElementById('menu-button').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('-translate-x-full');
    });
    
    // Botones de cambio de modo
    document.getElementById('btn-admin-login').addEventListener('click', handleAdminLogin);
    document.getElementById('btn-admin-logout').addEventListener('click', handleAdminLogout);

    // Botones de cancelar en todos los modales
    document.querySelectorAll('.btn-cancelar-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Listeners para el checador rápido del dashboard
    document.getElementById('btn-check-in').addEventListener('click', handleAdminCheckIn);
    document.getElementById('btn-check-out').addEventListener('click', handleAdminCheckOut);

    // Inicializar listeners de cada módulo
    initEmployeesView();
    initConceptsView();
    initAttendanceView();
    initReportsView();
}


// --- NAVEGACIÓN Y CAMBIO DE VISTAS ---

/**
 * Navega a la vista especificada por el hash.
 * @param {string} hash - El hash de la URL (e.g., '#dashboard').
 */
function navigateTo(hash) {
    hash = hash || '#dashboard';
    
    // Ocultar todas las vistas y quitar el estilo activo de los links
    document.querySelectorAll('#admin-view .view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('bg-gray-700'));
    
    const viewId = hash.substring(1);
    const activeView = document.getElementById(viewId);
    const activeLink = document.querySelector(`.nav-link[href="${hash}"]`);

    if (activeView && activeLink) {
        activeView.classList.add('active');
        activeLink.classList.add('bg-gray-700');
        document.getElementById('view-title').textContent = activeLink.textContent.trim();
        window.location.hash = hash;
        
        // Cargar datos para la vista activa
        switch(viewId) {
            case 'dashboard':
                updateDashboard();
                break;
            case 'asistencias':
                // La carga se hace desde su propio módulo
                break;
            case 'empleados':
                // La carga se hace desde su propio módulo
                break;
            case 'conceptos':
                // La carga se hace desde su propio módulo
                break;
            case 'reportes':
                // La carga se hace desde su propio módulo
                break;
        }
    } else {
        // Si no se encuentra, ir al dashboard por defecto
        navigateTo('#dashboard');
    }
}

/**
 * Carga la vista del Kiosko.
 */
function loadKioskView() {
    document.getElementById('kiosk-view').classList.remove('hidden');
    document.getElementById('admin-view').classList.add('hidden');
    initKioskMode();
}

/**
 * Maneja el inicio de sesión del administrador.
 */
function handleAdminLogin() {
    const password = prompt("Por favor, ingrese la contraseña de administrador:");
    if (password === "admin") { // Contraseña simple por ahora
        stopKioskMode();
        document.getElementById('kiosk-view').classList.add('hidden');
        document.getElementById('admin-view').classList.remove('hidden');
        navigateTo(window.location.hash || '#dashboard');
    } else if (password !== null) {
        alert("Contraseña incorrecta.");
    }
}

/**
 * Maneja el cierre de sesión del administrador, volviendo al Kiosko.
 */
function handleAdminLogout() {
    loadKioskView();
}


// --- DATOS INICIALES (SEEDING) ---

/**
 * Inserta datos de prueba en la base de datos si está vacía.
 */
async function seedInitialData() {
    try {
        const count = await dbAction('empleados', 'readonly', 'count');
        if (count > 0) return; // Si ya hay datos, no hacer nada

        console.log('Base de datos vacía, insertando datos de prueba.');
        
        const empleados = [
            { id: 1, nombreCompleto: 'Dylan', sueldoSemanal: 2350.00, diasLaborales: 6, horarioEntrada: '10:00', horarioSalida: '20:00', pagoPorHoraExtra: 50.00, activo: true, pin: '1234' },
            { id: 2, nombreCompleto: 'Alejandro C.', sueldoSemanal: 2350.00, diasLaborales: 6, horarioEntrada: '10:00', horarioSalida: '20:00', pagoPorHoraExtra: 50.00, activo: true, pin: '1111' },
            { id: 3, nombreCompleto: 'Yaret F.', sueldoSemanal: 1800.00, diasLaborales: 5, horarioEntrada: '10:00', horarioSalida: '20:00', pagoPorHoraExtra: 45.00, activo: true, pin: '2222' },
            { id: 4, nombreCompleto: 'David/Mowgli', sueldoSemanal: 2100.00, diasLaborales: 6, horarioEntrada: '10:00', horarioSalida: '20:00', pagoPorHoraExtra: 48.00, activo: true, pin: '3333' },
            { id: 5, nombreCompleto: 'Asael', sueldoSemanal: 2350.00, diasLaborales: 6, horarioEntrada: '10:00', horarioSalida: '20:00', pagoPorHoraExtra: 50.00, activo: true, pin: '4444' },
        ];
        const conceptos = [
            { id: 1, nombre: 'Cont. Descarga', tipo: 'PERCEPCION', montoFijo: 0, activo: true },
            { id: 2, nombre: 'Bono Limpieza', tipo: 'PERCEPCION', montoFijo: 150, activo: true },
            { id: 3, nombre: 'Préstamo', tipo: 'DEDUCCION', montoFijo: 0, activo: true },
        ];

        for (const emp of empleados) {
            await dbAction('empleados', 'readwrite', 'add', emp);
        }
        for (const con of conceptos) {
            await dbAction('conceptos', 'readwrite', 'add', con);
        }

        showToast('Datos de prueba cargados.', 'info');

    } catch (error) {
        console.error("Error al cargar datos de prueba:", error);
        showToast('Error cargando datos de prueba.', 'error');
    }
}
