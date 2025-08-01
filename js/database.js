// js/database.js

const DB_NAME = 'NominaDB_PIN_Final';
const DB_VERSION = 1;
export let db; // <--- CAMBIO: Se añade "export"

/**
 * Inicializa la conexión con la base de datos IndexedDB.
 * @returns {Promise<IDBDatabase>} Una promesa que se resuelve con la instancia de la base de datos.
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = e => reject('Error al abrir la base de datos');

        request.onsuccess = e => {
            db = e.target.result;
            resolve(db);
        };

        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('empleados')) {
                db.createObjectStore('empleados', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('registrosAsistencia')) {
                const store = db.createObjectStore('registrosAsistencia', { keyPath: 'id', autoIncrement: true });
                store.createIndex('empleado_fecha', ['empleadoId', 'fecha'], { unique: false });
                store.createIndex('fecha', 'fecha');
            }
            if (!db.objectStoreNames.contains('conceptos')) {
                db.createObjectStore('conceptos', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('transaccionesNomina')) {
                const store = db.createObjectStore('transaccionesNomina', { keyPath: 'id', autoIncrement: true });
                store.createIndex('empleado_periodo_concepto', ['empleadoId', 'periodo', 'conceptoId'], { unique: true });
            }
            if (!db.objectStoreNames.contains('justificaciones')) {
                const store = db.createObjectStore('justificaciones', { keyPath: 'id', autoIncrement: true });
                store.createIndex('empleado_fecha', ['empleadoId', 'fecha'], { unique: true });
            }
        };
    });
}

/**
 * Realiza una acción genérica en la base de datos.
 * @param {string} storeName - El nombre del object store.
 * @param {'readonly'|'readwrite'} mode - El modo de la transacción.
 * @param {string} action - La acción a realizar (e.g., 'get', 'getAll', 'add', 'put', 'delete', 'count').
 * @param {*} [data] - Los datos para las acciones 'add' o 'put', o la clave para 'get' y 'delete'.
 * @returns {Promise<any>} Una promesa que se resuelve con el resultado de la operación.
 */
export function dbAction(storeName, mode, action, data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject("La base de datos no está inicializada.");
        }
        const transaction = db.transaction([storeName], mode);
        const store = transaction.objectStore(storeName);
        
        const request = data !== undefined ? store[action](data) : store[action]();
        
        transaction.oncomplete = () => {
            resolve(request.result);
        };
        
        transaction.onerror = (e) => {
            console.error(`Error en la transacción de IndexedDB: ${e.target.error}`);
            reject(e.target.error);
        };
    });
}
