// --- 1. CẤU HÌNH ---
// THAY THẾ bằng URL và Key của BẠN
const SUPABASE_URL = 'https://tfebrbyzxkvmuggesvjw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZWJyYnl6eGt2bXVnZ2Vzdmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTQ2NjAsImV4cCI6MjA3NjYzMDY2MH0.ZoecgOZOQfo-mapiUipPzpgabUk3522HgV-1GmCrb54';

// !!! QUAN TRỌNG: Đặt mật khẩu của bạn ở đây.
// Đây là mật khẩu đơn giản, chỉ để ngăn người dùng thông thường truy cập.
const ADMIN_PASSWORD = 'DaiHoiDoan2025'; 

// --- 2. KHỞI TẠO ---
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 3. LẤY CÁC ĐỐI TƯỢNG DOM ---
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const passwordInput = document.getElementById('password');

const uploadSection = document.getElementById('upload-section');
const uploadForm = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const statusMessage = document.getElementById('status-message');

// --- 4. LOGIC ĐĂNG NHẬP ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (passwordInput.value === ADMIN_PASSWORD) {
        // Mật khẩu đúng
        loginSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    } else {
        // Mật khẩu sai
        loginError.classList.remove('hidden');
    }
});

// --- 5. LOGIC UPLOAD ---
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Lấy dữ liệu từ form
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const file = document.getElementById('file-upload').files[0];

    if (!title || !file) {
        showStatus('Vui lòng nhập tiêu đề và chọn file.', 'error');
        return;
    }

    // Vô hiệu hóa nút để tránh double-click
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';

    try {
        // Bước 1: Upload file lên Supabase Storage
        showStatus('Đang tải file lên...', 'info');
        // Tạo tên file độc nhất để tránh trùng lặp
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await _supabase.storage
            .from('van-kien') // Tên bucket của bạn
            .upload(fileName, file);

        if (uploadError) {
            throw uploadError;
        }

        // Bước 2: Lấy URL công khai (public URL) của file
        showStatus('Đang lấy đường dẫn file...', 'info');
        const { data: urlData } = _supabase.storage
            .from('van-kien')
            .getPublicUrl(fileName);
        
        const publicUrl = urlData.publicUrl;

        // Bước 3: Lưu thông tin vào bảng 'documents' trong CSDL
        showStatus('Đang lưu thông tin vào cơ sở dữ liệu...', 'info');
        const { error: dbError } = await _supabase
            .from('documents') // Tên bảng của bạn
            .insert([{ 
                title: title, 
                description: description, 
                file_url: publicUrl 
            }]);

        if (dbError) {
            throw dbError;
        }

        // Hoàn tất!
        showStatus('Tải lên văn kiện thành công!', 'success');
        uploadForm.reset(); // Xóa trắng form

    } catch (error) {
        console.error('Lỗi chi tiết:', error);
        showStatus(`Đã xảy ra lỗi: ${error.message}`, 'error');
    } finally {
        // Kích hoạt lại nút sau khi xử lý xong
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tải lên';
    }
});

// Hàm trợ giúp hiển thị trạng thái
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'mt-4 text-center text-sm'; // Reset class
    switch (type) {
        case 'success':
            statusMessage.classList.add('text-green-600');
            break;
        case 'error':
            statusMessage.classList.add('text-red-600');
            break;
        case 'info':
        default:
            statusMessage.classList.add('text-blue-600');
            break;
    }
}
