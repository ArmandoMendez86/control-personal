// js/ui.js

/**
 * Renderiza el layout principal de las vistas de Kiosko y Administrador.
 */
export function renderLayout() {
    // Kiosk View HTML
    document.getElementById('kiosk-view').innerHTML = `
        <div class="min-h-screen bg-gray-200 flex flex-col items-center justify-center p-4">
            <div class="w-full max-w-4xl text-center">
                <h1 class="text-6xl font-bold text-gray-800" id="kiosk-clock"></h1>
                <p class="text-2xl text-gray-500" id="kiosk-date"></p>
                <div id="kiosk-main-content" class="mt-10">
                    <!-- El contenido dinámico del kiosko se inserta aquí -->
                </div>
            </div>
            <button id="btn-admin-login" class="absolute bottom-4 right-4 bg-gray-700 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-800">
                <i class="fas fa-lock mr-2"></i>Acceso Admin
            </button>
        </div>`;

    // Admin View HTML
    // Se reestructura para usar un contenedor con padding en lugar de margen
    document.getElementById('admin-view').innerHTML = `
        <div class="h-screen w-full md:p-8">
            <div class="flex h-full w-full max-w-screen-2xl mx-auto rounded-none md:rounded-2xl shadow-none md:shadow-2xl overflow-hidden">
                <aside class="sidebar bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0">
                    <a href="#" class="text-white flex items-center space-x-2 px-4">
                        <i class="fas fa-business-time text-2xl"></i>
                        <span class="text-2xl font-extrabold">ControlSys</span>
                    </a>
                    <nav class="flex flex-col justify-between h-full pb-10">
                        <div>
                            <a href="#dashboard" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"><i class="fas fa-tachometer-alt mr-2"></i>Dashboard</a>
                            <a href="#asistencias" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"><i class="fas fa-history mr-2"></i>Asistencias</a>
                            <a href="#empleados" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"><i class="fas fa-users mr-2"></i>Empleados</a>
                            <a href="#conceptos" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"><i class="fas fa-cogs mr-2"></i>Conceptos</a>
                            <a href="#reportes" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"><i class="fas fa-file-invoice-dollar mr-2"></i>Pre-Nómina</a>
                        </div>
                        <div>
                            <button id="btn-admin-logout" class="w-full text-left block py-2.5 px-4 rounded transition duration-200 hover:bg-red-700 bg-red-600">
                                <i class="fas fa-sign-out-alt mr-2"></i>Salir a Kiosko
                            </button>
                        </div>
                    </nav>
                </aside>
                <div class="main-content flex-1 flex flex-col overflow-hidden bg-white">
                    <header class="flex justify-between items-center p-4 border-b-2 border-gray-100">
                        <div class="flex items-center">
                            <button id="menu-button" class="text-gray-500 focus:outline-none md:hidden"><i class="fas fa-bars text-2xl"></i></button>
                            <h1 id="view-title" class="text-2xl font-bold text-gray-800 ml-4"></h1>
                        </div>
                    </header>
                    <main class="flex-1 overflow-y-auto bg-gray-50 p-6 min-h-0">
                        <div id="dashboard" class="view"></div>
                        <div id="asistencias" class="view"></div>
                        <div id="empleados" class="view"></div>
                        <div id="conceptos" class="view"></div>
                        <div id="reportes" class="view"></div>
                    </main>
                </div>
            </div>
        </div>`;
    
    // Renderiza el contenido inicial de cada vista del admin
    renderAdminViewsContent();
    // Renderiza los modales
    renderModals();
}

/**
 * Renderiza el contenido HTML inicial de las vistas de administrador.
 */
function renderAdminViewsContent() {
    // Se mantiene el contenedor centrado para el contenido interno de cada vista
    
    document.getElementById('dashboard').innerHTML = `
        <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-between"><div class="text-center"><p class="text-4xl font-bold text-green-600" id="kpi-presentes">0</p><p class="text-gray-500">Presentes</p></div><i class="fas fa-user-check text-5xl text-green-200"></i></div>
                <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-between"><div class="text-center"><p class="text-4xl font-bold text-red-500" id="kpi-ausentes">0</p><p class="text-gray-500">Ausentes</p></div><i class="fas fa-user-times text-5xl text-red-200"></i></div>
                <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-between"><div class="text-center"><p class="text-4xl font-bold text-yellow-500" id="kpi-retardos">0</p><p class="text-gray-500">Con Retardo</p></div><i class="fas fa-user-clock text-5xl text-yellow-200"></i></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-bold mb-4">Registro Rápido</h3>
                    <div class="mb-4">
                        <label for="checador-empleado" class="block text-sm font-medium text-gray-700">Seleccionar Empleado</label>
                        <select id="checador-empleado" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"></select>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-6">
                        <button id="btn-check-in" class="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"><i class="fas fa-fingerprint mr-2"></i> Entrada</button>
                        <button id="btn-check-out" class="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"><i class="fas fa-sign-out-alt mr-2"></i> Salida</button>
                    </div>
                    <div id="checador-status" class="mt-6 text-center"></div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-bold mb-4">Actividad Reciente</h3>
                    <ul id="lista-actividad" class="space-y-3 h-64 overflow-y-auto"></ul>
                </div>
            </div>
        </div>`;
    
    document.getElementById('asistencias').innerHTML = `
        <div class="max-w-7xl mx-auto">
            <div class="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center space-x-4 flex-wrap">
                <label for="filtro-fecha-asistencia" class="font-medium text-gray-700">Fecha:</label>
                <input type="date" id="filtro-fecha-asistencia" class="border-gray-300 rounded-md shadow-sm">
                <label for="filtro-empleado-asistencia" class="font-medium text-gray-700">Empleado:</label>
                <select id="filtro-empleado-asistencia" class="border-gray-300 rounded-md shadow-sm w-64"></select>
                <button id="btn-buscar-asistencias" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Buscar</button>
            </div>
            <div class="bg-white shadow-md rounded-lg overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50">
                <tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr>
            </thead><tbody id="tabla-asistencias" class="bg-white divide-y divide-gray-200"></tbody></table></div>
        </div>`;

    document.getElementById('empleados').innerHTML = `
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-end mb-4"><button id="btn-nuevo-empleado" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"><i class="fas fa-plus mr-2"></i> Nuevo Empleado</button></div>
            <div class="bg-white shadow-md rounded-lg overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50">
                <tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago H. Extra</th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr>
            </thead><tbody id="tabla-empleados" class="bg-white divide-y divide-gray-200"></tbody></table></div>
        </div>`;
    
    document.getElementById('conceptos').innerHTML = `
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-end mb-4"><button id="btn-nuevo-concepto" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"><i class="fas fa-plus mr-2"></i> Nuevo Concepto</button></div>
            <div class="bg-white shadow-md rounded-lg overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50">
                <tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Fijo</th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr>
            </thead><tbody id="tabla-conceptos" class="bg-white divide-y divide-gray-200"></tbody></table></div>
        </div>`;

    document.getElementById('reportes').innerHTML = `
        <div class="max-w-7xl mx-auto">
            <div class="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center space-x-4 flex-wrap">
                <label for="semana-reporte" class="font-medium text-gray-700">Seleccionar Semana:</label>
                <input type="week" id="semana-reporte" class="border-gray-300 rounded-md shadow-sm">
                <button id="btn-generar-reporte" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Generar</button>
                <button id="btn-exportar-csv" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg hidden">Exportar a CSV</button>
            </div>
            <div id="reporte-container" class="bg-white shadow-md rounded-lg overflow-x-auto">
                <div class="p-8 text-center text-gray-500"><i class="fas fa-file-alt text-4xl mb-4"></i><p>Seleccione una semana y haga clic en "Generar" para ver el reporte de pre-nómina.</p></div>
            </div>
        </div>`;
}

/**
 * Renderiza el HTML de todos los modales en el contenedor de modales.
 */
function renderModals() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <!-- Empleado Modal -->
        <div id="empleado-modal" class="fixed z-10 inset-0 overflow-y-auto hidden">
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity" aria-hidden="true"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form id="form-empleado">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-empleado"></h3>
                            <input type="hidden" id="empleado-id">
                            <div class="mt-4 space-y-4">
                                <div><label for="nombreCompleto" class="block text-sm font-medium text-gray-700">Nombre Completo</label><input type="text" id="nombreCompleto" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label for="sueldoSemanal" class="block text-sm font-medium text-gray-700">Sueldo Semanal ($)</label><input type="number" step="0.01" id="sueldoSemanal" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
                                    <div><label for="pin" class="block text-sm font-medium text-gray-700">PIN de 4 dígitos</label><input type="password" id="pin" required pattern="\\d{4}" title="El PIN debe contener 4 números." maxlength="4" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label for="horarioEntrada" class="block text-sm font-medium text-gray-700">Horario Entrada</label><input type="time" id="horarioEntrada" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
                                    <div><label for="horarioSalida" class="block text-sm font-medium text-gray-700">Horario Salida</label><input type="time" id="horarioSalida" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label for="diasLaborales" class="block text-sm font-medium text-gray-700">Días Laborales</label><input type="number" min="1" max="7" id="diasLaborales" value="6" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
                                    <div><label for="pagoPorHoraExtra" class="block text-sm font-medium text-gray-700">Pago por H. Extra ($)</label><input type="number" step="0.01" id="pagoPorHoraExtra" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
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
        <div id="concepto-modal" class="fixed z-10 inset-0 overflow-y-auto hidden">
             <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"><div class="fixed inset-0 transition-opacity" aria-hidden="true"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div><span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span><div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"><form id="form-concepto"><div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4"><h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-concepto"></h3><input type="hidden" id="concepto-id"><div class="mt-4 space-y-4"><div><label for="conceptoNombre" class="block text-sm font-medium text-gray-700">Nombre del Concepto</label><input type="text" id="conceptoNombre" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div><div><label for="conceptoTipo" class="block text-sm font-medium text-gray-700">Tipo</label><select id="conceptoTipo" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"><option value="PERCEPCION">Percepción (Bono, Ingreso)</option><option value="DEDUCCION">Deducción (Préstamo, Descuento)</option></select></div><div><label for="conceptoMonto" class="block text-sm font-medium text-gray-700">Monto Fijo (Opcional)</label><input type="number" step="0.01" id="conceptoMonto" placeholder="Dejar en 0 si es variable" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div></div></div><div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"><button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Guardar</button><button type="button" class="btn-cancelar-modal mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancelar</button></div></form></div></div>
        </div>

        <!-- Asistencia Modal -->
        <div id="asistencia-modal" class="fixed z-10 inset-0 overflow-y-auto hidden">
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"><div class="fixed inset-0 transition-opacity" aria-hidden="true"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div><span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span><div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"><form id="form-asistencia"><div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4"><h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-asistencia"></h3><input type="hidden" id="asistencia-id"><div class="mt-4 space-y-4">
            <div><label class="block text-sm font-medium text-gray-700">Empleado</label><p id="asistencia-empleado-nombre" class="mt-1 text-lg"></p></div>
            <div><label for="asistencia-fecha" class="block text-sm font-medium text-gray-700">Fecha</label><input type="date" id="asistencia-fecha" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label for="asistencia-entrada" class="block text-sm font-medium text-gray-700">Hora Entrada</label><input type="time" id="asistencia-entrada" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
                <div><label for="asistencia-salida" class="block text-sm font-medium text-gray-700">Hora Salida</label><input type="time" id="asistencia-salida" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div>
            </div>
            </div></div><div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"><button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Guardar</button><button type="button" class="btn-cancelar-modal mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancelar</button></div></form></div></div>
        </div>

        <!-- Justificar Faltas Modal -->
        <div id="justificar-modal" class="fixed z-20 inset-0 overflow-y-auto hidden">
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
