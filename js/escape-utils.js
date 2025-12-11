// Escape utilities based on Apache Commons Lang StringEscapeUtils

const EscapeUtils = {
    // Java/JavaScript escape
    escapeJava(str) {
        if (!str) return '';
        return str.split('').map(ch => {
            const code = ch.charCodeAt(0);
            if (code > 0xFFF) return '\\u' + code.toString(16).toUpperCase();
            if (code > 0xFF) return '\\u0' + code.toString(16).toUpperCase();
            if (code > 0x7F) return '\\u00' + code.toString(16).toUpperCase();
            if (code < 0x20) {
                switch (ch) {
                    case '\b': return '\\b';
                    case '\t': return '\\t';
                    case '\n': return '\\n';
                    case '\f': return '\\f';
                    case '\r': return '\\r';
                    default: return code > 0xF ? '\\u00' + code.toString(16).toUpperCase() : '\\u000' + code.toString(16).toUpperCase();
                }
            }
            switch (ch) {
                case '"': return '\\"';
                case '\\': return '\\\\';
                default: return ch;
            }
        }).join('');
    },

    unescapeJava(str) {
        if (!str) return '';
        let result = '';
        let i = 0;
        while (i < str.length) {
            if (str[i] === '\\' && i + 1 < str.length) {
                const next = str[i + 1];
                switch (next) {
                    case 'b': result += '\b'; i += 2; break;
                    case 't': result += '\t'; i += 2; break;
                    case 'n': result += '\n'; i += 2; break;
                    case 'f': result += '\f'; i += 2; break;
                    case 'r': result += '\r'; i += 2; break;
                    case '"': result += '"'; i += 2; break;
                    case "'": result += "'"; i += 2; break;
                    case '\\': result += '\\'; i += 2; break;
                    case 'u':
                        if (i + 5 < str.length) {
                            const hex = str.substring(i + 2, i + 6);
                            result += String.fromCharCode(parseInt(hex, 16));
                            i += 6;
                        } else {
                            result += str[i++];
                        }
                        break;
                    default: result += next; i += 2;
                }
            } else {
                result += str[i++];
            }
        }
        return result;
    },

    // HTML escape
    escapeHtml(str) {
        if (!str) return '';
        const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
        return str.replace(/[&<>"']/g, m => map[m]);
    },

    unescapeHtml(str) {
        if (!str) return '';
        const map = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'"};
        return str.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, m => map[m] || m);
    },

    // XML escape
    escapeXml(str) {
        if (!str) return '';
        const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'};
        return str.replace(/[&<>"']/g, m => map[m]);
    },

    unescapeXml(str) {
        if (!str) return '';
        const map = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"};
        return str.replace(/&(?:amp|lt|gt|quot|apos);/g, m => map[m] || m);
    },

    // SQL escape
    escapeSql(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    },

    // CSV escape
    escapeCsv(str) {
        if (!str) return '';
        if (!/[,"\r\n]/.test(str)) return str;
        return '"' + str.replace(/"/g, '""') + '"';
    },

    unescapeCsv(str) {
        if (!str) return '';
        if (str.length < 2) return str;
        if (str[0] === '"' && str[str.length - 1] === '"') {
            return str.slice(1, -1).replace(/""/g, '"');
        }
        return str;
    }
};
