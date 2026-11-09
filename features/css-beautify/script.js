// CSS Beautify (js-beautify)
(function () {
    const indentOptions = (root) => {
        const v = root.querySelector('[data-option="indent"]').value;
        return v === 'tab' ? { indent_with_tabs: true } : { indent_size: Number(v) };
    };

    Tools.register('css-beautify', {
        init(root) {
            UI.transformTool(root, {
                example: '.nut-bam{color:#fff;background:#1f6feb;padding:10px 20px}.nut-bam:hover{opacity:.9}',
                actions: {
                    beautify: (v, r) => css_beautify(v, indentOptions(r))
                }
            });
        }
    });
})();
