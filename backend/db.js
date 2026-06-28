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
            power BOOLEAN NOT NULL
        )`);

        // Seed initial data if empty
        db.get("SELECT COUNT(*) AS count FROM rooms", (err, row) => {
            if (row.count === 0) {
                const insert = db.prepare("INSERT INTO rooms (id, status, power) VALUES (?, ?, ?)");
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

function updateRoomState(id, status, power, callback) {
    db.run(
        "UPDATE rooms SET status = ?, power = ? WHERE id = ?",
        [status, power ? 1 : 0, id],
        function (err) {
            callback(err, { changes: this.changes });
        }
    );
}

module.exports = {
    db,
    getAllRooms,
    updateRoomState
};
