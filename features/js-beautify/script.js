// JS Beautify (js-beautify)
(function () {
    const indentOptions = (root) => {
        const v = root.querySelector('[data-option="indent"]').value;
        return v === 'tab' ? { indent_with_tabs: true } : { indent_size: Number(v) };
    };

    Tools.register('js-beautify', {
        init(root) {
            UI.transformTool(root, {
                example: "function tinhTong(a){let t=0;for(const s of a){t+=s}return t}console.log(tinhTong([1,2,3]));",
                actions: {
                    beautify: (v, r) => js_beautify(v, { ...indentOptions(r), space_in_empty_paren: true })
                }
            });
        }
    });
})();
