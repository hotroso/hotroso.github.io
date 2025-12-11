const textInput = document.getElementById('text-input');
const textOutput = document.getElementById('text-output');

function capitalizeText() {
    const text = textInput.value;
    if (!text) return;
    
    const result = text.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
    
    textOutput.value = result;
}

function capitalizeFullyText() {
    const text = textInput.value;
    if (!text) return;
    
    const result = text.toLowerCase().split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
    
    textOutput.value = result;
}

function uncapitalizeText() {
    const text = textInput.value;
    if (!text) return;
    
    const result = text.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toLowerCase() + word.slice(1);
    }).join(' ');
    
    textOutput.value = result;
}

function swapCaseText() {
    const text = textInput.value;
    if (!text) return;
    
    const result = text.split('').map(char => {
        if (char === char.toUpperCase()) {
            return char.toLowerCase();
        } else {
            return char.toUpperCase();
        }
    }).join('');
    
    textOutput.value = result;
}

function getInitials() {
    const text = textInput.value;
    if (!text) return;
    
    const words = text.trim().split(/\s+/);
    const initials = words.map(word => word.charAt(0).toUpperCase()).join('');
    
    textOutput.value = initials;
}

function wrapText() {
    const text = textInput.value;
    if (!text) return;
    
    const wrapLength = parseInt(document.getElementById('wrap-length').value) || 80;
    const words = text.split(' ');
    let result = '';
    let currentLine = '';
    
    words.forEach(word => {
        if ((currentLine + word).length > wrapLength) {
            result += currentLine.trim() + '\n';
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });
    
    result += currentLine.trim();
    textOutput.value = result;
}

function clearTextFormatter() {
    textInput.value = '';
    textOutput.value = '';
}

function copyTextResult() {
    textOutput.select();
    document.execCommand('copy');
    alert('Đã copy kết quả!');
}

// Show wrap options when clicking Word Wrap
document.addEventListener('DOMContentLoaded', () => {
    const wrapBtn = document.querySelector('button[onclick="wrapText()"]');
    if (wrapBtn) {
        wrapBtn.addEventListener('click', () => {
            document.getElementById('wrap-options').style.display = 'block';
        });
    }
});
