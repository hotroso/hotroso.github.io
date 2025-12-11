(function() {
    const input = document.getElementById('xml-input');
    const output = document.getElementById('xml-output');

    document.getElementById('xml-escape').addEventListener('click', () => {
        output.value = EscapeUtils.escapeXml(input.value);
    });

    document.getElementById('xml-unescape').addEventListener('click', () => {
        output.value = EscapeUtils.unescapeXml(input.value);
    });

    document.getElementById('xml-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
    });
})();
