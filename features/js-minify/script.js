const jsMinifyInput = document.getElementById('js-minify-input');
const jsMinifyOutput = document.getElementById('js-minify-output');
const jsMinifyError = document.getElementById('js-minify-error');

async function minifyJS() {
    const code = jsMinifyInput.value.trim();
    if (!code) return;
    
    jsMinifyError.style.display = 'none';
    
    try {
        const result = await Terser.minify(code);
        if (result.error) {
            jsMinifyError.textContent = '❌ ' + result.error;
            jsMinifyError.style.display = 'block';
        } else {
            jsMinifyOutput.value = result.code;
        }
    } catch (e) {
        jsMinifyError.textContent = '❌ Lỗi: ' + e.message;
        jsMinifyError.style.display = 'block';
    }
}

function clearJSMinify() {
    jsMinifyInput.value = '';
    jsMinifyOutput.value = '';
    jsMinifyError.style.display = 'none';
}

function copyJSMinifyResult() {
    jsMinifyOutput.select();
    document.execCommand('copy');
    alert('Đã copy!');
}
