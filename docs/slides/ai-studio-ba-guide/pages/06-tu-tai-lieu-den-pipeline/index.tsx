import type { Page } from '../types';

export default [
  {
    id: 'from-doc',
    element: (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        background: '#fff',
        color: '#333', fontFamily: '"Segoe UI", Arial, sans-serif',
        padding: '40 60',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 6px 0', color: '#0f3460' }}>
          📄 Từ Tài liệu → Pipeline với /from-doc
        </h2>
        <div style={{ width: 80, height: 3, background: '#0f3460', marginBottom: 24, borderRadius: 2 }} />

        <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 16px 0', color: '#555' }}>
          <strong>"Bên A gửi file SRS rồi, BA xử lý giúp."</strong> — Bạn mở file PDF 50 trang,
          tim đập nhanh? Đừng lo, <code>/from-doc</code> làm hết phần nặng nhọc.
        </p>

        {/* 3 bước */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 20 }}>
          <div style={{
            flex: 1, background: '#f5f7fa', borderRadius: 10, padding: 18,
            borderTop: '3px solid #1565c0',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📥</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px 0', color: '#1565c0' }}>
              Bước 1: Nạp
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#666', margin: 0 }}>
              Gõ <code>/from-doc docs/inputs/SRS.pdf</code><br />
              AI Studio đọc file (PDF, DOCX, ảnh).
            </p>
          </div>

          <div style={{
            flex: 1, background: '#f5f7fa', borderRadius: 10, padding: 18,
            borderTop: '3px solid #e65100',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🧠</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px 0', color: '#e65100' }}>
              Bước 2: Phân tích
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#666', margin: 0 }}>
              AI trích xuất actor, use case, quy tắc nghiệp vụ, 
              phân tích gap, phát hiện mâu thuẫn.
            </p>
          </div>

          <div style={{
            flex: 1, background: '#f5f7fa', borderRadius: 10, padding: 18,
            borderTop: '3px solid #2e7d32',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🏗️</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px 0', color: '#2e7d32' }}>
              Bước 3: Scaffold
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#666', margin: 0 }}>
              AI sinh module tree + feature tree + intel layer.
              Bạn chỉ việc gọi <code>/resume-module M-001</code>.
            </p>
          </div>
        </div>

        {/* Kinh nghiệm thực tế */}
        <div style={{
          display: 'flex', flexDirection: 'row', gap: 16,
        }}>
          <div style={{
            flex: 1, background: '#e8f5e9', borderRadius: 10, padding: 16,
            border: '1px solid #c8e6c9',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px 0', color: '#2e7d32' }}>
              ✅ Kinh nghiệm xương máu
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 1.7, color: '#444', margin: 0, paddingLeft: 16 }}>
              <li>File càng sạch, kết quả càng tốt</li>
              <li>Với tài liệu lớn (&gt;50 trang), AI tự động chạy chế độ map-reduce</li>
              <li>Luôn review kết quả trước khi scaffold</li>
              <li>Nếu document có bảng, AI xử lý cực tốt</li>
            </ul>
          </div>

          <div style={{
            flex: 1, background: '#fff3e0', borderRadius: 10, padding: 16,
            border: '1px solid #ffe0b2',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px 0', color: '#e65100' }}>
              ⚠️ Cạm bẫy thường gặp
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 1.7, color: '#444', margin: 0, paddingLeft: 16 }}>
              <li>File scan kém → AI đọc sai → BA mất thời gian sửa</li>
              <li>Tài liệu cũ không đồng bộ → AI vẫn scaffold lên</li>
              <li>BA không review → module sai cấu trúc ngay từ đầu</li>
            </ul>
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#78909c', marginTop: 16, textAlign: 'center', fontStyle: 'italic' }}>
          📌 Ví dụ thực tế: Dự án "Cổng thông tin Sở KHCN" — SRS dạng PDF 45 trang 
          → /from-doc → 5 modules, 18 features, pipeline chạy ngay.
        </p>
      </div>
    ),
  },
] satisfies Page[];
