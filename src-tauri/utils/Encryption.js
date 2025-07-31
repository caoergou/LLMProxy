"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const CryptoJS = __importStar(require("crypto-js"));
class Encryption {
    constructor() {
        if (!process.env.ENCRYPTION_KEY) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('ENCRYPTION_KEY environment variable must be set in production.');
            }
            else {
                console.warn('Warning: ENCRYPTION_KEY is not set. Using an insecure default key for non-production environments.');
                this.secretKey = 'default-secret-key-change-in-production';
            }
        }
        else {
            this.secretKey = process.env.ENCRYPTION_KEY;
        }
    }
    encrypt(text) {
        return CryptoJS.AES.encrypt(text, this.secretKey).toString();
    }
    decrypt(encryptedText) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        }
        catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }
}
exports.default = new Encryption();
//# sourceMappingURL=Encryption.js.map