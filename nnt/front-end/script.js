// script.js

// Hàm này sẽ đi hỏi server để lấy dữ liệu mới
async function layDuLieuMoi() {
     // alert("hi" ) ; 
    const tbody = document.getElementById('data-body');
    try {
        // Gửi yêu cầu đến API /api/data của server
        const response = await fetch('/api/data');
        const data = await response.json();

        // // Xóa hết bảng cũ
        tbody.innerHTML = '';

        // Lặp qua từng dòng dữ liệu nhận được và tạo hàng mới trong bảng
        for (const row of data) {
            const tr = document.createElement('tr');
            const thoiGian = new Date(row.timestamp).toLocaleString('vi-VN');

            tr.innerHTML = `
                <td>${row.id}</td>
                <td>${row.device_id}</td>
                <td>${row.lux}</td>
                <td>${thoiGian}</td>
            `;
            tbody.appendChild(tr);
        }
    } catch (error) {
        console.error("Không thể lấy dữ liệu:", error);
    }
}

// Cứ 5 giây lại gọi hàm lấy dữ liệu một lần
setInterval(layDuLieuMoi, 5000);

// Lấy dữ liệu ngay khi vừa mở trang
layDuLieuMoi();
