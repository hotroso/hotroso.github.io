// Random Generator: dùng crypto.getRandomValues (an toàn cho mật khẩu)
(function () {
    const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOWER = 'abcdefghijklmnopqrstuvwxyz';
    const DIGITS = '0123456789';
    const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let ASCII = '';
    for (let c = 32; c < 127; c++) ASCII += String.fromCharCode(c);

    // Số ngẫu nhiên đều trong [0, max) - loại bỏ sai lệch modulo
    function randomInt(max) {
        const limit = Math.floor(0x100000000 / max) * max;
        const buf = new Uint32Array(1);
        do {
            crypto.getRandomValues(buf);
        } while (buf[0] >= limit);
        return buf[0] % max;
    }

    function randomString(chars, length) {
        let out = '';
        for (let i = 0; i < length; i++) out += chars[randomInt(chars.length)];
        return out;
    }

    // Mật khẩu luôn có đủ chữ hoa, chữ thường, số và ký tự đặc biệt (khi đủ dài)
    function password(length) {
        const sets = [UPPER, LOWER, DIGITS, SYMBOLS];
        const all = sets.join('');
        const chars = Array.from({ length }, () => all[randomInt(all.length)]);
        if (length >= sets.length) {
            const slots = Array.from({ length }, (_, i) => i);
            sets.forEach(set => {
                const slot = slots.splice(randomInt(slots.length), 1)[0];
                chars[slot] = set[randomInt(set.length)];
            });
        }
        return chars.join('');
    }

    function uuid() {
        if (crypto.randomUUID) return crypto.randomUUID();
        const b = crypto.getRandomValues(new Uint8Array(16));
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }

    const readNumber = (root, name, min, max, fallback) => {
        const n = parseInt(root.querySelector(`[data-option="${name}"]`).value, 10);
        return Math.min(max, Math.max(min, isNaN(n) ? fallback : n));
    };

    // Tạo "count" kết quả, mỗi dòng một kết quả
    const many = (makeOne) => (value, root) => {
        const length = readNumber(root, 'length', 1, 1000, 16);
        const count = readNumber(root, 'count', 1, 100, 1);
        return Array.from({ length: count }, () => makeOne(length)).join('\n');
    };

    Tools.register('random-generator', {
        init(root) {
            UI.transformTool(root, {
                requireInput: false,
                actions: {
                    password: many(password),
                    uuid: many(() => uuid()),
                    alphanumeric: many(n => randomString(UPPER + LOWER + DIGITS, n)),
                    alphabetic: many(n => randomString(UPPER + LOWER, n)),
                    numeric: many(n => randomString(DIGITS, n)),
                    hex: many(n => randomString('0123456789abcdef', n)),
                    ascii: many(n => randomString(ASCII, n))
                }
            });
        }
    });
})();
