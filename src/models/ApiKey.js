const Database = require('../models/Database');
const Encryption = require('../utils/Encryption');

class ApiKeyModel {
    static getAll() {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            db.all(`SELECT id, provider, name, base_url, cost_per_request, 
                    remaining_quota, total_quota, is_active, created_at, updated_at 
                    FROM api_keys ORDER BY created_at DESC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            db.get(`SELECT * FROM api_keys WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    // Decrypt sensitive data
                    row.api_key = Encryption.decrypt(row.api_key);
                    if (row.api_secret) {
                        row.api_secret = Encryption.decrypt(row.api_secret);
                    }
                    resolve(row);
                } else {
                    resolve(null);
                }
            });
        });
    }

    static getActiveByProvider(provider) {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            db.all(`SELECT id, provider, name, cost_per_request, remaining_quota, 
                    is_active, created_at, updated_at 
                    FROM api_keys WHERE provider = ? AND is_active = 1 
                    ORDER BY 
                        CASE WHEN remaining_quota = -1 THEN 1 ELSE 0 END DESC,
                        remaining_quota DESC,
                        cost_per_request ASC`, 
                [provider], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Decrypt sensitive data
                    rows.forEach(row => {
                        row.api_key = Encryption.decrypt(row.api_key);
                        if (row.api_secret) {
                            row.api_secret = Encryption.decrypt(row.api_secret);
                        }
                    });
                    resolve(rows);
                }
            });
        });
    }

    static create(keyData) {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            
            // Encrypt sensitive data
            const encryptedApiKey = Encryption.encrypt(keyData.api_key);
            const encryptedApiSecret = keyData.api_secret ? Encryption.encrypt(keyData.api_secret) : null;

            db.run(`INSERT INTO api_keys 
                    (provider, name, api_key, api_secret, base_url, cost_per_request, 
                     remaining_quota, total_quota, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [keyData.provider, keyData.name, encryptedApiKey, encryptedApiSecret,
                 keyData.base_url, keyData.cost_per_request || 0,
                 keyData.remaining_quota || -1, keyData.total_quota || -1,
                 keyData.is_active !== false ? 1 : 0],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...keyData });
                    }
                }
            );
        });
    }

    static update(id, keyData) {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            
            let updateFields = [];
            let updateValues = [];

            if (keyData.name !== undefined) {
                updateFields.push('name = ?');
                updateValues.push(keyData.name);
            }
            if (keyData.api_key !== undefined) {
                updateFields.push('api_key = ?');
                updateValues.push(Encryption.encrypt(keyData.api_key));
            }
            if (keyData.api_secret !== undefined) {
                updateFields.push('api_secret = ?');
                updateValues.push(keyData.api_secret ? Encryption.encrypt(keyData.api_secret) : null);
            }
            if (keyData.base_url !== undefined) {
                updateFields.push('base_url = ?');
                updateValues.push(keyData.base_url);
            }
            if (keyData.cost_per_request !== undefined) {
                updateFields.push('cost_per_request = ?');
                updateValues.push(keyData.cost_per_request);
            }
            if (keyData.remaining_quota !== undefined) {
                updateFields.push('remaining_quota = ?');
                updateValues.push(keyData.remaining_quota);
            }
            if (keyData.total_quota !== undefined) {
                updateFields.push('total_quota = ?');
                updateValues.push(keyData.total_quota);
            }
            if (keyData.is_active !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(keyData.is_active ? 1 : 0);
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(id);

            db.run(`UPDATE api_keys SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues,
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            db.run(`DELETE FROM api_keys WHERE id = ?`, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    static updateQuota(id, remainingQuota) {
        return new Promise((resolve, reject) => {
            const db = Database.getDb();
            db.run(`UPDATE api_keys SET remaining_quota = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [remainingQuota, id],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }
}

module.exports = ApiKeyModel;