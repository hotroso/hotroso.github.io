// URL Encode/Decode
(function () {
    Tools.register('url', {
        init(root) {
            UI.transformTool(root, {
                example: 'search=hello world&price=25',
                actions: {
                    encode: v => encodeURIComponent(v),
                    decode: v => {
                        try {
                            return decodeURIComponent(v.trim());
                        } catch {
                            throw new Error('Invalid string: malformed percent-encoding.');
                        }
                    }
                }
            });
        }
    });
})();
