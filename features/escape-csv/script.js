(function() {
    const input = document.getElementById('csv-input');
    const output = document.getElementById('csv-output');

    document.getElementById('csv-escape').addEventListener('click', () => {
        output.value = EscapeUtils.escapeCsv(input.value);
    });

    document.getElementById('csv-unescape').addEventListener('click', () => {
        output.value = EscapeUtils.unescapeCsv(input.value);
    });

    document.getElementById('csv-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
    });
})();
