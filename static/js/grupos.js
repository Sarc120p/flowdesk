'use strict';

// ============================================================
// TOKEN CSRF
// ============================================================
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

// ============================================================
// MODAL DE CRIAÇÃO DE GRUPO
// ============================================================
const modalCriar = document.getElementById('modalGrupo');
document.getElementById('btnNovoGrupo').addEventListener('click', () => modalCriar.style.display = 'flex');
document.getElementById('cancelGrupo').addEventListener('click', () => modalCriar.style.display = 'none');

document.getElementById('saveGrupo').addEventListener('click', () => {
    const nome = document.getElementById('nomeGrupo').value.trim();
    const slug = document.getElementById('slugGrupo').value.trim().toLowerCase();
    const codigo = document.getElementById('codigoGrupo').value.trim();
    const adminNome = document.getElementById('adminNomeGrupo').value.trim();
    const adminSenha = document.getElementById('adminSenhaGrupo').value.trim();

    if (!nome || !slug) return alert('Preencha nome e slug.');

    fetch('/criar-grupo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
            nome,
            slug,
            codigo: codigo || '',
            admin_nome: adminNome || '',
            admin_senha: adminSenha || ''
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/grupo/' + data.slug;
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(() => alert('Erro de rede.'));
});

modalCriar.addEventListener('click', (e) => {
    if (e.target === modalCriar) modalCriar.style.display = 'none';
});

// ============================================================
// MODAL DE ELIMINAÇÃO DE GRUPO
// ============================================================
const modalEliminar = document.getElementById('modalEliminarGrupo');
const nomeGrupoEliminar = document.getElementById('nomeGrupoEliminar');
let slugParaEliminar = null;

function confirmarEliminarGrupo(slug, nome) {
    slugParaEliminar = slug;
    nomeGrupoEliminar.textContent = nome;
    modalEliminar.style.display = 'flex';
}

document.getElementById('confirmEliminarGrupo').addEventListener('click', async () => {
    if (!slugParaEliminar) return;

    const token = getCsrfToken();
    if (!token) {
        alert('Token CSRF não encontrado. Recarrega a página.');
        return;
    }

    try {
        const response = await fetch(`/eliminar-grupo/${slugParaEliminar}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': token
            }
        });

        const data = await response.json();

        if (data.success) {
            modalEliminar.style.display = 'none';
            location.reload();
        } else {
            alert('Erro: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro de rede:', error);
        alert('Erro de rede. Verifica a consola.');
    }
});

document.getElementById('cancelEliminarGrupo').addEventListener('click', () => {
    modalEliminar.style.display = 'none';
    slugParaEliminar = null;
});

modalEliminar.addEventListener('click', (e) => {
    if (e.target === modalEliminar) {
        modalEliminar.style.display = 'none';
        slugParaEliminar = null;
    }
});

// Associa os botões de lixeira
document.querySelectorAll('.btn-eliminar-grupo').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slug = btn.dataset.slug;
        const nome = btn.dataset.nome;
        confirmarEliminarGrupo(slug, nome);
    });
});