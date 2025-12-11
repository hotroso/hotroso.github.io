// QR Generator feature script
(function() {
    let qrCode = null;

    const qrContentInput = document.getElementById('qr-content');
    const qrGenerationForm = document.getElementById('qr-generation-form');
    const countchars = document.getElementById('countchars');

    qrContentInput.addEventListener('input', () => {
        countchars.textContent = qrContentInput.value.length;
    });

    qrGenerationForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const qrContent = qrContentInput.value.trim();
        
        if (!qrContent) {
            alert('Vui lòng nhập nội dung!');
            return;
        }
        
        if (qrContent.length > 1024) {
            if (!confirm('Nội dung vượt quá 1024 ký tự, QR code có thể bị lỗi. Bạn có muốn tiếp tục?')) return;
        }
        
        if (qrCode == null) {
            qrCode = new QRCode('qr-code', {
                text: qrContent,
                width: 400,
                height: 400,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrCode.makeCode(qrContent);
        }
    });
})();
