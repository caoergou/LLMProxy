import * as CryptoJS from 'crypto-js';

class Encryption {
    private secretKey: string;

    constructor() {
        if (!process.env.ENCRYPTION_KEY) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('ENCRYPTION_KEY environment variable must be set in production.');
            } else {
                console.warn('Warning: ENCRYPTION_KEY is not set. Using an insecure default key for non-production environments.');
                this.secretKey = 'default-secret-key-change-in-production';
            }
        } else {
            this.secretKey = process.env.ENCRYPTION_KEY;
        }
    }

    encrypt(text: string): string {
        return CryptoJS.AES.encrypt(text, this.secretKey).toString();
    }

    decrypt(encryptedText: string): string | null {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }
}

export default new Encryption();