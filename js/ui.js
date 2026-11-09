/*
 * Tiện ích giao diện dùng chung cho hub DevTools.
 *  - Tools: nơi mỗi công cụ đăng ký hàm init(root, feature). app.js gọi init mỗi lần mở công cụ,
 *           init có thể trả về một hàm dọn dẹp (tắt camera, gỡ listener...) được gọi khi rời công cụ.
 *  - UI.toast / UI.copy: thông báo nhỏ và sao chép vào clipboard.
 *  - UI.transformTool: hành vi chuẩn cho công cụ dạng "nhập -> xử lý -> kết quả".
 *  - UI.toggleTheme: chuyển giao diện sáng/tối.
 */
(function () {
    // ── Registry công cụ ──────────────────────────────────────────────────
    const registry = {};
    window.Tools = {
        register(ids, def) {
            [].concat(ids).forEach(id => { registry[id] = def; });
        },
        get(id) {
            return registry[id];
        }
    };

    // ── Toast ─────────────────────────────────────────────────────────────
    let toastRoot = null;
    function toast(message, type = 'success', ms = 2200) {
        if (!toastRoot) {
            toastRoot = document.createElement('div');
            toastRoot.className = 'toast-root';
            toastRoot.setAttribute('role', 'status');
            toastRoot.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastRoot);
        }
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.textContent = message;
        toastRoot.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 250);
        }, ms);
    }

    // ── Sao chép ──────────────────────────────────────────────────────────
    async function copy(text) {
        if (!text) {
            toast('Chưa có kết quả để sao chép', 'info');
            return false;
        }
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Dự phòng cho trình duyệt cũ / trang không chạy HTTPS
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            if (!ok) {
                toast('Không sao chép được, hãy chọn và copy thủ công', 'error');
                return false;
            }
        }
        toast('Đã sao chép');
        return true;
    }

    /*
     * Công cụ dạng "nhập -> xử lý -> kết quả".
     * HTML cần có: [data-role="input"], [data-role="output"], [data-role="error"],
     *              [data-count="input|output"] (tuỳ chọn), button[data-action="<tên>"].
     * Các action có sẵn: copy, clear, example.
     * opts.actions: { tên: (value, root) => string | { output?, message?, type? } | Promise }
     * opts.example: chuỗi ví dụ cho nút "Thử ví dụ"
     * opts.primary: action chạy khi bấm Ctrl+Enter / Thử ví dụ (mặc định là action đầu tiên)
     * opts.requireInput: false nếu công cụ không cần ô nhập (vd. Random Generator)
     */
    function transformTool(root, opts) {
        const input = root.querySelector('[data-role="input"]');
        const output = root.querySelector('[data-role="output"]');
        const errorEl = root.querySelector('[data-role="error"]');
        const actions = opts.actions || {};
        const requireInput = opts.requireInput !== false && !!input;
        const primary = opts.primary || Object.keys(actions)[0];

        const setError = (msg) => {
            if (!errorEl) {
                if (msg) toast(msg, 'error');
                return;
            }
            errorEl.textContent = msg || '';
            errorEl.hidden = !msg;
            if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        };

        const updateCounts = () => {
            root.querySelectorAll('[data-count]').forEach(el => {
                const src = el.dataset.count === 'output' ? output : input;
                if (src) el.textContent = src.value.length.toLocaleString('vi-VN') + ' ký tự';
            });
        };

        async function run(name) {
            const fn = actions[name];
            if (!fn) return;
            setError('');
            const value = input ? input.value : '';
            if (requireInput && !value.trim()) {
                setError('Vui lòng nhập nội dung.');
                input.focus();
                return;
            }
            try {
                const res = await fn(value, root);
                if (res && typeof res === 'object') {
                    if ('output' in res && output) output.value = res.output;
                    if (res.message) toast(res.message, res.type || 'success');
                } else if (output && res !== undefined) {
                    output.value = res;
                }
            } catch (e) {
                if (output) output.value = '';
                setError(e && e.message ? e.message : String(e));
            }
            updateCounts();
        }

        root.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || !root.contains(btn)) return;
            const name = btn.dataset.action;
            if (name === 'copy') {
                copy(output ? output.value : '');
            } else if (name === 'clear') {
                if (input) input.value = '';
                if (output) output.value = '';
                setError('');
                updateCounts();
                if (input) input.focus();
            } else if (name === 'example') {
                if (input && opts.example) {
                    input.value = opts.example;
                    run(primary);
                }
            } else {
                run(name);
            }
        });

        if (input) {
            input.addEventListener('input', () => {
                setError('');
                updateCounts();
            });
            input.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    run(primary);
                }
            });
        }

        if (!opts.example) {
            root.querySelectorAll('[data-action="example"]').forEach(b => { b.hidden = true; });
        }
        updateCounts();
        return { run, setError };
    }

    // ── Giao diện sáng / tối ─────────────────────────────────────────────
    const THEME_KEY = 'theme';
    const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            const isDark = theme === 'dark';
            const label = isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
            btn.textContent = isDark ? '☀️' : '🌙';
            btn.setAttribute('aria-label', label);
            btn.title = label;
        }
    }

    function toggleTheme() {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch { /* bỏ qua */ }
        applyTheme(next);
    }

    // Theo hệ điều hành nếu người dùng chưa tự chọn
    if (darkQuery && darkQuery.addEventListener) {
        darkQuery.addEventListener('change', (e) => {
            let saved = null;
            try { saved = localStorage.getItem(THEME_KEY); } catch { /* bỏ qua */ }
            if (!saved) applyTheme(e.matches ? 'dark' : 'light');
        });
    }

    function initThemeToggle() {
        applyTheme(document.documentElement.dataset.theme || 'light');
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.addEventListener('click', toggleTheme);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initThemeToggle);
    else initThemeToggle();

    window.UI = { toast, copy, transformTool, toggleTheme, applyTheme };
})();
