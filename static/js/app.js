'use strict';

// ============================================================
// DADOS INJETADOS PELO SERVIDOR (definidos no grupo.html)
// ============================================================
let categoriasData = window.categoriasData || [];
let tarefasPorCategoria = window.tarefasPorCategoria || {};
let tarefasSemCategoria = window.tarefasSemCategoria || [];
const grupoSlug = window.grupoSlug || '';

// Informações do membro logado
const membroLogado = window.membroLogado || false;
const membroNome = window.membroNome || '';
const membroIsGerente = window.membroIsGerente || false;

// Base URL para todas as operações do grupo
const baseUrl = '/grupo/' + grupoSlug;

// ============================================================
// TOKEN CSRF (lido da meta tag)
// ============================================================
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
function formatarData(dataStr) {
    if (!dataStr) return '';
    return new Date(dataStr).toLocaleDateString('pt-PT');
}

function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ============================================================
// ÍCONES SVG
// ============================================================
function getIconeSvg(iconeId, cor) {
    const svgs = {
        'infraestrutura': `<svg width="16" height="16" fill="${cor}" class="bi bi-pc-display" viewBox="0 0 16 16"><path d="M8 1a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1zm1 13.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0m2 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0M9.5 1a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM9 3.5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 0-1h-5a.5.5 0 0 0-.5.5M1.5 2A1.5 1.5 0 0 0 0 3.5v7A1.5 1.5 0 0 0 1.5 12H6v2h-.5a.5.5 0 0 0 0 1H7v-4H1.5a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5H7V2z"/></svg>`,
        'software': `<svg width="16" height="16" fill="${cor}" class="bi bi-braces" viewBox="0 0 16 16"><path d="M2.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C3.25 2 2.49 2.759 2.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6M13.886 7.9v.163c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456V7.332c-1.114 0-1.49-.362-1.49-1.456V4.352C13.51 2.759 12.75 2 11.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6"/></svg>`,
        'rede': `<svg width="16" height="16" fill="${cor}" class="bi bi-wifi" viewBox="0 0 16 16"><path d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.44 12.44 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.52.52 0 0 0 .668.05A11.45 11.45 0 0 1 8 4c2.507 0 4.827.802 6.716 2.164.205.148.49.13.668-.049"/><path d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.46 9.46 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.576 1.336c.206.132.48.108.653-.065m-2.183 2.183c.226-.226.185-.605-.1-.75A6.5 6.5 0 0 0 8 9c-1.06 0-2.062.254-2.946.704-.285.145-.326.524-.1.75l.015.015c.16.16.407.19.611.09A5.5 5.5 0 0 1 8 10c.868 0 1.69.201 2.42.56.203.1.45.07.61-.091zM9.06 12.44c.196-.196.198-.52-.04-.66A2 2 0 0 0 8 11.5a2 2 0 0 0-1.02.28c-.238.14-.236.464-.04.66l.706.706a.5.5 0 0 0 .707 0l.707-.707z"/></svg>`,
        'hardware': `<svg width="16" height="16" fill="${cor}" class="bi bi-pci-card" viewBox="0 0 16 16"><path d="M0 1.5A.5.5 0 0 1 .5 1h1a.5.5 0 0 1 .5.5V4h13.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H2v2.5a.5.5 0 0 1-1 0V2H.5a.5.5 0 0 1-.5-.5"/><path d="M3 12.5h3.5v1a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5zm4 0h4v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z"/></svg>`,
        'seguranca': `<svg width="16" height="16" fill="${cor}" class="bi bi-database-fill-lock" viewBox="0 0 16 16"><path d="M8 1c-1.573 0-3.022.289-4.096.777C2.875 2.245 2 2.993 2 4s.875 1.755 1.904 2.223C4.978 6.711 6.427 7 8 7s3.022-.289 4.096-.777C13.125 5.755 14 5.007 14 4s-.875-1.755-1.904-2.223C11.022 1.289 9.573 1 8 1"/><path d="M3.904 9.223C2.875 8.755 2 8.007 2 7v-.839c.457.432 1.004.751 1.49.972C4.722 7.693 6.318 8 8 8s3.278-.307 4.51-.867c.486-.22 1.033-.54 1.49-.972V7c0 .424-.155.802-.411 1.133a4.5 4.5 0 0 0-1.364-.125 3 3 0 0 0-2.197.731 4.5 4.5 0 0 0-1.254 1.237A12 12 0 0 1 8 10c-1.573 0-3.022-.289-4.096-.777M8 14c-1.682 0-3.278-.307-4.51-.867-.486-.22-1.033-.54-1.49-.972V13c0 1.007.875 1.755 1.904 2.223C4.978 15.711 6.427 16 8 16q.134 0 .266-.003A2 2 0 0 1 8 15zm0-1.5q0 .15.01.3A2 2 0 0 0 8 13c-1.573 0-3.022-.289-4.096-.777C2.875 11.755 2 11.007 2 10v-.839c.457.432 1.004.751 1.49.972C4.722 10.693 6.318 11 8 11q.13 0 .257-.002A4.5 4.5 0 0 0 8 12.5"/><path d="M9 13a1 1 0 0 1 1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1"/></svg>`
    };
    return svgs[iconeId] || `<span>📁</span>`;
}

function getIconeNome(iconeId) {
    const nomes = {
        'infraestrutura': 'Infraestrutura',
        'software': 'Software',
        'rede': 'Rede',
        'hardware': 'Hardware',
        'seguranca': 'Segurança'
    };
    return nomes[iconeId] || 'Outro';
}

// ============================================================
// ATUALIZAÇÃO LOCAL DOS DADOS
// ============================================================
function atualizarTarefaNosDados(tarefaId, novosDados) {
    for (const catId in tarefasPorCategoria) {
        const index = tarefasPorCategoria[catId].findIndex(t => t.id === tarefaId);
        if (index !== -1) {
            tarefasPorCategoria[catId][index] = { ...tarefasPorCategoria[catId][index], ...novosDados };
            return true;
        }
    }
    const index = tarefasSemCategoria.findIndex(t => t.id === tarefaId);
    if (index !== -1) {
        tarefasSemCategoria[index] = { ...tarefasSemCategoria[index], ...novosDados };
        return true;
    }
    return false;
}

function removerTarefaDosDados(tarefaId) {
    for (const catId in tarefasPorCategoria) {
        const index = tarefasPorCategoria[catId].findIndex(t => t.id === tarefaId);
        if (index !== -1) {
            tarefasPorCategoria[catId].splice(index, 1);
            return true;
        }
    }
    const index = tarefasSemCategoria.findIndex(t => t.id === tarefaId);
    if (index !== -1) {
        tarefasSemCategoria.splice(index, 1);
        return true;
    }
    return false;
}

// ============================================================
// RENDERIZAÇÃO DAS CATEGORIAS E TAREFAS
// ============================================================
function getTarefasAtivas() {
    const ativas = [];
    for (const catId in tarefasPorCategoria) {
        ativas.push(...tarefasPorCategoria[catId].filter(t => t.status !== 'Concluido' && t.status !== 'Cancelado'));
    }
    ativas.push(...tarefasSemCategoria.filter(t => t.status !== 'Concluido' && t.status !== 'Cancelado'));
    return ativas;
}

function getTarefasConcluidas() {
    const concluidas = [];
    for (const catId in tarefasPorCategoria) {
        concluidas.push(...tarefasPorCategoria[catId].filter(t => t.status === 'Concluido'));
    }
    concluidas.push(...tarefasSemCategoria.filter(t => t.status === 'Concluido'));
    return concluidas;
}

function getTarefasCanceladas() {
    const canceladas = [];
    for (const catId in tarefasPorCategoria) {
        canceladas.push(...tarefasPorCategoria[catId].filter(t => t.status === 'Cancelado'));
    }
    canceladas.push(...tarefasSemCategoria.filter(t => t.status === 'Cancelado'));
    return canceladas;
}

function getPrioridadeIcone(prioridade) {
    switch(prioridade) {
        case 'Baixa': return `<svg width="14" height="14" viewBox="0 0 16 16" fill="#3cf281"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/></svg>`;
        case 'Media': return `<svg width="14" height="14" viewBox="0 0 16 16" fill="#ffc107"><path d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16"/></svg>`;
        case 'Alta': return `<svg width="14" height="14" viewBox="0 0 16 16" fill="#ff6b6b"><circle cx="8" cy="8" r="8"/></svg>`;
        case 'Urgente': return `<svg width="14" height="14" viewBox="0 0 16 16" fill="#e44c55"><path d="M7.938 2.016a.146.146 0 0 0-.054.057L1.027 13.74a.176.176 0 0 0-.002.183.163.163 0 0 0 .148.078h13.713a.163.163 0 0 0 .148-.078.176.176 0 0 0-.002-.183L8.116 2.073a.146.146 0 0 0-.054-.057.13.13 0 0 0-.124 0zM8.002 5.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm0 5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z"/></svg>`;
        default: return `<svg width="14" height="14" viewBox="0 0 16 16" fill="#999"><circle cx="8" cy="8" r="8"/></svg>`;
    }
}

function getPrioridadeCor(prioridade) {
    switch(prioridade) {
        case 'Baixa': return '#3cf281';
        case 'Media': return '#ffc107';
        case 'Alta': return '#ff6b6b';
        case 'Urgente': return '#e44c55';
        default: return '#999';
    }
}

function renderizarTarefas(tarefas, cor) {
    if (!tarefas || tarefas.length === 0) {
        return '<div class="sem-tarefas">Nenhum chamado ativo nesta categoria</div>';
    }

    return `
        <ul class="tarefas-lista">
            ${tarefas.map(tarefa => {
                const conteudoEscapado = escapeHtml(tarefa.conteudo);
                const prioridadeIcone = getPrioridadeIcone(tarefa.prioridade);
                const prioridadeCor = getPrioridadeCor(tarefa.prioridade);
                const statusIcone = tarefa.status === 'Aberto' ? '📋' : '⚙️';

                return `
                    <li class="tarefa-item ${tarefa.feita ? 'tarefa-concluida' : ''}" data-tarefa-id="${tarefa.id}">
                        <div class="tarefa-conteudo">
                            <div class="tarefa-header">
                                <span class="tarefa-check" onclick="concluirChamado(${tarefa.id}, this.closest('.tarefa-item'))">
                                    ${tarefa.feita ? '✅' : '⭘'}
                                </span>
                                <span class="tarefa-texto" ondblclick="editarTitulo(${tarefa.id}, this)" style="cursor: pointer;">${conteudoEscapado}</span>
                            </div>
                            <div class="tarefa-meta">
                                <span class="badge-prioridade" style="background-color: ${prioridadeCor}; color: white;">${prioridadeIcone} ${escapeHtml(tarefa.prioridade)}</span>
                                <span class="badge-status">${statusIcone} ${escapeHtml(tarefa.status)}</span>
                                ${tarefa.data_limite ? `<span class="tarefa-data-limite">📅 ${formatarData(tarefa.data_limite)}</span>` : ''}
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="tarefa-detalhes" onclick="abrirDetalhesModal(${tarefa.id})" title="Ver detalhes">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-columns-reverse" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 0 .5m4 0a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1h-10A.5.5 0 0 1 4 .5m-4 2A.5.5 0 0 1 .5 2h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-4 2A.5.5 0 0 1 .5 4h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m-4 2A.5.5 0 0 1 .5 6h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5m-4 2A.5.5 0 0 1 .5 8h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5m-4 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1h-10a.5.5 0 0 1-.5-.5m-4 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m-4 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
                                </svg>
                            </button>
                            <button class="tarefa-eliminar" onclick="confirmarEliminarTarefa(${tarefa.id}, '${conteudoEscapado.replace(/'/g, "\\'")}', this.closest('.tarefa-item'))">🗑️</button>
                        </div>
                    </li>
                `;
            }).join('')}
        </ul>
    `;
}

function renderizarTarefasArquivadas(tarefas, tipo) {
    if (!tarefas || tarefas.length === 0) {
        return `<div class="sem-tarefas">Nenhum chamado ${tipo === 'concluido' ? 'concluído' : 'cancelado'}.</div>`;
    }
    const statusIcone = tipo === 'concluido' ? '✅' : '❌';
    return `
        <ul class="tarefas-lista">
            ${tarefas.map(tarefa => {
                const conteudoEscapado = escapeHtml(tarefa.conteudo);
                return `
                    <li class="tarefa-item tarefa-concluida" data-tarefa-id="${tarefa.id}">
                        <div class="tarefa-conteudo">
                            <div class="tarefa-header">
                                <span class="tarefa-texto" ondblclick="editarTitulo(${tarefa.id}, this)" style="cursor: pointer;">${conteudoEscapado}</span>
                            </div>
                            <div class="tarefa-meta">
                                <span class="badge-status">${statusIcone} ${escapeHtml(tarefa.status)}</span>
                                <span>📅 ${formatarData(tarefa.data_criacao)}</span>
                                ${tarefa.data_limite ? `<span>⏰ Limite: ${formatarData(tarefa.data_limite)}</span>` : ''}
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="tarefa-detalhes" onclick="abrirDetalhesModal(${tarefa.id})" title="Ver detalhes">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-columns-reverse" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 0 .5m4 0a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1h-10A.5.5 0 0 1 4 .5m-4 2A.5.5 0 0 1 .5 2h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-4 2A.5.5 0 0 1 .5 4h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m-4 2A.5.5 0 0 1 .5 6h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5m-4 2A.5.5 0 0 1 .5 8h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5m-4 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1h-10a.5.5 0 0 1-.5-.5m-4 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m-4 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m4 0a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
                                </svg>
                            </button>
                            <button class="tarefa-eliminar" onclick="confirmarEliminarTarefa(${tarefa.id}, '${conteudoEscapado.replace(/'/g, "\\'")}', this.closest('.tarefa-item'))">🗑️</button>
                        </div>
                    </li>
                `;
            }).join('')}
        </ul>
    `;
}

function renderizarCategorias() {
    const container = document.getElementById('listaCategorias');
    if (!container) return;

    let html = '';
    const expandidas = JSON.parse(localStorage.getItem('categorias_expandidas') || '{}');

    for (const cat of categoriasData) {
        const tarefas = (tarefasPorCategoria[cat.id] || []).filter(t => t.status !== 'Concluido' && t.status !== 'Cancelado');
        const estaExpandida = expandidas[cat.id] === true;
        const totalTarefas = tarefas.length;
        const tarefasFeitas = tarefas.filter(t => t.feita).length;

        const iconeSvg = getIconeSvg(cat.icone, cat.cor);

        html += `
            <div class="categoria-item" data-categoria-id="${cat.id}">
                <div class="categoria-header" style="border-left-color: ${cat.cor};">
                    <div class="categoria-toggle" onclick="toggleCategoria(${cat.id})">
                        <span class="toggle-icon">${estaExpandida ? '▼' : '▶'}</span>
                        <span class="categoria-icone">${iconeSvg}</span>
                        <span class="categoria-nome">${escapeHtml(cat.nome)}</span>
                        <span class="categoria-contagem">(${tarefasFeitas}/${totalTarefas})</span>
                    </div>
                    <div class="categoria-acoes">
                        <button class="btn-editar-categoria" onclick="editarCategoria(${cat.id}, '${escapeHtml(cat.nome)}', '${cat.cor}', '${cat.icone}')">✏️</button>
                        <button class="btn-eliminar-categoria" onclick="confirmarEliminarCategoria(${cat.id}, '${escapeHtml(cat.icone + ' ' + cat.nome)}')">🗑️</button>
                    </div>
                </div>
                <div class="categoria-tarefas" id="categoria-tarefas-${cat.id}" style="display: ${estaExpandida ? 'block' : 'none'};">
                    ${renderizarTarefas(tarefas, cat.cor)}
                </div>
            </div>
        `;
    }

    // Sem categoria (apenas ativas)
    const tarefasSemCatAtivas = tarefasSemCategoria.filter(t => t.status !== 'Concluido' && t.status !== 'Cancelado');
    const semCatExpandida = expandidas['sem_categoria'] !== false;
    html += `
        <div class="categoria-item">
            <div class="categoria-header" style="border-left-color: #999;">
                <div class="categoria-toggle" onclick="toggleCategoria('sem_categoria')">
                    <span class="toggle-icon">${semCatExpandida ? '▼' : '▶'}</span>
                    <span class="categoria-icone">📂</span>
                    <span class="categoria-nome">Sem categoria</span>
                    <span class="categoria-contagem">(${tarefasSemCatAtivas.filter(t => t.feita).length}/${tarefasSemCatAtivas.length})</span>
                </div>
            </div>
            <div class="categoria-tarefas" id="categoria-tarefas-sem_categoria" style="display: ${semCatExpandida ? 'block' : 'none'};">
                ${renderizarTarefas(tarefasSemCatAtivas, '#999')}
            </div>
        </div>
    `;

    // Concluídos
    const concluidasExpandida = expandidas['concluidas'] !== false;
    const tarefasConcluidas = getTarefasConcluidas();
    html += `
        <div class="categoria-item historico-categoria">
            <div class="categoria-header" style="border-left-color: #6c5ce7;">
                <div class="categoria-toggle" onclick="toggleCategoria('concluidas')">
                    <span class="toggle-icon">${concluidasExpandida ? '▼' : '▶'}</span>
                    <span class="categoria-icone">✅</span>
                    <span class="categoria-nome">Concluídos</span>
                    <span class="categoria-contagem">(${tarefasConcluidas.length})</span>
                </div>
            </div>
            <div class="categoria-tarefas" id="categoria-tarefas-concluidas" style="display: ${concluidasExpandida ? 'block' : 'none'};">
                ${renderizarTarefasArquivadas(tarefasConcluidas, 'concluido')}
            </div>
        </div>
    `;

    // Cancelados
    const canceladasExpandida = expandidas['canceladas'] !== false;
    const tarefasCanceladas = getTarefasCanceladas();
    html += `
        <div class="categoria-item cancelados-categoria">
            <div class="categoria-header" style="border-left-color: #999;">
                <div class="categoria-toggle" onclick="toggleCategoria('canceladas')">
                    <span class="toggle-icon">${canceladasExpandida ? '▼' : '▶'}</span>
                    <span class="categoria-icone">❌</span>
                    <span class="categoria-nome">Cancelados</span>
                    <span class="categoria-contagem">(${tarefasCanceladas.length})</span>
                </div>
            </div>
            <div class="categoria-tarefas" id="categoria-tarefas-canceladas" style="display: ${canceladasExpandida ? 'block' : 'none'};">
                ${renderizarTarefasArquivadas(tarefasCanceladas, 'cancelado')}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ============================================================
// AÇÕES DE TAREFA (AJAX)
// ============================================================
let tarefaIdParaEliminar = null;
let tarefaElementParaEliminar = null;
let tarefaIdAtual = null;  // armazena o ID da tarefa aberta nos detalhes

function concluirChamado(id, element) {
    fetch(`${baseUrl}/concluir-chamado/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            atualizarTarefaNosDados(id, { status: 'Concluido', feita: true });
            const tarefaElement = element;
            tarefaElement.style.transition = 'all 0.3s ease';
            tarefaElement.style.opacity = '0';
            tarefaElement.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                renderizarCategorias();
                mostrarNotificacao('Chamado concluído!', 'success');
            }, 300);
        } else {
            mostrarNotificacao('Erro ao concluir chamado!', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarNotificacao('Erro de rede ao concluir chamado.', 'error');
    });
}

function cancelarChamado(id, element) {
    fetch(`${baseUrl}/cancelar-chamado/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            atualizarTarefaNosDados(id, { status: 'Cancelado', feita: true });
            const tarefaElement = element;
            if (tarefaElement) {
                tarefaElement.style.transition = 'all 0.3s ease';
                tarefaElement.style.opacity = '0';
                tarefaElement.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    renderizarCategorias();
                    mostrarNotificacao('Chamado cancelado!', 'success');
                }, 300);
            }
            closeModal();
        } else {
            mostrarNotificacao('Erro ao cancelar chamado.', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarNotificacao('Erro de rede ao cancelar chamado.', 'error');
    });
}

function confirmarEliminarTarefa(id, conteudo, element) {
    tarefaIdParaEliminar = id;
    tarefaElementParaEliminar = element;
    document.getElementById('modalTaskName').textContent = `"${conteudo}"`;
    document.getElementById('customModal').style.display = 'flex';
}

function eliminarTarefa() {
    if (!tarefaIdParaEliminar) return;
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Eliminando...';
    confirmBtn.disabled = true;

    fetch(`${baseUrl}/eliminar-tarefa/${tarefaIdParaEliminar}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            removerTarefaDosDados(tarefaIdParaEliminar);
            const tarefaElement = tarefaElementParaEliminar;
            if (tarefaElement) {
                tarefaElement.style.transition = 'all 0.3s ease';
                tarefaElement.style.opacity = '0';
                tarefaElement.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    renderizarCategorias();
                    mostrarNotificacao('Chamado eliminado permanentemente!', 'success');
                }, 300);
            }
            closeModal();
        } else {
            mostrarNotificacao('Erro ao eliminar chamado!', 'error');
            closeModal();
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarNotificacao('Erro de rede ao eliminar chamado.', 'error');
        closeModal();
    })
    .finally(() => {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    });
}

function closeModal() {
    document.getElementById('customModal').style.display = 'none';
    tarefaIdParaEliminar = null;
    tarefaElementParaEliminar = null;
}

// Edição inline do título (duplo clique)
function editarTitulo(id, element) {
    const novoTitulo = prompt('Editar título:', element.textContent);
    if (novoTitulo && novoTitulo.trim() !== '') {
        fetch(`${baseUrl}/atualizar-descricao/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ conteudo: novoTitulo.trim() })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                atualizarTarefaNosDados(id, { conteudo: novoTitulo.trim() });
                element.textContent = novoTitulo.trim();
                mostrarNotificacao('Título atualizado!', 'success');
            } else {
                mostrarNotificacao(data.error || 'Erro ao atualizar título.', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarNotificacao('Erro de rede ao atualizar título.', 'error');
        });
    }
}

// Listeners do modal de ação (3 botões)
document.getElementById('modalCancelarBtn')?.addEventListener('click', () => {
    if (tarefaIdParaEliminar) {
        cancelarChamado(tarefaIdParaEliminar, tarefaElementParaEliminar);
    }
});

document.getElementById('modalConfirmBtn')?.addEventListener('click', () => {
    if (tarefaIdParaEliminar) {
        eliminarTarefa();
    }
});

document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);

document.getElementById('customModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('customModal')) closeModal();
});

// ============================================================
// TOGGLE DE CATEGORIA
// ============================================================
function toggleCategoria(catId) {
    const tarefasDiv = document.getElementById(`categoria-tarefas-${catId}`);
    if (!tarefasDiv) return;
    const estaVisivel = tarefasDiv.style.display !== 'none';
    tarefasDiv.style.display = estaVisivel ? 'none' : 'block';
    const header = tarefasDiv.closest('.categoria-item')?.querySelector('.categoria-header');
    const toggleIcon = header?.querySelector('.toggle-icon');
    if (toggleIcon) toggleIcon.textContent = estaVisivel ? '▶' : '▼';
    const expandidas = JSON.parse(localStorage.getItem('categorias_expandidas') || '{}');
    expandidas[catId] = estaVisivel ? false : true;
    localStorage.setItem('categorias_expandidas', JSON.stringify(expandidas));
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================
function mostrarNotificacao(mensagem, tipo) {
    const notificacao = document.createElement('div');
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#4ecdc4' : '#e44c55'};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 0.9rem;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notificacao);
    setTimeout(() => {
        notificacao.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// ============================================================
// FORMULÁRIO DE ADICIONAR CHAMADO
// ============================================================
const form = document.getElementById('formAdicionarTarefa');
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const titulo = document.getElementById('tituloTarefa').value.trim();
        const descricao = document.getElementById('descricaoTarefa').value.trim();
        const profissionais = document.getElementById('profissionaisTarefa').value.trim();
        if (!titulo) {
            mostrarNotificacao('Por favor, insira um título para o chamado.', 'error');
            return;
        }
        let prioridade = 'Media';
        const prioridadeSelecionada = document.querySelector('input[name="prioridade"]:checked');
        if (prioridadeSelecionada) prioridade = prioridadeSelecionada.value;
        const formData = new FormData();
        formData.append('conteudo_tarefa', titulo);
        formData.append('descricao_tarefa', descricao);
        formData.append('profissionais', profissionais);
        formData.append('data_limite', document.getElementById('dataLimite').value);
        formData.append('categoria_id', document.getElementById('categoriaSelect').value);
        formData.append('prioridade', prioridade);
        formData.append('status', document.getElementById('statusSelect').value);

        fetch(`${baseUrl}/criar-tarefa`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken()
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                mostrarNotificacao(data.error || 'Erro ao criar chamado.', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarNotificacao('Erro de rede ao criar chamado.', 'error');
        });
    });
}

// ============================================================
// CRUD DE CATEGORIAS
// ============================================================
let categoriaIdParaEliminar = null;
function confirmarEliminarCategoria(id, nome) {
    categoriaIdParaEliminar = id;
    document.getElementById('categoriaDeleteName').textContent = nome;
    document.getElementById('categoriaDeleteModal').style.display = 'flex';
}
document.getElementById('categoriaDeleteConfirmBtn')?.addEventListener('click', () => {
    if (categoriaIdParaEliminar) {
        fetch(`${baseUrl}/eliminar-categoria/${categoriaIdParaEliminar}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        })
        .then(() => location.reload())
        .catch(error => console.error('Erro:', error));
    }
    document.getElementById('categoriaDeleteModal').style.display = 'none';
});
document.getElementById('categoriaDeleteCancelBtn')?.addEventListener('click', () => {
    document.getElementById('categoriaDeleteModal').style.display = 'none';
});

// ============================================================
// POP-UP DE CATEGORIA (com ícones)
// ============================================================
let categoriaEditId = null;
const corPreview = document.getElementById('corPreview');
const corTexto = document.getElementById('corTexto');
const iconePreviewSpan = document.getElementById('iconePreview');
const iconeTextoSpan = document.getElementById('iconeTexto');

function abrirCategoriaModal(editId = null, nome = '', cor = '#ff6b6b', icone = 'infraestrutura') {
    categoriaEditId = editId;
    const modal = document.getElementById('categoriaModal');
    const titulo = document.getElementById('categoriaModalTitle');
    const saveBtn = document.getElementById('categoriaSaveBtn');
    const editIdField = document.getElementById('categoriaEditId');
    if (editId) {
        titulo.textContent = 'Editar Categoria';
        saveBtn.textContent = 'Guardar Alterações';
        editIdField.value = editId;
    } else {
        titulo.textContent = 'Criar Nova Categoria';
        saveBtn.textContent = 'Criar';
        editIdField.value = '';
    }
    document.getElementById('categoriaNome').value = nome;
    if (corPreview) corPreview.style.backgroundColor = cor;
    if (corTexto) corTexto.textContent = getCorNome(cor);
    const iconeSvg = getIconeSvg(icone, '#ffffff');
    if (iconePreviewSpan) iconePreviewSpan.innerHTML = iconeSvg;
    if (iconeTextoSpan) iconeTextoSpan.textContent = getIconeNome(icone);
    updatePreview();
    modal.style.display = 'flex';
    document.getElementById('categoriaNome').focus();
}

function getCorNome(cor) {
    const cores = { '#ff6b6b':'Vermelho','#4ecdc4':'Turquesa','#45b7d1':'Azul','#96ceb4':'Verde','#ffeaa7':'Amarelo','#a29bfe':'Roxo','#fd79a8':'Rosa' };
    return cores[cor] || 'Vermelho';
}

function closeCategoriaModal() {
    document.getElementById('categoriaModal').style.display = 'none';
    categoriaEditId = null;
}

document.getElementById('categoriaSaveBtn')?.addEventListener('click', () => {
    const nome = document.getElementById('categoriaNome').value.trim();
    if (!nome) { alert('Digite um nome para a categoria'); return; }
    const cor = corPreview?.style.backgroundColor || '#ff6b6b';
    const iconeId = (iconeTextoSpan?.textContent === 'Infraestrutura') ? 'infraestrutura' :
                     (iconeTextoSpan?.textContent === 'Software') ? 'software' :
                     (iconeTextoSpan?.textContent === 'Rede') ? 'rede' :
                     (iconeTextoSpan?.textContent === 'Hardware') ? 'hardware' :
                     (iconeTextoSpan?.textContent === 'Segurança') ? 'seguranca' : 'infraestrutura';
    const editId = document.getElementById('categoriaEditId')?.value;
    const url = editId ? `${baseUrl}/editar-categoria/${editId}` : `${baseUrl}/criar-categoria`;
    const method = editId ? 'PUT' : 'POST';
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ nome, cor, icone: iconeId })
    })
    .then(() => location.reload())
    .catch(error => console.error('Erro:', error));
});
document.getElementById('categoriaCancelBtn')?.addEventListener('click', closeCategoriaModal);
function editarCategoria(id, nome, cor, icone) { abrirCategoriaModal(id, nome, cor, icone); }

// ============================================================
// SELETORES PERSONALIZADOS (COR e ÍCONE)
// ============================================================
const btnCor = document.getElementById('btnCor'), menuCor = document.getElementById('menuCor');
const btnIcone = document.getElementById('btnIcone'), menuIcone = document.getElementById('menuIcone');
btnCor?.addEventListener('click', () => {
    menuCor?.classList.toggle('ativo');
    btnCor?.classList.toggle('aberto');
    menuIcone?.classList.remove('ativo');
    btnIcone?.classList.remove('aberto');
});
menuCor?.querySelectorAll('.seletor-opcao').forEach(opcao => {
    opcao.addEventListener('click', () => {
        const cor = opcao.dataset.cor, nome = opcao.dataset.nome;
        if (corPreview) corPreview.style.backgroundColor = cor;
        if (corTexto) corTexto.textContent = nome;
        menuCor.classList.remove('ativo');
        btnCor.classList.remove('aberto');
        updatePreview();
    });
});
btnIcone?.addEventListener('click', () => {
    menuIcone?.classList.toggle('ativo');
    btnIcone?.classList.toggle('aberto');
    menuCor?.classList.remove('ativo');
    btnCor?.classList.remove('aberto');
});
menuIcone?.querySelectorAll('.seletor-opcao').forEach(opcao => {
    opcao.addEventListener('click', () => {
        const icone = opcao.dataset.icone, nome = opcao.dataset.nome;
        const iconeSvg = getIconeSvg(icone, '#ffffff');
        if (iconePreviewSpan) iconePreviewSpan.innerHTML = iconeSvg;
        if (iconeTextoSpan) iconeTextoSpan.textContent = nome;
        menuIcone.classList.remove('ativo');
        btnIcone.classList.remove('aberto');
        updatePreview();
    });
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('.seletor-wrapper')) {
        menuCor?.classList.remove('ativo');
        menuIcone?.classList.remove('ativo');
        btnCor?.classList.remove('aberto');
        btnIcone?.classList.remove('aberto');
    }
});
function updatePreview() {
    const nome = document.getElementById('categoriaNome')?.value.trim() || 'Nome';
    const cor = corPreview?.style.backgroundColor || '#ff6b6b';
    const iconeId = (iconeTextoSpan?.textContent === 'Infraestrutura') ? 'infraestrutura' :
                     (iconeTextoSpan?.textContent === 'Software') ? 'software' :
                     (iconeTextoSpan?.textContent === 'Rede') ? 'rede' :
                     (iconeTextoSpan?.textContent === 'Hardware') ? 'hardware' :
                     (iconeTextoSpan?.textContent === 'Segurança') ? 'seguranca' : 'infraestrutura';
    const previewBox = document.getElementById('previewBox');
    if (previewBox) {
        previewBox.innerHTML = `${getIconeSvg(iconeId, 'white')} ${escapeHtml(nome)}`;
        previewBox.style.backgroundColor = cor;
    }
}
document.getElementById('categoriaNome')?.addEventListener('input', updatePreview);

// ============================================================
// PESQUISA E FILTROS
// ============================================================
function getTodasTarefas() {
    const todas = [];
    for (const catId in tarefasPorCategoria) todas.push(...tarefasPorCategoria[catId]);
    todas.push(...tarefasSemCategoria);
    return todas;
}

let searchModal = document.getElementById('searchModal');
let searchInput = document.getElementById('searchInput');
let filtroStatus = document.getElementById('filtroStatus');
let filtroPrioridade = document.getElementById('filtroPrioridade');
let filtroCategoria = document.getElementById('filtroCategoria');
let searchResults = document.getElementById('searchResults');
let btnPesquisar = document.getElementById('btnPesquisar');
let searchCloseBtn = document.getElementById('searchCloseBtn');
let btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
let btnLimparFiltros = document.getElementById('btnLimparFiltros');

function aplicarFiltros() {
    const termo = searchInput.value.trim().toLowerCase();
    const statusVal = filtroStatus.value;
    const prioridadeVal = filtroPrioridade.value;
    const categoriaVal = filtroCategoria.value;
    let resultados = getTodasTarefas();
    if (termo) resultados = resultados.filter(t => t.conteudo.toLowerCase().includes(termo));
    if (statusVal !== 'todos') {
        if (statusVal === 'nao_concluidos') resultados = resultados.filter(t => t.status === 'Aberto' || t.status === 'Em andamento');
        else if (statusVal === 'concluidos') resultados = resultados.filter(t => t.status === 'Concluido' || t.status === 'Cancelado');
        else resultados = resultados.filter(t => t.status === statusVal);
    }
    if (prioridadeVal !== 'todas') resultados = resultados.filter(t => t.prioridade === prioridadeVal);
    if (categoriaVal !== 'todas') {
        if (categoriaVal === 'sem_categoria') resultados = resultados.filter(t => t.categoria_id === null);
        else resultados = resultados.filter(t => t.categoria_id === parseInt(categoriaVal));
    }
    if (resultados.length === 0) {
        searchResults.innerHTML = '<div class="sem-resultados">Nenhum chamado encontrado com os filtros atuais.</div>';
    } else {
        searchResults.innerHTML = `<div class="mb-2"><strong>${resultados.length} resultado(s)</strong></div>` +
            resultados.map(t => {
                const statusIcone = { 'Aberto':'📋','Em andamento':'⚙️','Concluido':'✅','Cancelado':'❌' }[t.status] || '';
                const prioridadeIcone = { 'Baixa':'🟢','Media':'🟡','Alta':'🟠','Urgente':'🔴' }[t.prioridade] || '';
                return `<div class="resultado-item" onclick="concluirChamado(${t.id}, this)"><div class="resultado-titulo">${escapeHtml(t.conteudo)} ${t.feita ? '✓' : ''}</div><div class="resultado-meta"><span>${statusIcone} ${escapeHtml(t.status)}</span><span>${prioridadeIcone} ${escapeHtml(t.prioridade)}</span><span>📅 ${formatarData(t.data_criacao)}</span></div></div>`;
            }).join('');
    }
}

function limparFiltros() {
    searchInput.value = '';
    filtroStatus.value = 'todos';
    filtroPrioridade.value = 'todas';
    filtroCategoria.value = 'todas';
    aplicarFiltros();
}

function openSearchModal() {
    searchModal.style.display = 'flex';
    setTimeout(() => searchInput.focus(), 100);
    aplicarFiltros();
}

function closeSearchModal() {
    searchModal.style.display = 'none';
    searchResults.innerHTML = '<div class="sem-resultados">Utilize os filtros ou a busca acima para encontrar chamados.</div>';
}

btnPesquisar?.addEventListener('click', openSearchModal);
searchCloseBtn?.addEventListener('click', closeSearchModal);
btnAplicarFiltros?.addEventListener('click', aplicarFiltros);
btnLimparFiltros?.addEventListener('click', limparFiltros);
searchInput?.addEventListener('input', aplicarFiltros);
searchModal?.addEventListener('click', (e) => { if (e.target === searchModal) closeSearchModal(); });

document.getElementById('btnAbrirCategoria')?.addEventListener('click', () => abrirCategoriaModal());
document.getElementById('btnNovaCategoriaTopo')?.addEventListener('click', () => abrirCategoriaModal());

// Fechar modais com tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('customModal').style.display === 'flex') closeModal();
        if (document.getElementById('categoriaDeleteModal').style.display === 'flex') document.getElementById('categoriaDeleteModal').style.display = 'none';
        if (document.getElementById('categoriaModal').style.display === 'flex') closeCategoriaModal();
        if (searchModal?.style.display === 'flex') closeSearchModal();
        if (document.getElementById('adminPanelModal')?.style.display === 'flex') document.getElementById('adminPanelModal').style.display = 'none';
    }
});
document.getElementById('categoriaModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('categoriaModal')) closeCategoriaModal();
});
document.getElementById('categoriaDeleteModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('categoriaDeleteModal')) document.getElementById('categoriaDeleteModal').style.display = 'none';
});

// ============================================================
// POP-UP DE DESCRIÇÃO
// ============================================================
let tarefaAtual = null;
function abrirDescricaoModal(id) {
    fetch(`${baseUrl}/detalhes-chamado/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                tarefaAtual = data;
                document.getElementById('descricaoModalTitulo').textContent = data.titulo || 'Sem título';
                document.getElementById('descricaoModalTexto').value = data.descricao || '';
                document.getElementById('descricaoModalDataCriacao').textContent = `📅 Criado em: ${formatarData(data.data_criacao)}`;
                document.getElementById('descricaoModalStatus').textContent = `📋 Status: ${data.status}`;
                document.getElementById('descricaoModalPrioridade').textContent = `🎯 Prioridade: ${data.prioridade}`;
                if (data.data_limite) document.getElementById('descricaoModalDataLimite').textContent = `⏰ Data limite: ${formatarData(data.data_limite)}`;
                else document.getElementById('descricaoModalDataLimite').textContent = '';
                document.getElementById('descricaoModal').style.display = 'flex';
            } else {
                mostrarNotificacao('Erro ao carregar detalhes do chamado', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarNotificacao('Erro de rede ao carregar detalhes', 'error');
        });
}

function fecharDescricaoModal() {
    document.getElementById('descricaoModal').style.display = 'none';
    tarefaAtual = null;
}

function salvarDescricao() {
    if (!tarefaAtual) return;
    const novaDescricao = document.getElementById('descricaoModalTexto').value;
    fetch(`${baseUrl}/atualizar-descricao/${tarefaAtual.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ descricao: novaDescricao })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacao('Descrição atualizada!', 'success');
            fecharDescricaoModal();
            atualizarTarefaNosDados(tarefaAtual.id, { descricao: novaDescricao });
        } else {
            mostrarNotificacao(data.error || 'Erro ao atualizar descrição!', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarNotificacao('Erro de rede ao atualizar descrição.', 'error');
    });
}

// ============================================================
// MODAL DE DETALHES (OS, PROFISSIONAIS)
// ============================================================
let chamadoAtualDetalhes = null;
function abrirDetalhesModal(id) {
    tarefaIdAtual = id;
    fetch(`${baseUrl}/detalhes-chamado/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                chamadoAtualDetalhes = data;
                document.getElementById('detalhesModalTitulo').textContent = data.titulo || 'Chamado';
                document.getElementById('detalhesDescricao').textContent = data.descricao || 'Sem descrição';
                document.getElementById('detalhesOS').textContent = data.numero_os || '---';
                document.getElementById('detalhesProfissionaisInput').value = data.profissionais || '';
                document.getElementById('detalhesDataCriacao').textContent = formatarData(data.data_criacao);
                document.getElementById('detalhesStatus').textContent = data.status;
                document.getElementById('detalhesPrioridade').textContent = data.prioridade;
                document.getElementById('detalhesModal').style.display = 'flex';
                // Carregar comentários
                carregarComentarios(id);
            } else {
                mostrarNotificacao('Erro ao carregar detalhes do chamado', 'error');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarNotificacao('Erro de rede ao carregar detalhes', 'error');
        });
}

function fecharDetalhesModal() {
    document.getElementById('detalhesModal').style.display = 'none';
    chamadoAtualDetalhes = null;
    tarefaIdAtual = null;
    document.getElementById('novoComentarioTexto').value = '';
}

function salvarProfissionais() {
    if (!chamadoAtualDetalhes) return;
    const novosProfissionais = document.getElementById('detalhesProfissionaisInput').value.trim();
    fetch(`${baseUrl}/atualizar-profissionais/${chamadoAtualDetalhes.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ profissionais: novosProfissionais })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacao('Profissionais atualizados!', 'success');
            if (chamadoAtualDetalhes) chamadoAtualDetalhes.profissionais = novosProfissionais;
            atualizarTarefaNosDados(chamadoAtualDetalhes.id, { profissionais: novosProfissionais });
        } else {
            mostrarNotificacao(data.error || 'Erro ao atualizar profissionais', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarNotificacao('Erro de rede ao atualizar profissionais.', 'error');
    });
}

// ============================================================
// ADMINISTRAÇÃO DE MEMBROS (apenas gerente)
// ============================================================
const adminPanelModal = document.getElementById('adminPanelModal');
const listaMembros = document.getElementById('listaMembros');
const btnAdminGerente = document.getElementById('btnAdmin');

// Abrir painel de membros diretamente se for gerente (já autenticado)
if (btnAdminGerente) {
    btnAdminGerente.addEventListener('click', () => {
        carregarMembros();
        adminPanelModal.style.display = 'flex';
    });
}

function carregarMembros() {
    fetch(`${baseUrl}/membros`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(r => r.json())
    .then(membros => {
        if (Array.isArray(membros)) {
            renderizarListaMembros(membros);
        } else {
            listaMembros.innerHTML = '<p class="text-muted">Não foi possível carregar membros.</p>';
        }
    })
    .catch(() => {
        listaMembros.innerHTML = '<p class="text-muted">Erro ao carregar membros.</p>';
    });
}

function renderizarListaMembros(membros) {
    if (membros.length === 0) {
        listaMembros.innerHTML = '<p class="text-muted">Nenhum membro cadastrado.</p>';
        return;
    }
    let html = '<ul class="tarefas-lista">';
    membros.forEach(m => {
        const nomeEscapado = escapeHtml(m.nome);
        html += `
            <li class="tarefa-item" style="justify-content: space-between;">
                <span>${nomeEscapado} ${m.is_gerente ? '<span class="badge-status">Gerente</span>' : ''}</span>
                <button class="tarefa-eliminar" onclick="removerMembro(${m.id}, '${nomeEscapado}')">🗑️</button>
            </li>`;
    });
    html += '</ul>';
    listaMembros.innerHTML = html;
}

// Adicionar membro
document.getElementById('btnAdicionarMembro')?.addEventListener('click', () => {
    const nome = document.getElementById('novoMembroNome').value.trim();
    const senha = document.getElementById('novoMembroSenha').value.trim();
    const erro = document.getElementById('erroMembro');
    if (!nome || !senha) {
        erro.textContent = 'Preencha nome e senha.';
        erro.style.display = 'block';
        return;
    }
    fetch(`${baseUrl}/membros`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ nome: nome, senha: senha })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            document.getElementById('novoMembroNome').value = '';
            document.getElementById('novoMembroSenha').value = '';
            erro.style.display = 'none';
            carregarMembros();
            mostrarNotificacao('Membro adicionado!', 'success');
        } else {
            erro.textContent = data.error || 'Erro ao adicionar membro.';
            erro.style.display = 'block';
        }
    })
    .catch(() => {
        erro.textContent = 'Erro de rede.';
        erro.style.display = 'block';
    });
});

// Remover membro
function removerMembro(id, nome) {
    if (!confirm(`Tem certeza que deseja remover "${nome}"?`)) return;
    fetch(`${baseUrl}/membros/${id}`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            carregarMembros();
            mostrarNotificacao('Membro removido.', 'success');
        } else {
            mostrarNotificacao(data.error || 'Erro ao remover.', 'error');
        }
    })
    .catch(() => mostrarNotificacao('Erro de rede.', 'error'));
}

// Fechar painel de admin
document.getElementById('fecharAdminPanel')?.addEventListener('click', () => {
    adminPanelModal.style.display = 'none';
});
adminPanelModal?.addEventListener('click', (e) => {
    if (e.target === adminPanelModal) {
        adminPanelModal.style.display = 'none';
    }
});

// Logout do membro
document.getElementById('btnLogout')?.addEventListener('click', () => {
    fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(() => {
        location.reload();
    })
    .catch(() => mostrarNotificacao('Erro ao sair.', 'error'));
});
// ============================================================
// COMENTÁRIOS
// ============================================================
function carregarComentarios(tarefaId) {
    fetch(`${baseUrl}/tarefa/${tarefaId}/comentarios`)
        .then(r => r.json())
        .then(comentarios => {
            const container = document.getElementById('detalhesComentarios');
            if (comentarios.length === 0) {
                container.innerHTML = '<p class="text-muted">Nenhum comentário ainda.</p>';
                return;
            }
            let html = '<ul class="tarefas-lista">';
            comentarios.forEach(c => {
                const dataFormatada = formatarData(c.data_criacao);
                const nomeEscapado = escapeHtml(c.membro_nome);
                const textoEscapado = escapeHtml(c.texto);
                html += `
                    <li class="tarefa-item" style="flex-direction: column; align-items: flex-start;">
                        <div class="comentario-cabecalho" style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.25rem;">
                            <strong>${nomeEscapado}</strong>
                            <small class="text-muted">${dataFormatada}</small>
                        </div>
                        <div>${textoEscapado}</div>
                    </li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        })
        .catch(() => {
            document.getElementById('detalhesComentarios').innerHTML = '<p class="text-muted">Erro ao carregar comentários.</p>';
        });
}

document.getElementById('btnAdicionarComentario')?.addEventListener('click', () => {
    const texto = document.getElementById('novoComentarioTexto').value.trim();
    if (!texto) return;
    if (!tarefaIdAtual) return;

    fetch(`${baseUrl}/tarefa/${tarefaIdAtual}/comentarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ texto })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            document.getElementById('novoComentarioTexto').value = '';
            carregarComentarios(tarefaIdAtual);
            mostrarNotificacao('Comentário adicionado!', 'success');
        } else {
            mostrarNotificacao(data.error || 'Erro ao comentar.', 'error');
        }
    })
    .catch(() => mostrarNotificacao('Erro de rede.', 'error'));
});
// ============================================================
// INICIALIZAÇÃO
// ============================================================
renderizarCategorias();
updatePreview();