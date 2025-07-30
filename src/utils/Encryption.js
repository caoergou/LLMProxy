const CryptoJS = require('crypto-js');

class Encryption {
    constructor() {
        this.secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
    }

    encrypt(text) {
        return CryptoJS.AES.encrypt(text, this.secretKey).toString();
    }

    decrypt(encryptedText) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }
}

module.exports = new Encryption();