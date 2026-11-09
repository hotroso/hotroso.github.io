// JS Minify (Terser)
(function () {
    const savedMessage = (before, after) => {
        const pct = before ? Math.round((1 - after / before) * 100) : 0;
        return `Đã nén: ${before.toLocaleString('vi-VN')} → ${after.toLocaleString('vi-VN')} ký tự (giảm ${pct}%)`;
    };

    Tools.register('js-minify', {
        init(root) {
            UI.transformTool(root, {
                example: 'function tinhTong(danhSach) {\n    // Cộng tất cả phần tử\n    let tong = 0;\n    for (const so of danhSach) {\n        tong += so;\n    }\n    return tong;\n}\nconsole.log(tinhTong([1, 2, 3]));',
                actions: {
                    minify: async v => {
                        let result;
                        try {
                            result = await Terser.minify(v);
                        } catch (e) {
                            const where = e.line ? ` (dòng ${e.line}, cột ${e.col})` : '';
                            throw new Error('Lỗi cú pháp' + where + ': ' + e.message);
                        }
                        if (result.error) throw new Error(String(result.error));
                        return { output: result.code, message: savedMessage(v.length, result.code.length) };
                    }
                }
            });
        }
    });
})();
