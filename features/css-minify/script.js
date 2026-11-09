// CSS Minify (CleanCSS)
(function () {
    Tools.register('css-minify', {
        init(root) {
            UI.transformTool(root, {
                example: '/* Nút bấm chính */\n.nut-bam {\n    color: #ffffff;\n    background-color: #1f6feb;\n    padding: 10px 20px 10px 20px;\n    margin: 0px;\n}\n',
                actions: {
                    minify: v => {
                        const result = new CleanCSS({}).minify(v);
                        if (result.errors && result.errors.length) throw new Error(result.errors.join('\n'));
                        const before = v.length;
                        const after = result.styles.length;
                        const pct = before ? Math.round((1 - after / before) * 100) : 0;
                        return {
                            output: result.styles,
                            message: `Đã nén: ${before.toLocaleString('vi-VN')} → ${after.toLocaleString('vi-VN')} ký tự (giảm ${pct}%)`
                        };
                    }
                }
            });
        }
    });
})();
