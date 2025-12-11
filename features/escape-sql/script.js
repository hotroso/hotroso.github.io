(function() {
    const input = document.getElementById('sql-input');
    const output = document.getElementById('sql-output');

    document.getElementById('sql-escape').addEventListener('click', () => {
        output.value = EscapeUtils.escapeSql(input.value);
    });

    document.getElementById('sql-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
    });
})();
