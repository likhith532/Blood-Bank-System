// ============================================
// BLOOD BANK - FRONTEND / BACKEND INTEGRATION
// Wires the landing page to the Express API.
// ============================================

const API_BASE = window.location.origin + '/api';
const TOKEN_KEY = 'bloodbank_token';
const USER_KEY = 'bloodbank_user';

// ---------- Toast notifications ----------
function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(40px)';
        setTimeout(() => el.remove(), 300);
    }, 4000);
}

// ---------- API helper ----------
async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
        const firstError = data.errors && data.errors.length ? data.errors[0].msg : null;
        throw new Error(firstError || data.message || `Request failed (${res.status})`);
    }
    return data;
}

// ---------- Modal handling ----------
function openModal(name) {
    closeModals();
    const modal = document.getElementById(`${name}Modal`);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
}

function bindModalControls() {
    document.querySelectorAll('[data-open]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('mobileMenu')?.classList.remove('active');
            openModal(btn.getAttribute('data-open'));
        });
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    document.querySelectorAll('[data-switch]').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.getAttribute('data-switch')));
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModals();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModals();
    });
}

// ---------- Auth state ----------
function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
        return null;
    }
}

function setSession(user, token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    renderAuthArea();
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    renderAuthArea();
    toast('You have been logged out', 'info');
}

function renderAuthArea() {
    const area = document.getElementById('authArea');
    if (!area) return;
    const user = getUser();

    if (user) {
        const initial = (user.name || user.email || '?').charAt(0).toUpperCase();
        area.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                    <div class="w-9 h-9 bg-gradient-to-br from-red-600 to-red-400 rounded-full flex items-center justify-center font-bold">${initial}</div>
                    <div class="leading-tight">
                        <p class="text-sm font-semibold">${user.name || user.email}</p>
                        <p class="text-xs text-gray-400 capitalize">${user.role || ''}${user.bloodType ? ' · ' + user.bloodType : ''}</p>
                    </div>
                </div>
                <button id="logoutBtn" class="px-5 py-2.5 rounded-xl border-2 border-red-500 text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-all">Logout</button>
            </div>`;
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        area.innerHTML = `
            <button data-open="login" class="px-6 py-2.5 rounded-xl border-2 border-red-500 text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-all">Login</button>
            <button data-open="register" class="px-6 py-2.5 rounded-xl gradient-btn text-white font-semibold">Register</button>`;
        area.querySelectorAll('[data-open]').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-open')));
        });
    }
}

// ---------- Form submit helpers ----------
function setLoading(button, loading, defaultText) {
    if (!button) return;
    if (loading) {
        button.dataset.text = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.text || defaultText;
    }
}

function bindForms() {
    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('button[type="submit"]');
        const fd = new FormData(loginForm);
        setLoading(btn, true);
        try {
            const res = await apiRequest('/auth/login', {
                method: 'POST',
                body: { email: fd.get('email'), password: fd.get('password') }
            });
            setSession(res.data.user, res.data.token);
            toast(`Welcome back, ${res.data.user.name}!`, 'success');
            closeModals();
            loginForm.reset();
        } catch (err) {
            toast(err.message, 'error');
        } finally {
            setLoading(btn, false, 'Sign In');
        }
    });

    const registerForm = document.getElementById('registerForm');
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = registerForm.querySelector('button[type="submit"]');
        const fd = new FormData(registerForm);
        setLoading(btn, true);
        try {
            const res = await apiRequest('/auth/register', {
                method: 'POST',
                body: {
                    name: fd.get('name'),
                    email: fd.get('email'),
                    password: fd.get('password'),
                    phone: fd.get('phone'),
                    role: fd.get('role'),
                    bloodType: fd.get('bloodType'),
                    gender: fd.get('gender'),
                    dateOfBirth: fd.get('dateOfBirth')
                }
            });
            setSession(res.data.user, res.data.token);
            toast('Account created successfully!', 'success');
            closeModals();
            registerForm.reset();
        } catch (err) {
            toast(err.message, 'error');
        } finally {
            setLoading(btn, false, 'Create Account');
        }
    });

    const contactForm = document.getElementById('contactForm');
    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button[type="submit"]');
        const fd = new FormData(contactForm);
        setLoading(btn, true);
        try {
            await apiRequest('/contact/contact', {
                method: 'POST',
                body: {
                    name: fd.get('name'),
                    email: fd.get('email'),
                    subject: fd.get('subject'),
                    message: fd.get('message')
                }
            });
            toast('Message sent! We will get back to you soon.', 'success');
            contactForm.reset();
        } catch (err) {
            toast(err.message, 'error');
        } finally {
            setLoading(btn, false, '<span>Send Message</span> <i class="fas fa-paper-plane"></i>');
        }
    });
}

// ---------- Live inventory ----------
function stockMeta(status) {
    switch (status) {
        case 'critical': return { label: 'Critical', color: 'text-red-400', bar: 'from-red-600 to-red-500' };
        case 'low': return { label: 'Low Stock', color: 'text-yellow-400', bar: 'from-yellow-600 to-yellow-400' };
        case 'high': return { label: 'Well Stocked', color: 'text-green-400', bar: 'from-green-600 to-green-400' };
        default: return { label: 'Available', color: 'text-green-400', bar: 'from-red-600 to-red-400' };
    }
}

async function loadInventory() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    try {
        const res = await apiRequest('/inventory');
        const inventory = res.data.inventory || [];
        if (!inventory.length) return;

        grid.innerHTML = inventory.map(item => {
            const meta = stockMeta(item.stockStatus);
            const pct = Math.max(4, Math.min(100, item.stockPercentage || 0));
            return `
                <div class="blood-type-card p-8 rounded-3xl card-hover">
                    <div class="flex items-center justify-between mb-6">
                        <div class="w-14 h-14 bg-red-600/20 rounded-2xl flex items-center justify-center">
                            <i class="fas fa-tint text-red-500 text-2xl"></i>
                        </div>
                        <span class="${meta.color} text-sm font-semibold">${meta.label}</span>
                    </div>
                    <h3 class="text-4xl font-black text-red-400 mb-2">${item.bloodType}</h3>
                    <p class="text-3xl font-bold text-white mb-1">${item.availableUnits}</p>
                    <p class="text-gray-500">Units Available</p>
                    <div class="mt-6 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r ${meta.bar}" style="width: ${pct}%"></div>
                    </div>
                </div>`;
        }).join('');
    } catch (err) {
        console.error('Failed to load inventory:', err);
    }
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    bindModalControls();
    bindForms();
    renderAuthArea();
    loadInventory();
});
