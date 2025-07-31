import { Database as SQLiteDatabase } from 'sqlite3';
declare class Database {
    private db;
    init(): void;
    private createTables;
    private seedProviderTemplates;
    private migrateApiCallsTable;
    getDb(): SQLiteDatabase | null;
    close(): void;
}
declare const _default: Database;
export default _default;
//# sourceMappingURL=Database.d.ts.map