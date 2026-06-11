/**
 * Guia Canind&eacute; - App JS Principal
 * SPA (Single Page Application) puro sem frameworks
 * Toda navegacao e feita via hash (#/rota) para funcionar em qualquer hospedagem
 */

// ============================================================
// Configuracao
// ============================================================
const API_BASE = window.API_BASE_URL || '/api';

// ============================================================
// Utilitarios
// ============================================================
async function api(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + path, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
}

async function apiUpload(formData, token = null) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/companies/upload-logo`, { method: 'POST', headers, body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro no upload');
    return data;
}

// Toast de notificacoes
function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

// Renderiza estrelas
function renderStars(avg, total) {
    if (!avg) return '<span style="color:var(--text-light);font-size:.8rem">Sem avalia&ccedil;&otilde;es</span>';
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="${i <= Math.round(avg) ? 'star' : 'star-empty'}">&#9733;</span>`;
    }
    return `<div class="company-stars">${stars}<span class="rating-count">(${total})</span></div>`;
}

// Logo da empresa
function companyLogoHTML(company) {
    if (company.logo) {
        return `<img class="company-logo" src="${company.logo}" alt="${company.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="company-logo-placeholder" style="display:none">${company.name.charAt(0)}</div>`;
    }
    return `<div class="company-logo-placeholder">${company.name.charAt(0)}</div>`;
}

// Formata numero de WhatsApp para link
function whatsappLink(number) {
    const digits = number.replace(/\D/g, '');
    const full = digits.startsWith('55') ? digits : '55' + digits;
    return `https://wa.me/${full}`;
}

// Token de autenticacao
function getToken() { return localStorage.getItem('gc_token'); }
function setToken(t) { localStorage.setItem('gc_token', t); }
function removeToken() { localStorage.removeItem('gc_token'); localStorage.removeItem('gc_user'); }
function setUser(u) { localStorage.setItem('gc_user', JSON.stringify(u)); }
function getUser() { try { return JSON.parse(localStorage.getItem('gc_user')); } catch { return null; } }

// ============================================================
// Roteador SPA (hash-based)
// ============================================================
const routes = {
    '/':             renderHome,
    '/categorias':   renderCategorias,
    '/buscar':       renderBuscar,
    '/cadastrar':    renderCadastrar,
    '/empresa-login':renderEmpresaLogin,
};

function getRoute() {
    const hash = location.hash.replace('#', '') || '/';
    return hash.split('?')[0];
}

function getQuery() {
    const hash = location.hash;
    const q = hash.includes('?') ? hash.split('?')[1] : '';
    return Object.fromEntries(new URLSearchParams(q));
}

function navigate(path) {
    location.hash = path;
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

function router() {
    const path = getRoute();
    const handler = routes[path];
    const app = document.getElementById('app');

    if (handler) {
        handler(app);
    } else {
        app.innerHTML = `<div class="page-section container"><div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
            <p>P&aacute;gina n&atilde;o encontrada</p>
        </div></div>`;
    }
    updateNavActive();
}

function updateNavActive() {
    const path = getRoute();
    document.querySelectorAll('.navbar-links a[data-route]').forEach(a => {
        a.classList.toggle('active', a.dataset.route === path);
    });
}

// ============================================================
// Navbar
// ============================================================
function renderNavbar() {
    const user = getUser();
    return `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-brand">
          <img src="/ICONETESTE.png" alt="Guia Canind&eacute;">
          Guia Canind&eacute;
        </a>
        <ul class="navbar-links">
          <li><a href="#/" data-route="/"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><span>In&iacute;cio</span></a></li>
          <li><a href="#/categorias" data-route="/categorias"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg><span>Categorias</span></a></li>
          <li><a href="#/buscar" data-route="/buscar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><span>Buscar</span></a></li>
          <li><a href="#/empresa-login" data-route="/empresa-login"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><span>Login da Empresa</span></a></li>
          <li><a href="#/cadastrar" class="btn-cadastrar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> Cadastrar Neg&oacute;cio</a></li>
          <li><button class="btn-instalar" id="btn-pwa" style="display:none"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Instalar App</button></li>
        </ul>
      </div>
    </nav>`;
}

// ============================================================
// HOME
// ============================================================
async function renderHome(app) {
    app.innerHTML = `
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <h1>Encontre tudo em Canind&eacute;</h1>
          <p>Conecte-se diretamente com empresas e profissionais da sua cidade. R&aacute;pido, f&aacute;cil e gratuito!</p>
          <div class="hero-btns">
            <a href="#/buscar" class="btn-hero-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              O que est&aacute; buscando?
            </a>
            <a href="#/cadastrar" class="btn-hero-cadastrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
              Cadastrar Meu Neg&oacute;cio
            </a>
          </div>
        </div>
        <div class="hero-logo">
          <img class="hero-logo-light" src="/LOGO-BG.png" alt="Guia Canind&eacute;" onerror="this.src='/ICONETESTE.png'">
          <img class="hero-logo-dark" src="/LOGO-BR.png" alt="Guia Canind&eacute;" onerror="this.src='/ICONETESTE.png'">
        </div>
      </div>
    </div>
    <section class="como-funciona">
      <h2>Como funciona?</h2>
      <div class="cards-como">
        <div class="card-como">
          <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
          <p><strong>100% gratuito!</strong> Conecte-se diretamente pelo WhatsApp com empresas e profissionais.</p>
        </div>
        <div class="card-como">
          <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg></div>
          <p>Encontre servi&ccedil;os pr&oacute;ximos a voc&ecirc;: pizzarias, encanadores, cabeleireiros e muito mais!</p>
        </div>
      </div>
      <p style="margin-top:2rem;color:var(--text-light);font-size:.9rem">Encontre o que precisa em Canind&eacute; - R&aacute;pido, f&aacute;cil e direto no WhatsApp</p>
    </section>`;
}

// ============================================================
// CATEGORIAS
// ============================================================
async function renderCategorias(app) {
    app.innerHTML = `<div class="page-section container">
        <h1 class="page-title">Categorias</h1>
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" id="cat-search" placeholder="Buscar categorias...">
        </div>
        <div id="categories-grid" class="categories-grid">
          <p style="color:var(--text-light)">Carregando...</p>
        </div>
    </div>`;

    try {
        const data = await api('GET', '/categories');
        renderCatGrid(data);

        document.getElementById('cat-search').addEventListener('input', e => {
            const q = e.target.value.toLowerCase();
            const filtered = data.filter(c => c.name.toLowerCase().includes(q));
            renderCatGrid(filtered);
        });
    } catch (e) {
        document.getElementById('categories-grid').innerHTML = `<p style="color:var(--danger)">${e.message}</p>`;
    }
}

function renderCatGrid(cats) {
    const grid = document.getElementById('categories-grid');
    if (!cats.length) {
        grid.innerHTML = '<div class="empty-state"><p>Nenhuma categoria encontrada</p></div>';
        return;
    }
    grid.innerHTML = cats.map(c => `
        <a class="category-card" href="#/buscar?category=${c.id}&catName=${encodeURIComponent(c.name)}">
          <div class="cat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
          </div>
          <div>
            <div class="cat-name">${c.name}</div>
            <div class="cat-count">${c.companyCount || 0} empresa${(c.companyCount || 0) !== 1 ? 's' : ''}</div>
          </div>
        </a>`).join('');
}

// ============================================================
// BUSCAR
// ============================================================
let currentPage = 1;
let currentSearch = '';
let currentCategory = '';

async function renderBuscar(app) {
    const query = getQuery();
    currentSearch   = query.search   || '';
    currentCategory = query.category || '';
    const catName   = query.catName  || '';

    app.innerHTML = `<div class="page-section container">
        <h1 class="buscar-title" style="font-size:1.5rem;font-weight:700;margin-bottom:1.25rem">
          ${catName ? catName : 'Buscar Empresas'}
        </h1>
        <div class="search-full">
          <div class="search-full-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" id="search-input" placeholder="Digite o nome da empresa ou endere&ccedil;o..." value="${currentSearch}">
          </div>
        </div>
        <div id="companies-list"><p style="color:var(--text-light)">Carregando...</p></div>
        <div id="pagination" class="pagination"></div>
    </div>`;

    currentPage = 1;
    await loadCompanies();

    document.getElementById('search-input').addEventListener('input', debounce(async e => {
        currentSearch = e.target.value;
        currentPage   = 1;
        await loadCompanies();
    }, 400));
}

async function loadCompanies() {
    const list = document.getElementById('companies-list');
    list.innerHTML = '<p style="color:var(--text-light)">Carregando...</p>';

    try {
        const params = new URLSearchParams({ page: currentPage, limit: 20 });
        if (currentSearch)   params.set('search',   currentSearch);
        if (currentCategory) params.set('category', currentCategory);

        const data = await api('GET', `/companies?${params}`);
        renderCompaniesList(data.data);
        renderPagination(data.meta);
    } catch (e) {
        list.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`;
    }
}

function renderCompaniesList(companies) {
    const list = document.getElementById('companies-list');
    if (!companies.length) {
        list.innerHTML = `<div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <p>Nenhuma empresa encontrada</p>
        </div>`;
        return;
    }
    list.innerHTML = `<div class="companies-grid">${companies.map(c => `
        <div class="company-card">
          ${companyLogoHTML(c)}
          <div class="company-info">
            <div class="company-name">${c.name}</div>
            <div class="company-category">${c.categoryName || ''}</div>
            ${renderStars(c.avgRating, c.totalRatings)}
            <div class="company-address">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${c.address}
            </div>
            <div class="company-actions">
              <a class="btn-whatsapp" href="${whatsappLink(c.whatsapp)}" target="_blank" rel="noopener">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.309A9.959 9.959 0 0012 22c5.522 0 10-4.477 10-10S17.522 2 12 2z" fill-rule="evenodd" clip-rule="evenodd"/></svg>
                WhatsApp
              </a>
              <button class="btn-share" onclick="shareCompany('${c.name}', '${c.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Compartilhar
              </button>
            </div>
          </div>
        </div>`).join('')}
    </div>`;
}

function renderPagination(meta) {
    const pag = document.getElementById('pagination');
    if (meta.pages <= 1) { pag.innerHTML = ''; return; }

    let html = `<button class="page-btn" onclick="goPage(${meta.page - 1})" ${meta.page <= 1 ? 'disabled' : ''}>&lsaquo;</button>`;
    for (let i = 1; i <= meta.pages; i++) {
        if (i === 1 || i === meta.pages || Math.abs(i - meta.page) <= 2) {
            html += `<button class="page-btn ${i === meta.page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
        } else if (Math.abs(i - meta.page) === 3) {
            html += `<span style="padding:.45rem .5rem;color:var(--text-light)">&hellip;</span>`;
        }
    }
    html += `<button class="page-btn" onclick="goPage(${meta.page + 1})" ${meta.page >= meta.pages ? 'disabled' : ''}>&rsaquo;</button>`;
    pag.innerHTML = html;
}

async function goPage(p) {
    currentPage = p;
    await loadCompanies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shareCompany(name, id) {
    const url = `${location.origin}${location.pathname}#/buscar?search=${encodeURIComponent(name)}`;
    if (navigator.share) {
        navigator.share({ title: name, url });
    } else {
        navigator.clipboard.writeText(url).then(() => toast('Link copiado!', 'success'));
    }
}

// ============================================================
// CADASTRAR EMPRESA
// ============================================================
async function renderCadastrar(app) {
    app.innerHTML = `<div class="page-section">
      <div class="cadastro-form">
        <h1>Cadastrar Meu Neg&oacute;cio</h1>
        <div class="form-group">
          <label>Logo da Empresa (Opcional)</label>
          <div class="logo-upload" id="logo-drop" onclick="document.getElementById('logo-file').click()">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-light);margin:0 auto;display:block"><path d="M12 4v16m8-8H4"/></svg>
            <p>Clique para adicionar logo</p>
            <div id="logo-preview"></div>
          </div>
          <input type="file" id="logo-file" accept="image/*" style="display:none">
        </div>
        <div class="form-group">
          <label>Nome da Empresa *</label>
          <input type="text" id="f-name" placeholder="Ex: Padaria S&atilde;o Jos&eacute;">
        </div>
        <div class="form-group">
          <label>Descri&ccedil;&atilde;o (Opcional)</label>
          <textarea id="f-desc" maxlength="300" placeholder="Descreva seu neg&oacute;cio em at&eacute; 300 caracteres"></textarea>
          <div class="char-count"><span id="char-count">0</span>/300 caracteres</div>
        </div>
        <div class="form-group">
          <label>WhatsApp *</label>
          <input type="text" id="f-whatsapp" placeholder="(85) 99999-9999">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Rua *</label>
            <input type="text" id="f-rua" placeholder="Ex: Rua Principal">
          </div>
          <div class="form-group">
            <label>N&uacute;mero</label>
            <input type="text" id="f-numero" placeholder="Ex: 123">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Bairro</label>
            <input type="text" id="f-bairro" placeholder="Ex: Centro">
          </div>
          <div class="form-group">
            <label>Categoria *</label>
            <select id="f-category">
              <option value="">Carregando...</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Email (Opcional)</label>
          <input type="email" id="f-email" placeholder="contato@empresa.com">
        </div>
        <div class="form-group">
          <label>Senha para acesso (Opcional)</label>
          <input type="password" id="f-password" placeholder="M&iacute;nimo 6 caracteres">
        </div>
        <button class="btn-submit" id="btn-cadastrar">Cadastrar Neg&oacute;cio</button>
      </div>
    </div>`;

    // Carrega categorias
    try {
        const cats = await api('GET', '/categories');
        const sel = document.getElementById('f-category');
        sel.innerHTML = '<option value="">Selecione a categoria</option>' +
            cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (e) { toast('Erro ao carregar categorias', 'error'); }

    // Contador de caracteres
    document.getElementById('f-desc').addEventListener('input', e => {
        document.getElementById('char-count').textContent = e.target.value.length;
    });

    // Preview de logo
    let logoUrl = null;
    document.getElementById('logo-file').addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = document.getElementById('logo-preview');
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="max-width:120px;border-radius:8px;margin-top:.75rem">`;

        // Upload imediato
        try {
            const fd = new FormData();
            fd.append('logo', file);
            const res = await apiUpload(fd);
            logoUrl = res.url;
            toast('Logo enviada!', 'success');
        } catch (err) {
            toast('Erro no upload: ' + err.message, 'error');
            logoUrl = null;
        }
    });

    // Submit
    document.getElementById('btn-cadastrar').addEventListener('click', async () => {
        const name     = document.getElementById('f-name').value.trim();
        const whatsapp = document.getElementById('f-whatsapp').value.trim();
        const rua      = document.getElementById('f-rua').value.trim();
        const numero   = document.getElementById('f-numero').value.trim();
        const bairro   = document.getElementById('f-bairro').value.trim();
        const catId    = document.getElementById('f-category').value;
        const desc     = document.getElementById('f-desc').value.trim();
        const email    = document.getElementById('f-email').value.trim();
        const password = document.getElementById('f-password').value;

        if (!name || !whatsapp || !rua || !catId) {
            toast('Preencha todos os campos obrigat&oacute;rios (*)', 'error');
            return;
        }

        const address = [rua, numero, bairro, 'Canind&eacute; - CE'].filter(Boolean).join(', ');

        const btn = document.getElementById('btn-cadastrar');
        btn.disabled = true;
        btn.textContent = 'Cadastrando...';

        try {
            await api('POST', '/companies', {
                name, whatsapp, address, categoryId: catId,
                description: desc || null,
                email: email || null,
                password: password || null,
                logo: logoUrl || null,
            });
            toast('Neg&oacute;cio cadastrado com sucesso!', 'success');
            setTimeout(() => navigate('/buscar'), 1500);
        } catch (err) {
            toast('Erro: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Cadastrar Neg&oacute;cio';
        }
    });
}

// ============================================================
// LOGIN EMPRESA
// ============================================================
async function renderEmpresaLogin(app) {
    app.innerHTML = `<div class="login-page">
      <div class="login-card">
        <div class="icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
        </div>
        <h1>Acesso para Empresas</h1>
        <p>Fa&ccedil;a login para acessar sua &aacute;rea administrativa</p>
        <div class="form-group" style="text-align:left">
          <label>Email</label>
          <input type="email" id="l-email" placeholder="seu@email.com">
        </div>
        <div class="form-group" style="text-align:left">
          <label>Senha</label>
          <input type="password" id="l-senha" placeholder="••••••">
        </div>
        <button class="btn-submit" id="btn-login">Entrar</button>
        <div class="divider">ou</div>
        <a href="#/" class="btn-voltar">Voltar para o site</a>
      </div>
    </div>`;

    document.getElementById('btn-login').addEventListener('click', async () => {
        const email = document.getElementById('l-email').value.trim();
        const senha = document.getElementById('l-senha').value;
        if (!email || !senha) { toast('Preencha email e senha', 'error'); return; }

        const btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.textContent = 'Entrando...';

        try {
            const res = await api('POST', '/auth/company/login', { email, password: senha });
            setToken(res.token);
            setUser(res.company);
            toast('Login realizado!', 'success');
            navigate('/');
        } catch (e) {
            toast(e.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });

    // Enter para submeter
    ['l-email','l-senha'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('btn-login').click();
        });
    });
}

// ============================================================
// PWA Install
// ============================================================
let deferredPrompt;
const THEME_COLORS = {
    light: '#4f46e5',
    dark: '#182132'
};

function setInstallButtonsVisible(visible) {
    ['btn-pwa', 'btn-pwa-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? 'flex' : 'none';
    });
}

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIosDevice() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function updateThemeColorMeta() {
    const meta = document.getElementById('theme-color-meta');
    if (!meta) return;
    const dark = document.documentElement.classList.contains('dark');
    meta.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        });
    }
}

function syncInstallUi() {
    const shouldShow = !isStandaloneMode() && (Boolean(deferredPrompt) || isIosDevice());
    setInstallButtonsVisible(shouldShow);
}

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    syncInstallUi();
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    syncInstallUi();
});

document.addEventListener('click', e => {
    if (!(e.target.closest('#btn-pwa') || e.target.closest('#btn-pwa-mobile'))) return;

    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
            syncInstallUi();
        });
        return;
    }

    if (isIosDevice() && !isStandaloneMode()) {
        toast('No iPhone/iPad, use Compartilhar > Adicionar a Tela de Inicio.', 'info');
    }
});

// ============================================================
// Dark Mode
// ============================================================
function initDarkMode() {
    const saved = localStorage.getItem('gc_dark');
    if (saved === '1') document.documentElement.classList.add('dark');
    updateThemeColorMeta();
}
initDarkMode();
registerServiceWorker();
syncInstallUi();

document.addEventListener('click', e => {
    if (e.target.closest('#dark-toggle')) {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('gc_dark', isDark ? '1' : '0');
        updateThemeColorMeta();
    }
});

// ============================================================
// Utils
// ============================================================
function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

