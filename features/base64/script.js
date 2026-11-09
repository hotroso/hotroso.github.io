// Base64 Encode/Decode (UTF-8)
(function () {
    function encode(text) {
        const bytes = new TextEncoder().encode(text);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return btoa(binary);
    }

    function decode(text) {
        // Chấp nhận dạng URL-safe, khoảng trắng/xuống dòng và thiếu padding
        let clean = text.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
        while (clean.length % 4) clean += '=';
        let binary;
        try {
            binary = atob(clean);
        } catch {
            throw new Error('Chuỗi Base64 không hợp lệ.');
        }
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch {
            throw new Error('Giải mã được nhưng dữ liệu không phải văn bản UTF-8 (có thể là file nhị phân).');
        }
    }

    Tools.register('base64', {
        init(root) {
            UI.transformTool(root, {
                example: 'Xin chào Việt Nam! 👋',
                actions: { encode, decode }
            });
        }
    });
})();
