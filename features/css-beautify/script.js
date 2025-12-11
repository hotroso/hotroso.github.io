const cssBeautifyInput = document.getElementById('css-beautify-input');
const cssBeautifyOutput = document.getElementById('css-beautify-output');

function beautifyCSS() {
    const code = cssBeautifyInput.value.trim();
    if (!code) return;
    
    try {
        const beautified = css_beautify(code, {
            indent_size: 2
        });
        cssBeautifyOutput.value = beautified;
    } catch (e) {
        alert('Lỗi: ' + e.message);
    }
}

function clearCSSBeautify() {
    cssBeautifyInput.value = '';
    cssBeautifyOutput.value = '';
}

function copyCSSBeautifyResult() {
    cssBeautifyOutput.select();
    document.execCommand('copy');
    alert('Đã copy!');
}
