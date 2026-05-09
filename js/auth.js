// Auth module - dùng chung toàn trang
const Auth = (() => {
    const API = 'https://3093baeeb9.hotrogiaiphapso.info';
    const KEYS = { access: 'auth_access', refresh: 'auth_refresh', user: 'auth_user' };

    let _refreshTimer = null;

    function getAccessToken()  { return localStorage.getItem(KEYS.access); }
    function getRefreshToken() { return localStorage.getItem(KEYS.refresh); }
    function getUser()         { const u = localStorage.getItem(KEYS.user); return u ? JSON.parse(u) : null; }
    function isLoggedIn()      { return !!getUser(); }

    function _save(access, refresh, username) {
        localStorage.setItem(KEYS.access,  access);
        localStorage.setItem(KEYS.refresh, refresh);
        localStorage.setItem(KEYS.user,    JSON.stringify({ username }));
        _scheduleRefresh(access);
        _updateWidget();
    }

    function _clear() {
        localStorage.removeItem(KEYS.access);
        localStorage.removeItem(KEYS.refresh);
        localStorage.removeItem(KEYS.user);
        clearTimeout(_refreshTimer);
        _updateWidget();
    }

    // Tự động refresh access token trước khi hết hạn 60s
    function _scheduleRefresh(token) {
        clearTimeout(_refreshTimer);
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const msLeft  = (payload.exp * 1000) - Date.now() - 60000;
            if (msLeft > 0) _refreshTimer = setTimeout(_doRefresh, msLeft);
            else _doRefresh();
        } catch { _doRefresh(); }
    }

    async function _doRefresh() {
        const rt = getRefreshToken();
        if (!rt) return _clear();
        try {
            const res  = await _post('/auth/refresh', { refresh_token: rt });
            const data = await res.json();
            if (data.access_token) _save(data.access_token, data.refresh_token, data.username);
            else _clear();
        } catch { /* giữ nguyên, thử lại lần sau */ }
    }

    async function _post(path, body) {
        return fetch(API + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    // Fetch có auth header, tự refresh nếu 401
    async function authFetch(path, opts = {}) {
        opts.headers = { ...(opts.headers || {}), 'Authorization': 'Bearer ' + getAccessToken() };
        let res = await fetch(API + path, opts);
        if (res.status === 401) {
            await _doRefresh();
            opts.headers['Authorization'] = 'Bearer ' + getAccessToken();
            res = await fetch(API + path, opts);
        }
        return res;
    }

    async function register(username, password) {
        const res  = await _post('/auth/register', { username, password, agreed: true });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
        _save(data.access_token, data.refresh_token, data.username);
        return data;
    }

    async function login(username, password) {
        const res  = await _post('/auth/login', { username, password });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
        _save(data.access_token, data.refresh_token, data.username);
        return data;
    }

    async function logout() {
        const rt = getRefreshToken();
        if (rt) _post('/auth/logout', { refresh_token: rt }).catch(() => {});
        _clear();
        document.dispatchEvent(new Event('auth:logout'));
    }

    // ── Widget UI ──────────────────────────────────────────────────────────
    function _updateWidget() {
        const widget = document.getElementById('auth-widget');
        if (!widget) return;
        const user = getUser();
        if (user) {
            widget.innerHTML = `
                <span class="auth-username">👤 ${escHtml(user.username)}</span>
                <button class="auth-btn" id="auth-logout-btn">Đăng xuất</button>`;
            document.getElementById('auth-logout-btn').addEventListener('click', async () => {
                await logout();
            });
        } else {
            widget.innerHTML = `<button class="auth-btn" id="auth-open-btn">Đăng nhập / Đăng ký</button>`;
            document.getElementById('auth-open-btn').addEventListener('click', () => openModal());
        }
    }

    function openModal(tab = 'login') {
        let modal = document.getElementById('auth-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'auth-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
            <div class="modal-box">
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Đăng nhập</button>
                    <button class="auth-tab" data-tab="register">Đăng ký</button>
                </div>

                <div id="auth-tab-login">
                    <div class="form-group"><label>Username</label><input id="login-username" type="text" autocomplete="username"></div>
                    <div class="form-group"><label>Password</label><input id="login-password" type="password" autocomplete="current-password"></div>
                    <div id="login-error" class="auth-error"></div>
                    <div class="modal-actions">
                        <button class="btn" id="login-submit-btn">Đăng nhập</button>
                        <button class="btn btn-secondary" id="auth-modal-close">Đóng</button>
                    </div>
                </div>

                <div id="auth-tab-register" style="display:none">
                    <div class="form-group"><label>Username</label><input id="reg-username" type="text" autocomplete="username"></div>
                    <div class="form-group"><label>Password</label><input id="reg-password" type="password" autocomplete="new-password"></div>
                    <div class="auth-terms">
                        <label><input type="checkbox" id="reg-agree">
                        Tôi đồng ý <a href="#" id="terms-link">điều khoản sử dụng</a> — hệ thống sẽ lưu trữ dữ liệu hoạt động của bạn (IP, User Agent, nội dung QR...) cho mục đích thống kê.</label>
                    </div>
                    <div id="reg-error" class="auth-error"></div>
                    <div class="modal-actions">
                        <button class="btn" id="reg-submit-btn">Đăng ký</button>
                        <button class="btn btn-secondary" id="auth-modal-close2">Đóng</button>
                    </div>
                </div>
            </div>`;
            document.body.appendChild(modal);

            // Tab switch
            modal.querySelectorAll('.auth-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('auth-tab-login').style.display    = btn.dataset.tab === 'login'    ? '' : 'none';
                    document.getElementById('auth-tab-register').style.display = btn.dataset.tab === 'register' ? '' : 'none';
                });
            });

            modal.querySelector('#auth-modal-close').addEventListener('click',  () => modal.remove());
            modal.querySelector('#auth-modal-close2').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

            document.getElementById('login-submit-btn').addEventListener('click', async () => {
                const btn = document.getElementById('login-submit-btn');
                const err = document.getElementById('login-error');
                btn.disabled = true; err.textContent = '';
                try {
                    await login(
                        document.getElementById('login-username').value.trim(),
                        document.getElementById('login-password').value
                    );
                    modal.remove();
                    document.dispatchEvent(new Event('auth:login'));
                } catch (e) { err.textContent = e.message; }
                finally { btn.disabled = false; }
            });

            document.getElementById('reg-submit-btn').addEventListener('click', async () => {
                const btn = document.getElementById('reg-submit-btn');
                const err = document.getElementById('reg-error');
                if (!document.getElementById('reg-agree').checked) {
                    err.textContent = 'Bạn phải đồng ý điều khoản'; return;
                }
                btn.disabled = true; err.textContent = '';
                try {
                    await register(
                        document.getElementById('reg-username').value.trim(),
                        document.getElementById('reg-password').value
                    );
                    modal.remove();
                    document.dispatchEvent(new Event('auth:login'));
                } catch (e) { err.textContent = e.message; }
                finally { btn.disabled = false; }
            });
        }

        // Switch tab nếu cần
        modal.querySelector(`[data-tab="${tab}"]`)?.click();
        modal.style.display = 'flex';
    }

    function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // Init: khôi phục session
    function init() {
        const at = getAccessToken();
        if (at) _scheduleRefresh(at);
        // Widget render sau khi DOM sẵn sàng
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _updateWidget);
        } else {
            _updateWidget();
        }
    }

    return { init, isLoggedIn, getUser, getAccessToken, authFetch, login, logout, register, openModal };
})();

Auth.init();
