let currentPage = 1;
let limit = 10;
let totalPages = 1;
let myChart = null; // Biến lưu biểu đồ

// 1. Khởi tạo khi load trang
document.addEventListener("DOMContentLoaded", () => {
    loadDevices(); // Load danh sách thiết bị vào dropdown
    fetchData();   // Load dữ liệu bảng
    
    // Auto refresh mỗi 10s (không nên quá nhanh vì có phân trang)
    setInterval(() => {
        if(currentPage === 1) fetchData(); 
    }, 10000);
});

// 2. Hàm lấy danh sách thiết bị cho Dropdown
async function loadDevices() {
    try {
        const res = await fetch('/api/devices');
        const devices = await res.json();
        const select = document.getElementById('deviceSelect');
        devices.forEach(dev => {
            const opt = document.createElement('option');
            opt.value = dev;
            opt.innerText = dev;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Lỗi load devices:", err);
    }
}

// 3. Hàm Fetch Dữ liệu chính (có phân trang)
async function fetchData() {
    try {
        const res = await fetch(`/api/data?page=${currentPage}&limit=${limit}`);
        const json = await res.json();
        
        const data = json.data;
        const pagination = json.pagination;
        totalPages = pagination.totalPages;

        // Render Bảng
        renderTable(data);
        // Render Biểu đồ
        renderChart(data);
        // Cập nhật thông tin trang
        document.getElementById('pageInfo').innerText = `Trang ${pagination.page} / ${pagination.totalPages}`;

    } catch (err) {
        console.error("Lỗi fetch data:", err);
    }
}

// 4. Render Bảng
function renderTable(data) {
    const tbody = document.getElementById('data-body');
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.id}</td>
            <td><span class="badge">${row.device_id}</span></td>
            <td style="font-weight:bold; color:#2980b9">${row.lux}</td>
            <td>${row.timestamp}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. Render Biểu đồ (Chart.js)
function renderChart(data) {
    // Đảo ngược mảng để biểu đồ chạy từ trái qua phải (cũ -> mới)
    // Vì bảng hiển thị mới nhất lên đầu, nhưng biểu đồ thì thời gian chạy xuôi
    const chartData = [...data].reverse(); 

    const labels = chartData.map(d => d.timestamp.split(' ')[1]); // Chỉ lấy giờ
    const luxValues = chartData.map(d => d.lux);

    const ctx = document.getElementById('luxChart').getContext('2d');

    if (myChart) {
        // Nếu biểu đồ đã có, chỉ update dữ liệu
        myChart.data.labels = labels;
        myChart.data.datasets[0].data = luxValues;
        myChart.update();
    } else {
        // Nếu chưa có, tạo mới
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cường độ sáng (Lux)',
                    data: luxValues,
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3 // Làm mềm đường cong
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

// 6. Xử lý chuyển trang
function changePage(step) {
    const nextPage = currentPage + step;
    if (nextPage > 0 && nextPage <= totalPages) {
        currentPage = nextPage;
        fetchData();
    }
}

function changeLimit() {
    limit = document.getElementById('limitSelect').value;
    currentPage = 1; // Reset về trang 1
    fetchData();
}

// 7. Hàm Xuất CSV
function exportCSV() {
    const deviceId = document.getElementById('deviceSelect').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!deviceId || !startDate || !endDate) {
        alert("Vui lòng chọn đầy đủ: Thiết bị, Ngày bắt đầu, Ngày kết thúc!");
        return;
    }

    // Tạo URL query string
    const url = `/api/export-csv?device_id=${deviceId}&start_date=${startDate}&end_date=${endDate}`;
    
    // Mở tab mới hoặc tải trực tiếp
    window.location.href = url;
}