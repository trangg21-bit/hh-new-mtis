import type { Page } from '../types';

export default [
  {
    id: 'intake',
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
          📥 Tiếp nhận & Phân loại Yêu cầu với /intake
        </h2>
        <div style={{ width: 80, height: 3, background: '#0f3460', marginBottom: 24, borderRadius: 2 }} />

        <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 16px 0', color: '#555' }}>
          <strong>"BA ơi, thêm cái nút export ra Excel nữa nhé."</strong> — Một câu nói đơn giản
          nhưng có thể là: tính năng mới, thay đổi tính năng cũ, hoặc đã có rồi.
          <code>/intake</code> giúp bạn xử lý ngay.
        </p>

        {/* Luồng xử lý */}
        <div style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          justifyContent: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const,
        }}>
          <IntakeStep label="Yêu cầu thô" icon="💬" />
          <Arrow2 />
          <IntakeStep label="Tra catalog" icon="🔍" />
          <Arrow2 />
          <IntakeStep label="Phân tích trùng" icon="⚖️" />
          <Arrow2 />
          <IntakeStep label="Đề xuất routing" icon="🗺️" />
          <Arrow2 />
          <IntakeStep label="BA phê duyệt" icon="✅" />
          <Arrow2 />
          <IntakeStep label="AI scaffold" icon="🏗️" />
        </div>

        {/* Kịch bản */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
          <div style={{
            flex: 1, background: '#f5f7fa', borderRadius: 10, padding: 16,
            borderLeft: '4px solid #1565c0',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px 0', color: '#1565c0' }}>
              🔵 Kịch bản: Thêm export Excel
            </h3>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: '#555' }}>
              <p>BA gõ: <code>/intake thêm nút export ra Excel</code></p>
              <p>💻 AI tra catalog:</p>
              <ul>
                <li>Tìm thấy feature "F-023: Export báo cáo" trong M-004</li>
                <li>Feature hiện chỉ hỗ trợ PDF</li>
                <li>📌 <strong>Đề xuất:</strong> Update feature F-023<br/>
                  <span style={{ color: '#888' }}>(thêm định dạng Excel vào export)</span></li>
              </ul>
              <p>BA: "OK, làm đi." — AI tự động update module.</p>
            </div>
          </div>

          <div style={{
            flex: 1, background: '#f5f7fa', borderRadius: 10, padding: 16,
            borderLeft: '4px solid #e65100',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px 0', color: '#e65100' }}>
              🟠 Kịch bản: Yêu cầu mới mơ hồ
            </h3>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: '#555' }}>
              <p>BA gõ: <code>/intake làm chức năng chat</code></p>
              <p>💻 AI tra catalog:</p>
              <ul>
                <li>Không có module chat nào</li>
                <li>Nhưng có M-003 "Thông báo" — có thể mở rộng</li>
                <li>📌 <strong>Đề xuất routing:</strong></li>
                <li>Option A: New module "Chat" (ưu tiên)</li>
                <li>Option B: Mở rộng M-003 thành "Thông báo & Chat"</li>
                <li>Option C: Skip (đã có module tương tự?)</li>
              </ul>
              <p>BA chọn A → AI scaffold module mới.</p>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: 12, background: '#e8f5e9', borderRadius: 8,
          fontSize: 14, color: '#2e7d32', textAlign: 'center', border: '1px solid #c8e6c9',
        }}>
          💡 <strong>Lợi ích:</strong> Không còn cảnh BA ngồi tra Excel catalog, gọi điện hỏi dev
          "cái này làm chưa em?" — AI làm hết!
        </div>
      </div>
    ),
  },
] satisfies Page[];

function IntakeStep({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{
      background: '#f5f7fa', borderRadius: 8, padding: '8 12',
      textAlign: 'center', border: '1px solid #e0e0e0',
    }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Arrow2() {
  return <span style={{ color: '#bdbdbd', fontSize: 14 }}>→</span>;
}
