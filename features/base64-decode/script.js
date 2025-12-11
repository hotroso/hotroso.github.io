const decodeInput = document.getElementById('decode-input');
const decodeOutput = document.getElementById('decode-output');

function decodeFromBase64() {
    const text = decodeInput.value.trim();
    if (!text) return;
    
    try {
        const decoded = decodeURIComponent(escape(atob(text)));
        decodeOutput.value = decoded;
    } catch (e) {
        alert('Base64 không hợp lệ!');
    }
}

function clearDecode() {
    decodeInput.value = '';
    decodeOutput.value = '';
}

function copyDecodeResult() {
    decodeOutput.select();
    document.execCommand('copy');
    alert('Đã copy!');
}
