const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('front-end'));

// Kết nối SQLite
const dbPath = path.resolve(__dirname, 'data/database.sqlite');
// Tạo thư mục data nếu chưa có
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Lỗi kết nối DB:", err.message);
    else {
        console.log("DB Connected.");
        db.run(`CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            lux REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// ---- API ENDPOINTS ----

// 1. Nhận dữ liệu từ ESP32
app.post('/api/data', (req, res) => {
    const { device_id, lux } = req.body;
    // Tạo timestamp giờ VN
    const now = new Date();
    const offsetMs = 7 * 60 * 60 * 1000;
    const vnTime = new Date(now.getTime() + offsetMs);
    const timestamp = vnTime.toISOString().replace('T', ' ').slice(0, 19);

    if (!device_id || lux === undefined) {
        return res.status(400).json({ error: "Thiếu thông tin" });
    }

    const sql = `INSERT INTO sensor_data (device_id, lux, timestamp) VALUES (?, ?, ?)`;
    db.run(sql, [device_id, lux, timestamp], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`Saved: ${device_id} - ${lux}`);
        res.status(201).json({ message: "Success", id: this.lastID });
    });
});

// 2. Lấy dữ liệu CÓ PHÂN TRANG (Pagination) cho bảng và biểu đồ
app.get('/api/data', (req, res) => {
    // Mặc định lấy trang 1, 10 dòng mỗi trang nếu không truyền tham số
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Query đếm tổng số dòng để tính số trang
    const countSql = `SELECT COUNT(*) as total FROM sensor_data`;
    
    db.get(countSql, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const totalRecords = row.total;
        const totalPages = Math.ceil(totalRecords / limit);

        // Query lấy dữ liệu phân trang
        const dataSql = `SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
        db.all(dataSql, [limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                data: rows,
                pagination: {
                    page: page,
                    limit: limit,
                    totalRecords: totalRecords,
                    totalPages: totalPages
                }
            });
        });
    });
});

// 3. Lấy danh sách Device ID (để hiển thị vào dropdown chọn thiết bị)
app.get('/api/devices', (req, res) => {
    const sql = `SELECT DISTINCT device_id FROM sensor_data`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.device_id));
    });
});

// 4. XUẤT CSV (Quan trọng)
app.get('/api/export-csv', (req, res) => {
    const { device_id, start_date, end_date } = req.query;

    if (!device_id || !start_date || !end_date) {
        return res.status(400).send("Vui lòng chọn Device, Ngày bắt đầu và Ngày kết thúc.");
    }

    // Chuyển định dạng input (nếu cần) để khớp với DB: 'YYYY-MM-DD HH:MM:SS'
    // Lưu ý: Input datetime-local html trả về 'YYYY-MM-DDTHH:MM', cần thay T bằng khoảng trắng
    const startStr = start_date.replace('T', ' ');
    const endStr = end_date.replace('T', ' ');

    const sql = `SELECT * FROM sensor_data WHERE device_id = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp ASC`;

    db.all(sql, [device_id, startStr, endStr], (err, rows) => {
        if (err) return res.status(500).send("Lỗi Database");

        // Tạo nội dung CSV thủ công (hoặc dùng thư viện fast-csv nếu muốn)
        let csvContent = "ID,Device ID,Lux,Timestamp\n"; // Header
        rows.forEach(row => {
            csvContent += `${row.id},${row.device_id},${row.lux},${row.timestamp}\n`;
        });

        // Set header để trình duyệt hiểu đây là file tải về
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=data_${device_id}_${Date.now()}.csv`);
        res.status(200).send(csvContent);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});