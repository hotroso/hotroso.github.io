const encodeInput = document.getElementById('encode-input');
const encodeOutput = document.getElementById('encode-output');

function encodeToBase64() {
    const text = encodeInput.value;
    if (!text) return;
    
    try {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        encodeOutput.value = encoded;
    } catch (e) {
        alert('Lỗi encode: ' + e.message);
    }
}

function clearEncode() {
    encodeInput.value = '';
    encodeOutput.value = '';
}

function copyEncodeResult() {
    encodeOutput.select();
    document.execCommand('copy');
    alert('Đã copy!');
}
