// js/modules/concepts.js
import { dbAction } from '../database.js';
import { showToast } from '../utils.js';
import { openModal, closeModal, renderEmptyState } from '../ui.js';

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
    const container = document.getElementById('conceptos-table-container');
    try {
        const conceptos = await dbAction('conceptos', 'readonly', 'getAll');
        
        if (!conceptos || conceptos.length === 0) {
            const buttonHTML = `<button id="btn-nuevo-concepto-vacio" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mx-auto shadow-sm hover:shadow-lg transition-shadow"><i class="fas fa-plus mr-2"></i> Agregar Primer Concepto</button>`;
            renderEmptyState(
                container,
                'fas fa-puzzle-piece',
                'No hay conceptos de nómina',
                'Agrega conceptos como bonos, préstamos o descuentos para usarlos en la pre-nómina.',
                buttonHTML
            );
            document.getElementById('btn-nuevo-concepto-vacio').addEventListener('click', () => openConceptoModal());
            return;
        }
        
        let tableHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Fijo</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">`;

        conceptos.forEach(c => {
            tableHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${c.nombre}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.tipo === 'PERCEPCION' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">${c.tipo}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${c.montoFijo > 0 ? `$${c.montoFijo.toFixed(2)}` : 'Variable'}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="edit-btn text-gray-400 hover:text-indigo-600 p-2 rounded-full" data-id="${c.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn text-gray-400 hover:text-red-600 p-2 rounded-full" data-id="${c.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        });

        tableHTML += `</tbody></table>`;
        container.innerHTML = tableHTML;

        container.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openConceptoModal(conceptos.find(c => c.id === parseInt(btn.dataset.id)))));
        container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async () => {
            const concepto = conceptos.find(c => c.id === parseInt(btn.dataset.id));
            if (confirm(`¿Seguro que desea eliminar el concepto "${concepto.nombre}"?`)) {
                await dbAction('conceptos', 'readwrite', 'delete', concepto.id);
                showToast('Concepto eliminado.', 'success');
                loadConceptosTable();
            }
        }));

    } catch (error) {
        console.error("Error cargando tabla de conceptos:", error);
        renderEmptyState(container, 'fas fa-exclamation-triangle', 'Error', 'No se pudo cargar la lista de conceptos.');
    }
};
