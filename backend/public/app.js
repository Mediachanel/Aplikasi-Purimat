'use strict';
// Android WebView already reserves the system navigation-bar inset natively.
if (/PurimasAndroid\//.test(navigator.userAgent)) document.documentElement.classList.add('purimas-android');
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], app = $('#app'), modal = $('#modal');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => v === null || v === undefined ? 'Belum ditetapkan' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v));
const date = v => v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }) : '—';
const roleNames = { KETUA: 'Ketua RT', SEKRETARIS: 'Sekretaris', BENDAHARA: 'Bendahara', WARGA: 'Warga' };
function storedToken() {
    let saved = null;
    try { saved = localStorage.getItem('purimas-token'); } catch {}
    try { saved ||= sessionStorage.getItem('purimas-token'); } catch {}
    if (saved) saveToken(saved);
    return saved;
}
function saveToken(value) {
    token = value;
    try { if (value) localStorage.setItem('purimas-token', value); else localStorage.removeItem('purimas-token'); sessionStorage.removeItem('purimas-token'); }
    catch { try { if (value) sessionStorage.setItem('purimas-token', value); else sessionStorage.removeItem('purimas-token'); } catch {} }
}
let token = null;
token = storedToken();
let user = null, page = 'home', records = [], requestId = 0;
const is = (...r) => r.includes(user?.role);
const iconPaths = { home: 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z', profile: 'M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', residents: 'M16 21v-2a6 6 0 0 0-12 0v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 21v-2a6 6 0 0 0-3-5 M17 3a4 4 0 0 1 0 8', bills: 'M6 3h12v18l-3-2-3 2-3-2-3 2z M9 7h6 M9 11h6 M9 15h3', cash: 'M3 7h18v13H3z M3 7V4h15v3 M16 11h5v5h-5z', reports: 'M5 3h10l4 4v14H5z M14 3v5h5 M8 17v-3 M12 17v-6 M16 17v-4', payments: 'M3 5h18v14H3z M3 9h18 M7 15h3 M15 15h2', transparency: 'M3 7h18v13H3z M3 7V4h15v3 M16 11h5v5h-5z', submissions: 'M8 3h8v4H8z M8 5H5v16h14V5h-3 M8 12h8 M8 16h5', documents: 'M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 17h5', announcements: 'M4 10v5h4l9 5V5l-9 5z M8 15l2 6 M20 9v7', users: 'M4 4h16v16H4z M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M7 19a5 5 0 0 1 10 0', audit: 'M12 8v5l3 2 M3 12a9 9 0 1 0 3-7 M3 3v5h5', arrow: 'M5 12h14 M13 6l6 6-6 6', plus: 'M12 5v14 M5 12h14', check: 'M5 12l4 4L19 6', clock: 'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', logout: 'M9 4H4v16h5 M9 12h12 M17 8l4 4-4 4', settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6', download: 'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4', more: 'M5 12h.01 M12 12h.01 M19 12h.01' };
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[name] || iconPaths.documents}"/></svg>`;
const allMenus = { home: ['home', 'Ringkasan'], profile: ['profile', 'Data Keluarga'], residents: ['residents', 'Data Warga'], submissions: ['submissions', 'Pengajuan'], bills: ['bills', 'Iuran Warga'], reminders: ['clock', 'Pengingat Iuran'], cash: ['cash', 'Buku Kas'], reports: ['reports', 'Laporan Keuangan'], payments: ['payments', 'Pembayaran'], transparency: ['transparency', 'Saldo Lingkungan'], documents: ['documents', 'Dokumen'], announcements: ['announcements', 'Pengumuman'], users: ['users', 'Akun Rumah'], audit: ['audit', 'Riwayat Aktivitas'] };
function menus() { return { KETUA: ['home', 'bills', 'cash', 'reports', 'payments', 'residents', 'submissions', 'profile', 'documents', 'announcements', 'users', 'audit'], SEKRETARIS: ['home', 'submissions', 'residents', 'users', 'bills', 'payments', 'transparency', 'profile', 'documents', 'announcements'], BENDAHARA: ['home', 'payments', 'cash', 'reports', 'bills', 'reminders', 'residents', 'profile', 'submissions', 'documents'], WARGA: ['home', 'bills', 'payments', 'transparency', 'profile', 'submissions', 'documents', 'announcements'] }[user.role]; }
function toast(s) { $('#toast').textContent = s; $('#toast').style.display = 'block'; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').style.display = 'none', 4500); }
async function api(path, body, method = 'POST') {
    const sentToken = token;
    const r = await fetch('/api/' + path, { method: body === undefined ? 'GET' : method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    let d;
    try {
        d = await r.json();
    }
    catch {
        throw Error('Server belum dapat dihubungi. Silakan coba lagi.');
    }
    if (r.status === 401 && token && token === sentToken) {
        logout();
        throw Error('Sesi berakhir. Silakan masuk kembali.');
    }
    if (!r.ok || d.success === false)
        throw Error(d.message || 'Permintaan gagal.');
    return d;
}
const brand = () => '<div class="brand"><img src="/assets/logo.png" alt="Logo Purimas"><div><strong>PURIMAS</strong><small>RT 013 / RW 003 · Tirtajaya</small></div></div>';
const badge = s => `<span class="tag ${['LUNAS', 'DISETUJUI', 'MASUK'].includes(s) ? 'ok' : s === 'DITOLAK' || s === 'KELUAR' ? 'bad' : 'warn'}">${esc(String(s).replaceAll('_', ' '))}</span>`;
const empty = s => `<div class="empty">${esc(s || 'Belum ada data.')}</div>`;
const eyeIcon = hidden => `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>${hidden ? '<path d="m3 3 18 18"/>' : ''}</svg>`;
const field = (n, l, t = 'text', v = '', extra = '') => t === 'password'
    ? `<div class="password-field"><label for="password-${n}">${esc(l)}</label><div class="password-control"><input id="password-${n}" name="${n}" type="password" value="${esc(v)}" required ${extra}><button type="button" class="password-toggle" data-toggle-password aria-label="Tampilkan ${esc(l.toLowerCase())}" aria-pressed="false">${eyeIcon(false)}</button></div></div>`
    : `<label>${esc(l)}<input name="${n}" type="${t}" value="${esc(v)}" required ${extra}></label>`;
const optional = (n, l, t = 'text', v = '', extra = '') => field(n, l, t, v, extra).replace(' required ', ' ');
const area = (n, l, v = '', required = true) => `<label>${esc(l)}<textarea name="${n}" ${required ? 'required' : ''}>${esc(v)}</textarea></label>`;
const select = (n, l, opts, v = '') => `<label>${esc(l)}<select name="${n}" aria-label="${esc(l)}">${opts.map(o => { const [value, label] = Array.isArray(o) ? o : [o, o.replaceAll('_', ' ')]; return `<option value="${esc(value)}" ${value === v ? 'selected' : ''}>${esc(label)}</option>`; }).join('')}</select></label>`;
async function logout(revoke = false) {
    const previousToken = token;
    if (revoke && previousToken) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try { await fetch('/api/auth/logout', { method:'POST', headers:{Authorization:'Bearer '+previousToken, 'Content-Type':'application/json'}, body:'{}', signal:controller.signal }); }
        catch (_) { /* Local logout still works without a connection. */ }
        finally { clearTimeout(timeout); }
    }
    stopPaymentAlerts(); token = null; user = null; requestId++; saveToken(null); modal.close(); login();
}
function requirePasswordChange() {
    app.innerHTML = `<main class="password-setup"><section class="card password-setup-card">${brand()}<h1>Ganti password awal</h1><p>Untuk melindungi data keluarga dan keuangan, buat password pribadi sebelum menggunakan aplikasi.</p><form id="setup-password">${field('currentPassword','Password awal','password','','autocomplete="current-password"')}${field('newPassword','Password baru','password','','minlength="12" maxlength="72" autocomplete="new-password"')}${field('confirmPassword','Ulangi password baru','password','','minlength="12" maxlength="72" autocomplete="new-password"')}<p class="muted">Minimal 12 karakter. Gunakan password yang unik dan mudah Anda ingat.</p><p class="error" id="setup-error" role="alert"></p><div class="actions"><button type="submit">Simpan password</button><button type="button" class="soft" id="setup-logout">Keluar</button></div></form></section></main>`;
    $('#setup-logout').onclick=()=>logout(true);
    $('#setup-password').onsubmit=async e=>{ e.preventDefault(); const form=e.currentTarget, button=form.querySelector('[type=submit]'); button.disabled=true; $('#setup-error').textContent='';
        try { const values=Object.fromEntries(new FormData(form)); if (values.newPassword!==values.confirmPassword) throw Error('Ulangi password baru dengan benar.'); const d=await api('auth/password',{currentPassword:values.currentPassword,newPassword:values.newPassword}); token=d.token; user.mustChangePassword=false; saveToken(token); shell(); await navigate('home'); }
        catch(err){ const el=$('#setup-error'); if(el) el.textContent=err.message; }
        finally{ button.disabled=false; }
    };
}

function login() {
    app.innerHTML = `<div class="login"><div class="login-art"><div class="login-art-content">${brand()}<span class="login-kicker">SISTEM INFORMASI LINGKUNGAN</span><h1>Purimas Tirtajaya</h1><p>Bersama mengelola lingkungan yang tertib, nyaman, dan transparan.</p><div class="login-art-note">RT 013 / RW 003 · Kota Depok</div></div></div><div class="login-form"><div class="login-mobile-hero">${brand()}<span>SELAMAT DATANG</span><h1>Masuk ke Purimas</h1><p>Akses layanan warga, iuran, dan informasi lingkungan.</p></div><div class="login-box">${brand()}<span class="login-label">PORTAL LOGIN</span><h1>Masuk ke Purimas Tirtajaya</h1><p class="login-intro">Gunakan akun rumah Anda untuk mengakses layanan lingkungan.</p><form id="auth">${field('username', 'Username', 'text', '', 'autocomplete="username" autocapitalize="none"')}${field('password', 'Password', 'password', '', 'autocomplete="current-password" minlength="7"')}<p class="error" role="alert" id="auth-error"></p><button type="submit">Masuk ke aplikasi ${icon('arrow')}</button></form><p style="text-align:center;margin-top:25px"><a href="/download/">Download aplikasi Android</a></p></div></div></div>`;
    $('#auth').onsubmit = async (e) => {
        e.preventDefault();
        const b = e.target.querySelector('[type=submit]');
        b.disabled = true;
        try {
            const d = await api('auth/login', Object.fromEntries(new FormData(e.target)));
            token = d.token;
            user = d.user;
            saveToken(token);
            if (user.mustChangePassword) requirePasswordChange();
            else { shell(); await navigate('home'); }
        }
        catch (err) {
            if ($('#auth-error'))
                $('#auth-error').textContent = err.message;
        }
        finally {
            b.disabled = false;
        }
    };
}
let sidebarCollapsed = false;
try { sidebarCollapsed = localStorage.getItem('purimas-sidebar-collapsed') === 'true'; } catch {}
function updateSidebar() {
    const sidebar = $('.sidebar');
    sidebar.classList.toggle('is-collapsed', sidebarCollapsed);
    for (const button of $$('[data-sidebar-toggle]')) {
        const label = sidebarCollapsed ? 'Buka sidebar' : 'Sembunyikan sidebar';
        button.setAttribute('aria-label', label);
        button.setAttribute('title', label);
        button.setAttribute('aria-expanded', String(!sidebarCollapsed));
        button.innerHTML = icon('arrow', sidebarCollapsed ? '' : 'sidebar-chevron-close') + '<span>' + label + '</span>';
    }
}
function setupSidebar() {
    for (const button of $$('[data-sidebar-toggle]')) button.onclick = () => {
        sidebarCollapsed = !sidebarCollapsed;
        try { localStorage.setItem('purimas-sidebar-collapsed', String(sidebarCollapsed)); } catch {}
        updateSidebar();
    };
    updateSidebar();
}
function shell() { const primary = { WARGA:['home','bills','payments','profile'], SEKRETARIS:['home','submissions','residents','bills'], KETUA:['home','bills','reports','submissions'], BENDAHARA:['home','payments','cash','reports'] }[user.role].filter(id => menus().includes(id)); const unit = user.username.replace('blok_', '').toUpperCase(); app.innerHTML = `<aside class="sidebar" id="sidebar" aria-label="Menu utama">${brand()}<div class="sidebar-user"><span class="sidebar-user-avatar">${esc(unit)}</span><div><strong>${esc(user.fullName)}</strong><small>${roleNames[user.role]}</small></div></div><div class="nav-caption">MENU UTAMA</div><nav class="nav">${menus().map(id => `<button data-page="${id}" title="${allMenus[id][1]}" aria-label="${allMenus[id][1]}">${icon(allMenus[id][0])}<span>${allMenus[id][1]}</span></button>`).join('')}</nav><footer><div class="community-mini">${icon('home')}<div><strong>Purimas Tirtajaya</strong><small>RT 013 / RW 003 · Depok</small></div></div><a href="/download/" title="Aplikasi Android" aria-label="Aplikasi Android">${icon('download')}<span>Aplikasi Android</span></a><button class="sidebar-toggle" data-sidebar-toggle aria-controls="sidebar"></button></footer></aside><div class="main"><header class="topbar"><div class="topbar-title"><button class="icon-button sidebar-top-toggle" data-sidebar-toggle aria-controls="sidebar"></button><span class="mobile-mark">${icon('home')}</span><div><strong>Purimas Tirtajaya</strong><small>Pengelolaan lingkungan</small></div></div><div class="profile">${is('BENDAHARA') ? `<button class="icon-button notification-button" id="payment-notifications" aria-label="Konfirmasi pembayaran menunggu pemeriksaan">${icon('clock')}<span id="payment-notification-count" class="notification-count" hidden></span></button>` : ''}<span class="role-label">${roleNames[user.role]}</span><button class="account-button" id="password" aria-label="Ganti password"><span class="avatar">${esc(unit)}</span><span class="account-name">${esc(user.fullName)}<small>${roleNames[user.role]}</small></span>${icon('settings')}</button><button class="icon-button" id="logout" aria-label="Keluar">${icon('logout')}</button></div></header><main class="content" id="content"></main></div><nav class="bottom-nav" aria-label="Navigasi utama">${primary.map(id => `<button data-page="${id}" aria-label="${allMenus[id][1]}">${icon(allMenus[id][0])}<span>${{home:'Beranda',bills:'Iuran',payments:is('BENDAHARA')?'Verifikasi':'Bayar',profile:'Keluarga',submissions:'Pengajuan',residents:'Warga',cash:'Kas',reports:'Laporan'}[id]}</span></button>`).join('')}<button id="more-menu">${icon('more')}<span>Lainnya</span></button></nav>`; setupSidebar(); $$('[data-page]').forEach(b => b.onclick = () => navigate(b.dataset.page)); $('#logout').onclick = () => logout(true); $('#password').onclick = changePassword; if ($('#payment-notifications')) { $('#payment-notifications').onclick = () => navigate('payments'); startPaymentAlerts(); } $('#more-menu').onclick = () => { showModal('Menu layanan', `<div class="menu-sheet">${menus().map(id => `<button class="menu-link" data-menu-page="${id}">${icon(allMenus[id][0])}<span>${allMenus[id][1]}</span>${icon('arrow')}</button>`).join('')}<a class="menu-link" href="/download/">${icon('download')}<span>Download Android</span></a></div>`); $$('[data-menu-page]').forEach(b => b.onclick = () => { modal.close(); navigate(b.dataset.menuPage); }); }; }
let paymentAlertTimer = null, paymentAlertLatest = null;
function stopPaymentAlerts() { clearInterval(paymentAlertTimer); paymentAlertTimer = null; paymentAlertLatest = null; }
async function refreshPaymentAlerts() {
    if (!token || !is('BENDAHARA') || !$('#payment-notification-count')) return;
    try {
        const {data} = await api('payment-notifications');
        const badge = $('#payment-notification-count');
        if (!badge || !is('BENDAHARA')) return;
        badge.hidden = !data.pending; badge.textContent = data.pending > 99 ? '99+' : String(data.pending);
        $('#payment-notifications').setAttribute('aria-label', `${data.pending} konfirmasi pembayaran menunggu pemeriksaan`);
        if (paymentAlertLatest !== null && data.latest > paymentAlertLatest) toast('Ada konfirmasi pembayaran baru. Buka ikon notifikasi untuk memeriksa.');
        paymentAlertLatest = data.latest;
    } catch (_) { /* Polling retries when the connection returns. */ }
}
function startPaymentAlerts() { stopPaymentAlerts(); refreshPaymentAlerts(); paymentAlertTimer = setInterval(() => { if (!document.hidden) refreshPaymentAlerts(); }, 30000); }
function showModal(title, body) {
    $('#modal-body').innerHTML = `<div class="row"><h2>${esc(title)}</h2><button class="plain" id="close-modal" aria-label="Tutup">✕</button></div>${body}`;
    $('#close-modal').onclick = () => modal.close();
    if (!modal.open)
        modal.showModal();
}
function formModal(title, fields, path, transform = x => x) {
    showModal(title, `<form id="edit-form">${fields}<p class="error" id="form-error" role="alert"></p><div class="actions"><button type="button" class="soft" id="cancel">Batal</button><button type="submit">Simpan</button></div></form>`);
    $('#cancel').onclick = () => modal.close();
    $('#edit-form').onsubmit = async (e) => {
        e.preventDefault();
        const b = e.target.querySelector('[type="submit"]');
        b.disabled = true;
        try {
            const d = await api(path, await transform(Object.fromEntries(new FormData(e.target))));
            modal.close();
            toast(d.message || 'Berhasil disimpan.');
            await navigate(page);
        }
        catch (err) {
            $('#form-error').textContent = err.message;
        }
        finally {
            b.disabled = false;
        }
    };
}
function changePassword() {
    formModal('Ganti password', field('currentPassword', 'Password saat ini', 'password') + field('newPassword', 'Password baru', 'password', '', 'minlength="12" maxlength="72" autocomplete="new-password"'), 'auth/password', x => x);
    const f = $('#edit-form');
    f.onsubmit = async (e) => {
        e.preventDefault();
        const b = f.querySelector('[type=submit]');
        b.disabled = true;
        try {
            const d = await api('auth/password', Object.fromEntries(new FormData(f)));
            token = d.token;
            saveToken(token);
            modal.close();
            toast(d.message);
        }
        catch (err) {
            $('#form-error').textContent = err.message;
        }
        finally {
            b.disabled = false;
        }
    };
}
async function navigate(next) {
    if (!menus().includes(next))
        return;
    page = next;
    $('#content').classList.toggle('dashboard-home', next === 'home');
    const rid = ++requestId;
    $$('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page)); const more=$('#more-menu'); if(more) more.classList.toggle('active', !document.querySelector('.bottom-nav [data-page="'+page+'"]'));
    $('#content').innerHTML = '<div class="loading" role="status">Memuat…</div>';
    try {
        if (next === 'reminders') {
            const d = await api('bills/reminders');
            if (rid === requestId) remindersPage(d.data);
            return;
        }
        if (next === 'reports') {
            await reportsPage();
            return;
        }
        const endpoint = next === 'home' ? 'dashboard' : next === 'profile' ? 'residents/me' : next;
        const d = await api(endpoint);
        if (rid !== requestId)
            return;
        if (next === 'home')
            home(d.data);
        else if (next === 'transparency')
            transparencyPage(d.data);
        else if (next === 'payments')
            paymentsPage(d.data);
        else if (next === 'profile')
            profileView(d.data);
        else {
            records = d.data;
            listing();
        }
    }
    catch (err) {
        if (rid === requestId && $('#content')) {
            $('#content').innerHTML = `<div class="card"><p class="error">${esc(err.message)}</p><button id="retry">Coba lagi</button></div>`;
            $('#retry').onclick = () => navigate(next);
        }
    }
}
function bindGo() { $$('[data-go]').forEach(b => b.onclick = () => navigate(b.dataset.go)); }
function stat(label, value, sub = '', kind = 'cash') { return `<article class="card stat"><div class="stat-top"><span>${esc(label)}</span><span class="stat-icon">${icon(kind)}</span></div><strong>${esc(value)}</strong>${sub ? `<small>${esc(sub)}</small>` : ''}</article>`; }
function expenseBars(categories) { const total = categories.reduce((s, c) => s + Number(c.amount), 0); return categories.map((c, i) => `<div class="bar-row"><div class="row"><span>${esc(c.category)}</span><strong>${money(c.amount)}</strong></div><div class="bar-track"><span style="width:${total ? Number(c.amount) / total * 100 : 0}%;--bar-color:${['#c7460d', '#e6762c', '#ed9b5c', '#f3bd92', '#f8dfc9'][i % 5]}"></span></div></div>`).join('') || empty('Belum ada pengeluaran.'); }
function sectionTitle(title, sub = '', action = '') { return `<div class="section-title"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${action}</div>`; }
function quickServices() {
    const services = menus();
    return `<section class="card quick-card">${sectionTitle('Layanan cepat')}<div class="quick-actions" id="quick-services" role="region" aria-label="Semua layanan sesuai peran" tabindex="0">${services.map(id => `<button class="quick-action" data-go="${id}" aria-label="${allMenus[id][1]}"><span class="quick-icon">${icon(allMenus[id][0])}</span><span>${allMenus[id][1]}</span>${icon('arrow')}</button>`).join('')}</div>${services.length > 8 ? `<div class="quick-scroll-tools"><small>Geser untuk melihat semua layanan</small><div><button type="button" id="quick-previous" class="icon-button" aria-label="Layanan sebelumnya" aria-controls="quick-services">${icon('arrow','sidebar-chevron-close')}</button><button type="button" id="quick-next" class="icon-button" aria-label="Layanan berikutnya" aria-controls="quick-services">${icon('arrow')}</button></div></div>` : ''}</section>`;
}
function updateQuickScrollControls() {
    const services = $('#quick-services');
    if (!services || !$('#quick-previous')) return;
    $('#quick-previous').disabled = services.scrollLeft <= 2;
    $('#quick-next').disabled = services.scrollLeft >= services.scrollWidth - services.clientWidth - 2;
}
function setupQuickServices() {
    const services = $('#quick-services');
    if (!services) return;
    const slide = direction => services.scrollBy({left:direction * services.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    if ($('#quick-previous')) {
        $('#quick-previous').onclick = () => slide(-1);
        $('#quick-next').onclick = () => slide(1);
    }
    services.addEventListener('scroll',updateQuickScrollControls,{passive:true});
    services.onkeydown = event => {
        if (event.target !== services || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
        event.preventDefault(); slide(event.key === 'ArrowRight' ? 1 : -1);
    };
    requestAnimationFrame(updateQuickScrollControls);
}
window.addEventListener('resize',updateQuickScrollControls);
function home(d) { const finance = is('KETUA', 'BENDAHARA'), secretary = is('SEKRETARIS'), rate = d.bills.rate || 0; const dateLabel = d.cash.asOf ? 'Per ' + date(d.cash.asOf) : 'Saldo belum ditetapkan'; const metrics = secretary ? stat('Menunggu verifikasi', d.submissions.pending, 'Pengajuan perlu diperiksa', 'clock') + stat('Disetujui', d.submissions.approved, 'Pengajuan selesai', 'check') + stat('Ditolak', d.submissions.rejected, 'Perlu dilengkapi warga', 'submissions') + stat('Anggota keluarga', d.profile.family.length, 'Data rumah Anda', 'profile') : stat('Saldo kas lingkungan', money(d.cash.currentBalance), dateLabel, 'cash') + stat(finance ? 'Iuran terbayar' : 'Iuran saya terbayar', money(d.bills.amountPaid), `${d.bills.paid} bulan lunas`, 'check') + stat(finance ? 'Iuran belum dibayar' : 'Iuran saya belum dibayar', money(d.bills.overdue), `${d.bills.unpaid} bulan belum dibayar`, 'bills') + stat('Tingkat pelunasan', `${rate.toLocaleString('id-ID')}%`, finance ? 'Seluruh tagihan lingkungan' : 'Tagihan rumah Anda', 'reports'); const title = finance ? 'Ringkasan lingkungan' : secretary ? 'Pusat administrasi' : 'Selamat datang, ' + user.username.replace('blok_', '').toUpperCase(); const action = secretary ? `<button data-go="submissions">${icon('submissions')} Periksa pengajuan</button>` : is('BENDAHARA') ? `<button data-go="payments">${icon('payments')} Konfirmasi pembayaran${d.paymentPending ? `<span class="count-badge">${d.paymentPending}</span>` : ''}</button>` : is('KETUA') ? `<button data-go="reports">${icon('reports')} Lihat laporan</button>` : `<button data-go="bills">${icon('payments')} ${d.bills.unpaid ? 'Bayar iuran' : 'Lihat iuran saya'}</button>`; $('#content').innerHTML = `<div class="heading"><div><div class="eyebrow">DASHBOARD · ${roleNames[user.role].toUpperCase()}</div><h1>${esc(title)}</h1><p class="muted">${secretary ? 'Kelola administrasi warga serta iuran dan layanan rumah Anda.' : 'Pantau iuran, kas, dan layanan lingkungan Anda.'}</p></div>${action}</div><div class="stats kpi-grid">${metrics}</div>${demographicsPanel(d.demographics)}<div class="dashboard-grid"><section class="card collection-card">${sectionTitle(finance ? 'Pelunasan iuran' : 'Status iuran rumah Anda', 'Berdasarkan tagihan yang telah diterbitkan')}<div class="collection-body"><div class="progress-ring" style="--progress:${rate}%"><div><strong>${rate.toLocaleString('id-ID')}<small>%</small></strong><span>terbayar</span></div></div><div class="collection-details"><div><span class="legend-dot green"></span><span>Lunas<strong>${d.bills.paid} bulan</strong></span><b>${money(d.bills.amountPaid)}</b></div><div><span class="legend-dot amber"></span><span>Belum dibayar<strong>${d.bills.unpaid} bulan</strong></span><b>${money(d.bills.overdue)}</b></div></div></div><div class="card-bottom"><span>${d.paymentPending ? `${d.paymentPending} konfirmasi menunggu pemeriksaan` : 'Status pembayaran diperbarui setelah verifikasi'}</span><button class="text-button" data-go="${finance ? 'payments' : 'bills'}">${finance ? 'Lihat pembayaran' : 'Lihat tagihan'} ${icon('arrow')}</button></div></section><section class="card expense-card">${sectionTitle('Pengeluaran lingkungan', 'Komposisi kas keluar per kategori')}${expenseBars(d.categories)}</section></div>${quickServices()}${d.announcements.length ? `<section class="card news-card">${sectionTitle('Kabar lingkungan')}${d.announcements.map(n => `<article><span class="tag">${esc(n.category)}</span><h2>${esc(n.title)}</h2><p>${esc(n.content)}</p></article>`).join('')}</section>` : ''}<footer class="page-footer" lang="en"><span>© ${new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date())} Purimas Tirtajaya. All rights reserved.</span><span>Developed by <strong>B9</strong>.</span></footer>`; bindGo(); setupQuickServices(); }
function demographicsPanel(d){
 const lookup=(list,label)=>list.find(x=>x.label===label)?.count||0;
 const bars=(items)=>items.length?items.map(x=>`<div class="bar-row"><div class="row"><span>${esc(x.label)}</span><strong>${x.count} orang</strong></div><div class="bar-track"><span style="width:${d.total?Math.round(x.count/d.total*100):0}%;--bar-color:#d85b16"></span></div></div>`).join(''):empty('Belum ada data anggota KK yang diverifikasi.');
 return `<section class="demography"><div class="section-title"><div><h2>Demografi penduduk</h2><p>Berdasarkan anggota KK yang telah diverifikasi sekretaris.</p></div></div><div class="stats kpi-grid demography-stats">${stat('Penduduk terdata',d.total+' orang','Termasuk kepala keluarga yang tercantum dalam anggota KK','residents')}${stat('Laki-laki',lookup(d.gender,'Laki-laki')+' orang','Data terverifikasi','profile')}${stat('Perempuan',lookup(d.gender,'Perempuan')+' orang','Data terverifikasi','profile')}${stat('Rumah dengan anggota',d.completedHouses+' / '+d.houses,'Rumah yang sudah memiliki anggota KK terverifikasi','home')}</div>${d.total?`<div class="dashboard-grid"><div class="card">${sectionTitle('Kelompok usia','Usia dihitung dari tanggal lahir saat ini')}${bars(d.ageGroups)}</div><div class="card">${sectionTitle('Pendidikan','Sesuai data anggota KK')}${bars(d.education)}</div><div class="card">${sectionTitle('Pekerjaan','Sesuai data anggota KK')}${bars(d.occupation)}</div></div>`:`<div class="card empty-state">${icon('residents')}<h2>Belum ada anggota KK terverifikasi</h2><p>Isi data keluarga, termasuk kepala keluarga sebagai anggota KK. Angka akan muncul setelah disetujui sekretaris.</p></div>`}</section>`;
}
function profileDetails(p) { return `<div class="card"><h2>${esc(p.block_number)} No. ${esc(p.house_number)}</h2><div class="detail-grid"><p><small>Nama kepala keluarga</small><br>${esc(p.full_name) || '—'}</p><p><small>NIK</small><br>${esc(p.nik) || '—'}</p><p><small>Nomor KK</small><br>${esc(p.kk_number) || '—'}</p><p><small>Tanggal terbit KK</small><br>${date(p.kk_issue_date)}</p><p><small>Alamat pada KK</small><br>${esc(p.kk_address?.address) || '—'} · RT ${esc(p.kk_address?.rt) || '—'} / RW ${esc(p.kk_address?.rw) || '—'}<br>${esc(p.kk_address?.village) || '—'}, ${esc(p.kk_address?.district) || '—'}<br>${esc(p.kk_address?.city) || '—'}, ${esc(p.kk_address?.province) || '—'} ${esc(p.kk_address?.postalCode) || ''}</p><p><small>Nomor HP</small><br>${esc(p.phone_number) || '—'}</p><p><small>Status hunian</small><br>${esc(p.occupancy_status) || '—'}</p></div></div><h2 style="margin-top:25px">Anggota keluarga</h2><p class="muted">Masukkan setiap orang pada KK, termasuk kepala keluarga, agar demografi terhitung.</p><div class="grid">${p.family.map(f => `<article class="card"><h2>${esc(f.full_name)}</h2><p>${esc(f.relationship)} · ${esc(f.gender) || '—'}</p><p>NIK: ${esc(f.nik) || '—'}<br>Lahir: ${esc(f.birth_place) || '—'}, ${date(f.birth_date)}<br>Pekerjaan: ${esc(f.occupation) || '—'}<br>Agama: ${esc(f.kk_details?.religion) || '—'}<br>Pendidikan: ${esc(f.kk_details?.education) || '—'}<br>Perkawinan: ${esc(f.kk_details?.maritalStatus) || '—'}<br>Kewarganegaraan: ${esc(f.kk_details?.citizenship) || '—'}<br>Golongan darah: ${esc(f.kk_details?.bloodType) || '—'}<br>Ayah: ${esc(f.kk_details?.fatherName) || '—'} · Ibu: ${esc(f.kk_details?.motherName) || '—'}<br>Paspor: ${esc(f.kk_details?.passportNumber) || '—'} · Izin tinggal: ${esc(f.kk_details?.stayPermitNumber) || '—'}<br>Tanggal perkawinan: ${date(f.kk_details?.marriageDate)}</p></article>`).join('') || empty('Belum ada anggota keluarga terverifikasi.')}</div><h2 style="margin-top:25px">Kendaraan</h2><div class="grid">${p.vehicles.map(v => `<article class="card"><h2>${esc(v.plate_number)}</h2><p>${esc(v.vehicle_type)} · ${esc(v.brand)} · ${esc(v.color)}</p></article>`).join('') || empty('Belum ada kendaraan terverifikasi.')}</div><h2 style="margin-top:25px">KTP & KK</h2><div class="stack">${(p.attachments || []).map(a => `<div class="card row"><span>${esc(a.kind)} · ${esc(a.original_name)}</span><button class="soft" data-file="${a.id}">Buka berkas</button></div>`).join('') || empty('Belum ada berkas terverifikasi.')}</div>`; }
function profileView(p) { $('#content').innerHTML = `<div class="heading"><h1>Data Keluarga</h1><button id="edit-profile">Ajukan perubahan</button></div>${profileDetails(p)}`; $('#edit-profile').onclick = () => editProfile(p); bindFiles(); }
function memberFields(f = {}) { const id = f.id || crypto.randomUUID(); return `<div class="card member" data-id="${id}"><div class="row"><h2>Anggota keluarga</h2><button type="button" class="danger remove-row">Hapus</button></div><div class="detail-grid">${field('fullName', 'Nama lengkap', 'text', f.full_name || f.fullName || '')}${optional('nik', 'NIK', 'text', f.nik || '', 'pattern="[0-9]{16}" inputmode="numeric"')}${select('relationship', 'Hubungan', ['Kepala Keluarga', 'Suami', 'Istri', 'Anak', 'Orang Tua', 'Keluarga Lain'], f.relationship)}${select('gender', 'Jenis kelamin', ['Laki-laki', 'Perempuan'], f.gender)}${optional('birthPlace', 'Tempat lahir', 'text', f.birth_place || f.birthPlace || '')}${optional('birthDate', 'Tanggal lahir', 'date', (f.birth_date || f.birthDate || '').slice(0, 10))}${optional('occupation', 'Pekerjaan', 'text', f.occupation || '')}${optional('religion', 'Agama / kepercayaan', 'text', f.kk_details?.religion || f.religion || '')}${select('education', 'Pendidikan', [['','Belum diisi'],'Tidak / belum sekolah','Belum tamat SD/sederajat','Tamat SD/sederajat','SLTP/sederajat','SLTA/sederajat','Diploma I/II','Akademi/Diploma III','Diploma IV/Strata I','Strata II','Strata III'], f.kk_details?.education || f.education || '')}${select('maritalStatus', 'Status perkawinan', [['','Belum diisi'],'Belum kawin','Kawin tercatat','Kawin belum tercatat','Cerai hidup','Cerai mati'], f.kk_details?.maritalStatus || f.maritalStatus || '')}${optional('marriageDate', 'Tanggal perkawinan', 'date', f.kk_details?.marriageDate || f.marriageDate || '')}${optional('citizenship', 'Kewarganegaraan', 'text', f.kk_details?.citizenship || f.citizenship || '')}${select('bloodType', 'Golongan darah', [['','Belum diisi'],'A','B','AB','O','A+','A-','B+','B-','AB+','AB-','O+','O-','Tidak tahu'], f.kk_details?.bloodType || f.bloodType || '')}${optional('passportNumber', 'Nomor paspor', 'text', f.kk_details?.passportNumber || f.passportNumber || '')}${optional('stayPermitNumber', 'Nomor izin tinggal', 'text', f.kk_details?.stayPermitNumber || f.stayPermitNumber || '')}${optional('fatherName', 'Nama ayah', 'text', f.kk_details?.fatherName || f.fatherName || '')}${optional('motherName', 'Nama ibu', 'text', f.kk_details?.motherName || f.motherName || '')}</div></div>`; }
function vehicleFields(v = {}) { return `<div class="card vehicle" data-id="${v.id || crypto.randomUUID()}"><div class="row"><h2>Kendaraan</h2><button type="button" class="danger remove-row">Hapus</button></div><div class="detail-grid">${field('plateNumber', 'Nomor polisi', 'text', v.plate_number || v.plateNumber || '')}${select('vehicleType', 'Jenis kendaraan', ['Motor', 'Mobil', 'Lainnya'], v.vehicle_type || v.vehicleType)}${optional('brand', 'Merek', 'text', v.brand || '')}${optional('color', 'Warna', 'text', v.color || '')}</div></div>`; }
function readRows(selector) { return $$(selector).map(el => ({ id: el.dataset.id, ...Object.fromEntries([...el.querySelectorAll('[name]')].map(i => [i.name, i.value])) })); }
function editProfile(p, manage = false, correction = null) {
    $('#content').innerHTML = `<div class="heading"><h1>${manage ? 'Kelola Data ' + esc(p.block_number) + ' No. ' + esc(p.house_number) : correction ? 'Perbaiki Usulan Data Keluarga' : 'Ajukan Perubahan Data'}</h1><button class="soft" id="back-profile">Kembali</button></div>${correction ? `<section class="card correction-notice"><h2>Catatan penolakan</h2><p>${esc(correction.review_note || "Periksa dan lengkapi data sebelum mengajukan kembali.")}</p>${correction.profileChanged ? `<p class="inline-note">Data terverifikasi sudah diperbarui sejak usulan sebelumnya. ${correction.baselineUnavailable ? "Formulir memakai data terbaru; sesuaikan kembali perbaikan Anda." : "Perubahan usulan lama diterapkan pada data terbaru. Periksa kembali seluruh isian sebelum mengirim."}</p>` : ""}</section>` : ""}<form id="profile-form"><div class="card"><h2>Identitas kepala keluarga</h2><p class="muted">Tambahkan juga kepala keluarga sebagai anggota KK di bawah agar dihitung dalam demografi.</p><div class="detail-grid">${field('fullName', 'Nama lengkap', 'text', p.full_name)}${optional('nik', 'NIK', 'text', p.nik, 'pattern="[0-9]{16}" inputmode="numeric"')}${optional('phoneNumber', 'Nomor HP', 'tel', p.phone_number)}${optional('kkNumber', 'Nomor KK', 'text', p.kk_number || '', 'pattern="[0-9]{16}" inputmode="numeric"')}${optional('kkIssueDate', 'Tanggal terbit KK', 'date', p.kk_issue_date || '', `max="${jakartaToday()}"`)}${optional('kkAddress', 'Alamat pada KK', 'text', p.kk_address?.address || '')}${optional('kkRt', 'RT pada KK', 'text', p.kk_address?.rt || '')}${optional('kkRw', 'RW pada KK', 'text', p.kk_address?.rw || '')}${optional('kkVillage', 'Desa / Kelurahan pada KK', 'text', p.kk_address?.village || '')}${optional('kkDistrict', 'Kecamatan pada KK', 'text', p.kk_address?.district || '')}${optional('kkCity', 'Kabupaten / Kota pada KK', 'text', p.kk_address?.city || '')}${optional('kkProvince', 'Provinsi pada KK', 'text', p.kk_address?.province || '')}${optional('kkPostalCode', 'Kode pos pada KK', 'text', p.kk_address?.postalCode || '', 'inputmode="numeric"')}${select('occupancyStatus', 'Status hunian', [['', 'Pilih status hunian'], 'Pemilik Tetap', 'Pengontrak / Penyewa'], p.occupancy_status)}</div></div><div class="heading" style="margin-top:25px"><h2>Anggota keluarga</h2><button class="soft" type="button" id="add-member">＋ Anggota</button></div><div id="family-list" class="stack">${p.family.map(memberFields).join('')}</div><div class="heading" style="margin-top:25px"><h2>Kendaraan</h2><button class="soft" type="button" id="add-vehicle">＋ Kendaraan</button></div><div id="vehicle-list" class="stack">${p.vehicles.map(vehicleFields).join('')}</div><h2 style="margin-top:25px">Lampiran KTP & KK</h2><div class="card"><div id="attached" class="stack"></div><div class="detail-grid" style="margin-top:18px">${select('fileKind', 'Jenis berkas', ['KK', 'KTP'])}<label>Pemilik KTP<select id="file-member"><option value="">Kepala keluarga / satu rumah</option></select></label><label>Pilih berkas (JPG, PNG, PDF · maks. 8 MB)<input type="file" id="upload-file" accept="image/jpeg,image/png,application/pdf"></label></div><button type="button" id="upload" class="soft">Unggah berkas</button><p id="upload-error" class="error" role="alert"></p></div><p class="error" id="profile-error" role="alert"></p><div class="actions"><button type="submit">${manage ? 'Simpan data warga' : 'Kirim ke sekretaris'}</button></div></form>`;
    $('#back-profile').onclick = () => navigate(manage ? 'residents' : 'profile');
    let attachments = [...p.attachments];
    function renderAttachments() { $('#attached').innerHTML = attachments.map(a => `<label class="attachment-check"><input type="checkbox" value="${a.id}" checked> ${esc(a.kind)} · ${esc(a.original_name)}</label>`).join(''); }
    renderAttachments();
    function bindRemoves() { $$('.remove-row').forEach(b => b.onclick = () => { b.closest('.card').remove(); refreshMembers(); }); }
    function refreshMembers() { const el = $('#file-member'), value = el.value; el.innerHTML = '<option value="">Kepala keluarga / satu rumah</option>' + readRows('.member').map(f => `<option value="${f.id}">${esc(f.fullName) || 'Anggota keluarga'}</option>`).join(''); el.value = value; }
    $('#family-list').oninput = refreshMembers;
    $('#add-member').onclick = () => { $('#family-list').insertAdjacentHTML('beforeend', memberFields()); bindRemoves(); refreshMembers(); };
    $('#add-vehicle').onclick = () => { $('#vehicle-list').insertAdjacentHTML('beforeend', vehicleFields()); bindRemoves(); };
    bindRemoves();
    refreshMembers();
    $('#upload').onclick = async () => {
        const f = $('#upload-file').files[0], b = $('#upload');
        $('#upload-error').textContent = '';
        if (!f) {
            $('#upload-error').textContent = 'Pilih berkas terlebih dahulu.';
            return;
        }
        if (f.size > 8 * 1024 * 1024) {
            $('#upload-error').textContent = 'Ukuran berkas maksimal 8 MB.';
            return;
        }
        b.disabled = true;
        try {
            const r = await fetch('/api/attachments', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': f.type, 'X-File-Kind': $('#profile-form [name=fileKind]').value, 'X-File-Name': encodeURIComponent(f.name), ...(manage ? { 'X-Resident-Id': String(p.id) } : {}), ...($('#file-member').value ? { 'X-Member-Ref': $('#file-member').value } : {}) }, body: f });
            const d = await r.json();
            if (!r.ok)
                throw Error(d.message);
            attachments.push(d.data);
            renderAttachments();
            $('#upload-file').value = '';
            toast('Berkas diunggah.');
        }
        catch (e) {
            $('#upload-error').textContent = e.message;
        }
        finally {
            b.disabled = false;
        }
    };
    $('#profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const b = e.target.querySelector('[type=submit]');
        b.disabled = true;
        try {
            const val = n => e.target.querySelector('[name=' + n + ']').value;
            await api(manage ? 'residents/' + p.id + '/profile' : 'submissions', { type: 'PERUBAHAN_DATA', ...(correction ? {retryOf:correction.id} : {}), baseRevision: p.revision, payload: { fullName: val('fullName'), nik: val('nik'), kkNumber: val('kkNumber'), kkIssueDate: val('kkIssueDate'), kkAddress:{address:val('kkAddress'),rt:val('kkRt'),rw:val('kkRw'),village:val('kkVillage'),district:val('kkDistrict'),city:val('kkCity'),province:val('kkProvince'),postalCode:val('kkPostalCode')}, phoneNumber: val('phoneNumber'), occupancyStatus: val('occupancyStatus'), family: readRows('.member'), vehicles: readRows('.vehicle') }, attachmentIds: $$('#attached input:checked').map(i => i.value) });
            toast(manage ? 'Data warga berhasil disimpan.' : 'Pengajuan dikirim ke sekretaris.');
            await navigate(manage ? 'residents' : 'submissions');
        }
        catch (err) {
            $('#profile-error').textContent = err.message;
        }
        finally {
            b.disabled = false;
        }
    };
}
function bindFiles() {
    $$('[data-file]').forEach(b => b.onclick = async () => {
        b.disabled = true;
        try {
            const { data: d } = await api('attachments/' + b.dataset.file + '/link', {});
            showModal('Berkas identitas', d.mimeType.startsWith('image/') ? `<img src="${esc(d.url)}" alt="Berkas identitas"><div class="actions"><a class="button" href="${esc(d.url)}" download>Unduh</a></div>` : `<a class="button" href="${esc(d.url)}" download>Unduh PDF</a>`);
        }
        catch (e) {
            toast(e.message);
        }
        finally {
            b.disabled = false;
        }
    });
}
let selectedBillYear = null;
const jakartaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
function billYears() {
    const current = Number(jakartaToday().slice(0, 4));
    return [...new Set([...records.map(r => Number(r.year)), current, current + 1, ...(selectedBillYear ? [selectedBillYear] : [])])].filter(Number.isFinite).sort((a,b) => b-a);
}
function whatsappNumber(value) {
    const text = String(value || '').trim();
    if (!/^\+?[\d ()-]+$/.test(text)) return null;
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '62' + digits.slice(1);
    return /^62[1-9]\d{7,12}$/.test(digits) ? digits : null;
}
function remindersPage(data) {
    const noDate = data.unknownDueCount ? `<div class="inline-note">${data.unknownDueCount} tagihan belum memiliki tanggal jatuh tempo yang dapat dihitung.</div>` : '';
    const pending = data.pendingCount ? `<div class="inline-note">${data.pendingCount} tagihan lewat jatuh tempo sedang menunggu verifikasi pembayaran dan tidak dimasukkan ke pengingat.</div>` : '';
    $('#content').innerHTML = `<div class="heading"><div><h1>Pengingat iuran</h1><p class="muted">Daftar tagihan yang melewati tanggal jatuh tempo.</p></div><button class="soft" id="due-settings">Atur jatuh tempo</button></div>${data.dueDay ? `<p class="muted">Jatuh tempo tanggal ${data.dueDay} setiap bulan · diperbarui ${date(data.today)}. Pengingat disiapkan di WhatsApp dan dikirim oleh bendahara.</p>` : '<div class="inline-note">Atur tanggal jatuh tempo untuk menghitung tagihan yang belum memiliki tanggal sendiri.</div>'}<div class="stats two-stats">${stat('Rumah perlu diingatkan', String(data.rows.length), 'Tidak termasuk pembayaran yang menunggu pemeriksaan', 'residents')}${stat('Total terlambat', money(data.amount), 'Tagihan yang sudah lewat jatuh tempo', 'bills')}</div>${noDate}${pending}<div class="stack">${data.rows.map(h => `<article class="card reminder-card"><div><h2>${esc(h.blockNumber)} No. ${esc(h.houseNumber)}${h.fullName ? ' · ' + esc(h.fullName) : ''}</h2><p>${h.bills.map(b => esc(b.monthName)).join(' · ')}</p><small>${h.bills.length} bulan · ${h.phoneNumber ? esc(h.phoneNumber) : 'Nomor HP belum tersedia'}</small></div><div class="reminder-action"><strong>${money(h.amount)}</strong><button data-reminder="${h.residentId}" ${whatsappNumber(h.phoneNumber) ? '' : 'disabled title="Nomor WhatsApp belum tersedia atau tidak valid"'}>Siapkan pengingat</button></div></article>`).join('') || empty('Tidak ada tagihan lewat jatuh tempo yang perlu diingatkan.')}</div>`;
    $('#due-settings').onclick = () => formModal('Tanggal jatuh tempo iuran', '<p>Gunakan untuk tagihan tanpa tanggal jatuh tempo, termasuk riwayat. Tanggal pada tagihan yang sudah memiliki tanggal tetap berlaku. Hari terakhir bulan dipakai jika tanggal yang dipilih tidak ada.</p>' + field('dueDay','Tanggal setiap bulan','number',data.dueDay || '', 'min="1" max="31"'), 'bills/reminder-settings', d => ({dueDay:Number(d.dueDay)}));
    $$('[data-reminder]').forEach(button => button.onclick = async () => {
        button.disabled = true;
        try {
            const fresh = (await api('bills/reminders')).data;
            const h = fresh.rows.find(row => String(row.residentId) === button.dataset.reminder);
            if (!h) { toast('Tagihan sudah berubah. Daftar akan diperbarui.'); remindersPage(fresh); return; }
            const number = whatsappNumber(h.phoneNumber);
            if (!number) { toast('Nomor WhatsApp belum tersedia atau tidak valid.'); remindersPage(fresh); return; }
            const bank = fresh.account ? `\nPembayaran: ${fresh.account.bankName} ${fresh.account.accountNumber} a.n. ${fresh.account.accountName}.` : '';
            const message = `Yth. Warga ${h.blockNumber} No. ${h.houseNumber},\n\nKami mengingatkan iuran lingkungan yang sudah melewati jatuh tempo: ${h.bills.map(b => b.monthName).join(', ')}. Total ${money(h.amount)}.${bank}\n\nJika sudah membayar, mohon kirim konfirmasi melalui aplikasi Purimas. Abaikan pesan ini jika pembayaran sudah dikonfirmasi. Terima kasih.\n\nBendahara RT Purimas Tirtajaya`;
            showModal('Tinjau pengingat WhatsApp', `<p>Periksa nomor dan pesan sebelum mengirim.</p><p><strong>${esc(h.phoneNumber)}</strong></p><div class="reminder-preview">${esc(message)}</div><div class="actions"><a class="button" href="https://wa.me/${number}?text=${encodeURIComponent(message)}" rel="noopener noreferrer">Buka WhatsApp</a></div>`);
        } catch (e) { toast(e.message); }
        finally { button.disabled = false; }
    });
}
function listing() {
    const title = allMenus[page][1];
    const add = is('BENDAHARA') && ['cash', 'bills'].includes(page) || is('KETUA') && page === 'announcements';
    $('#content').innerHTML = `<div class="heading"><h1>${title}</h1><div class="row">${page === 'bills' && is('WARGA', 'SEKRETARIS', 'KETUA', 'BENDAHARA') ? '<button id="citizen-pay">' + icon('payments') + ' Bayar iuran</button>' : ''}${page === 'submissions' ? '<button id="new-submission">Ajukan administrasi</button>' : ''}${page === 'bills' && is('BENDAHARA') ? '<button id="manual-payment">Catat pembayaran warga</button><button class="soft" id="add-year">Buat tagihan setahun</button>' : ''}${add ? `<button id="add">${page === 'bills' ? 'Buat tagihan bulanan' : page === 'cash' ? 'Catat transaksi' : 'Tambah'}</button>` : ''}</div></div><div class="toolbar"><input id="search" aria-label="Cari data" placeholder="Cari ${title.toLowerCase()}…">${['bills', 'submissions'].includes(page) ? `<select id="status-filter" aria-label="Filter status"><option value="">Semua status</option>${(page === 'bills' ? ['LUNAS', 'BELUM_BAYAR'] : ['MENUNGGU', 'DISETUJUI', 'DITOLAK']).map(s => `<option value="${s}">${s.replaceAll('_', ' ')}</option>`).join('')}</select>` : ''}${page === 'residents' && is('SEKRETARIS') ? '<button class="soft" id="export-residents">Unduh Excel data warga</button>' : ''}${page === 'cash' ? '<button class="soft" data-go="reports">Laporan keuangan</button><button class="soft" id="export">Unduh Excel</button>' : ''}${page === 'bills' ? '<select id="bill-year" aria-label="Tahun iuran">' + billYears().map(y => '<option value="' + y + '"' + (y === (selectedBillYear || Number(jakartaToday().slice(0, 4))) ? ' selected' : '') + '>' + y + '</option>').join('') + '</select>' : ''}${page === 'bills' && is('BENDAHARA') ? '<button class="soft" id="advance-settings">Nominal iuran di muka</button><button class="soft" id="import">Impor riwayat</button>' : ''}</div><div id="results"></div>`;
    if ($('#citizen-pay'))
        $('#citizen-pay').onclick = () => payBills();
    if ($('#manual-payment')) $('#manual-payment').onclick = () => manualPayment();
    $('#search').oninput = renderRows;
    if ($('#status-filter'))
        $('#status-filter').onchange = renderRows;
    if ($('#bill-year'))
        $('#bill-year').onchange = () => { selectedBillYear = Number($('#bill-year').value); renderRows(); };
    if ($('#new-submission'))
        $('#new-submission').onclick = newAdministration;
    if ($('#add'))
        $('#add').onclick = addForm;
    if ($('#add-year'))
        $('#add-year').onclick = () => formModal('Buat tagihan setahun', '<p>Tagihan Januari–Desember dibuat untuk setiap rumah aktif. Tagihan yang sudah ada tidak diubah.</p>' + field('year', 'Tahun iuran', 'number', selectedBillYear || Number(jakartaToday().slice(0, 4)), 'min="2020" max="2200"') + field('amount', 'Iuran per rumah per bulan (Rp)', 'number', 150000, 'min="1"'), 'bills/generate-year', d => { selectedBillYear = Number(d.year); return { year: Number(d.year), amount: Number(d.amount) }; });
    if ($('#export'))
        $('#export').onclick = exportExcel;
    if ($('#export-residents')) $('#export-residents').onclick = async () => { try { const d=await api('residents/export-link',{}); downloadLink(d.data.url,'data-warga-purimas.xlsx'); } catch(e) { toast(e.message); } };
    if ($('#import'))
        $('#import').onclick = importBills;
    if ($('#advance-settings')) $('#advance-settings').onclick = async () => { try { const setting=(await api('bills/advance-settings')).data; formModal('Nominal iuran di muka', '<p>Nominal ini digunakan untuk bulan mendatang yang belum memiliki tagihan. Tagihan yang sudah diterbitkan tetap menggunakan nominalnya sendiri.</p>' + field('amount','Iuran per rumah per bulan (Rp)','number',setting.amount || '', 'min="1"'), 'bills/advance-settings', d=>({amount:Number(d.amount)})); } catch(e) { toast(e.message); } };
    renderRows();
    bindGo();
}
function renderRows() {
    const q = $('#search').value.toLowerCase(), status = $('#status-filter')?.value;
    const rows = records.filter(r => Object.values(r).join(' ').toLowerCase().includes(q) && (!status || r.status === status) && (page !== 'bills' || !$('#bill-year') || r.year === Number($('#bill-year').value)));
    let html = '';
    if (page === 'cash') {
        html = `<div class="stats">${stat('Saldo kas', money(records.reduce((s, r) => s + (r.type === 'MASUK' ? 1 : -1) * Number(r.amount), 0)))}${stat('Kas masuk', money(records.filter(r => r.type === 'MASUK').reduce((s, r) => s + Number(r.amount), 0)))}${stat('Kas keluar', money(records.filter(r => r.type === 'KELUAR').reduce((s, r) => s + Number(r.amount), 0)))}</div>`;
    }
    if (!rows.length) {
        $('#results').innerHTML = html + empty(q || status ? 'Tidak ada hasil yang cocok.' : page === 'bills' ? 'Belum ada tagihan untuk tahun ' + $('#bill-year').value + '. Tagihan diterbitkan oleh bendahara.' : 'Belum ada data.');
        return;
    }
    if (page === 'residents')
        html += table(['Rumah', 'Kepala keluarga', ...(is('KETUA', 'SEKRETARIS') ? ['Kontak', 'Anggota', 'Kendaraan', 'Data'] : [])], rows.map(r => `<tr><td>${esc(r.block_number)} No. ${esc(r.house_number)}</td><td>${esc(r.full_name) || 'Belum diisi'}</td>${is('KETUA', 'SEKRETARIS') ? `<td>${esc(r.phone_number) || '—'}</td><td>${r.family_members_count}</td><td>${r.vehicle_count}</td><td><div class="row"><button class="soft" data-profile="${r.id}">Lihat</button>${is('SEKRETARIS') ? `<button class="soft" data-edit-resident="${r.id}">Tambah / ubah</button>` : ''}</div></td>` : ''}</tr>`));
    if (page === 'users')
        html += table(['Rumah', 'Username', 'Peran', 'Status', 'Password'], rows.map(r => `<tr><td>${esc(r.block_number)} No. ${esc(r.house_number)}</td><td>${esc(r.username)}</td><td>${roleNames[r.role]}</td><td>${r.is_active ? 'Aktif' : 'Nonaktif'}</td><td>${r.role === 'WARGA' && r.is_active ? `<button class="soft" data-reset-password="${r.id}">Reset password</button>${r.must_change_password ? '<small>Perlu ganti password awal</small>' : ''}` : '—'}</td></tr>`));
    if (page === 'audit')
        html += table(['Waktu', 'Akun', 'Tindakan', 'Objek'], rows.map(r => `<tr><td>${date(r.created_at)}</td><td>${esc(r.username)}</td><td>${esc(r.action.replaceAll('_', ' '))}</td><td>${esc(r.entity_type)} #${esc(r.entity_id)}</td></tr>`));
    if (page === 'bills')
        html += billMatrix(rows);
    if (page === 'cash')
        html += table(['Tanggal', 'Transaksi', 'Debit / Kredit', 'Nominal', 'Bukti'], rows.map(r => `<tr><td>${date(r.date)}</td><td><strong>${esc(r.title)}</strong><small>${esc(r.category)}</small></td><td>${badge(r.type)}</td><td>${money(r.amount)}</td><td>${cashProofCell(r)}</td></tr>`));
    if (page === 'submissions')
        html += `<div class="stack">${rows.map(r => `<article class="card"><div class="row"><span class="tag">${r.type === 'PERUBAHAN_DATA' ? 'Perubahan data' : 'Administrasi'}</span>${badge(r.status)}</div><h2 style="margin-top:18px">${esc(r.title)}</h2><p>${esc(r.block_number)} No. ${esc(r.house_number)} · ${esc(r.full_name) || 'Nama belum diisi'}</p><small>${date(r.created_at)}</small>${r.status === 'DITOLAK' && r.review_note ? `<p class="rejection-note"><strong>Catatan penolakan:</strong> ${esc(r.review_note)}</p>` : ''}<div class="actions">${r.type === 'PERUBAHAN_DATA' && r.status === 'DITOLAK' && String(r.submitted_by) === String(user.id) && !r.resubmitted_id ? `<button data-retry-submission="${r.id}">Perbaiki dan ajukan lagi</button>` : ''}${r.resubmitted_id ? `<button class="soft" data-submission="${r.resubmitted_id}">Lihat pengajuan terbaru</button>` : ''}<button class="soft" data-submission="${r.id}">${is('SEKRETARIS') && r.status === 'MENUNGGU' ? 'Verifikasi' : 'Lihat pengajuan'}</button></div></article>`).join('')}</div>`;
    if (page === 'documents')
        html += `<div class="grid">${rows.map(r => `<article class="card"><span class="tag">${esc(r.category)}</span><h2 style="margin-top:18px">${esc(r.title)}</h2><small>${esc(r.file_number)} · ${date(r.issue_date)}</small><p>${esc(r.description)}</p><button class="soft" data-doc="${r.id}">Buka dokumen</button></article>`).join('')}</div>`;
    if (page === 'announcements')
        html += `<div class="stack">${rows.map(r => `<article class="card"><div class="row"><span class="tag">${esc(r.category)}</span><small>${date(r.created_at)}</small></div><h2 style="margin-top:18px">${esc(r.title)}</h2><p>${esc(r.content)}</p></article>`).join('')}</div>`;
    $('#results').innerHTML = html;
    bindRows();
    bindCashProofButtons();
    $$('[data-reset-password]').forEach(button => button.onclick = () => resetResidentPassword(button.dataset.resetPassword));
}
function resetResidentPassword(id) {
    const target = records.find(row => String(row.id) === String(id));
    if (!target || !is('KETUA', 'SEKRETARIS') || target.role !== 'WARGA') return;
    showModal('Reset password warga', `<p>Reset password akun <strong>${esc(target.username)}</strong> (${esc(target.block_number)} No. ${esc(target.house_number)}) ke <strong>purimas</strong>?</p><p>Sesi masuk warga akan diakhiri. Saat masuk kembali, warga perlu membuat password pribadi.</p><p class="error" id="reset-password-error" role="alert"></p><div class="actions"><button type="button" id="confirm-reset-password">Reset ke purimas</button><button type="button" class="soft" id="cancel-reset-password">Batal</button></div>`);
    $('#cancel-reset-password').onclick = () => modal.close();
    $('#confirm-reset-password').onclick = async event => {
        const button = event.currentTarget; button.disabled = true;
        try { const result = await api('users/' + target.id + '/reset-password', {}); modal.close(); toast(result.message); await navigate('users'); }
        catch (err) { const error = $('#reset-password-error'); if (error) error.textContent = err.message; }
        finally { button.disabled = false; }
    };
}
const table = (heads, rows) => `<div class="table-wrap"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
function billMatrix(rows) {
    if (is('WARGA', 'SEKRETARIS')) {
        const paid = rows.filter(r => r.status === 'LUNAS').reduce((s, r) => s + Number(r.amount), 0), unpaid = rows.filter(r => r.status !== 'LUNAS').reduce((s, r) => s + Number(r.amount), 0);
        return `<div class="stats two-stats">${stat('Iuran lunas', money(paid), 'Sesuai periode yang dipilih', 'check')}${stat('Belum dibayar', money(unpaid), 'Termasuk yang menunggu konfirmasi', 'bills')}</div><div class="personal-bill-list">${[...rows].sort((a, b) => (a.status === 'LUNAS') - (b.status === 'LUNAS') || b.month_index - a.month_index).map(r => `<article class="card personal-bill"><span class="bill-calendar">${icon('bills')}</span><div><strong>${esc(r.month_name)}</strong><small>Iuran lingkungan · ${money(r.amount)}</small></div>${r.status === 'LUNAS' ? badge('LUNAS') : r.pending_payment_id ? '<span class="tag pending-tag">Menunggu verifikasi</span>' : badge('BELUM_BAYAR')}<button class="${r.status === 'LUNAS' ? 'soft' : ''}" ${r.status === 'LUNAS' ? `data-receipt="${r.id}"` : r.pending_payment_id ? `data-pending-payment="${r.pending_payment_id}"` : `data-citizen-bill="${r.id}"`}>${r.status === 'LUNAS' ? 'Bukti' : r.pending_payment_id ? 'Lihat' : 'Bayar'}</button></article>`).join('')}</div>`;
    }
    const groups = new Map();
    for (const r of rows) {
        if (!groups.has(r.resident_id))
            groups.set(r.resident_id, { name: r.house_unit, bills: [] });
        groups.get(r.resident_id).bills.push(r);
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    let totalPaid = 0, totalPending = 0;
    const body = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'id', { numeric: true })).map(g => {
        let paid = 0, pending = 0;
        const cells = months.map((m, i) => {
            const r = g.bills.find(b => b.month_index === i + 1);
            if (!r)
                return '<td>—</td>';
            if (r.status === 'LUNAS')
                paid += Number(r.amount);
            else
                pending += Number(r.amount);
            return `<td><button class="month-cell ${r.status === 'LUNAS' ? 'paid' : r.pending_payment_id ? 'pending' : 'unpaid'}" ${r.status === 'LUNAS' ? `data-receipt="${r.id}"` : r.pending_payment_id ? `data-pending-payment="${r.pending_payment_id}"` : is('BENDAHARA') ? `data-pay="${r.id}"` : is('WARGA', 'SEKRETARIS') ? `data-citizen-bill="${r.id}"` : ''} title="${esc(r.month_name)}: ${r.status === 'LUNAS' ? 'Lunas' : 'Belum dibayar'}" aria-label="${esc(g.name)} ${esc(r.month_name)} ${r.status === 'LUNAS' ? 'Lunas' : 'Belum dibayar'}">${r.status === 'LUNAS' ? '✓' : r.pending_payment_id ? '◷' : '—'}</button></td>`;
        }).join('');
        totalPaid += paid;
        totalPending += pending;
        return `<tr><td><strong>${esc(g.name)}</strong></td>${cells}<td>${money(paid)}</td><td>${money(pending)}</td></tr>`;
    });
    return `<div class="stats">${stat('Lunas', money(totalPaid))}${stat('Belum dibayar', money(totalPending))}${stat('Periode', String($('#bill-year')?.value || ''))}</div>` + table(['Rumah', ...months, 'Lunas', 'Belum dibayar'], body);
}
async function newAdministration() {
    let p;
    try {
        p = (await api('residents/me')).data;
    }
    catch (e) {
        toast(e.message);
        return;
    }
    formModal('Pengajuan administrasi', field('title', 'Judul pengajuan') + select('category', 'Jenis', ['Surat Pengantar', 'Surat Keterangan Domisili', 'Surat Keterangan Usaha', 'Surat Keterangan Lainnya']) + area('purpose', 'Keperluan'), 'submissions', d => ({ type: 'ADMINISTRASI', title: d.title, payload: { category: d.category, purpose: d.purpose }, attachmentIds: p.attachments.map(a => a.id) }));
}
function renderProfileChanges(s) {
    if (s.changes === null) return '<p class="inline-note">Data pembanding untuk usulan lama ini tidak tersedia. Rincian perubahan historis tidak dapat ditentukan.</p>';
    if (!s.changes.length) return '<p class="inline-note">Tidak ada perubahan data atau lampiran pada usulan ini.</p>';
    const names = {added:'Ditambahkan',changed:'Diubah',removed:'Dihapus'};
    const display = (key, value) => !value ? '—' : /Date$/.test(key) ? date(value) : esc(value);
    return `<section class="submission-changes"><h2>Rincian perubahan</h2>${s.changes.map(group => `<article class="change-group"><div class="row"><h3>${esc(group.title)}</h3><span class="change-status ${group.kind}">${names[group.kind]}</span></div>${group.fields.map(field => `<div class="change-field"><strong>${esc(field.label)}</strong><div class="change-values">${group.kind !== 'added' ? `<div><small>Sebelum</small><span>${display(field.key,field.before)}</span></div>` : ''}${group.kind !== 'removed' ? `<div><small>${group.kind === 'added' ? 'Data baru' : 'Sesudah'}</small><span>${display(field.key,field.after)}</span></div>` : ''}</div></div>`).join('')}${group.attachment ? `<button class="soft" data-file="${esc(group.attachment.id)}">Buka lampiran baru</button>` : ''}</article>`).join('')}</section>`;
}
async function retrySubmission(id) {
    try {
        const {data:s} = await api('submissions/' + id);
        if (!s.canRetry) throw Error('Usulan ini tidak dapat diajukan ulang. Buka pengajuan terbaru Anda.');
        const p = {...s.currentProfile,attachments:s.retryDraft.attachments};
        const draft = s.retryDraft.payload;
        if (draft) Object.assign(p,{full_name:draft.fullName,nik:draft.nik,phone_number:draft.phoneNumber,kk_number:draft.kkNumber,kk_issue_date:draft.kkIssueDate,kk_address:draft.kkAddress,occupancy_status:draft.occupancyStatus,family:draft.family,vehicles:draft.vehicles});
        modal.close();
        editProfile(p,false,s);
    } catch (err) { toast(err.message); }
}
async function submission(id) {
    try {
        const { data: s } = await api('submissions/' + id);
        let body = `<div class="row">${badge(s.status)}<small>${date(s.created_at)}</small></div><h2 style="margin-top:22px">${esc(s.currentProfile.block_number)} No. ${esc(s.currentProfile.house_number)}</h2>`;
        if (s.type === 'PERUBAHAN_DATA') {
            body += renderProfileChanges(s);
        }
        else
            body += `<p><small>Jenis surat</small><br>${esc(s.payload.category)}</p><p><small>Keperluan</small><br>${esc(s.payload.purpose)}</p>`;
        if (s.type !== 'PERUBAHAN_DATA') body += `<h2 style="margin-top:24px">Lampiran</h2>${s.attachments.map(a => `<p>${esc(a.kind)} · ${esc(a.original_name)} <button class="soft" data-file="${a.id}">Buka</button></p>`).join('') || '<p>—</p>'}`;
        if (s.review_note)
            body += `<h2>Hasil verifikasi</h2><p>${esc(s.review_note)}</p><small>${date(s.reviewed_at)}</small>`;
        if (is('SEKRETARIS') && s.status === 'MENUNGGU')
            body += `<form id="review-form">${select('status', 'Keputusan', ['DISETUJUI', 'DITOLAK'])}${area('reviewNote', 'Catatan verifikasi')}${s.type === 'ADMINISTRASI' ? `<div id="letter-fields">${field('fileNumber', 'Nomor surat')}${area('contentBody', 'Isi surat')}</div>` : ''}<p class="error" id="review-error" role="alert"></p><div class="actions"><button type="submit">Simpan keputusan</button></div></form>`;
        if (s.canRetry) body += `<div class="actions"><button id="retry-submission">Perbaiki dan ajukan lagi</button></div>`;
        if (s.resubmitted_id) body += `<div class="actions"><button class="soft" id="latest-submission">Lihat pengajuan terbaru</button></div>`;
        showModal(s.title, body);
        bindFiles();
        if ($('#retry-submission')) $('#retry-submission').onclick = () => retrySubmission(s.id);
        if ($('#latest-submission')) $('#latest-submission').onclick = () => submission(s.resubmitted_id);
        if ($('#review-form')) {
            const f = $('#review-form');
            if ($('#letter-fields'))
                f.querySelector('[name=status]').onchange = e => { $('#letter-fields').hidden = e.target.value === 'DITOLAK'; $('#letter-fields').querySelectorAll('[name]').forEach(i => i.required = e.target.value === 'DISETUJUI'); };
            f.onsubmit = async (e) => {
                e.preventDefault();
                const b = f.querySelector('[type=submit]');
                b.disabled = true;
                try {
                    await api(`submissions/${id}/review`, Object.fromEntries(new FormData(f)));
                    modal.close();
                    toast('Hasil verifikasi disimpan.');
                    await navigate('submissions');
                }
                catch (err) {
                    $('#review-error').textContent = err.message;
                }
                finally {
                    b.disabled = false;
                }
            };
        }
    }
    catch (e) {
        toast(e.message);
    }
}
function cashProofCell(row) {
    const editable=is('BENDAHARA') && !row.bill_id && row.category?.trim().toLowerCase()!=='iuran warga';
    return `<div class="cash-proof-cell">${row.attachment_id ? `<button class="soft" data-view-cash-proof="${esc(row.attachment_id)}">Lihat bukti</button><small>${esc(row.attachment_name || '')}</small>` : esc(row.receipt_code) || '—'}${editable ? `<button class="text-button" data-upload-cash-proof="${row.id}">${row.attachment_id ? 'Ganti bukti' : 'Upload bukti'}</button>` : ''}</div>`;
}
function bindCashProofButtons() {
    $$('[data-view-cash-proof]').forEach(button => button.onclick = async () => {
        button.disabled=true;
        try {
            const {data}=await api('attachments/'+button.dataset.viewCashProof+'/link',{});
            showModal('Bukti transaksi kas',data.mimeType==='image/jpeg' ? `<img src="${esc(data.url)}" alt="Bukti transaksi kas"><div class="actions"><a class="button" href="${esc(data.url)}" download>Unduh JPG</a></div>` : `<p>Bukti transaksi dalam format PDF.</p><a class="button" href="${esc(data.url)}" download>Unduh PDF</a>`);
        } catch (err) { toast(err.message); }
        finally { button.disabled=false; }
    });
    $$('[data-upload-cash-proof]').forEach(button => button.onclick = () => cashProofForm(Number(button.dataset.uploadCashProof)));
}
const cashProofField = () => '<label>Bukti transaksi (JPG/PDF · maksimal 8 MB)<input id="cash-proof" type="file" accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf" required></label>';
async function uploadCashProof(file) {
    if (!file) throw Error('Pilih bukti transaksi JPG atau PDF.');
    const mime=file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : /\.jpe?g$/i.test(file.name) ? 'image/jpeg' : '');
    if (!['image/jpeg','application/pdf'].includes(mime)) throw Error('Bukti transaksi harus JPG atau PDF.');
    if (file.size>8*1024*1024) throw Error('Bukti transaksi maksimal 8 MB.');
    const response=await fetch('/api/attachments',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':mime,'X-File-Kind':'KAS','X-File-Name':encodeURIComponent(file.name)},body:file});
    const result=await response.json();
    if (!response.ok) throw Error(result.message || 'Bukti belum berhasil diunggah.');
    return result.data.id;
}
function cashEntryForm() {
    showModal('Catat kas',`<p>Pemasukan atau pengeluaran selain iuran warga. Untuk iuran, gunakan menu Pembayaran.</p><form id="cash-entry-form">${select('type','Debit / Kredit',[['MASUK','Debit — kas masuk'],['KELUAR','Kredit — kas keluar']])}${field('title','Nama transaksi')}${field('category','Kategori')}${field('amount','Nominal (Rp)','number','','min="1"')}${field('date','Tanggal transaksi','date',jakartaToday())}${cashProofField()}${area('description','Uraian','',false)}<p class="error" id="cash-entry-error" role="alert"></p><div class="actions"><button type="submit">Simpan transaksi</button></div></form>`);
    let attachmentId=null;
    $('#cash-proof').onchange=()=>{attachmentId=null;};
    $('#cash-entry-form').onsubmit=async event=>{
        event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]');button.disabled=true;$('#cash-entry-error').textContent='';
        try {
            if (!attachmentId) attachmentId=await uploadCashProof($('#cash-proof').files[0]);
            const values=Object.fromEntries(new FormData(form));
            const result=await api('cash',{...values,amount:Number(values.amount),attachmentId});
            modal.close();toast(result.message);await navigate('cash');
        } catch (err) { const error=$('#cash-entry-error');if(error) error.textContent=err.message; }
        finally { button.disabled=false; }
    };
}
function cashProofForm(id) {
    const row=(page==='reports' ? currentReport?.rows : records)?.find(row=>Number(row.id)===id);
    if (!row || !is('BENDAHARA')) return;
    showModal(row.attachment_id?'Ganti bukti transaksi':'Upload bukti transaksi',`<p><strong>${esc(row.title)}</strong><br>${money(row.amount)} · ${date(row.date)}</p><p>Menambahkan atau mengganti bukti tidak mengubah nominal maupun saldo kas.</p><form id="cash-proof-form">${cashProofField()}<p class="error" id="cash-proof-error" role="alert"></p><div class="actions"><button type="submit">Simpan bukti</button></div></form>`);
    let attachmentId=null;$('#cash-proof').onchange=()=>{attachmentId=null;};
    $('#cash-proof-form').onsubmit=async event=>{
        event.preventDefault();const button=event.currentTarget.querySelector('[type=submit]');button.disabled=true;$('#cash-proof-error').textContent='';
        try {
            if (!attachmentId) attachmentId=await uploadCashProof($('#cash-proof').files[0]);
            const result=await api('cash/'+id+'/proof',{attachmentId});modal.close();toast(result.message);
            if (page==='reports' && $('#report-filters')) $('#report-filters').requestSubmit();else await navigate('cash');
        } catch (err) { const error=$('#cash-proof-error');if(error) error.textContent=err.message; }
        finally { button.disabled=false; }
    };
}
function addForm() {
    if (page === 'cash') cashEntryForm();
    if (page === 'bills')
        formModal('Buat tagihan bulanan', field('period', 'Bulan tagihan', 'month', (selectedBillYear || Number(jakartaToday().slice(0, 4))) + '-' + jakartaToday().slice(5, 7)) + field('amount', 'Iuran per rumah (Rp)', 'number', 150000, 'min="1"'), 'bills/generate-monthly', d => { const [year, monthIndex] = d.period.split('-').map(Number); selectedBillYear = year; return { year, monthIndex, amount: Number(d.amount) }; });
    if (page === 'announcements')
        formModal('Pengumuman', field('title', 'Judul') + select('category', 'Kategori', ['INFORMASI', 'KEGIATAN', 'DARURAT']) + area('content', 'Isi pengumuman'), 'announcements');
}
function bindRows() {
    $$('[data-pending-payment]').forEach(b => b.onclick = () => navigate('payments'));
    $$('[data-citizen-bill]').forEach(b => b.onclick = () => payBills(Number(b.dataset.citizenBill)));
    $$('[data-edit-resident]').forEach(b => b.onclick = async () => {
        try { const {data} = await api('residents/' + b.dataset.editResident); editProfile(data, true); }
        catch (e) { toast(e.message); }
    });
    $$('[data-profile]').forEach(b => b.onclick = async () => {
        try {
            const d = await api('residents/' + b.dataset.profile);
            showModal('Data keluarga', profileDetails(d.data) + (is('SEKRETARIS') ? '<div class="actions"><button id="manage-resident">Kelola data warga</button></div>' : ''));
            bindFiles();
            if ($('#manage-resident')) $('#manage-resident').onclick = () => { modal.close(); editProfile(d.data, true); };
        }
        catch (e) {
            toast(e.message);
        }
    });
    $$('[data-submission]').forEach(b => b.onclick = () => submission(b.dataset.submission));
    $$('[data-retry-submission]').forEach(b => b.onclick = () => retrySubmission(b.dataset.retrySubmission));
    $$('[data-pay]').forEach(b => b.onclick = () => { const r = records.find(r => r.id === Number(b.dataset.pay)); if (r) manualPayment(r.resident_id,r.id); });
    $$('[data-receipt]').forEach(b => b.onclick = () => { const r = records.find(r => r.id === Number(b.dataset.receipt)); showModal('Bukti status pembayaran', `${brand()}<hr><h2>${money(r.amount)}</h2><p>${esc(r.house_unit)}<br>Iuran ${esc(r.month_name)}</p>${badge('LUNAS')}<p>Tanggal pembayaran: ${date(r.paid_at)}<br>Sumber / referensi: ${esc(r.transaction_ref) || '—'}<br>${esc(r.payment_channel) || ''}</p><div class="actions"><button id="print">Cetak / Simpan PDF</button></div>`); $('#print').onclick = printDocument; });
    $$('[data-doc]').forEach(b => b.onclick = () => { const r = records.find(r => r.id === Number(b.dataset.doc)); showModal(r.title, `<small>${esc(r.file_number)} · ${date(r.issue_date)}</small><p class="doc-body">${esc(r.content_body)}</p><p>${esc(r.official_signatory)}</p><div class="actions"><button id="print">Cetak / Simpan PDF</button></div>`); $('#print').onclick = printDocument; });
}
function importBills() {
    showModal('Impor riwayat iuran', `<p>Unggah CSV dengan kolom: <code>username,year,month,amount,status,paidAt,reference</code>.</p><p>Status: LUNAS atau BELUM_BAYAR. Riwayat yang diimpor tidak menambah saldo kas.</p><label>Berkas CSV<input type="file" id="csv-file" accept=".csv,text/csv"></label><p class="error" id="import-error" role="alert"></p><button id="upload-csv">Periksa & impor</button>`);
    $('#upload-csv').onclick = async () => {
        const b = $('#upload-csv');
        b.disabled = true;
        try {
            const f = $('#csv-file').files[0];
            if (!f)
                throw Error('Pilih berkas CSV.');
            if (f.size > 250000)
                throw Error('Ukuran CSV maksimal 250 KB.');
            const lines = (await f.text()).replace(/^\uFEFF/, '').trim().split(/\r?\n/);
            const header = lines.shift().split(',').map(x => x.trim());
            if (header.join(',') !== 'username,year,month,amount,status,paidAt,reference')
                throw Error('Kolom CSV tidak sesuai.');
            const rows = lines.filter(Boolean).map(l => {
                const cells = l.split(',').map(x => x.trim());
                if (cells.length !== 7)
                    throw Error('Setiap baris harus berisi tujuh kolom tanpa koma dalam nilai.');
                return Object.fromEntries(header.map((k, i) => [k, cells[i]]));
            });
            const d = await api('bills/import', { rows });
            modal.close();
            toast(d.message);
            await navigate('bills');
        }
        catch (e) {
            $('#import-error').textContent = e.message;
        }
        finally {
            b.disabled = false;
        }
    };
}
function printDocument() {
    if (window.PurimasPrint?.printDocument) {
        window.PurimasPrint.printDocument();
        return;
    }
    const win = window.open('', '_blank');
    if (!win) {
        toast('Izinkan jendela baru untuk mencetak.');
        return;
    }
    win.document.write('<!doctype html><html lang="id"><head><title>Dokumen Purimas</title><link rel="stylesheet" href="/style.css"></head><body style="padding:35px">' + $('#modal-body').innerHTML + '</body></html>');
    win.document.close();
    win.onload = () => win.print();
}
async function exportExcel() {
    try {
        const d = await api('cash/export-link', {});
        const a = document.createElement('a');
        a.href = d.data.url;
        a.download = 'kas-purimas.xlsx';
        document.body.append(a);
        a.click();
        a.remove();
    }
    catch (e) {
        toast(e.message);
    }
}
modal.addEventListener('click', e => {
    if (e.target === modal)
        modal.close();
});
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshPaymentAlerts();
    if (!document.hidden && token && user && !modal.open && $('#content') && !$('#profile-form'))
        navigate(page);
});
async function restoreSession(persistRefresh = true) {
    if (!token) { login(); return; }
    const expectedToken = token;
    app.innerHTML = '<div class="loading" role="status">Memuat…</div>';
    try {
        const result = await api('auth/me');
        if (token !== expectedToken) return;
        user = result.data;
        if (persistRefresh && result.token) saveToken(result.token);
        if (user.mustChangePassword) requirePasswordChange();
        else { shell(); await navigate('home'); }
    } catch (err) {
        if (!token || token !== expectedToken) return;
        app.innerHTML = `<main class="password-setup"><section class="card"><h1>Belum dapat terhubung</h1><p>Sesi masuk Anda tetap tersimpan. Periksa koneksi lalu coba lagi.</p><button id="retry-session">Coba lagi</button></section></main>`;
        $('#retry-session').onclick = () => restoreSession();
    }
}
window.addEventListener('storage', event => {
    if (event.key !== 'purimas-token' || event.newValue === token) return;
    stopPaymentAlerts(); requestId++; modal.close();
    token = event.newValue; user = null;
    restoreSession(false);
});
restoreSession();
document.addEventListener('click', event => {
    const button = event.target.closest('[data-toggle-password]');
    if (!button)
        return;
    const input = button.closest('.password-control').querySelector('input');
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(visible));
    const label = document.querySelector(`label[for="${input.id}"]`).textContent.toLowerCase();
    button.setAttribute('aria-label', `${visible ? 'Sembunyikan' : 'Tampilkan'} ${label}`);
    button.innerHTML = eyeIcon(visible);
});
async function uploadPaymentProof(file) { if (!file)
    return null; if (file.size > 8 * 1024 * 1024)
    throw Error('Bukti pembayaran maksimal 8 MB.'); const r = await fetch('/api/attachments', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': file.type, 'X-File-Kind': 'BUKTI', 'X-File-Name': encodeURIComponent(file.name) }, body: file }); const d = await r.json(); if (!r.ok)
    throw Error(d.message); return d.data.id; }
async function manualPayment(residentId = null, preselected = null) { try {
    const [residentsResult, billsResult] = await Promise.all([api('residents'),api('bills')]);
    const houses=residentsResult.data, allBills=billsResult.data;
    showModal('Catat pembayaran warga', `<p>Catat setelah dana diterima dan diperiksa bendahara. Pembayaran akan langsung berstatus lunas dan masuk ke kas.</p><form id="manual-payment-form">${select('residentId','Rumah', [['','Pilih rumah'],...houses.map(h=>[String(h.id),`${h.block_number} No. ${h.house_number}${h.full_name ? ' · '+h.full_name : ''}`])],residentId ? String(residentId) : '')}<div id="manual-months" class="month-options"></div><p class="muted" id="manual-month-note">Pilih rumah untuk melihat iuran.</p><div class="payment-total"><span>Total pembayaran</span><strong id="manual-total">${money(0)}</strong></div>${select('channel','Metode pembayaran',[['TUNAI','Tunai'],['TRANSFER','Transfer bank']])}${field('paidDate','Tanggal pembayaran','date',jakartaToday(),`max="${jakartaToday()}"`)}${field('reference','Nomor bukti / catatan pembayaran')}<p class="error" id="manual-error" role="alert"></p><div class="actions"><button type="submit">Simpan pembayaran</button></div></form>`);
    const form=$('#manual-payment-form'); let choices=[], loading=0;
    const total=()=> { $('#manual-total').textContent=money($$('#manual-months input:checked').reduce((sum,input)=>sum+Number(choices.find(b=>b.key===input.value).amount),0)); };
    async function loadMonths() {
        const rid=Number(form.querySelector('[name=residentId]').value), current=++loading;
        choices=[]; $('#manual-months').innerHTML=''; $('#manual-total').textContent=money(0);
        if (!rid) { $('#manual-month-note').textContent='Pilih rumah untuk melihat iuran.'; return; }
        $('#manual-month-note').textContent='Memuat pilihan iuran…';
        try {
            const advance=(await api('bills/advance-options?residentId='+rid)).data;
            if (current!==loading || !$('#manual-payment-form')) return;
            const issued=allBills.filter(b=>b.resident_id===rid && b.status!=='LUNAS' && !b.pending_payment_id).map(b=>({...b,key:String(b.id)}));
            const future=advance.months.map(m=>({...m,month_name:m.monthName,month_index:m.monthIndex,key:`future:${m.year}:${m.monthIndex}`,projected:true}));
            choices=[...issued,...future].sort((a,b)=>a.year-b.year || a.month_index-b.month_index);
            const pending=allBills.filter(b=>b.resident_id===rid && b.status!=='LUNAS' && b.pending_payment_id).length;
            $('#manual-month-note').textContent=(choices.length ? 'Pilih bulan yang sudah dibayar, termasuk bulan mendatang.' : 'Tidak ada bulan yang tersedia untuk dicatat.') + (pending ? ` ${pending} bulan sedang menunggu konfirmasi warga; periksa melalui menu Pembayaran.` : '');
            $('#manual-months').innerHTML=choices.map(b=>`<label class="bill-choice"><input type="checkbox" value="${esc(b.key)}" ${preselected != null && b.id===preselected ? 'checked' : ''}><span>${esc(b.month_name)}${b.projected ? ' · di muka' : ''}</span><strong>${money(b.amount)}</strong></label>`).join('');
            $$('#manual-months input').forEach(el=>el.onchange=total); total(); preselected=null;
        } catch(e) { if(current===loading && $('#manual-month-note')) $('#manual-month-note').textContent=e.message; }
    }
    form.querySelector('[name=residentId]').onchange=loadMonths;
    await loadMonths();
    form.onsubmit=async e=>{ e.preventDefault(); const button=form.querySelector('[type=submit]'); button.disabled=true; $('#manual-error').textContent='';
        try {
            const rid=Number(form.querySelector('[name=residentId]').value), selected=$$('#manual-months input:checked').map(input=>choices.find(b=>b.key===input.value));
            if(!rid || !selected.length) throw Error('Pilih rumah dan bulan yang sudah dibayar.');
            const billIds=selected.filter(b=>!b.projected).map(b=>b.id), futureMonths=selected.filter(b=>b.projected).map(b=>({year:b.year,monthIndex:b.monthIndex,amount:b.amount}));
            const result=await api('payments/manual',{residentId:rid,billIds,futureMonths,channel:form.querySelector('[name=channel]').value,paidDate:form.querySelector('[name=paidDate]').value,reference:form.querySelector('[name=reference]').value});
            modal.close(); toast(result.message); refreshPaymentAlerts(); await navigate(page);
        } catch(err) { $('#manual-error').textContent=err.message; }
        finally { button.disabled=false; }
    };
} catch(e) { toast(e.message); } }
async function payBills(preselected) { try {
    const [billResult, settingsResult, advanceResult] = await Promise.all([api('bills'), api('payment-settings'), api('bills/advance-options')]);
    const issued = billResult.data.filter(b => b.resident_id === user.residentId && b.status !== 'LUNAS' && !b.pending_payment_id).map(b => ({...b, key:String(b.id)}));
    const future = advanceResult.data.months.map(m => ({...m, month_name:m.monthName, month_index:m.monthIndex, key:`future:${m.year}:${m.monthIndex}`, projected:true}));
    const bills = [...issued,...future].sort((a,b) => a.year-b.year || a.month_index-b.month_index);
    const settings = settingsResult.data;
    if (!bills.length) {
        showModal('Iuran Anda', `<div class="success-state">${icon('check')}<h2>Tidak ada tagihan yang perlu dikonfirmasi</h2><p>Tidak ada tagihan yang tersedia. Untuk iuran bulan mendatang, hubungi bendahara jika belum tersedia.</p></div><button class="full-width" id="view-payments">Lihat riwayat pembayaran</button>`);
        $('#view-payments').onclick = () => { modal.close(); navigate('payments'); };
        return;
    }
    showModal('Bayar iuran', `<div class="steps"><span class="current">1 Pilih bulan</span><span>2 Konfirmasi</span><span>3 Verifikasi</span></div><form id="pay-form"><p class="muted">Pilih satu atau beberapa bulan, termasuk bulan mendatang. Bulan di muka yang belum terbit akan dicatat saat konfirmasi dikirim.</p><div class="month-options">${bills.map(b => `<label class="bill-choice"><input type="checkbox" name="billIds" value="${esc(b.key)}" ${preselected != null && b.id === preselected ? 'checked' : ''}><span>${esc(b.month_name)}${b.projected ? ' · di muka' : ''}</span><strong>${money(b.amount)}</strong></label>`).join('')}</div><div class="payment-total"><span>Total pembayaran</span><strong id="pay-total">${money(0)}</strong></div>${select('channel', 'Metode pembayaran', [['TUNAI', 'Tunai ke bendahara'], ...(settings ? [['TRANSFER', 'Transfer bank']] : [])])}<div id="bank-destination" hidden>${settings ? `<div class="bank-card"><small>REKENING PENERIMA IURAN</small><strong>${esc(settings.bankName)} · ${esc(settings.accountNumber)}</strong><span>a.n. ${esc(settings.accountName)}</span><button type="button" class="text-button" id="copy-account">Salin nomor rekening</button></div>` : ''}</div><p id="cash-instruction" class="inline-note">Serahkan uang kepada bendahara, lalu kirim konfirmasi ini setelah pembayaran dilakukan.</p>${field('paidDate', 'Tanggal pembayaran', 'date', new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))}${optional('reference', 'Nomor referensi / catatan pembayaran')}<label id="proof-label" hidden>Bukti transfer (JPG, PNG, PDF · maks. 8 MB)<input id="payment-proof" type="file" accept="image/jpeg,image/png,application/pdf"></label><p class="inline-note">Status iuran menjadi lunas setelah dana diverifikasi oleh bendahara.</p><p class="error" id="pay-error" role="alert"></p><div class="actions"><button type="submit">${icon('payments')} Kirim konfirmasi</button></div></form>`);
    const f = $('#pay-form');
    const updateTotal = () => { $('#pay-total').textContent = money($$('#pay-form [name=billIds]:checked').reduce((s, i) => s + Number(bills.find(b => b.key === i.value).amount), 0)); };
    $$('#pay-form [name=billIds]').forEach(i => i.onchange = updateTotal);
    updateTotal();
    f.querySelector('[name=channel]').onchange = e => { const transfer = e.target.value === 'TRANSFER'; $('#bank-destination').hidden = !transfer; $('#proof-label').hidden = !transfer; $('#payment-proof').required = transfer; $('#cash-instruction').hidden = transfer; };
    if ($('#copy-account'))
        $('#copy-account').onclick = async () => { try {
            await navigator.clipboard.writeText(settings.accountNumber);
            toast('Nomor rekening disalin.');
        }
        catch {
            toast(settings.accountNumber);
        } };
    f.onsubmit = async (e) => { e.preventDefault(); const button = f.querySelector('[type=submit]'); button.disabled = true; try {
        const selected = $$('#pay-form [name=billIds]:checked').map(i => bills.find(b => b.key === i.value));
        const ids = selected.filter(b => !b.projected).map(b => b.id);
        const futureMonths = selected.filter(b => b.projected).map(b => ({year:b.year,monthIndex:b.monthIndex,amount:b.amount}));
        if (!selected.length)
            throw Error('Pilih bulan yang akan dibayar.');
        const attachmentId = await uploadPaymentProof($('#payment-proof').files[0]);
        const d = await api('payments', { billIds: ids, futureMonths, channel: f.querySelector('[name=channel]').value, paidDate: f.querySelector('[name=paidDate]').value, reference: f.querySelector('[name=reference]').value, attachmentId });
        modal.close();
        toast(d.message);
        navigate('payments');
    }
    catch (err) {
        $('#pay-error').textContent = err.message;
    }
    finally {
        button.disabled = false;
    } };
}
catch (e) {
    toast(e.message);
} }
function paymentsPage(rows) { records = rows; const pending = rows.filter(p => p.status === 'MENUNGGU'); $('#content').innerHTML = `<div class="heading"><div><div class="eyebrow">IURAN LINGKUNGAN</div><h1>${is('WARGA', 'SEKRETARIS') ? 'Pembayaran saya' : 'Konfirmasi pembayaran'}</h1><p class="muted">${is('WARGA', 'SEKRETARIS') ? 'Pantau konfirmasi dan riwayat pembayaran Anda.' : 'Periksa dana yang diterima sebelum menyetujui pembayaran.'}</p></div>${is('WARGA', 'SEKRETARIS') ? `<button id="make-payment">${icon('plus')} Bayar iuran</button>` : is('BENDAHARA') ? `<div class="row"><button id="manual-payment">Catat pembayaran warga</button><button class="soft" id="bank-settings">${icon('settings')} Rekening penerima</button></div>` : ''}</div><div class="stats compact-stats">${stat('Menunggu konfirmasi', pending.length, 'Pembayaran perlu diperiksa', 'clock')}${stat('Disetujui', rows.filter(p => p.status === 'DISETUJUI').length, 'Sudah masuk buku kas', 'check')}${stat('Nominal menunggu', money(pending.reduce((s, p) => s + Number(p.amount), 0)), 'Belum menambah saldo kas', 'payments')}</div><div class="toolbar"><input id="payment-search" aria-label="Cari pembayaran" placeholder="Cari rumah atau referensi…"><select id="payment-status" aria-label="Status pembayaran"><option value="">Semua status</option><option value="MENUNGGU">Menunggu</option><option value="DISETUJUI">Disetujui</option><option value="DITOLAK">Ditolak</option></select></div><div id="payment-results"></div>`; function render() { const status = $('#payment-status').value, q = $('#payment-search').value.toLowerCase(); const data = rows.filter(p => (!status || p.status === status) && `${p.block_number} ${p.house_number} ${p.reference}`.toLowerCase().includes(q)); $('#payment-results').innerHTML = data.length ? `<div class="payment-list">${data.map(p => `<article class="card payment-row"><div class="payment-avatar">${icon(p.channel === 'TUNAI' ? 'cash' : 'payments')}</div><div class="payment-info"><strong>${esc(p.block_number)} No. ${esc(p.house_number)}</strong><p>${p.bills.map(b => esc(b.month_name)).join(' · ')}</p><small>${p.channel === 'TUNAI' ? 'Tunai' : 'Transfer bank'} · ${date(p.paid_date)} · #PAY-${p.id}</small></div><div class="payment-amount"><strong>${money(p.amount)}</strong>${badge(p.status)}</div><button class="soft" data-payment="${p.id}">${is('BENDAHARA') && p.status === 'MENUNGGU' ? 'Periksa' : 'Detail'} ${icon('arrow')}</button></article>`).join('')}</div>` : `<div class="card empty-state">${icon('payments')}<h2>Belum ada konfirmasi pembayaran</h2><p>${is('WARGA', 'SEKRETARIS') ? 'Pilih tagihan di menu Iuran untuk mulai membayar.' : 'Konfirmasi yang dikirim warga akan tampil di sini.'}</p></div>`; $$('[data-payment]').forEach(b => b.onclick = () => paymentDetail(rows.find(r => String(r.id) === b.dataset.payment))); } $('#payment-search').oninput = render; $('#payment-status').onchange = render; if ($('#make-payment'))
    $('#make-payment').onclick = () => payBills(); if ($('#manual-payment')) $('#manual-payment').onclick = () => manualPayment(); if ($('#bank-settings'))
    $('#bank-settings').onclick = bankSettings; render(); }
async function bankSettings() { try {
    const { data: s } = await api('payment-settings');
    formModal('Rekening penerima iuran', field('bankName', 'Nama bank', 'text', s?.bankName || '') + field('accountNumber', 'Nomor rekening', 'text', s?.accountNumber || '', 'inputmode="numeric"') + field('accountName', 'Atas nama', 'text', s?.accountName || ''), 'payment-settings');
}
catch (e) {
    toast(e.message);
} }
function paymentDetail(p) { showModal('Konfirmasi #PAY-' + p.id, `<div class="payment-total"><span>${esc(p.block_number)} No. ${esc(p.house_number)}</span><strong>${money(p.amount)}</strong></div>${badge(p.status)}<div class="detail-grid" style="margin-top:20px"><p><small>Metode</small><br>${p.channel === 'TUNAI' ? 'Tunai ke bendahara' : 'Transfer bank'}</p><p><small>Tanggal pembayaran</small><br>${date(p.paid_date)}</p><p><small>Referensi</small><br>${esc(p.reference) || '—'}</p><p><small>Tagihan</small><br>${p.bills.map(b => esc(b.month_name)).join('<br>')}</p></div>${p.attachment_id ? '<button class="soft" id="show-proof">' + icon('documents') + ' Tampilkan bukti pembayaran</button><div id="proof-preview"></div>' : ''}${p.note ? `<div class="inline-note">${esc(p.note)}</div>` : ''}${is('BENDAHARA') && p.status === 'MENUNGGU' ? `<form id="payment-review">${select('status', 'Hasil pemeriksaan', [['DISETUJUI', 'Setujui — dana sudah diterima'], ['DITOLAK', 'Tolak — perlu diperbaiki']])}${area('note', 'Catatan untuk warga', '', false)}<p class="error" id="payment-review-error" role="alert"></p><div class="actions"><button type="submit">Simpan hasil pemeriksaan</button></div></form>` : ''}`); if ($('#show-proof'))
    $('#show-proof').onclick = async () => { try {
        const d = (await api(`attachments/${p.attachment_id}/link`, {})).data;
        $('#proof-preview').innerHTML = d.mimeType.startsWith('image/') ? `<img class="proof-image" src="${esc(d.url)}" alt="Bukti pembayaran">` : `<a class="button soft" href="${esc(d.url)}" download>Unduh bukti PDF</a>`;
    }
    catch (e) {
        toast(e.message);
    } }; if ($('#payment-review')) {
    const f = $('#payment-review');
    f.querySelector('[name=status]').onchange = e => f.querySelector('[name=note]').required = e.target.value === 'DITOLAK';
    f.onsubmit = async (e) => { e.preventDefault(); const b = f.querySelector('[type=submit]'); b.disabled = true; try {
        const d = await api(`payments/${p.id}/review`, Object.fromEntries(new FormData(f)));
        modal.close();
        toast(d.message);
        navigate('payments');
    }
    catch (err) {
        $('#payment-review-error').textContent = err.message;
    }
    finally {
        b.disabled = false;
    } };
} }
function transparencyPage(d) { $('#content').innerHTML = `<div class="heading"><div><div class="eyebrow">TRANSPARANSI LINGKUNGAN</div><h1>Kas kita, terbuka bersama</h1><p class="muted">Ringkasan keuangan yang dicatat dan diverifikasi bendahara.</p></div></div><div class="balance-banner"><div><span>Saldo kas lingkungan</span><strong>${money(d.cash.currentBalance)}</strong><small>${d.cash.asOf ? 'Pencatatan terakhir ' + date(d.cash.asOf) : 'Belum ada pencatatan'}</small></div><span class="balance-symbol">${icon('cash')}</span></div><div class="stats two-stats">${stat('Total kas masuk', money(d.cash.totalIncome), 'Termasuk saldo awal', 'cash')}${stat('Total kas keluar', money(d.cash.totalExpense), 'Pengeluaran lingkungan', 'reports')}</div><div class="card">${sectionTitle('Dana digunakan untuk', 'Pengeluaran per kategori')}${expenseBars(d.categories)}</div><div class="inline-note privacy-note">${icon('check')} Informasi saldo terbuka untuk warga. Pencatatan dan perubahan transaksi dilakukan oleh bendahara.</div>`; }
let currentReport = null;
async function reportsPage() { currentReport = null; const year = Number(jakartaToday().slice(0, 4)); $('#content').innerHTML = `<div class="heading"><div><div class="eyebrow">KEUANGAN LINGKUNGAN</div><h1>Laporan debit & kredit</h1><p class="muted">Pilih periode, periksa saldo, lalu unduh laporan Excel.</p></div><div class="row"><button id="report-excel">${icon('download')} Unduh Excel</button></div></div><form id="report-filters" class="card report-filters"><label>Tahun laporan<input id="report-year" type="number" min="2020" max="2200" value="${year}"></label>${field('from', 'Dari tanggal', 'date', `${year}-01-01`)}${field('to', 'Sampai tanggal', 'date', jakartaToday())}${select('type', 'Jenis transaksi', [['', 'Semua transaksi'], ['MASUK', 'Debit / kas masuk'], ['KELUAR', 'Kredit / kas keluar']])}<button type="submit">Tampilkan laporan</button></form><div id="report-results"><div class="loading">Memuat laporan…</div></div>`; const load = async () => { const filters = Object.fromEntries(new FormData($('#report-filters'))); const d = (await api('reports/cash?' + new URLSearchParams(filters))).data; currentReport = d; $('#report-excel').disabled = false; $('#report-results').innerHTML = `<div class="stats kpi-grid">${stat('Saldo awal periode', money(d.summary.opening), 'Sebelum ' + date(d.period.from), 'cash')}${stat('Debit / kas masuk', money(d.summary.income), 'Seluruh penerimaan dalam periode', 'payments')}${stat('Kredit / kas keluar', money(d.summary.expense), 'Seluruh pengeluaran dalam periode', 'reports')}${stat('Saldo akhir periode', money(d.summary.closing), 'Per ' + date(d.period.to), 'cash')}</div><section class="card report-table-card">${sectionTitle('Rincian transaksi', date(d.period.from) + ' — ' + date(d.period.to))}${reportTable(d)}</section>`; bindCashProofButtons(); }; const markReportChanged = () => { currentReport = null; $('#report-excel').disabled = true; }; $('#report-filters').addEventListener('input', markReportChanged); $('#report-year').addEventListener('change', () => { const y = Number($('#report-year').value); if (Number.isInteger(y) && y >= 2020 && y <= 2200) { $('#report-filters [name=from]').value = `${y}-01-01`; $('#report-filters [name=to]').value = `${y}-12-31`; markReportChanged(); } }); $('#report-filters').onsubmit = async (e) => { e.preventDefault(); try {
    await load();
}
catch (err) {
    toast(err.message);
} }; $('#report-excel').onclick = async () => { try {
    if (!currentReport)
        return;
    const d = await api('reports/cash/export-link', currentReport.period);
    downloadLink(d.data.url, 'laporan-kas-purimas.xlsx');
}
catch (e) {
    toast(e.message);
} }; await load(); }
function reportTable(d) { let balance = d.summary.opening; return d.rows.length ? table(['Tanggal', 'Transaksi', 'Kategori', 'Debit (Rp)', 'Kredit (Rp)', 'Bukti'], d.rows.map(r => `<tr><td>${date(r.date)}</td><td><strong>${esc(r.title)}</strong><small>${esc(r.recorded_by)}</small></td><td>${esc(r.category)}</td><td class="number ${r.type === 'MASUK' ? 'positive' : ''}">${r.type === 'MASUK' ? money(r.amount) : '—'}</td><td class="number ${r.type === 'KELUAR' ? 'negative' : ''}">${r.type === 'KELUAR' ? money(r.amount) : '—'}</td><td>${cashProofCell(r)}</td></tr>`)) : empty('Tidak ada transaksi dalam periode ini.'); }
function downloadLink(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); }
