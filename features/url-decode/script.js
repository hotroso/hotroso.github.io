const urlDecodeInput = document.getElementById('url-decode-input');
const urlDecodeOutput = document.getElementById('url-decode-output');

function decodeURL() {
    const text = urlDecodeInput.value.trim();
    if (!text) return;
    
    try {
        const decoded = decodeURIComponent(text);
        urlDecodeOutput.value = decoded;
    } catch (e) {
        alert('URL không hợp lệ!');
    }
}

function clearURLDecode() {
    urlDecodeInput.value = '';
    urlDecodeOutput.value = '';
}

function copyURLDecodeResult() {
    urlDecodeOutput.select();
    document.execCommand('copy');
    alert('Đã copy!');
}
