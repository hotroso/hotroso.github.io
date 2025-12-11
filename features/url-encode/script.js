const urlEncodeInput = document.getElementById('url-encode-input');
const urlEncodeOutput = document.getElementById('url-encode-output');

function encodeURL() {
    const text = urlEncodeInput.value;
    if (!text) return;
    
    try {
        const encoded = encodeURIComponent(text);
        urlEncodeOutput.value = encoded;
    } catch (e) {
        alert('Lỗi encode: ' + e.message);
    }
}

function clearURLEncode() {
    urlEncodeInput.value = '';
    urlEncodeOutput.value = '';
}

function copyURLEncodeResult() {
    urlEncodeOutput.select();
    document.execCommand('copy');
    alert('Đã copy!');
}
