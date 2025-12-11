const randomOutput = document.getElementById('random-output');

function getLength() {
    return parseInt(document.getElementById('random-length').value) || 16;
}

function getCount() {
    return parseInt(document.getElementById('random-count').value) || 1;
}

function randomAlphanumeric(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function randomAlphabetic(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function randomNumeric(length) {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function randomAscii(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += String.fromCharCode(Math.floor(Math.random() * 95) + 32);
    }
    return result;
}

function randomHex(length) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function randomPassword(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateAlphanumeric() {
    const length = getLength();
    const count = getCount();
    let results = [];
    for (let i = 0; i < count; i++) {
        results.push(randomAlphanumeric(length));
    }
    randomOutput.value = results.join('\n');
}

function generateAlphabetic() {
    const length = getLength();
    const count = getCount();
    let results = [];
    for (let i = 0; i < count; i++) {
        results.push(randomAlphabetic(length));
    }
    randomOutput.value = results.join('\n');
}

function generateNumeric() {
    const length = getLength();
    const count = getCount();
    let results = [];
    for (let i = 0; i < count; i++) {
        results.push(randomNumeric(length));
    }
    randomOutput.value = results.join('\n');
}

function generateAscii() {
    const length = getLength();
    const count = getCount();
    let results = [];
    for (let i = 0; i < count; i++) {
        results.push(randomAscii(length));
    }
    randomOutput.value = results.join('\n');
}

function generateHex() {
    const length = getLength();
    const count = getCount();
    let results = [];
    for (let i = 0; i < count; i++) {
        results.push(randomHex(length));
    }
    randomOutput.value = results.join('\n');
}

function generatePassword() {
    const length = getLength();
    const count = getCount();
    let results = [];
    for (let i = 0; i < count; i++) {
        results.push(randomPassword(length));
    }
    randomOutput.value = results.join('\n');
}

function generateUUID() {
    const count = getCount();
    let results = [];
    for (let i = 0; i < count; i++) {
        results.push(generateUUIDv4());
    }
    randomOutput.value = results.join('\n');
}

function clearRandom() {
    randomOutput.value = '';
}

function copyRandomResult() {
    randomOutput.select();
    document.execCommand('copy');
    alert('Đã copy kết quả!');
}
