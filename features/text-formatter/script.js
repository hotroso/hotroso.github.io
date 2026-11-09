// Text Formatter
(function () {
    // Áp dụng fn cho ký tự đầu của mỗi từ (giữ nguyên khoảng trắng, xuống dòng)
    const eachWordFirst = (text, fn) => text.replace(/(^|\s)(\S)/gu, (m, space, ch) => space + fn(ch));

    const swapCase = (text) => Array.from(text).map(ch => {
        const upper = ch.toUpperCase();
        return ch === upper ? ch.toLowerCase() : upper;
    }).join('');

    const initials = (text) => text.trim().split(/\s+/)
        .map(word => Array.from(word)[0] || '')
        .join('')
        .toUpperCase();

    // Ngắt dòng theo độ dài, giữ nguyên các đoạn đã xuống dòng sẵn
    const wrap = (text, width) => text.split('\n').map(line => {
        const words = line.split(/ +/);
        const lines = [];
        let current = '';
        words.forEach(word => {
            if (current && (current + ' ' + word).length > width) {
                lines.push(current);
                current = word;
            } else {
                current = current ? current + ' ' + word : word;
            }
        });
        lines.push(current);
        return lines.join('\n');
    }).join('\n');

    Tools.register('text-formatter', {
        init(root) {
            UI.transformTool(root, {
                example: 'hôm nay trời đẹp, chúng ta cùng đi CÀ PHÊ nhé',
                actions: {
                    capitalize: v => eachWordFirst(v, c => c.toUpperCase()),
                    capitalizeFully: v => eachWordFirst(v.toLowerCase(), c => c.toUpperCase()),
                    uncapitalize: v => eachWordFirst(v, c => c.toLowerCase()),
                    swapCase,
                    initials,
                    wrap: (v, r) => {
                        const n = parseInt(r.querySelector('[data-option="wrap-length"]').value, 10);
                        const width = Math.min(200, Math.max(10, isNaN(n) ? 80 : n));
                        return wrap(v, width);
                    }
                }
            });
        }
    });
})();
