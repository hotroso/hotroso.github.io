(function() {
    const input = document.getElementById('java-input');
    const output = document.getElementById('java-output');

    document.getElementById('java-escape').addEventListener('click', () => {
        output.value = EscapeUtils.escapeJava(input.value);
    });

    document.getElementById('java-unescape').addEventListener('click', () => {
        output.value = EscapeUtils.unescapeJava(input.value);
    });

    document.getElementById('java-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
    });
})();
