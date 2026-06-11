/**
 * Guia Canind&eacute; - App JS Principal
 * SPA (Single Page Application) puro sem frameworks
 * Toda navegacao e feita via hash (#/rota) para funcionar em qualquer hospedagem
 */

// ============================================================
// Configuracao
// ============================================================
const API_BASE = window.API_BASE_URL || '/api';
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

let systemSettings = cloneData(DEFAULT_SETTINGS);
let settingsLoaded = false;

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

    if (!res.ok) throw new Error(data.error || data.message || `Erro ${res.status}`);
    return data;
}

async function apiUpload(formData, token = null) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/companies/upload-logo`, { method: 'POST', headers, body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Erro no upload');
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

function renderStaticStars(value) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="${i <= value ? 'star' : 'star-empty'}">&#9733;</span>`;
    }
    return stars;
}

function ratingLabel(value) {
    return ['Pessima', 'Ruim', 'Boa', 'Muito boa', 'Excelente'][value - 1] || '';
}

// Logo da empresa
function companyLogoHTML(company) {
    const logo = normalizePublicAssetUrl(company.logo);
    if (logo) {
        return `<img class="company-logo" src="${logo}" alt="${company.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
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

function getSettings() {
    return systemSettings || DEFAULT_SETTINGS;
}

function decodeHtml(value) {
    const el = document.createElement('textarea');
    el.innerHTML = value || '';
    return el.value;
}

function cloneData(value) {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function getThemeColors() {
    const settings = getSettings();
    return {
        light: settings.theme?.themeColorLight || DEFAULT_SETTINGS.theme.themeColorLight,
        dark: settings.theme?.themeColorDark || DEFAULT_SETTINGS.theme.themeColorDark,
    };
}

function getBrandIcon() {
    return getSettings().branding?.iconUrl || DEFAULT_SETTINGS.branding.iconUrl;
}

function normalizePublicAssetUrl(url) {
    if (!url) return '';
    const raw = String(url).trim();
    if (!raw) return '';
    if (/^https?:\/\/seudominio\.com\.br/i.test(raw)) {
        const suffix = raw.replace(/^https?:\/\/seudominio\.com\.br/i, '');
        return `https://oguiacaninde.online/${suffix.replace(/^\/?/, '')}`;
    }
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/')) return raw;
    if (/^(uploads|public\/uploads)\//i.test(raw)) {
        return `https://oguiacaninde.online/${raw.replace(/^public\//i, '')}`;
    }
    return raw;
}

function buildWhatsAppHref(number, message = '') {
    const digits = String(number || '').replace(/\D/g, '');
    if (!digits) return '#';
    const full = digits.startsWith('55') ? digits : `55${digits}`;
    const query = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${full}${query}`;
}

function companyPageUrl(companyId) {
    return `${location.origin}${location.pathname}#/empresa?id=${encodeURIComponent(companyId)}`;
}

function companyMapUrl(company) {
    const query = encodeURIComponent([company.name, company.address].filter(Boolean).join(' - '));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function updateMetaTag(selector, value) {
    const el = document.querySelector(selector);
    if (el && value) {
        el.setAttribute('content', value);
    }
}

function applyCompanyMeta(company) {
    const title = `${company.name} - ${company.categoryName || 'Empresa'} | Guia Canindé`;
    const description = company.description || company.address || `Veja a página da empresa ${company.name} no Guia Canindé.`;
    const image = normalizePublicAssetUrl(company.logo) || getBrandIcon();

    document.title = title;
    updateMetaTag('meta[name="description"]', description);
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:image"]', image);
    updateMetaTag('meta[property="og:image:alt"]', company.name);
    updateMetaTag('meta[name="twitter:title"]', title);
    updateMetaTag('meta[name="twitter:description"]', description);
    updateMetaTag('meta[name="twitter:image"]', image);
}

function menuIcon(iconName) {
    const icons = {
        home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
        grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
        search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
        building: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01"/><path d="M9 13h.01"/><path d="M9 17h.01"/></svg>',
        briefcase: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
        settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.96 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.2 16.92l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.4a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.08 3.64l.06.06A1.7 1.7 0 0 0 9 4.04a1.7 1.7 0 0 0 1.04-1.56V2a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.87-.34l.06-.06A2 2 0 0 1 19.76 7.08l-.06.06A1.7 1.7 0 0 0 19.36 9c0 .68.4 1.3 1.04 1.56H21a2 2 0 0 1 0 4h-.09c-.64.26-1.04.88-1.51 1.44Z"/></svg>',
    };
    return icons[iconName] || icons.grid;
}

function renderNavLink(item) {
    const route = item.route || '/';
    const attrs = route.startsWith('http')
        ? `href="${route}" target="_blank" rel="noopener"`
        : `href="#${route}" data-route="${route}"`;
    const className = item.highlight ? 'btn-cadastrar' : '';
    return `<li><a ${attrs} class="${className}">${menuIcon(item.icon)}<span>${item.label || ''}</span></a></li>`;
}

function applySiteSettings() {
    const settings = getSettings();
    const branding = settings.branding || {};
    const contact = settings.contact || {};
    const home = settings.home || {};
    const theme = settings.theme || {};

    document.title = decodeHtml(branding.siteTitle || DEFAULT_SETTINGS.branding.siteTitle);

    const metaMap = [
        ['meta[name="application-name"]', branding.siteName],
        ['meta[name="description"]', branding.siteDescription],
        ['meta[name="apple-mobile-web-app-title"]', theme.pwaName || branding.siteName],
        ['meta[property="og:title"]', branding.siteTitle],
        ['meta[property="og:description"]', branding.siteDescription],
        ['meta[property="og:image"]', branding.ogImageUrl || branding.iconUrl],
        ['meta[property="og:image:alt"]', branding.siteName],
        ['meta[property="og:site_name"]', branding.siteName],
        ['meta[name="twitter:title"]', branding.siteTitle],
        ['meta[name="twitter:description"]', branding.siteDescription],
        ['meta[name="twitter:image"]', branding.ogImageUrl || branding.iconUrl],
    ];
    metaMap.forEach(([selector, value]) => {
        const el = document.querySelector(selector);
        if (el && value) el.setAttribute('content', decodeHtml(value));
    });

    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(link => {
        link.setAttribute('href', branding.iconUrl || DEFAULT_SETTINGS.branding.iconUrl);
    });

    const whatsapp = document.getElementById('floating-whatsapp');
    if (whatsapp) {
        whatsapp.href = buildWhatsAppHref(contact.whatsappNumber, contact.whatsappMessage);
        whatsapp.title = contact.whatsappButtonTitle || DEFAULT_SETTINGS.contact.whatsappButtonTitle;
        whatsapp.setAttribute('aria-label', whatsapp.title);
    }

    const footer = document.getElementById('site-footer');
    if (footer) {
        footer.innerHTML = `<p>${home.footerLine1 || DEFAULT_SETTINGS.home.footerLine1}</p><p>${home.footerLine2 || DEFAULT_SETTINGS.home.footerLine2}</p>`;
    }

    const navbarRoot = document.getElementById('navbar-root');
    if (navbarRoot) {
        navbarRoot.innerHTML = renderNavbar();
        updateNavActive();
    }

    updateThemeColorMeta();
}

async function ensureSettingsLoaded(force = false) {
    if (settingsLoaded && !force) return systemSettings;
    try {
        const remote = await api('GET', '/settings');
        systemSettings = deepMerge(cloneData(DEFAULT_SETTINGS), remote || {});
    } catch {
        systemSettings = cloneData(DEFAULT_SETTINGS);
    }
    settingsLoaded = true;
    applySiteSettings();
    return systemSettings;
}

// ============================================================
// Roteador SPA (hash-based)
// ============================================================
const routes = {
    '/':             renderHome,
    '/categorias':   renderCategorias,
    '/buscar':       renderBuscar,
    '/empresa':      renderEmpresaDetalhe,
    '/cadastrar':    renderCadastrar,
    '/empresa-login':renderEmpresaLogin,
    '/admin-login':  renderAdminLogin,
    '/admin-config': renderAdminConfig,
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

window.addEventListener('hashchange', () => { router(); });
window.addEventListener('load', async () => {
    await ensureSettingsLoaded();
    router();
});

async function router() {
    await ensureSettingsLoaded();
    applySiteSettings();
    const path = getRoute();
    const handler = routes[path];
    const app = document.getElementById('app');

    if (handler) {
        await handler(app);
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
    const settings = getSettings();
    const branding = settings.branding || {};
    const menuItems = (settings.navigation?.menuItems || DEFAULT_SETTINGS.navigation.menuItems).filter(item => item && item.visible !== false);
    const isAdminSession = getUser()?.role === 'admin';
    const adminLink = isAdminSession
        ? `<li><a href="#/admin-config" data-route="/admin-config">${menuIcon('settings')}<span>Painel Admin</span></a></li>`
        : `<li><a href="#/admin-login" data-route="/admin-login">${menuIcon('settings')}<span>Admin</span></a></li>`;

    return `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-brand">
          <img src="${branding.iconUrl || DEFAULT_SETTINGS.branding.iconUrl}" alt="${branding.siteName || DEFAULT_SETTINGS.branding.siteName}">
          ${branding.siteName || DEFAULT_SETTINGS.branding.siteName}
        </a>
        <ul class="navbar-links">
          ${menuItems.map(renderNavLink).join('')}
          ${adminLink}
          <li><button class="btn-instalar" id="btn-pwa" style="display:none"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Instalar App</button></li>
        </ul>
      </div>
    </nav>`;
}

// ============================================================
// HOME
// ============================================================
async function renderHome(app) {
    const settings = getSettings();
    const branding = settings.branding || {};
    const home = settings.home || {};
    app.innerHTML = `
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <h1>${home.heroTitle || DEFAULT_SETTINGS.home.heroTitle}</h1>
          <p>${home.heroDescription || DEFAULT_SETTINGS.home.heroDescription}</p>
          <div class="hero-btns">
            <a href="#${home.primaryButtonRoute || DEFAULT_SETTINGS.home.primaryButtonRoute}" class="btn-hero-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              ${home.primaryButtonLabel || DEFAULT_SETTINGS.home.primaryButtonLabel}
            </a>
            <a href="#${home.secondaryButtonRoute || DEFAULT_SETTINGS.home.secondaryButtonRoute}" class="btn-hero-cadastrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
              ${home.secondaryButtonLabel || DEFAULT_SETTINGS.home.secondaryButtonLabel}
            </a>
          </div>
        </div>
        <div class="hero-logo">
          <img class="hero-logo-light" src="${branding.logoLightUrl || DEFAULT_SETTINGS.branding.logoLightUrl}" alt="${branding.siteName || DEFAULT_SETTINGS.branding.siteName}" onerror="this.src='${branding.iconUrl || DEFAULT_SETTINGS.branding.iconUrl}'">
          <img class="hero-logo-dark" src="${branding.logoDarkUrl || DEFAULT_SETTINGS.branding.logoDarkUrl}" alt="${branding.siteName || DEFAULT_SETTINGS.branding.siteName}" onerror="this.src='${branding.iconUrl || DEFAULT_SETTINGS.branding.iconUrl}'">
        </div>
      </div>
    </div>
    <section class="como-funciona">
      <h2>${home.sectionTitle || DEFAULT_SETTINGS.home.sectionTitle}</h2>
      <div class="cards-como">
        <div class="card-como">
          <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
          <p><strong>${home.featurePrimaryTitle || DEFAULT_SETTINGS.home.featurePrimaryTitle}</strong> ${home.featurePrimaryText || DEFAULT_SETTINGS.home.featurePrimaryText}</p>
        </div>
        <div class="card-como">
          <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg></div>
          <p><strong>${home.featureSecondaryTitle || DEFAULT_SETTINGS.home.featureSecondaryTitle}</strong> ${home.featureSecondaryText || DEFAULT_SETTINGS.home.featureSecondaryText}</p>
        </div>
      </div>
      <p style="margin-top:2rem;color:var(--text-light);font-size:.9rem">${home.footerLine1 || DEFAULT_SETTINGS.home.footerLine1} - ${home.footerLine2 || DEFAULT_SETTINGS.home.footerLine2}</p>
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
let currentSort = 'rating';

async function renderBuscar(app) {
    const query = getQuery();
    currentSearch   = query.search   || '';
    currentCategory = query.category || '';
    currentSort     = query.sort     || 'rating';
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
          <div class="search-sort-wrap">
            <select id="search-sort">
              <option value="rating" ${currentSort === 'rating' ? 'selected' : ''}>Melhor avaliadas</option>
              <option value="recent" ${currentSort === 'recent' ? 'selected' : ''}>Mais recentes</option>
            </select>
          </div>
        </div>
        <div id="ranking-highlight"></div>
        <div id="companies-list"><p style="color:var(--text-light)">Carregando...</p></div>
        <div id="pagination" class="pagination"></div>
    </div>`;

    currentPage = 1;
    await loadCompanies();
    await loadRankingHighlight();

    document.getElementById('search-input').addEventListener('input', debounce(async e => {
        currentSearch = e.target.value;
        currentPage   = 1;
        await loadCompanies();
    }, 400));

    document.getElementById('search-sort').addEventListener('change', async e => {
        currentSort = e.target.value;
        currentPage = 1;
        await loadCompanies();
    });
}

async function loadCompanies() {
    const list = document.getElementById('companies-list');
    list.innerHTML = '<p style="color:var(--text-light)">Carregando...</p>';

    try {
        const params = new URLSearchParams({ page: currentPage, limit: 20 });
        if (currentSearch)   params.set('search',   currentSearch);
        if (currentCategory) params.set('category', currentCategory);
        if (currentSort)     params.set('sort',     currentSort);

        const data = await api('GET', `/companies?${params}`);
        renderCompaniesList(data.data);
        renderPagination(data.meta);
        await loadRankingHighlight();
    } catch (e) {
        list.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`;
    }
}

async function loadRankingHighlight() {
    const root = document.getElementById('ranking-highlight');
    if (!root) return;

    if (currentSearch || currentCategory) {
        root.innerHTML = '';
        return;
    }

    try {
        const data = await api('GET', '/ratings/top-rated?limit=3');
        const companies = data.data || [];

        if (!companies.length) {
            root.innerHTML = '';
            return;
        }

        root.innerHTML = `
        <section class="ranking-panel">
          <div class="ranking-header">
            <div>
              <p class="ranking-kicker">Ranking</p>
              <h2>Empresas mais bem avaliadas</h2>
            </div>
            <span class="ranking-help">As notas dos clientes definem a ordem.</span>
          </div>
          <div class="ranking-grid">
            ${companies.map(company => `
              <a class="ranking-card" href="#/empresa?id=${company.id}">
                <span class="ranking-position">#${company.position}</span>
                <div class="ranking-logo">${companyLogoHTML(company)}</div>
                <div class="ranking-copy">
                  <strong>${company.name}</strong>
                  <span>${company.categoryName || 'Empresa cadastrada'}</span>
                  <div class="ranking-stars">${renderStars(company.avgRating, company.totalRatings)}</div>
                </div>
              </a>
            `).join('')}
          </div>
        </section>`;
    } catch {
        root.innerHTML = '';
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
          <a class="company-card-main" href="#/empresa?id=${c.id}">
            ${companyLogoHTML(c)}
          </a>
          <div class="company-info">
            <a class="company-name company-link" href="#/empresa?id=${c.id}">${c.name}</a>
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
              <button class="btn-share" onclick="shareCompanyFromEncoded('${encodeURIComponent(JSON.stringify(c))}')">
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

function shareCompany(company) {
    const url = companyPageUrl(company.id);
    const text = company.description || company.address || `Veja ${company.name} no Guia Canindé`;
    if (navigator.share) {
        navigator.share({ title: company.name, text, url });
    } else {
        navigator.clipboard.writeText(url).then(() => toast('Link copiado!', 'success'));
    }
}

function shareCompanyFromEncoded(encoded) {
    shareCompany(JSON.parse(decodeURIComponent(encoded)));
}

async function renderEmpresaDetalhe(app) {
    const query = getQuery();
    const companyId = query.id || '';

    if (!companyId) {
        app.innerHTML = `<div class="page-section container"><div class="empty-state"><p>Empresa não informada.</p></div></div>`;
        return;
    }

    app.innerHTML = `<div class="page-section container"><p style="color:var(--text-light)">Carregando empresa...</p></div>`;

    try {
        const [company, ratingsData] = await Promise.all([
            api('GET', `/companies/${companyId}`),
            api('GET', `/ratings/${companyId}`).catch(() => ({ ratings: [], summary: null })),
        ]);
        applyCompanyMeta(company);
        const recentRatings = ratingsData.ratings || [];
        const ratingSummary = ratingsData.summary || {
            avgRating: Number(company.avgRating || 0),
            totalRatings: Number(company.totalRatings || 0),
        };
        const ratingStorageKey = `gc_rated_${company.id}`;
        const alreadyRated = localStorage.getItem(ratingStorageKey) === '1';

        const logo = normalizePublicAssetUrl(company.logo) || getBrandIcon();
        const shareUrl = companyPageUrl(company.id);
        const shareText = company.description || company.address || `Veja ${company.name} no Guia Canindé`;
        const socialLinks = [
            company.instagram ? `<a class="company-social-link" href="${company.instagram.startsWith('http') ? company.instagram : `https://instagram.com/${company.instagram.replace(/^@/, '')}`}" target="_blank" rel="noopener"><span>Instagram</span><strong>Seguir no Instagram</strong></a>` : '',
            company.facebook ? `<a class="company-social-link" href="${company.facebook.startsWith('http') ? company.facebook : `https://facebook.com/${company.facebook.replace(/^@/, '')}`}" target="_blank" rel="noopener"><span>Facebook</span><strong>Abrir página no Facebook</strong></a>` : '',
            company.website ? `<a class="company-social-link" href="${company.website.startsWith('http') ? company.website : `https://${company.website}`}" target="_blank" rel="noopener"><span>Website</span><strong>Visitar site oficial</strong></a>` : '',
            company.youtube ? `<a class="company-social-link" href="${company.youtube.startsWith('http') ? company.youtube : `https://${company.youtube}`}" target="_blank" rel="noopener"><span>YouTube</span><strong>Assistir no YouTube</strong></a>` : '',
        ].filter(Boolean).join('');

        app.innerHTML = `
        <section class="company-page-shell">
          <div class="company-page-card">
            <a class="company-back-link" href="#/buscar?search=${encodeURIComponent(company.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
              Voltar para resultados
            </a>

            <div class="company-hero-band"></div>

            <div class="company-profile">
              <div class="company-profile-logo-wrap">
                <img class="company-profile-logo" src="${logo}" alt="${company.name}" onerror="this.src='${getBrandIcon()}'">
              </div>

              <div class="company-profile-main">
                <div class="company-profile-grid">
                  <div class="company-profile-copy">
                    <h1>${company.name}</h1>
                    <p class="company-profile-category">${company.categoryName || 'Empresa cadastrada'}</p>
                    <p class="company-profile-description">${company.description || 'Conecte-se com esta empresa diretamente pelo WhatsApp e veja suas informações completas.'}</p>

                    <div class="company-profile-rating">
                      ${renderStars(ratingSummary.avgRating, ratingSummary.totalRatings)}
                      <span>${company.totalRatings ? `${company.totalRatings} avaliação${company.totalRatings > 1 ? 'es' : ''}` : 'Sem avaliações ainda'}</span>
                    </div>
                  </div>

                  <div class="company-profile-actions">
                    <button class="btn-share" onclick="navigator.clipboard.writeText('${company.whatsapp || ''}').then(() => toast('Número copiado!', 'success'))">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copiar Número
                    </button>
                    <button class="btn-share" onclick="shareCompanyFromEncoded('${encodeURIComponent(JSON.stringify(company))}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                      Compartilhar
                    </button>
                    <a class="btn-share btn-share-whatsapp" href="${buildWhatsAppHref(company.whatsapp, `${shareText} ${shareUrl}`)}" target="_blank" rel="noopener">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.309A9.959 9.959 0 0012 22c5.522 0 10-4.477 10-10S17.522 2 12 2z"/></svg>
                      Postar em Grupo
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div class="company-section-card">
              <div class="company-section-heading">Localização</div>
              <div class="company-location-row">
                <div class="company-location-copy">
                  <span>Endereço</span>
                  <strong>${company.address}</strong>
                </div>
                <a class="company-map-link" href="${companyMapUrl(company)}" target="_blank" rel="noopener">Ver no Maps</a>
              </div>
            </div>

            <div class="company-section-card">
              <div class="company-section-heading">Avaliar empresa</div>
              <p class="company-rating-help">Sua nota ajuda a destacar as melhores empresas no ranking do Guia Canind&eacute;.</p>
              <div class="rating-form-card ${alreadyRated ? 'is-rated' : ''}">
                <div class="rating-star-input" id="rating-star-input">
                  ${[1, 2, 3, 4, 5].map(value => `
                    <button type="button" class="rating-star-btn" data-rating="${value}" aria-label="${value} estrela${value > 1 ? 's' : ''}">
                      &#9733;
                    </button>
                  `).join('')}
                </div>
                <div class="rating-form-footer">
                  <span id="rating-choice-label">${alreadyRated ? 'Esta empresa j&aacute; foi avaliada neste aparelho.' : 'Escolha de 1 a 5 estrelas.'}</span>
                  <button class="btn-submit rating-submit-btn" id="rating-submit-btn" ${alreadyRated ? 'disabled' : ''}>Enviar avalia&ccedil;&atilde;o</button>
                </div>
              </div>
            </div>

            <div class="company-section-card">
              <div class="company-section-heading">Resumo das avalia&ccedil;&otilde;es</div>
              <div class="rating-summary-grid">
                <div class="rating-summary-box">
                  <strong>${ratingSummary.avgRating ? Number(ratingSummary.avgRating).toFixed(1) : '0.0'}</strong>
                  <span>M&eacute;dia geral</span>
                </div>
                <div class="rating-summary-box">
                  <strong>${ratingSummary.totalRatings || 0}</strong>
                  <span>Total de votos</span>
                </div>
              </div>
              <div class="rating-list">
                ${recentRatings.length ? recentRatings.slice(0, 6).map(rating => `
                  <div class="rating-list-item">
                    <div class="rating-list-stars">${renderStaticStars(rating.stars)}</div>
                    <span>${new Date(rating.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                `).join('') : '<p class="rating-empty">Ainda n&atilde;o h&aacute; avalia&ccedil;&otilde;es registradas. Seja o primeiro a avaliar.</p>'}
              </div>
            </div>

            <a class="company-primary-whatsapp" href="${whatsappLink(company.whatsapp)}" target="_blank" rel="noopener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.309A9.959 9.959 0 0012 22c5.522 0 10-4.477 10-10S17.522 2 12 2z"/></svg>
              WhatsApp
            </a>

            ${socialLinks ? `<div class="company-social-grid">${socialLinks}</div>` : ''}
          </div>
        </section>`;

        const ratingButtons = Array.from(document.querySelectorAll('.rating-star-btn'));
        const submitButton = document.getElementById('rating-submit-btn');
        const choiceLabel = document.getElementById('rating-choice-label');
        let selectedRating = 0;

        const syncRatingButtons = () => {
            ratingButtons.forEach(button => {
                const value = Number(button.dataset.rating || 0);
                button.classList.toggle('is-active', value <= selectedRating);
            });
            if (!alreadyRated && choiceLabel) {
                choiceLabel.textContent = selectedRating
                    ? `${selectedRating} estrela${selectedRating > 1 ? 's' : ''} - ${ratingLabel(selectedRating)}`
                    : 'Escolha de 1 a 5 estrelas.';
            }
        };

        ratingButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (alreadyRated) return;
                selectedRating = Number(button.dataset.rating || 0);
                syncRatingButtons();
            });
        });

        submitButton?.addEventListener('click', async () => {
            if (!selectedRating) {
                toast('Selecione de 1 a 5 estrelas antes de enviar.', 'error');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                await api('POST', '/ratings', { companyId: company.id, stars: selectedRating }, getToken());
                localStorage.setItem(ratingStorageKey, '1');
                toast('Avalia&ccedil;&atilde;o enviada com sucesso!', 'success');
                await renderEmpresaDetalhe(app);
            } catch (err) {
                toast(err.message, 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar avalia&ccedil;&atilde;o';
            }
        });

        syncRatingButtons();
    } catch (err) {
        app.innerHTML = `<div class="page-section container"><div class="empty-state"><p>${err.message}</p></div></div>`;
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
          <label>Foto ou Logo da Empresa (Opcional)</label>
          <div class="logo-upload" id="logo-drop" onclick="document.getElementById('logo-file').click()">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-light);margin:0 auto;display:block"><path d="M12 4v16m8-8H4"/></svg>
            <p>Clique para adicionar foto ou logo</p>
            <small class="logo-help">Formatos aceitos: JPG, PNG, WebP ou GIF at&eacute; 2MB</small>
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
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="max-width:120px;border-radius:8px;margin-top:.75rem"><div class="logo-file-name">${file.name}</div>`;

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

async function renderAdminLogin(app) {
    app.innerHTML = `<div class="login-page">
      <div class="login-card admin-login-card">
        <div class="icon-wrap">
          ${menuIcon('settings')}
        </div>
        <h1>Painel Administrativo</h1>
        <p>Entre com o usu&aacute;rio administrador para editar menus, WhatsApp, logos, textos e identidade visual.</p>
        <div class="form-group" style="text-align:left">
          <label>Usu&aacute;rio</label>
          <input type="text" id="admin-username" placeholder="admin">
        </div>
        <div class="form-group" style="text-align:left">
          <label>Senha</label>
          <input type="password" id="admin-password" placeholder="••••••••">
        </div>
        <button class="btn-submit" id="btn-admin-login">Entrar no painel</button>
      </div>
    </div>`;

    const submit = async () => {
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value;
        if (!username || !password) {
            toast('Informe usu&aacute;rio e senha do admin', 'error');
            return;
        }

        const btn = document.getElementById('btn-admin-login');
        btn.disabled = true;
        btn.textContent = 'Entrando...';

        try {
            const res = await api('POST', '/auth/admin/login', { username, password });
            setToken(res.token);
            setUser({ role: 'admin', username });
            toast('Acesso liberado!', 'success');
            applySiteSettings();
            navigate('/admin-config');
        } catch (err) {
            toast(err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Entrar no painel';
        }
    };

    document.getElementById('btn-admin-login').addEventListener('click', submit);
    ['admin-username', 'admin-password'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') submit();
        });
    });
}

async function renderAdminConfig(app) {
    const token = getToken();
    if (!token) {
        navigate('/admin-login');
        return;
    }

    try {
        await api('GET', '/auth/me', null, token);
    } catch {
        removeToken();
        applySiteSettings();
        navigate('/admin-login');
        return;
    }

    const settings = await api('GET', '/settings/admin', null, token).catch(() => getSettings());
    systemSettings = deepMerge(cloneData(DEFAULT_SETTINGS), settings || {});
    applySiteSettings();

    const branding = systemSettings.branding || {};
    const contact = systemSettings.contact || {};
    const navigation = systemSettings.navigation || {};
    const home = systemSettings.home || {};
    const theme = systemSettings.theme || {};

    app.innerHTML = `<div class="page-section container admin-page">
      <div class="admin-header">
        <div>
          <h1 class="page-title">Configura&ccedil;&otilde;es do Site</h1>
          <p class="admin-subtitle">Tudo que aparece no site principal pode ser ajustado aqui sem editar c&oacute;digo.</p>
        </div>
        <div class="admin-actions">
          <button class="btn-secondary" id="btn-admin-preview">Atualizar visual</button>
          <button class="btn-submit admin-save-btn" id="btn-admin-save">Salvar configura&ccedil;&otilde;es</button>
          <button class="btn-voltar" id="btn-admin-logout" type="button">Sair</button>
        </div>
      </div>

      <div class="admin-grid">
        <section class="admin-card">
          <h2>Marca e SEO</h2>
          <div class="form-group"><label>Nome da marca</label><input id="cfg-site-name" value="${branding.siteName || ''}"></div>
          <div class="form-group"><label>T&iacute;tulo da p&aacute;gina</label><input id="cfg-site-title" value="${branding.siteTitle || ''}"></div>
          <div class="form-group"><label>Descri&ccedil;&atilde;o</label><textarea id="cfg-site-description">${branding.siteDescription || ''}</textarea></div>
          <div class="form-group"><label>&Iacute;cone / favicon</label><input id="cfg-icon-url" value="${branding.iconUrl || ''}" placeholder="/ICONETESTE.png"></div>
          <div class="form-group"><label>Logo tema claro</label><input id="cfg-logo-light" value="${branding.logoLightUrl || ''}" placeholder="/LOGO-BG.png"></div>
          <div class="form-group"><label>Logo tema escuro</label><input id="cfg-logo-dark" value="${branding.logoDarkUrl || ''}" placeholder="/LOGO-BR.png"></div>
          <div class="form-group"><label>Imagem social (OG/Twitter)</label><input id="cfg-og-image" value="${branding.ogImageUrl || ''}"></div>
        </section>

        <section class="admin-card">
          <h2>WhatsApp e contato</h2>
          <div class="form-group"><label>N&uacute;mero do WhatsApp</label><input id="cfg-whatsapp-number" value="${contact.whatsappNumber || ''}" placeholder="5585999999999"></div>
          <div class="form-group"><label>Mensagem autom&aacute;tica</label><textarea id="cfg-whatsapp-message">${contact.whatsappMessage || ''}</textarea></div>
          <div class="form-group"><label>T&iacute;tulo do bot&atilde;o flutuante</label><input id="cfg-whatsapp-title" value="${contact.whatsappButtonTitle || ''}"></div>
        </section>

        <section class="admin-card">
          <h2>Menus</h2>
          <p class="admin-help">Use JSON para controlar r&oacute;tulo, rota, &iacute;cone, destaque e visibilidade. Exemplo: [{"label":"In&iacute;cio","route":"/","icon":"home","visible":true,"highlight":false}]</p>
          <div class="form-group"><label>Itens do menu</label><textarea id="cfg-menu-items" class="code-input">${JSON.stringify(navigation.menuItems || DEFAULT_SETTINGS.navigation.menuItems, null, 2)}</textarea></div>
        </section>

        <section class="admin-card">
          <h2>Home principal</h2>
          <div class="form-group"><label>T&iacute;tulo principal</label><input id="cfg-hero-title" value="${home.heroTitle || ''}"></div>
          <div class="form-group"><label>Descri&ccedil;&atilde;o principal</label><textarea id="cfg-hero-description">${home.heroDescription || ''}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Bot&atilde;o 1 texto</label><input id="cfg-primary-label" value="${home.primaryButtonLabel || ''}"></div>
            <div class="form-group"><label>Bot&atilde;o 1 rota</label><input id="cfg-primary-route" value="${home.primaryButtonRoute || ''}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Bot&atilde;o 2 texto</label><input id="cfg-secondary-label" value="${home.secondaryButtonLabel || ''}"></div>
            <div class="form-group"><label>Bot&atilde;o 2 rota</label><input id="cfg-secondary-route" value="${home.secondaryButtonRoute || ''}"></div>
          </div>
          <div class="form-group"><label>T&iacute;tulo da se&ccedil;&atilde;o</label><input id="cfg-section-title" value="${home.sectionTitle || ''}"></div>
          <div class="form-row">
            <div class="form-group"><label>Card 1 destaque</label><input id="cfg-feature1-title" value="${home.featurePrimaryTitle || ''}"></div>
            <div class="form-group"><label>Card 2 destaque</label><input id="cfg-feature2-title" value="${home.featureSecondaryTitle || ''}"></div>
          </div>
          <div class="form-group"><label>Card 1 texto</label><textarea id="cfg-feature1-text">${home.featurePrimaryText || ''}</textarea></div>
          <div class="form-group"><label>Card 2 texto</label><textarea id="cfg-feature2-text">${home.featureSecondaryText || ''}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Rodap&eacute; linha 1</label><input id="cfg-footer-line1" value="${home.footerLine1 || ''}"></div>
            <div class="form-group"><label>Rodap&eacute; linha 2</label><input id="cfg-footer-line2" value="${home.footerLine2 || ''}"></div>
          </div>
        </section>

        <section class="admin-card">
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
      </div>
    </div>`;

    const preview = () => {
        try {
            systemSettings = deepMerge(cloneData(DEFAULT_SETTINGS), adminSettingsPayloadFromForm());
            applySiteSettings();
            if (getRoute() === '/') renderHome(document.getElementById('app'));
            toast('Visual atualizado na hora.', 'success');
        } catch (err) {
            toast(`JSON do menu inválido: ${err.message}`, 'error');
        }
    };

    document.getElementById('btn-admin-preview').addEventListener('click', preview);
    document.getElementById('btn-admin-logout').addEventListener('click', () => {
        removeToken();
        applySiteSettings();
        toast('Sessão encerrada.', 'info');
        navigate('/');
    });
    document.getElementById('btn-admin-save').addEventListener('click', async () => {
        const btn = document.getElementById('btn-admin-save');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        try {
            const payload = adminSettingsPayloadFromForm();
            const res = await api('PUT', '/settings', payload, token);
            systemSettings = deepMerge(cloneData(DEFAULT_SETTINGS), res.settings || payload);
            applySiteSettings();
            toast('Configurações salvas com sucesso!', 'success');
        } catch (err) {
            toast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar configurações';
        }
    });
}

// ============================================================
// PWA Install
// ============================================================
let deferredPrompt;

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
    const colors = getThemeColors();
    meta.setAttribute('content', dark ? colors.dark : colors.light);
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

