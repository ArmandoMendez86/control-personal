// js/main.js

import { initDB, dbAction } from './database.js';
import { renderLayout, openModal, closeModal } from './ui.js';
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
        await seedInitialData();
        setupEventListeners();
        loadKioskView();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showToast('Error fatal al cargar la aplicación. Revise la consola.', 'error');
    }
});

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

function navigateTo(hash) {
    hash = hash || '#dashboard';
    
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
        
        if (viewId === 'dashboard') {
            updateDashboard();
        }
    } else {
        navigateTo('#dashboard');
    }
}

function loadKioskView() {
    document.getElementById('kiosk-view').classList.remove('hidden');
    document.getElementById('admin-view').classList.add('hidden');
    initKioskMode();
}

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

function handleAdminLogout() {
    loadKioskView();
}

async function seedInitialData() {
    try {
        const count = await dbAction('empleados', 'readonly', 'count');
        if (count > 0) return;

        console.log('Base de datos vacía, insertando datos de prueba.');
        
        const empleados = [
            { id: 1, nombreCompleto: 'Dylan', sueldoSemanal: 2350.00, diasLaborales: 6, horarioEntrada: '10:00', horarioSalida: '20:00', pagoPorHoraExtra: 50.00, activo: true, pin: '1234', uuid: crypto.randomUUID(), token: null, tokenExpiry: null },
            { id: 2, nombreCompleto: 'Alejandro C.', sueldoSemanal: 2350.00, diasLaborales: 6, horarioEntrada: '10:00', horarioSalida: '20:00', pagoPorHoraExtra: 50.00, activo: true, pin: '1111', uuid: crypto.randomUUID(), token: null, tokenExpiry: null },
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
