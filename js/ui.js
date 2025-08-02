// js/ui.js

/**
 * Renderiza el layout principal de las vistas de Kiosko y Administrador.
 */
export function renderLayout() {
    // Kiosk View HTML
    document.getElementById('kiosk-view').innerHTML = `
        <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div class="w-full max-w-4xl text-center">
                <h1 class="text-6xl md:text-8xl font-bold text-gray-800" id="kiosk-clock"></h1>
                <p class="text-xl md:text-2xl text-gray-500 mt-2" id="kiosk-date"></p>
                <div id="kiosk-main-content" class="mt-12 bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-auto transition-all duration-500">
                    <!-- El contenido dinámico del kiosko (scanner/acciones) se inserta aquí -->
                </div>
            </div>
            <button id="btn-admin-login" class="absolute bottom-5 right-5 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 shadow-md transition-all">
                <i class="fas fa-lock mr-2"></i>Acceso Admin
            </button>
        </div>`;

    // Admin View HTML
    document.getElementById('admin-view').innerHTML = `
        <div class="h-screen w-full bg-gray-100">
            <div class="flex h-full w-full max-w-screen-2xl mx-auto">
                <aside class="sidebar bg-gray-900 text-gray-300 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30">
                    <a href="#" class="text-white flex items-center space-x-3 px-4">
                        <i class="fas fa-business-time text-3xl text-blue-500"></i>
                        <span class="text-2xl font-extrabold">ControlSys</span>
                    </a>
                    <nav class="flex flex-col justify-between h-[calc(100%-80px)]">
                        <div>
                            <a href="#dashboard" class="nav-link flex items-center py-3 px-4 rounded-lg transition duration-200 hover:bg-gray-800 hover:text-white"><i class="fas fa-tachometer-alt w-6 mr-3"></i>Dashboard</a>
                            <a href="#asistencias" class="nav-link flex items-center py-3 px-4 rounded-lg transition duration-200 hover:bg-gray-800 hover:text-white"><i class="fas fa-calendar-check w-6 mr-3"></i>Asistencias</a>
                            <a href="#empleados" class="nav-link flex items-center py-3 px-4 rounded-lg transition duration-200 hover:bg-gray-800 hover:text-white"><i class="fas fa-users w-6 mr-3"></i>Empleados</a>
                            <a href="#conceptos" class="nav-link flex items-center py-3 px-4 rounded-lg transition duration-200 hover:bg-gray-800 hover:text-white"><i class="fas fa-cogs w-6 mr-3"></i>Conceptos</a>
                            <a href="#reportes" class="nav-link flex items-center py-3 px-4 rounded-lg transition duration-200 hover:bg-gray-800 hover:text-white"><i class="fas fa-file-invoice-dollar w-6 mr-3"></i>Pre-Nómina</a>
                        </div>
                        <div>
                            <button id="btn-admin-logout" class="w-full text-left flex items-center py-3 px-4 rounded-lg transition duration-200 bg-red-600 text-white hover:bg-red-700">
                                <i class="fas fa-sign-out-alt w-6 mr-3"></i>Salir a Kiosko
                            </button>
                        </div>
                    </nav>
                </aside>
                <div class="main-content flex-1 flex flex-col overflow-hidden bg-gray-100">
                    <header class="flex justify-between items-center p-5 bg-gray-100">
                        <div class="flex items-center">
                            <button id="menu-button" class="text-gray-600 focus:outline-none md:hidden mr-4">
                                <i class="fas fa-bars text-2xl"></i>
                            </button>
                            <h1 id="view-title" class="text-3xl font-bold text-gray-800"></h1>
                        </div>
                    </header>
                    <main class="flex-1 overflow-x-hidden overflow-y-auto p-6">
                        <div id="dashboard" class="view"></div>
                        <div id="asistencias" class="view"></div>
                        <div id="empleados" class="view"></div>
                        <div id="conceptos" class="view"></div>
                        <div id="reportes" class="view"></div>
                    </main>
                </div>
            </div>
        </div>`;
    
    renderAdminViewsContent();
    renderModals();
}

/**
 * Renderiza el contenido HTML inicial de las vistas de administrador.
 */
function renderAdminViewsContent() {
    document.getElementById('dashboard').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-md flex items-center justify-between transition-all hover:shadow-lg hover:scale-105"><div class="text-left"><p class="text-4xl font-bold text-green-500" id="kpi-presentes">0</p><p class="text-gray-500">Presentes Hoy</p></div><div class="bg-green-100 text-green-500 rounded-full h-16 w-16 flex items-center justify-center"><i class="fas fa-user-check text-3xl"></i></div></div>
            <div class="bg-white p-6 rounded-xl shadow-md flex items-center justify-between transition-all hover:shadow-lg hover:scale-105"><div class="text-left"><p class="text-4xl font-bold text-red-500" id="kpi-ausentes">0</p><p class="text-gray-500">Ausentes Hoy</p></div><div class="bg-red-100 text-red-500 rounded-full h-16 w-16 flex items-center justify-center"><i class="fas fa-user-times text-3xl"></i></div></div>
            <div class="bg-white p-6 rounded-xl shadow-md flex items-center justify-between transition-all hover:shadow-lg hover:scale-105"><div class="text-left"><p class="text-4xl font-bold text-yellow-500" id="kpi-retardos">0</p><p class="text-gray-500">Retardos Hoy</p></div><div class="bg-yellow-100 text-yellow-500 rounded-full h-16 w-16 flex items-center justify-center"><i class="fas fa-user-clock text-3xl"></i></div></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-xl font-bold mb-4 text-gray-800">Registro Rápido</h3>
                <div class="mb-4">
                    <label for="checador-empleado" class="block text-sm font-medium text-gray-700 mb-1">Seleccionar Empleado</label>
                    <select id="checador-empleado" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></select>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-6">
                    <button id="btn-check-in" class="w-full flex items-center justify-center px-4 py-3 font-semibold rounded-md text-white bg-green-500 hover:bg-green-600 transition-all shadow-sm hover:shadow-md"><i class="fas fa-fingerprint mr-2"></i> Entrada</button>
                    <button id="btn-check-out" class="w-full flex items-center justify-center px-4 py-3 font-semibold rounded-md text-white bg-red-500 hover:bg-red-600 transition-all shadow-sm hover:shadow-md"><i class="fas fa-sign-out-alt mr-2"></i> Salida</button>
                </div>
                <div id="checador-status" class="mt-6 text-center h-6"></div>
            </div>
            <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-xl font-bold mb-4 text-gray-800">Actividad Reciente</h3>
                <ul id="lista-actividad" class="space-y-3 h-64 overflow-y-auto"></ul>
            </div>
        </div>`;
    
    document.getElementById('asistencias').innerHTML = `
        <div class="bg-white p-5 rounded-xl shadow-md mb-6 flex items-center space-x-4 flex-wrap gap-y-4">
            <div>
                <label for="filtro-fecha-asistencia" class="font-medium text-gray-700 text-sm">Fecha:</label>
                <input type="date" id="filtro-fecha-asistencia" class="ml-2 border-gray-300 rounded-md shadow-sm p-2">
            </div>
            <div>
                <label for="filtro-empleado-asistencia" class="font-medium text-gray-700 text-sm">Empleado:</label>
                <select id="filtro-empleado-asistencia" class="ml-2 border-gray-300 rounded-md shadow-sm p-2 w-64"></select>
            </div>
            <button id="btn-buscar-asistencias" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"><i class="fas fa-search mr-2"></i>Buscar</button>
        </div>
        <div id="asistencias-table-container" class="bg-white shadow-md rounded-xl overflow-hidden"></div>`;

    document.getElementById('empleados').innerHTML = `
        <div class="flex justify-end mb-4"><button id="btn-nuevo-empleado" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-sm hover:shadow-lg transition-shadow"><i class="fas fa-plus mr-2"></i> Nuevo Empleado</button></div>
        <div id="empleados-table-container" class="bg-white shadow-md rounded-xl overflow-hidden"></div>`;
    
    document.getElementById('conceptos').innerHTML = `
        <div class="flex justify-end mb-4"><button id="btn-nuevo-concepto" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-sm hover:shadow-lg transition-shadow"><i class="fas fa-plus mr-2"></i> Nuevo Concepto</button></div>
        <div id="conceptos-table-container" class="bg-white shadow-md rounded-xl overflow-hidden"></div>`;

    document.getElementById('reportes').innerHTML = `
        <div class="bg-white p-5 rounded-xl shadow-md mb-6 flex items-center space-x-4 flex-wrap gap-y-4">
            <div>
                <label for="semana-reporte" class="font-medium text-gray-700 text-sm">Seleccionar Semana:</label>
                <input type="week" id="semana-reporte" class="ml-2 border-gray-300 rounded-md shadow-sm p-2">
            </div>
            <button id="btn-generar-reporte" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Generar Reporte</button>
            <button id="btn-exportar-csv" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg hidden">Exportar a CSV</button>
        </div>
        <div id="reporte-container">
            <!-- El estado vacío o la tabla de reporte se renderizará aquí -->
        </div>`;
}

/**
 * Renderiza el HTML de todos los modales en el contenedor de modales.
 */
function renderModals() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <!-- Empleado Modal -->
        <div id="empleado-modal" class="fixed z-50 inset-0 overflow-y-auto hidden">
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity" aria-hidden="true"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form id="form-empleado">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-empleado"></h3>
                            <input type="hidden" id="empleado-id">
                            <div class="mt-4 space-y-4">
                                <div><label for="nombreCompleto" class="block text-sm font-medium text-gray-700">Nombre Completo</label><input type="text" id="nombreCompleto" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label for="sueldoSemanal" class="block text-sm font-medium text-gray-700">Sueldo Semanal ($)</label><input type="number" step="0.01" id="sueldoSemanal" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
                                    <div id="pin-container" class="hidden"><label for="pin" class="block text-sm font-medium text-gray-700">PIN de 4 dígitos</label><input type="password" id="pin" pattern="\\d{4}" title="El PIN debe contener 4 números." maxlength="4" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label for="horarioEntrada" class="block text-sm font-medium text-gray-700">Horario Entrada</label><input type="time" id="horarioEntrada" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
                                    <div><label for="horarioSalida" class="block text-sm font-medium text-gray-700">Horario Salida</label><input type="time" id="horarioSalida" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label for="diasLaborales" class="block text-sm font-medium text-gray-700">Días Laborales</label><input type="number" min="1" max="7" id="diasLaborales" value="6" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
                                    <div><label for="pagoPorHoraExtra" class="block text-sm font-medium text-gray-700">Pago por H. Extra ($)</label><input type="number" step="0.01" id="pagoPorHoraExtra" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Guardar</button>
                            <button type="button" class="btn-cancelar-modal mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Concepto Modal -->
        <div id="concepto-modal" class="fixed z-50 inset-0 overflow-y-auto hidden">
             <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"><div class="fixed inset-0 transition-opacity" aria-hidden="true"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div><span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span><div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"><form id="form-concepto"><div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4"><h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-concepto"></h3><input type="hidden" id="concepto-id"><div class="mt-4 space-y-4"><div><label for="conceptoNombre" class="block text-sm font-medium text-gray-700">Nombre del Concepto</label><input type="text" id="conceptoNombre" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div><div><label for="conceptoTipo" class="block text-sm font-medium text-gray-700">Tipo</label><select id="conceptoTipo" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"><option value="PERCEPCION">Percepción (Bono, Ingreso)</option><option value="DEDUCCION">Deducción (Préstamo, Descuento)</option></select></div><div><label for="conceptoMonto" class="block text-sm font-medium text-gray-700">Monto Fijo (Opcional)</label><input type="number" step="0.01" id="conceptoMonto" placeholder="Dejar en 0 si es variable" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div></div></div><div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"><button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Guardar</button><button type="button" class="btn-cancelar-modal mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancelar</button></div></form></div></div>
        </div>

        <!-- Asistencia Modal -->
        <div id="asistencia-modal" class="fixed z-50 inset-0 overflow-y-auto hidden">
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"><div class="fixed inset-0 transition-opacity" aria-hidden="true"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div><span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span><div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"><form id="form-asistencia"><div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4"><h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-asistencia"></h3><input type="hidden" id="asistencia-id"><div class="mt-4 space-y-4">
            <div><label class="block text-sm font-medium text-gray-700">Empleado</label><p id="asistencia-empleado-nombre" class="mt-1 text-lg"></p></div>
            <div><label for="asistencia-fecha" class="block text-sm font-medium text-gray-700">Fecha</label><input type="date" id="asistencia-fecha" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label for="asistencia-entrada" class="block text-sm font-medium text-gray-700">Hora Entrada</label><input type="time" id="asistencia-entrada" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
                <div><label for="asistencia-salida" class="block text-sm font-medium text-gray-700">Hora Salida</label><input type="time" id="asistencia-salida" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"></div>
            </div>
            </div></div><div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"><button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Guardar</button><button type="button" class="btn-cancelar-modal mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancelar</button></div></form></div></div>
        </div>

        <!-- Justificar Faltas Modal -->
        <div id="justificar-modal" class="fixed z-50 inset-0 overflow-y-auto hidden">
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"><div class="fixed inset-0 transition-opacity" aria-hidden="true"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div><span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span><div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"><form id="form-justificar"><div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4"><h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-justificar"></h3><input type="hidden" id="justificar-empleado-id"><div id="lista-faltas" class="mt-4 space-y-4 max-h-64 overflow-y-auto"></div></div><div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"><button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Guardar Justificaciones</button><button type="button" class="btn-cancelar-modal mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancelar</button></div></form></div></div>
        </div>
    `;
}

/**
 * Abre un modal específico.
 * @param {string} modalId - El ID del modal a abrir.
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Cierra todos los modales abiertos.
 */
export function closeModal() {
    document.querySelectorAll('#modal-container > div').forEach(modal => {
        modal.classList.add('hidden');
    });
}

/**
 * Renderiza un estado vacío en un contenedor.
 * @param {HTMLElement} container - El elemento contenedor.
 * @param {string} iconClass - Clases de FontAwesome para el ícono.
 * @param {string} title - El título del mensaje.
 * @param {string} message - El mensaje descriptivo.
 * @param {string} [buttonHTML=''] - HTML opcional para un botón de acción.
 */
// ===== INICIO DE LA CORRECCIÓN =====
// Se agrega la palabra 'export' para que esta función esté disponible en otros módulos.
export function renderEmptyState(container, iconClass, title, message, buttonHTML = '') {
// ===== FIN DE LA CORRECCIÓN =====
    container.innerHTML = `
        <div class="empty-state-container">
            <div class="empty-state-icon">
                <i class="${iconClass}"></i>
            </div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-message">${message}</p>
            <div class="empty-state-action">${buttonHTML}</div>
        </div>
    `;
}
