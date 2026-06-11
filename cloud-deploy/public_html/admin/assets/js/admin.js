/**
 * Guia Canindé - Painel Administrativo
 * SPA puro em JS vanilla
 */

const API = window.API_BASE_URL || '/api';
const DEFAULT_SETTINGS = {
    branding: {
        siteName: 'Guia Canind&eacute;',
        siteTitle: 'Guia Canind&eacute; - Encontre os melhores neg&oacute;cios da cidade',
        siteDescription: 'O melhor guia de empresas e servi&ccedil;os de Canind&eacute;. Encontre os melhores neg&oacute;cios da cidade.',
        iconUrl: '/ICONETESTE.png',
        logoLightUrl: '/LOGO-BG.png',
        logoDarkUrl: '/LOGO-BR.png',
        ogImageUrl: 'https://oguiacaninde.online/ICONETESTE.png',
    },
    contact: {
        whatsappNumber: '5585999999999',
        whatsappMessage: 'Ol&aacute;! Gostaria de falar com a equipe do Guia Canind&eacute;.',
        whatsappButtonTitle: 'Fale conosco',
    },
    navigation: {
        menuItems: [
            { label: 'In&iacute;cio', route: '/', icon: 'home', visible: true, highlight: false },
            { label: 'Categorias', route: '/categorias', icon: 'grid', visible: true, highlight: false },
            { label: 'Buscar', route: '/buscar', icon: 'search', visible: true, highlight: false },
            { label: 'Login da Empresa', route: '/empresa-login', icon: 'building', visible: true, highlight: false },
            { label: 'Cadastrar Neg&oacute;cio', route: '/cadastrar', icon: 'briefcase', visible: true, highlight: true },
        ],
    },
    home: {
        heroTitle: 'Encontre tudo em Canind&eacute;',
        heroDescription: 'Conecte-se diretamente com empresas e profissionais da sua cidade. R&aacute;pido, f&aacute;cil e gratuito!',
        primaryButtonLabel: 'O que est&aacute; buscando?',
        primaryButtonRoute: '/buscar',
        secondaryButtonLabel: 'Cadastrar Meu Neg&oacute;cio',
        secondaryButtonRoute: '/cadastrar',
        sectionTitle: 'Como funciona?',
        featurePrimaryTitle: '100% gratuito!',
        featurePrimaryText: 'Conecte-se diretamente pelo WhatsApp com empresas e profissionais.',
        featureSecondaryTitle: 'Encontre servi&ccedil;os perto de voc&ecirc;',
        featureSecondaryText: 'Encontre servi&ccedil;os pr&oacute;ximos a voc&ecirc;: pizzarias, encanadores, cabeleireiros e muito mais!',
        footerLine1: 'Encontre o que precisa em Canind&eacute;',
        footerLine2: 'R&aacute;pido, f&aacute;cil e direto no WhatsApp',
    },
    theme: {
        themeColorLight: '#4f46e5',
        themeColorDark: '#182132',
        pwaName: 'Guia Canind&eacute;',
        pwaShortName: 'Guia',
    },
};

function cloneData(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function deepMerge(target, source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return source ?? target;
    const output = { ...target };
    Object.entries(source).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value) && output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) {
            output[key] = deepMerge(output[key], value);
        } else {
            output[key] = value;
        }
    });
    return output;
}

// ============================================================
// Auth helpers
// ============================================================
const Auth = {
    getToken: () => localStorage.getItem('gc_admin_token'),
    setToken: (t) => localStorage.setItem('gc_admin_token', t),
    getUser:  () => { try { return JSON.parse(localStorage.getItem('gc_admin_user')); } catch { return null; } },
    setUser:  (u) => localStorage.setItem('gc_admin_user', JSON.stringify(u)),
    clear:    () => { localStorage.removeItem('gc_admin_token'); localStorage.removeItem('gc_admin_user'); },
    isLogged: () => !!localStorage.getItem('gc_admin_token'),
};

// ============================================================
// API helper
// ============================================================
async function api(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);

    const res = await fetch(API + path, opts);

    // Token expirado → logout
    if (res.status === 401) { Auth.clear(); renderLogin(); return null; }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
}

// ============================================================
// Toast
// ============================================================
function toast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

// ============================================================
// Init
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    if (Auth.isLogged()) {
        renderApp();
    } else {
        renderLogin();
    }
});

// ============================================================
// LOGIN
// ============================================================
function renderLogin() {
    document.body.innerHTML = `
    <div class="login-screen">
      <div class="login-box">
        <h1>Painel Administrativo</h1>
        <p>Guia Comercial de Canindé</p>
        <div class="form-group">
          <label>Usuário</label>
          <input type="text" id="l-user" placeholder="admin" value="admin">
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" id="l-pass" placeholder="••••••••">
        </div>
        <button class="btn-login" id="btn-login">Entrar</button>
      </div>
    </div>
    <div id="toast-container"></div>`;

    document.getElementById('btn-login').addEventListener('click', doLogin);
    ['l-user','l-pass'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') doLogin();
        });
    });
}

async function doLogin() {
    const username = document.getElementById('l-user').value.trim();
    const password = document.getElementById('l-pass').value;
    if (!username || !password) { toast('Preencha usuário e senha', 'error'); return; }

    const btn = document.getElementById('btn-login');
    btn.disabled = true; btn.textContent = 'Entrando...';

    try {
        const res = await fetch(`${API}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Credenciais inválidas');

        Auth.setToken(data.token);
        Auth.setUser(data.user);
        renderApp();
    } catch (e) {
        toast(e.message, 'error');
        btn.disabled = false; btn.textContent = 'Entrar';
    }
}

// ============================================================
// APP SHELL
// ============================================================
function renderApp() {
    document.body.innerHTML = `
    <div class="admin-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#6B21A8" stroke-width="3"/>
            <circle cx="20" cy="20" r="6" fill="#10B981"/>
          </svg>
          Painel Admin
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-label">Menu</div>
          <button class="sidebar-link active" data-page="dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </button>
          <button class="sidebar-link" data-page="empresas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
            Empresas
          </button>
          <button class="sidebar-link" data-page="categorias">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            Categorias
          </button>
          <button class="sidebar-link" data-page="configuracoes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.96 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.2 16.92l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.4a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.08 3.64l.06.06A1.7 1.7 0 0 0 9 4.04a1.7 1.7 0 0 0 1.04-1.56V2a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.87-.34l.06-.06A2 2 0 0 1 19.76 7.08l-.06.06A1.7 1.7 0 0 0 19.36 9c0 .68.4 1.3 1.04 1.56H21a2 2 0 0 1 0 4h-.09c-.64.26-1.04.88-1.51 1.44Z"/></svg>
            Configura&ccedil;&otilde;es
          </button>
          <div class="sidebar-label" style="margin-top:.5rem">Site</div>
          <a class="sidebar-link" href="/" target="_blank">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
            Ver Site
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="btn-logout" id="btn-logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sair
          </button>
        </div>
      </aside>

      <main class="admin-main" id="admin-content">
        <p style="color:var(--text-light)">Carregando...</p>
      </main>
    </div>
    <div id="toast-container"></div>
    <div id="modal-root"></div>`;

    // Navegação sidebar
    document.querySelectorAll('.sidebar-link[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const page = btn.dataset.page;
            if (page === 'dashboard') loadDashboard();
            else if (page === 'empresas') loadEmpresas();
            else if (page === 'categorias') loadCategorias();
            else if (page === 'configuracoes') loadConfiguracoes();
        });
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        Auth.clear();
        renderLogin();
    });

    // Página inicial
    loadDashboard();
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<p style="color:var(--text-light)">Carregando...</p>';

    try {
        const data = await api('GET', '/dashboard');
        const s = data.stats;

        // Barras do gráfico
        const maxVal = Math.max(...data.accessData.map(d => d.count), 1);
        const bars = data.accessData.map(d => {
            const h = Math.max(4, Math.round((d.count / maxVal) * 70));
            const label = d.date.slice(5); // MM-DD
            return `<div class="chart-bar-wrap">
                <div class="chart-val">${d.count}</div>
                <div class="chart-bar" style="height:${h}px"></div>
                <div class="chart-date">${label}</div>
            </div>`;
        }).join('');

        // Tabela empresas recentes
        const rows = data.recentCompanies.map(c => `
            <tr>
              <td>${c.name}</td>
              <td>${c.categoryName || '—'}</td>
              <td><span class="badge ${c.approved ? 'liberada' : 'bloqueada'}">${c.approved ? 'Liberada' : 'Bloqueada'}</span></td>
              <td>${new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
            </tr>`).join('') || `<tr class="empty-row"><td colspan="4">Nenhuma empresa</td></tr>`;

        content.innerHTML = `
        <div class="page-header">
          <h1>Dashboard</h1>
          <p>Visao geral do Guia Comercial</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
            </div>
            <div><div class="stat-value">${s.totalCompanies}</div><div class="stat-label">Total de Empresas</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            </div>
            <div><div class="stat-value">${s.totalCategories}</div><div class="stat-label">Total de Categorias</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div><div class="stat-value">${s.approvedCount}</div><div class="stat-label">Empresas Liberadas</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <div><div class="stat-value">${s.blockedCount}</div><div class="stat-label">Empresas Bloqueadas</div></div>
          </div>
        </div>

        <div class="chart-card">
          <h2>Acessos ao Sistema (7 dias)</h2>
          <div class="chart-bars">${bars}</div>
        </div>

        <div class="quick-actions-card">
          <div>
            <h2>Configura&ccedil;&otilde;es do Site</h2>
            <p>Menus, WhatsApp, logos, textos, SEO e PWA agora ficam centralizados aqui no painel admin.</p>
          </div>
          <button class="btn-save" id="btn-open-settings">Abrir Configura&ccedil;&otilde;es</button>
        </div>

        <div class="table-card">
          <div class="table-header"><h2>Empresas Recentes</h2></div>
          <table>
            <thead><tr><th>Nome</th><th>Categoria</th><th>Status</th><th>Data</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;

        document.getElementById('btn-open-settings').addEventListener('click', () => {
            const btn = document.querySelector('.sidebar-link[data-page="configuracoes"]');
            if (btn) {
                document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
                btn.classList.add('active');
            }
            loadConfiguracoes();
        });
    } catch (e) {
        content.innerHTML = `<p style="color:var(--danger)">Erro: ${e.message}</p>`;
    }
}

// ============================================================
// EMPRESAS
// ============================================================
let empPage = 1, empSearch = '', empFilter = '';

async function loadEmpresas() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
    <div class="page-header">
      <h1>Empresas</h1>
      <p>Gerencie todas as empresas cadastradas</p>
    </div>
    <div class="table-card">
      <div class="table-header">
        <h2 id="emp-count">Carregando...</h2>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <select id="emp-filter" style="padding:.5rem .8rem;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;outline:none">
            <option value="">Todos os status</option>
            <option value="1">Liberadas</option>
            <option value="0">Bloqueadas</option>
          </select>
          <div class="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" id="emp-search" placeholder="Buscar empresa...">
          </div>
        </div>
      </div>
      <div id="emp-table-wrap"></div>
      <div id="emp-pagination" class="pagination"></div>
    </div>`;

    empPage = 1; empSearch = ''; empFilter = '';
    await fetchEmpresas();

    document.getElementById('emp-search').addEventListener('input', debounce(async e => {
        empSearch = e.target.value; empPage = 1; await fetchEmpresas();
    }, 400));
    document.getElementById('emp-filter').addEventListener('change', async e => {
        empFilter = e.target.value; empPage = 1; await fetchEmpresas();
    });
}

async function fetchEmpresas() {
    const wrap = document.getElementById('emp-table-wrap');
    wrap.innerHTML = '<p style="padding:1.5rem;color:var(--text-light)">Carregando...</p>';

    const params = new URLSearchParams({ page: empPage, limit: 15 });
    if (empSearch) params.set('search', empSearch);
    if (empFilter !== '') params.set('approved', empFilter);

    try {
        const data = await api('GET', `/companies?${params}`);
        document.getElementById('emp-count').textContent = `${data.meta.total} empresa${data.meta.total !== 1 ? 's' : ''}`;

        const rows = data.data.map(c => `
            <tr>
              <td>
                <div style="font-weight:600">${c.name}</div>
                <div style="font-size:.78rem;color:var(--text-light)">${c.whatsapp}</div>
              </td>
              <td>${c.categoryName || '—'}</td>
              <td>
                <span class="badge ${c.approved ? 'liberada' : 'bloqueada'}">
                  ${c.approved ? '✓ Liberada' : '✗ Bloqueada'}
                </span>
              </td>
              <td>${new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
              <td>
                <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                  <button class="btn-action" onclick="editEmpresa('${c.id}')">Editar</button>
                  <button class="btn-action ${c.approved ? 'danger' : 'success'}" 
                    onclick="toggleEmpresa('${c.id}', ${c.approved})">
                    ${c.approved ? 'Bloquear' : 'Liberar'}
                  </button>
                  <button class="btn-action danger" onclick="deleteEmpresa('${c.id}', '${c.name.replace(/'/g,"\\'")}')">Excluir</button>
                </div>
              </td>
            </tr>`).join('') || `<tr class="empty-row"><td colspan="5">Nenhuma empresa encontrada</td></tr>`;

        wrap.innerHTML = `<table>
            <thead><tr><th>Nome</th><th>Categoria</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;

        // Paginação
        renderAdminPagination('emp-pagination', data.meta, p => { empPage = p; fetchEmpresas(); });
    } catch (e) {
        wrap.innerHTML = `<p style="padding:1.5rem;color:var(--danger)">${e.message}</p>`;
    }
}

async function toggleEmpresa(id, currentApproved) {
    try {
        await api('PATCH', `/companies/${id}/approve`, { approved: !currentApproved });
        toast(currentApproved ? 'Empresa bloqueada' : 'Empresa liberada', 'success');
        await fetchEmpresas();
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteEmpresa(id, name) {
    openModal(`
        <div class="modal-header"><h2>Excluir Empresa</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        <p>Tem certeza que deseja excluir <strong>${name}</strong>?</p>
        <p style="color:var(--text-light);font-size:.875rem;margin-top:.5rem">Esta ação não pode ser desfeita.</p>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
          <button class="btn-danger-confirm" onclick="confirmDelete('${id}')">Excluir</button>
        </div>`);
}

async function confirmDelete(id) {
    try {
        await api('DELETE', `/companies/${id}`);
        toast('Empresa excluída', 'success');
        closeModal();
        await fetchEmpresas();
    } catch (e) { toast(e.message, 'error'); }
}

async function editEmpresa(id) {
    let cats = [];
    try {
        const data = await api('GET', `/companies/${id}`);
        cats = (await api('GET', '/categories')) || [];

        const catOptions = cats.map(c =>
            `<option value="${c.id}" ${c.id === data.categoryId ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        openModal(`
        <div class="modal-header"><h2>Editar Empresa</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        <div class="form-group"><label>Nome</label><input type="text" id="e-name" value="${data.name}"></div>
        <div class="form-group"><label>WhatsApp</label><input type="text" id="e-whatsapp" value="${data.whatsapp}"></div>
        <div class="form-group"><label>Endereço</label><input type="text" id="e-address" value="${data.address}"></div>
        <div class="form-group"><label>Categoria</label><select id="e-category">${catOptions}</select></div>
        <div class="form-group"><label>Descrição</label><textarea id="e-desc" maxlength="300">${data.description || ''}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Email</label><input type="email" id="e-email" value="${data.email || ''}"></div>
          <div class="form-group"><label>Instagram</label><input type="text" id="e-instagram" value="${data.instagram || ''}"></div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
          <button class="btn-save" onclick="saveEmpresa('${id}')">Salvar</button>
        </div>`);
    } catch (e) { toast(e.message, 'error'); }
}

async function saveEmpresa(id) {
    const btn = document.querySelector('.btn-save');
    btn.disabled = true; btn.textContent = 'Salvando...';
    try {
        await api('PUT', `/companies/${id}`, {
            name:        document.getElementById('e-name').value,
            whatsapp:    document.getElementById('e-whatsapp').value,
            address:     document.getElementById('e-address').value,
            categoryId:  document.getElementById('e-category').value,
            description: document.getElementById('e-desc').value || null,
            email:       document.getElementById('e-email').value || null,
            instagram:   document.getElementById('e-instagram').value || null,
        });
        toast('Empresa atualizada!', 'success');
        closeModal();
        await fetchEmpresas();
    } catch (e) {
        toast(e.message, 'error');
        btn.disabled = false; btn.textContent = 'Salvar';
    }
}

// ============================================================
// CATEGORIAS
// ============================================================
async function loadCategorias() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
    <div class="page-header">
      <h1>Categorias</h1>
      <p>Gerencie as categorias de negócios</p>
    </div>
    <div class="table-card">
      <div class="table-header">
        <h2 id="cat-count">Carregando...</h2>
        <button class="btn-save" onclick="openNewCategoria()" style="padding:.5rem 1rem;font-size:.875rem">+ Nova Categoria</button>
      </div>
      <div id="cat-table-wrap"></div>
    </div>`;

    await fetchCategorias();
}

async function fetchCategorias() {
    const wrap = document.getElementById('cat-table-wrap');
    wrap.innerHTML = '<p style="padding:1.5rem;color:var(--text-light)">Carregando...</p>';

    try {
        const data = await api('GET', '/categories');
        document.getElementById('cat-count').textContent = `${data.length} categoria${data.length !== 1 ? 's' : ''}`;

        const rows = data.map(c => `
            <tr>
              <td><div style="font-weight:600">${c.name}</div>${c.description ? `<div style="font-size:.78rem;color:var(--text-light)">${c.description}</div>` : ''}</td>
              <td>${c.companyCount || 0} empresa${(c.companyCount || 0) !== 1 ? 's' : ''}</td>
              <td>${new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
              <td>
                <div style="display:flex;gap:.4rem">
                  <button class="btn-action" onclick="editCategoria('${c.id}','${c.name.replace(/'/g,"\\'")}','${(c.description||'').replace(/'/g,"\\'")}')">Editar</button>
                  <button class="btn-action danger" onclick="deleteCategoria('${c.id}','${c.name.replace(/'/g,"\\'")}')">Excluir</button>
                </div>
              </td>
            </tr>`).join('') || `<tr class="empty-row"><td colspan="4">Nenhuma categoria</td></tr>`;

        wrap.innerHTML = `<table>
            <thead><tr><th>Nome</th><th>Empresas</th><th>Criado em</th><th>Ações</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    } catch (e) {
        wrap.innerHTML = `<p style="padding:1.5rem;color:var(--danger)">${e.message}</p>`;
    }
}

function openNewCategoria() {
    openModal(`
        <div class="modal-header"><h2>Nova Categoria</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        <div class="form-group"><label>Nome *</label><input type="text" id="nc-name" placeholder="Ex: Padarias"></div>
        <div class="form-group"><label>Descrição</label><textarea id="nc-desc" placeholder="Opcional"></textarea></div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
          <button class="btn-save" onclick="saveNewCategoria()">Criar</button>
        </div>`);
}

async function saveNewCategoria() {
    const name = document.getElementById('nc-name').value.trim();
    if (!name) { toast('Nome obrigatório', 'error'); return; }

    const btn = document.querySelector('.btn-save');
    btn.disabled = true; btn.textContent = 'Criando...';
    try {
        await api('POST', '/categories', { name, description: document.getElementById('nc-desc').value || null });
        toast('Categoria criada!', 'success');
        closeModal();
        await fetchCategorias();
    } catch (e) {
        toast(e.message, 'error');
        btn.disabled = false; btn.textContent = 'Criar';
    }
}

function editCategoria(id, name, desc) {
    openModal(`
        <div class="modal-header"><h2>Editar Categoria</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        <div class="form-group"><label>Nome *</label><input type="text" id="ec-name" value="${name}"></div>
        <div class="form-group"><label>Descrição</label><textarea id="ec-desc">${desc}</textarea></div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
          <button class="btn-save" onclick="saveEditCategoria('${id}')">Salvar</button>
        </div>`);
}

async function saveEditCategoria(id) {
    const name = document.getElementById('ec-name').value.trim();
    if (!name) { toast('Nome obrigatório', 'error'); return; }

    const btn = document.querySelector('.btn-save');
    btn.disabled = true; btn.textContent = 'Salvando...';
    try {
        await api('PUT', `/categories/${id}`, { name, description: document.getElementById('ec-desc').value || null });
        toast('Categoria atualizada!', 'success');
        closeModal();
        await fetchCategorias();
    } catch (e) {
        toast(e.message, 'error');
        btn.disabled = false; btn.textContent = 'Salvar';
    }
}

async function deleteCategoria(id, name) {
    openModal(`
        <div class="modal-header"><h2>Excluir Categoria</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        <p>Excluir <strong>${name}</strong>?</p>
        <p style="color:var(--text-light);font-size:.875rem;margin-top:.4rem">Não é possível excluir categorias com empresas vinculadas.</p>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
          <button class="btn-danger-confirm" onclick="confirmDeleteCat('${id}')">Excluir</button>
        </div>`);
}

async function confirmDeleteCat(id) {
    try {
        await api('DELETE', `/categories/${id}`);
        toast('Categoria excluída', 'success');
        closeModal();
        await fetchCategorias();
    } catch (e) { toast(e.message, 'error'); }
}

function adminSettingsPayloadFromForm() {
    const menuJson = document.getElementById('cfg-menu-items').value.trim();
    let menuItems = DEFAULT_SETTINGS.navigation.menuItems;

    if (menuJson) {
        menuItems = JSON.parse(menuJson);
    }

    return {
        branding: {
            siteName: document.getElementById('cfg-site-name').value.trim(),
            siteTitle: document.getElementById('cfg-site-title').value.trim(),
            siteDescription: document.getElementById('cfg-site-description').value.trim(),
            iconUrl: document.getElementById('cfg-icon-url').value.trim(),
            logoLightUrl: document.getElementById('cfg-logo-light').value.trim(),
            logoDarkUrl: document.getElementById('cfg-logo-dark').value.trim(),
            ogImageUrl: document.getElementById('cfg-og-image').value.trim(),
        },
        contact: {
            whatsappNumber: document.getElementById('cfg-whatsapp-number').value.trim(),
            whatsappMessage: document.getElementById('cfg-whatsapp-message').value.trim(),
            whatsappButtonTitle: document.getElementById('cfg-whatsapp-title').value.trim(),
        },
        navigation: {
            menuItems,
        },
        home: {
            heroTitle: document.getElementById('cfg-hero-title').value.trim(),
            heroDescription: document.getElementById('cfg-hero-description').value.trim(),
            primaryButtonLabel: document.getElementById('cfg-primary-label').value.trim(),
            primaryButtonRoute: document.getElementById('cfg-primary-route').value.trim(),
            secondaryButtonLabel: document.getElementById('cfg-secondary-label').value.trim(),
            secondaryButtonRoute: document.getElementById('cfg-secondary-route').value.trim(),
            sectionTitle: document.getElementById('cfg-section-title').value.trim(),
            featurePrimaryTitle: document.getElementById('cfg-feature1-title').value.trim(),
            featurePrimaryText: document.getElementById('cfg-feature1-text').value.trim(),
            featureSecondaryTitle: document.getElementById('cfg-feature2-title').value.trim(),
            featureSecondaryText: document.getElementById('cfg-feature2-text').value.trim(),
            footerLine1: document.getElementById('cfg-footer-line1').value.trim(),
            footerLine2: document.getElementById('cfg-footer-line2').value.trim(),
        },
        theme: {
            themeColorLight: document.getElementById('cfg-theme-light').value.trim(),
            themeColorDark: document.getElementById('cfg-theme-dark').value.trim(),
            pwaName: document.getElementById('cfg-pwa-name').value.trim(),
            pwaShortName: document.getElementById('cfg-pwa-short-name').value.trim(),
        },
    };
}

async function loadConfiguracoes() {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<p style="color:var(--text-light)">Carregando configurações...</p>';

    try {
        const settings = await api('GET', '/settings/admin');
        const merged = deepMerge(cloneData(DEFAULT_SETTINGS), settings || {});
        const branding = merged.branding || {};
        const contact = merged.contact || {};
        const navigation = merged.navigation || {};
        const home = merged.home || {};
        const theme = merged.theme || {};

        content.innerHTML = `
        <div class="page-header">
          <h1>Configurações do Site</h1>
          <p>Alterações visuais e estruturais do guia comercial passam a ser feitas por aqui.</p>
        </div>

        <div class="settings-toolbar">
          <button class="btn-cancel" id="btn-settings-reload">Recarregar</button>
          <button class="btn-save" id="btn-settings-save">Salvar configurações</button>
        </div>

        <div class="settings-grid">
          <section class="settings-card">
            <h2>Marca e SEO</h2>
            <div class="form-group"><label>Nome da marca</label><input id="cfg-site-name" value="${branding.siteName || ''}"></div>
            <div class="form-group"><label>Título da página</label><input id="cfg-site-title" value="${branding.siteTitle || ''}"></div>
            <div class="form-group"><label>Descrição</label><textarea id="cfg-site-description">${branding.siteDescription || ''}</textarea></div>
            <div class="form-group"><label>Ícone / favicon</label><input id="cfg-icon-url" value="${branding.iconUrl || ''}"></div>
            <div class="form-group"><label>Logo tema claro</label><input id="cfg-logo-light" value="${branding.logoLightUrl || ''}"></div>
            <div class="form-group"><label>Logo tema escuro</label><input id="cfg-logo-dark" value="${branding.logoDarkUrl || ''}"></div>
            <div class="form-group"><label>Imagem social (OG/Twitter)</label><input id="cfg-og-image" value="${branding.ogImageUrl || ''}"></div>
          </section>

          <section class="settings-card">
            <h2>WhatsApp e contato</h2>
            <div class="form-group"><label>Número do WhatsApp</label><input id="cfg-whatsapp-number" value="${contact.whatsappNumber || ''}" placeholder="5585999999999"></div>
            <div class="form-group"><label>Mensagem automática</label><textarea id="cfg-whatsapp-message">${contact.whatsappMessage || ''}</textarea></div>
            <div class="form-group"><label>Título do botão flutuante</label><input id="cfg-whatsapp-title" value="${contact.whatsappButtonTitle || ''}"></div>
          </section>

          <section class="settings-card">
            <h2>Menus</h2>
            <p class="settings-help">Use JSON para controlar rótulo, rota, ícone, visibilidade e destaque dos itens do menu público.</p>
            <div class="form-group"><label>Itens do menu</label><textarea id="cfg-menu-items" class="code-input">${JSON.stringify(navigation.menuItems || DEFAULT_SETTINGS.navigation.menuItems, null, 2)}</textarea></div>
          </section>

          <section class="settings-card">
            <h2>Home principal</h2>
            <div class="form-group"><label>Título principal</label><input id="cfg-hero-title" value="${home.heroTitle || ''}"></div>
            <div class="form-group"><label>Descrição principal</label><textarea id="cfg-hero-description">${home.heroDescription || ''}</textarea></div>
            <div class="form-row">
              <div class="form-group"><label>Botão 1 texto</label><input id="cfg-primary-label" value="${home.primaryButtonLabel || ''}"></div>
              <div class="form-group"><label>Botão 1 rota</label><input id="cfg-primary-route" value="${home.primaryButtonRoute || ''}"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Botão 2 texto</label><input id="cfg-secondary-label" value="${home.secondaryButtonLabel || ''}"></div>
              <div class="form-group"><label>Botão 2 rota</label><input id="cfg-secondary-route" value="${home.secondaryButtonRoute || ''}"></div>
            </div>
            <div class="form-group"><label>Título da seção</label><input id="cfg-section-title" value="${home.sectionTitle || ''}"></div>
            <div class="form-row">
              <div class="form-group"><label>Card 1 destaque</label><input id="cfg-feature1-title" value="${home.featurePrimaryTitle || ''}"></div>
              <div class="form-group"><label>Card 2 destaque</label><input id="cfg-feature2-title" value="${home.featureSecondaryTitle || ''}"></div>
            </div>
            <div class="form-group"><label>Card 1 texto</label><textarea id="cfg-feature1-text">${home.featurePrimaryText || ''}</textarea></div>
            <div class="form-group"><label>Card 2 texto</label><textarea id="cfg-feature2-text">${home.featureSecondaryText || ''}</textarea></div>
            <div class="form-row">
              <div class="form-group"><label>Rodapé linha 1</label><input id="cfg-footer-line1" value="${home.footerLine1 || ''}"></div>
              <div class="form-group"><label>Rodapé linha 2</label><input id="cfg-footer-line2" value="${home.footerLine2 || ''}"></div>
            </div>
          </section>

          <section class="settings-card">
            <h2>Tema e PWA</h2>
            <div class="form-row">
              <div class="form-group"><label>Cor tema claro</label><input id="cfg-theme-light" value="${theme.themeColorLight || ''}" placeholder="#4f46e5"></div>
              <div class="form-group"><label>Cor tema escuro</label><input id="cfg-theme-dark" value="${theme.themeColorDark || ''}" placeholder="#182132"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Nome do app</label><input id="cfg-pwa-name" value="${theme.pwaName || ''}"></div>
              <div class="form-group"><label>Nome curto do app</label><input id="cfg-pwa-short-name" value="${theme.pwaShortName || ''}"></div>
            </div>
          </section>
        </div>`;

        document.getElementById('btn-settings-reload').addEventListener('click', loadConfiguracoes);
        document.getElementById('btn-settings-save').addEventListener('click', async () => {
            const btn = document.getElementById('btn-settings-save');
            btn.disabled = true;
            btn.textContent = 'Salvando...';

            try {
                const payload = adminSettingsPayloadFromForm();
                await api('PUT', '/settings', payload);
                toast('Configurações salvas com sucesso!', 'success');
            } catch (err) {
                toast(err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Salvar configurações';
            }
        });
    } catch (e) {
        content.innerHTML = `<p style="color:var(--danger)">Erro: ${e.message}</p>`;
    }
}

// ============================================================
// Modal helper
// ============================================================
function openModal(html) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-overlay" onclick="e => e.target===this && closeModal()">
        <div class="modal">${html}</div>
    </div>`;
    root.querySelector('.modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}
function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
}

// ============================================================
// Paginação admin
// ============================================================
function renderAdminPagination(containerId, meta, callback) {
    const pag = document.getElementById(containerId);
    if (!pag || meta.pages <= 1) { if (pag) pag.innerHTML = ''; return; }

    let html = `<button class="page-btn" ${meta.page <= 1 ? 'disabled' : ''} onclick="(${callback})(${meta.page - 1})">‹</button>`;
    for (let i = 1; i <= meta.pages; i++) {
        if (i === 1 || i === meta.pages || Math.abs(i - meta.page) <= 1) {
            html += `<button class="page-btn ${i === meta.page ? 'active' : ''}" onclick="(${callback})(${i})">${i}</button>`;
        } else if (Math.abs(i - meta.page) === 2) {
            html += `<span style="padding:.3rem .4rem;color:var(--text-light)">…</span>`;
        }
    }
    html += `<button class="page-btn" ${meta.page >= meta.pages ? 'disabled' : ''} onclick="(${callback})(${meta.page + 1})">›</button>`;
    pag.innerHTML = html;
}

function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
