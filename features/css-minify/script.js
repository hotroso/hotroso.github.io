// CSS Minify (CSSO)
(function () {
    Tools.register('css-minify', {
        init(root) {
            UI.transformTool(root, {
                example: '/* Primary button */\n.button {\n    color: #ffffff;\n    background-color: #1f6feb;\n    padding: 10px 20px 10px 20px;\n    margin: 0px;\n}\n',
                actions: {
                    minify: v => {
                        if (typeof csso === 'undefined' || typeof csso.minify !== 'function') {
                            throw new Error('CSS minifier library is not loaded. Please reload the page.');
                        }
                        let result;
                        try {
                            result = csso.minify(v);
                        } catch (e) {
                            throw new Error(e && e.message ? e.message : String(e));
                        }
                        const out = result && typeof result.css === 'string' ? result.css : String(result || '');
                        const before = v.length;
                        const after = out.length;
                        const pct = before ? Math.round((1 - after / before) * 100) : 0;
                        return {
                            output: out,
                            message: `Minified: ${before.toLocaleString('en-US')} → ${after.toLocaleString('en-US')} chars (reduced ${pct}%)`
                        };
                    }
                }
            });
        }
    });
})();
