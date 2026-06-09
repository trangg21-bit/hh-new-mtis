import type { Page } from '../types';

export default [
  {
    id: 'skills',
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
          🛠️ Các Skill chính dành cho BA
        </h2>
        <div style={{ width: 80, height: 3, background: '#0f3460', marginBottom: 24, borderRadius: 2 }} />

        <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 20px 0', color: '#555' }}>
          Đây là "cần câu cơm" — những skill bạn sẽ dùng hằng ngày:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Card 1 */}
          <div style={{
            background: '#f5f7fa', borderRadius: 10, padding: 18,
            borderTop: '3px solid #1565c0',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px 0', color: '#1565c0' }}>
              <code style={{ background: '#e3f2fd', padding: '2 8', borderRadius: 4 }}>/from-idea</code>
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: '#666', margin: 0 }}>
              <strong>Tình huống:</strong> Khách hàng gọi: "Tôi muốn một app đặt bàn ăn, 
              nhưng chưa có gì cả, chỉ trong đầu."<br />
              → Gọi <code>/from-idea</code>, trả lời 4 vòng phỏng vấn, 
              AI tự sinh pipeline.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: '#f5f7fa', borderRadius: 10, padding: 18,
            borderTop: '3px solid #e65100',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px 0', color: '#e65100' }}>
              <code style={{ background: '#fff3e0', padding: '2 8', borderRadius: 4 }}>/from-doc</code>
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: '#666', margin: 0 }}>
              <strong>Tình huống:</strong> Bên A gửi 1 file PDF SRS 50 trang.
              <br />
              → Gọi <code>/from-doc path/file.pdf</code>. AI đọc, phân tích,
              sinh module + feature tree hoàn chỉnh.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: '#f5f7fa', borderRadius: 10, padding: 18,
            borderTop: '3px solid #2e7d32',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px 0', color: '#2e7d32' }}>
              <code style={{ background: '#e8f5e9', padding: '2 8', borderRadius: 4 }}>/intake</code>
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: '#666', margin: 0 }}>
              <strong>Tình huống:</strong> Dev báo: "Cần thêm chức năng export PDF."
              <br />
              → Gọi <code>/intake</code>, AI tra catalog, kiểm tra trùng, 
              đề xuất: new feature / update module / bỏ qua.
            </p>
          </div>

          {/* Card 4 */}
          <div style={{
            background: '#f5f7fa', borderRadius: 10, padding: 18,
            borderTop: '3px solid #6a1b9a',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px 0', color: '#6a1b9a' }}>
              <code style={{ background: '#f3e5f5', padding: '2 8', borderRadius: 4 }}>/new-feature</code>
              & <code style={{ background: '#f3e5f5', padding: '2 8', borderRadius: 4 }}>/update-module</code>
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: '#666', margin: 0 }}>
              Thêm tính năng mới vào module có sẵn, hoặc thay đổi scope
              khi khách hàng đổi ý giữa chừng.
            </p>
          </div>
        </div>

        <div style={{
          marginTop: 20, padding: 12, background: '#fff8e1', borderRadius: 8,
          fontSize: 14, color: '#e65100', textAlign: 'center', border: '1px solid #ffecb3',
        }}>
          💡 Mẹo: Gõ <code style={{ background: '#fff3e0', padding: '2 6', borderRadius: 4 }}>/</code> trong AI Studio 
          để xem danh sách skill — giống như autocomplete trong IDE!
        </div>
      </div>
    ),
  },
] satisfies Page[];
