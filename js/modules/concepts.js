// js/modules/concepts.js
import { dbAction } from '../database.js';
import { showToast } from '../utils.js';
import { openModal, closeModal } from '../ui.js';

/**
 * Inicializa la vista de conceptos, configurando listeners.
 */
export function initConceptsView() {
    const newConceptBtn = document.getElementById('btn-nuevo-concepto');
    if (newConceptBtn) {
        newConceptBtn.addEventListener('click', () => openConceptoModal());
    }

    const conceptForm = document.getElementById('form-concepto');
    if (conceptForm) {
        conceptForm.addEventListener('submit', handleSaveConcepto);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                loadConceptosTable();
            }
        });
    });
    const conceptsView = document.getElementById('conceptos');
    if (conceptsView) {
        observer.observe(conceptsView, { attributes: true });
    }
}

function openConceptoModal(concepto = null) {
    const form = document.getElementById('form-concepto');
    form.reset();
    document.getElementById('concepto-id').value = '';
    document.getElementById('modal-title-concepto').textContent = 'Nuevo Concepto';
    if (concepto) {
        document.getElementById('modal-title-concepto').textContent = 'Editar Concepto';
        document.getElementById('concepto-id').value = concepto.id;
        document.getElementById('conceptoNombre').value = concepto.nombre;
        document.getElementById('conceptoTipo').value = concepto.tipo;
        document.getElementById('conceptoMonto').value = concepto.montoFijo || '';
    }
    openModal('concepto-modal');
};

async function handleSaveConcepto(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('concepto-id').value);
    const concepto = {
        nombre: document.getElementById('conceptoNombre').value,
        tipo: document.getElementById('conceptoTipo').value,
        montoFijo: parseFloat(document.getElementById('conceptoMonto').value) || 0,
        activo: true
    };
    try {
        const action = id ? 'put' : 'add';
        const data = id ? { ...concepto, id } : concepto;
        await dbAction('conceptos', 'readwrite', action, data);
        showToast(`Concepto ${id ? 'actualizado' : 'guardado'}.`, 'success');
        closeModal();
        loadConceptosTable();
    } catch (error) {
        showToast('Error al guardar concepto.', 'error');
        console.error(error);
    }
};

async function loadConceptosTable() {
    try {
        const conceptos = await dbAction('conceptos', 'readonly', 'getAll');
        const tbody = document.getElementById('tabla-conceptos');
        tbody.innerHTML = '';
        if (!conceptos || conceptos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-500">No hay conceptos registrados.</td></tr>';
            return;
        }
        conceptos.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900">${c.nombre}</div></td>
                <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.tipo === 'PERCEPCION' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">${c.tipo}</span></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-500">${c.montoFijo > 0 ? `$${c.montoFijo.toFixed(2)}` : 'Variable'}</div></td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button class="edit-btn text-indigo-600 hover:text-indigo-900"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn text-red-600 hover:text-red-900 ml-4"><i class="fas fa-trash"></i></button>
                </td>`;
            tr.querySelector('.edit-btn').addEventListener('click', () => openConceptoModal(c));
            tr.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm('¿Seguro que desea eliminar este concepto?')) {
                    await dbAction('conceptos', 'readwrite', 'delete', c.id);
                    showToast('Concepto eliminado.', 'success');
                    loadConceptosTable();
                }
            });
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error cargando tabla de conceptos:", error);
    }
};
