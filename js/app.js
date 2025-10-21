// --- 1. Khai báo thông tin Supabase ---
// Thay thế bằng URL và Key của BẠN (lấy ở Bước 2)
const SUPABASE_URL = 'https://tfebrbyzxkvmuggesvjw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZWJyYnl6eGt2bXVnZ2Vzdmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTQ2NjAsImV4cCI6MjA3NjYzMDY2MH0.ZoecgOZOQfo-mapiUipPzpgabUk3522HgV-1GmCrb54';

// --- 2. Khởi tạo Supabase Client ---
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 3. Lấy đối tượng DOM ---
const documentListContainer = document.getElementById('document-list');
const loadingSpinner = document.getElementById('loading-spinner');

// Lấy các đối tượng của Modal
const modal = document.getElementById('modal-viewer');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalTitle = document.getElementById('modal-title');
const modalIframe = document.getElementById('modal-iframe');

// --- 4. Hàm để tải và hiển thị văn kiện ---
async function loadDocuments() {
    try {
        // Gọi Supabase để lấy TẤT CẢ dữ liệu từ bảng 'documents'
        // Sắp xếp theo ngày tạo mới nhất (tùy chọn)
        const { data, error } = await _supabase
            .from('documents')      // Tên bảng của bạn
            .select('*')            // Lấy tất cả các cột
            .order('created_at', { ascending: false }); // Sắp xếp

        if (error) {
            // Nếu có lỗi API, hiển thị lỗi
            console.error('Lỗi khi tải dữ liệu:', error);
            loadingSpinner.remove();
            documentListContainer.innerHTML = `<p class="text-red-500 text-center">Không thể tải được danh sách văn kiện. Vui lòng kiểm tra lại Policy SELECT.</p>`;
            return;
        }

        // Nếu không có dữ liệu
        if (data.length === 0) {
            loadingSpinner.remove();
            documentListContainer.innerHTML = `<p class="text-gray-500 text-center">Chưa có văn kiện nào được cập nhật.</p>`;
            return;
        }

        // Xóa thông báo loading
        if(loadingSpinner) {
            loadingSpinner.remove();
        }
        
        // Tạo một chuỗi HTML từ dữ liệu
        let htmlContent = '';
        data.forEach(doc => {
            htmlContent += `
                <div class="document-item block p-5 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-300 cursor-pointer" 
                     data-url="${doc.file_url}" 
                     data-title="${doc.title}">
                    
                    <h3 class="text-lg font-semibold text-blue-700 pointer-events-none">${doc.title}</h3>
                    
                    ${doc.description ? `<p class="text-sm text-gray-600 mt-1 pointer-events-none">${doc.description}</p>` : ''}
                    
                    <span class="text-xs text-blue-500 mt-2 inline-block pointer-events-none">Nhấn để xem chi tiết &raquo;</span>
                </div>
            `;
        });

        // Đổ chuỗi HTML vào container
        documentListContainer.innerHTML = htmlContent;

    } catch (e) {
        console.error('Lỗi JavaScript:', e);
        if(loadingSpinner) {
            loadingSpinner.remove();
        }
        documentListContainer.innerHTML = `<p class="text-red-500 text-center">Đã xảy ra lỗi không mong muốn.</p>`;
    }
}

// --- 5. Hàm Mở và Đóng Modal ---
function openModal(url, title) {
    // Dùng Google Docs Viewer để nhúng tài liệu
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    
    modalTitle.textContent = title;
    modalIframe.src = viewerUrl;
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    modalIframe.src = ''; // Xóa link iframe để dừng tải và giải phóng bộ nhớ
    modalTitle.textContent = 'Đang tải tài liệu...';
}

// --- 6. Gán sự kiện (Event Listeners) ---
document.addEventListener('DOMContentLoaded', () => {
    // Bắt đầu tải danh sách văn kiện ngay khi trang sẵn sàng
    loadDocuments();

    // Lắng nghe sự kiện click trên nút đóng modal
    modalCloseBtn.addEventListener('click', closeModal);

    // Lắng nghe sự kiện click vào nền mờ (overlay) để đóng modal
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'modal-viewer') {
            closeModal();
        }
    });

    // Lắng nghe sự kiện nhấn phím Escape để đóng modal
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Sử dụng kỹ thuật Event Delegation để bắt sự kiện click trên các văn kiện
    documentListContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.document-item');
        
        if (item) {
            const url = item.dataset.url;
            const title = item.dataset.title;
            openModal(url, title);
        }
    });
});
