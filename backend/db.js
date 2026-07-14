const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'hotel.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY,
            status TEXT NOT NULL,
            power BOOLEAN NOT NULL,
            guest_name TEXT,
            guest_email TEXT,
            consent_given_at TEXT,
            consent_ip TEXT
        )`);

        // Check and migrate columns if table already existed but is missing PDPA columns
        db.all("PRAGMA table_info(rooms)", (err, columns) => {
            if (err) {
                console.error("Error reading table info:", err.message);
                return;
            }
            const colNames = columns.map(c => c.name);
            const migrations = [
                { name: 'guest_name', type: 'TEXT' },
                { name: 'guest_email', type: 'TEXT' },
                { name: 'consent_given_at', type: 'TEXT' },
                { name: 'consent_ip', type: 'TEXT' }
            ];

            migrations.forEach(m => {
                if (!colNames.includes(m.name)) {
                    console.log(`[DB] Migrating: Adding column ${m.name}...`);
                    db.run(`ALTER TABLE rooms ADD COLUMN ${m.name} ${m.type}`, (alterErr) => {
                        if (alterErr) {
                            console.error(`[DB] Migration failed for column ${m.name}:`, alterErr.message);
                        } else {
                            console.log(`[DB] Column ${m.name} added successfully.`);
                        }
                    });
                }
            });
        });

        // Seed initial data if empty
        db.get("SELECT COUNT(*) AS count FROM rooms", (err, row) => {
            if (err) {
                console.error("Error checking room count:", err.message);
                return;
            }
            if (row && row.count === 0) {
                const insert = db.prepare("INSERT INTO rooms (id, status, power, guest_name, guest_email, consent_given_at, consent_ip) VALUES (?, ?, ?, NULL, NULL, NULL, NULL)");
                const initialRooms = [
                    { id: 101, status: 'vacant', power: false },
                    { id: 102, status: 'vacant', power: false },
                    { id: 103, status: 'vacant', power: false },
                    { id: 104, status: 'vacant', power: false },
                    { id: 105, status: 'vacant', power: false },
                    { id: 106, status: 'vacant', power: false }
                ];
                initialRooms.forEach(room => {
                    insert.run(room.id, room.status, room.power);
                });
                insert.finalize();
                console.log('Database seeded with initial rooms.');
            }
        });
    });
}

function getAllRooms(callback) {
    db.all("SELECT * FROM rooms", [], (err, rows) => {
        // SQLite stores boolean as 0/1, let's map it back to true/false
        const formattedRows = rows ? rows.map(r => ({ ...r, power: r.power === 1 })) : [];
        callback(err, formattedRows);
    });
}

function updateRoomState(id, status, power, options = {}, callback) {
    // Check if options is a function (fallback for old calls)
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? {} : options;

    if (status === 'vacant') {
        // Data Anonymization on checkout (PDPA)
        db.run(
            "UPDATE rooms SET status = ?, power = ?, guest_name = NULL, guest_email = NULL, consent_given_at = NULL, consent_ip = NULL WHERE id = ?",
            [status, power ? 1 : 0, id],
            function (err) {
                cb(err, { changes: this.changes });
            }
        );
    } else {
        // On Check-in
        db.run(
            "UPDATE rooms SET status = ?, power = ?, guest_name = ?, guest_email = ?, consent_given_at = ?, consent_ip = ? WHERE id = ?",
            [status, power ? 1 : 0, opts.guestName || null, opts.guestEmail || null, opts.consentGivenAt || null, opts.consentIp || null, id],
            function (err) {
                cb(err, { changes: this.changes });
            }
        );
    }
}

module.exports = {
    db,
    getAllRooms,
    updateRoomState
};
