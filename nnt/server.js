const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// // app.use(  (req, res , next) => { 
// //     console.log( `hi : [${req.method}]  ${req.url}` ) ; 
// //     next() ; 
// // }
    
// );

// Middleware để xử lý JSON từ ESP32
app.use(express.json());
// Middleware phục vụ file tĩnh (HTML, CSS, JS)
app.use(express.static('front-end'));

// Kết nối SQLite 
const dbPath = path.resolve(__dirname, 'data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Lỗi kết nối database:", err.message);
    } else {
        console.log("Kết nối tới database SQLite thành công.");
        db.run(`CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            lux REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// ---- API ENDPOINTS ----

// 1️⃣ ESP32 gửi dữ liệu POST
app.post('/api/data', (req, res) => {
    console.log("0------------------------------0") ; 
    console.log("Nhận đc req từ:", req.ip) ; 
    console.log("body raw : ", req.body) ; 
    const { device_id, lux } = req.body;

    // set giá trị cho timestamp
    const now = new Date(); 
    const offsetMs =  7 * 60 *60 *1000;
    const vnTime = new Date(now.getTime() + offsetMs) ; 
    const timestamp = vnTime.toISOString().replace('T', ' ').slice(0,19) ;
    if(!device_id) { 
        console.log(" thieeus device_id") ;
    }
    
    if (!device_id || lux === undefined) {
        return res.status(400).json({ error: "device_id và lux là bắt buộc." });
    }

    const sql = `INSERT INTO sensor_data (device_id, lux, timestamp) VALUES (?, ?, ? )`;
    db.run(sql, [device_id, lux, timestamp], function(err) {
        if (err) {
            console.error("Lỗi khi chèn dữ liệu:", err.message);
            return res.status(500).json({ error: "Lỗi server nội bộ." });
        }
        console.log(`Đã nhận dữ liệu: device=${device_id}, lux=${lux}`);
        res.status(201).json({ message: "Dữ liệu đã được nhận.", id: this.lastID });
    });
});

//frontend
app.get('/api/data', (req, res) => {
    const sql = `SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 50`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Lỗi khi truy vấn dữ liệu:", err.message);
            return res.status(500).json({ error: "Lỗi server nội bộ." });
        }
        res.json(rows);
    });
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
    console.log(`hi`) ; 
});
