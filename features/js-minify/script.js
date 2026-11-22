// JS Minify (Terser)
(function () {
    const savedMessage = (before, after) => {
        const pct = before ? Math.round((1 - after / before) * 100) : 0;
        return `Minified: ${before.toLocaleString('en-US')} → ${after.toLocaleString('en-US')} chars (reduced ${pct}%)`;
    };

    Tools.register('js-minify', {
        init(root) {
            UI.transformTool(root, {
                example: 'function sum(list) {\n    // Sum all elements\n    let total = 0;\n    for (const n of list) {\n        total += n;\n    }\n    return total;\n}\nconsole.log(sum([1, 2, 3]));',
                actions: {
                    minify: async v => {
                        let result;
                        try {
                            result = await Terser.minify(v);
                        } catch (e) {
                            const where = e.line ? ` (line ${e.line}, col ${e.col})` : '';
                            throw new Error('Syntax error' + where + ': ' + e.message);
                        }
                        if (result.error) throw new Error(String(result.error));
                        return { output: result.code, message: savedMessage(v.length, result.code.length) };
                    }
                }
            });
        }
    });
})();
