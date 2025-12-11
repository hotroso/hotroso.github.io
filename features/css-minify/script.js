const cssMinifyInput = document.getElementById('css-minify-input');
const cssMinifyOutput = document.getElementById('css-minify-output');

function minifyCSS() {
    const code = cssMinifyInput.value.trim();
    if (!code) return;
    
    try {
        const minified = new CleanCSS({}).minify(code);
        cssMinifyOutput.value = minified.styles;
    } catch (e) {
        alert('Lỗi: ' + e.message);
    }
}

function clearCSSMinify() {
    cssMinifyInput.value = '';
    cssMinifyOutput.value = '';
}

function copyCSSMinifyResult() {
    cssMinifyOutput.select();
    document.execCommand('copy');
    alert('Đã copy!');
}
