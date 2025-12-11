(function() {
    const input = document.getElementById('html-input');
    const output = document.getElementById('html-output');

    document.getElementById('html-escape').addEventListener('click', () => {
        output.value = EscapeUtils.escapeHtml(input.value);
    });

    document.getElementById('html-unescape').addEventListener('click', () => {
        output.value = EscapeUtils.unescapeHtml(input.value);
    });

    document.getElementById('html-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
    });
})();
