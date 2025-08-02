// js/database.js

const API_BASE_URL = 'http://localhost/control-personal/api';

/**
 * Realiza una acción genérica contra el backend API.
 */
export async function dbAction(storeName, mode, action, data) {
    let url = `${API_BASE_URL}/${storeName}`;
    let options = {
        method: '',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
    };

    switch (action) {
        case 'getAll':
            options.method = 'GET';
            break;
        case 'get':
            url += `/${data}`;
            options.method = 'GET';
            break;
        case 'add':
            options.method = 'POST';
            options.body = JSON.stringify(data);
            break;
        case 'put':
            url += `/${data.id}`;
            options.method = 'PUT';
            options.body = JSON.stringify(data);
            break;
        case 'delete':
            url += `/${data}`;
            options.method = 'DELETE';
            break;
        case 'count':
            options.method = 'GET';
            const countResponse = await fetch(url, options);
            if (!countResponse.ok) throw new Error(`Error en la API: ${countResponse.statusText}`);
            const items = await countResponse.json();
            return items.length;
        default:
            return Promise.reject(`Acción desconocida: ${action}`);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('API Error:', errorBody);
            throw new Error(`Error en la API: ${response.statusText}`);
        }
        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return { success: true };
        }
        return response.json();
    } catch (error) {
        console.error('Error de red o al hacer fetch:', error);
        throw error;
    }
}

// La función initDB ya no necesita hacer nada, pero la mantenemos para no romper las importaciones.
export function initDB() {
    console.log("Inicializando conexión con el backend API...");
    return Promise.resolve();
}
