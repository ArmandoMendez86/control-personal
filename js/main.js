// js/main.js

import { initDB, dbAction } from './database.js';
import { renderLayout, closeModal } from './ui.js';
import { showToast } from './utils.js';
import { initKioskMode, stopKioskMode } from './modules/kiosk.js';
import { updateDashboard, handleAdminCheckIn, handleAdminCheckOut } from './modules/dashboard.js';
import { initEmployeesView } from './modules/employees.js';
import { initConceptsView } from './modules/concepts.js';
import { initAttendanceView } from './modules/attendance.js';
import { initReportsView } from './modules/reports.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        renderLayout();
        await checkBackendData();
        setupEventListeners();
        loadKioskView();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showToast('Error fatal al cargar la aplicación. Revise la consola.', 'error');
    }
});

/**
 * Verifica la conexión con el backend y si hay datos iniciales.
 */
async function checkBackendData() {
    try {
        const empleados = await dbAction('empleados', 'readonly', 'getAll');
        if (empleados.length === 0) {
            console.log('La base de datos del servidor está vacía.');
            showToast('Backend conectado, pero sin datos de empleados.', 'info');
        } else {
            console.log('Conexión con backend exitosa. Empleados cargados.');
        }
    } catch (error) {
        console.error("Error al verificar datos del backend:", error);
        showToast('Error conectando al backend.', 'error');
    }
}

/**
 * Configura todos los event listeners de la aplicación.
 */
function setupEventListeners() {
    window.addEventListener('hashchange', () => navigateTo(window.location.hash));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        });
    });

    document.getElementById('menu-button').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('-translate-x-full');
    });
    
    document.getElementById('btn-admin-login').addEventListener('click', handleAdminLogin);
    document.getElementById('btn-admin-logout').addEventListener('click', handleAdminLogout);

    document.querySelectorAll('.btn-cancelar-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('btn-check-in').addEventListener('click', handleAdminCheckIn);
    document.getElementById('btn-check-out').addEventListener('click', handleAdminCheckOut);

    initEmployeesView();
    initConceptsView();
    initAttendanceView();
    initReportsView();
}

/**
 * Navega entre las diferentes vistas del panel de administrador.
 */
function navigateTo(hash) {
    hash = hash || '#dashboard';
    
    document.querySelectorAll('#admin-view .view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    const viewId = hash.substring(1);
    const activeView = document.getElementById(viewId);
    const activeLink = document.querySelector(`.nav-link[href="${hash}"]`);

    if (activeView && activeLink) {
        activeView.classList.add('active');
        activeLink.classList.add('active');
        document.getElementById('view-title').textContent = activeLink.textContent.trim();
        window.location.hash = hash;
        
        if (viewId === 'dashboard') {
            updateDashboard();
        }
    } else {
        navigateTo('#dashboard');
    }
}

/**
 * Carga la vista de Kiosko.
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
    if (password === "admin") {
        stopKioskMode();
        document.getElementById('kiosk-view').classList.add('hidden');
        document.getElementById('admin-view').classList.remove('hidden');
        navigateTo(window.location.hash || '#dashboard');
    } else if (password !== null) {
        alert("Contraseña incorrecta.");
    }
}

/**
 * Maneja el cierre de sesión del administrador.
 */
function handleAdminLogout() {
    loadKioskView();
}
