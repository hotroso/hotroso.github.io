// URL Encode/Decode
(function () {
    Tools.register('url', {
        init(root) {
            UI.transformTool(root, {
                example: 'tìm kiếm=cà phê sữa đá&giá=25.000đ',
                actions: {
                    encode: v => encodeURIComponent(v),
                    decode: v => {
                        try {
                            return decodeURIComponent(v.trim());
                        } catch {
                            throw new Error('Chuỗi không hợp lệ: có ký tự % không đúng định dạng.');
                        }
                    }
                }
            });
        }
    });
})();
