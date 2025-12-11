const jsonInput = document.getElementById('json-input');
const jsonOutput = document.getElementById('json-output');
const jsonError = document.getElementById('json-error');

function showError(message) {
    jsonError.textContent = '❌ ' + message;
    jsonError.style.display = 'block';
}

function hideError() {
    jsonError.style.display = 'none';
}

function formatJSON() {
    hideError();
    const text = jsonInput.value.trim();
    if (!text) return;
    
    try {
        const obj = JSON.parse(text);
        jsonOutput.value = JSON.stringify(obj, null, 2);
    } catch (e) {
        showError('JSON không hợp lệ: ' + e.message);
    }
}

function minifyJSON() {
    hideError();
    const text = jsonInput.value.trim();
    if (!text) return;
    
    try {
        const obj = JSON.parse(text);
        jsonOutput.value = JSON.stringify(obj);
    } catch (e) {
        showError('JSON không hợp lệ: ' + e.message);
    }
}

function escapeJSON() {
    hideError();
    const text = jsonInput.value;
    if (!text) return;
    
    let result = text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\//g, '\\/')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\b/g, '\\b')
        .replace(/\f/g, '\\f');
    
    jsonOutput.value = result;
}

function unescapeJSON() {
    hideError();
    const text = jsonInput.value;
    if (!text) return;
    
    try {
        let result = text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\b/g, '\b')
            .replace(/\\f/g, '\f')
            .replace(/\\"/g, '"')
            .replace(/\\\//g, '/')
            .replace(/\\\\/g, '\\');
        
        jsonOutput.value = result;
    } catch (e) {
        showError('Lỗi unescape: ' + e.message);
    }
}

function validateJSON() {
    hideError();
    const text = jsonInput.value.trim();
    if (!text) {
        showError('Vui lòng nhập JSON');
        return;
    }
    
    try {
        JSON.parse(text);
        jsonOutput.value = '✅ JSON hợp lệ!';
    } catch (e) {
        showError('JSON không hợp lệ: ' + e.message);
        jsonOutput.value = '';
    }
}

function clearJSON() {
    jsonInput.value = '';
    jsonOutput.value = '';
    hideError();
}

function copyJSONResult() {
    jsonOutput.select();
    document.execCommand('copy');
    alert('Đã copy kết quả!');
}
