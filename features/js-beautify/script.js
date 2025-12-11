const jsBeautifyInput = document.getElementById('js-beautify-input');
const jsBeautifyOutput = document.getElementById('js-beautify-output');

function beautifyJS() {
    const code = jsBeautifyInput.value.trim();
    if (!code) return;
    
    try {
        const beautified = js_beautify(code, {
            indent_size: 2,
            space_in_empty_paren: true
        });
        jsBeautifyOutput.value = beautified;
    } catch (e) {
        alert('Lỗi: ' + e.message);
    }
}

function clearJSBeautify() {
    jsBeautifyInput.value = '';
    jsBeautifyOutput.value = '';
}

function copyJSBeautifyResult() {
    jsBeautifyOutput.select();
    document.execCommand('copy');
    alert('Đã copy!');
}
