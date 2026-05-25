/**
 * Funções utilitárias globais.
 * Usadas por app.js e qualquer outro script do sistema.
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatarData(dataStr) {
    if (!dataStr) return '';
    return new Date(dataStr).toLocaleDateString('pt-PT');
}

function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}