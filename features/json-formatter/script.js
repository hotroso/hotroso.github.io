// JSON Formatter: format, minify, validate, escape, unescape
(function () {
    function parse(text) {
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('JSON không hợp lệ: ' + e.message);
        }
    }

    Tools.register('json-formatter', {
        init(root) {
            UI.transformTool(root, {
                example: '{"ten":"Nguyễn Văn A","tuoi":30,"ky_nang":["JavaScript","SQL"],"dang_lam_viec":true}',
                actions: {
                    format: v => JSON.stringify(parse(v), null, 2),
                    minify: v => JSON.stringify(parse(v)),
                    validate: v => {
                        parse(v);
                        return { message: 'JSON hợp lệ' };
                    },
                    // Chuyển văn bản thành nội dung chuỗi JSON (không gồm dấu nháy bao ngoài)
                    escape: v => JSON.stringify(v).slice(1, -1),
                    unescape: v => {
                        try {
                            return JSON.parse('"' + v + '"');
                        } catch {
                            throw new Error('Không unescape được: chuỗi có dấu " chưa escape hoặc ký tự \\ sai định dạng.');
                        }
                    }
                }
            });
        }
    });
})();
