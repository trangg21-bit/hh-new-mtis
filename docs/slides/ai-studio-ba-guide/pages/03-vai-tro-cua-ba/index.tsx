import type { Page } from '../types';

export default [
  {
    id: 'ba-role',
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
          👤 Vai trò của BA trong AI Studio
        </h2>
        <div style={{ width: 80, height: 3, background: '#0f3460', marginBottom: 24, borderRadius: 2 }} />

        <p style={{ fontSize: 18, lineHeight: 1.7, margin: '0 0 20px 0', color: '#555' }}>
          BA không thay thế — BA <strong>lái</strong> quy trình. Bạn là người chuyển đổi
          nhu cầu kinh doanh thành input có cấu trúc cho AI Studio.
        </p>

        <div style={{ display: 'flex', flexDirection: 'row', gap: 20, marginTop: 8 }}>
          {/* Cột trái: 3 vai trò */}
          <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: '#f5f7fa', borderRadius: 10, padding: '14 18',
              borderLeft: '4px solid #1565c0',
            }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 4px 0', color: '#1565c0' }}>
                🎙️ Người kể chuyện (Storyteller)
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: '#666', margin: 0 }}>
                Biến ý tưởng mơ hồ của khách hàng thành <strong>PRFAQ</strong>,
                <strong> Impact Map</strong>, <strong>Event Storm</strong> qua skill <code>/from-idea</code>.
              </p>
            </div>

            <div style={{
              background: '#f5f7fa', borderRadius: 10, padding: '14 18',
              borderLeft: '4px solid #e65100',
            }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 4px 0', color: '#e65100' }}>
                📄 Kỹ sư tài liệu (Document Analyst)
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: '#666', margin: 0 }}>
                Nạp SRS, BRD, PDF, Word vào skill <code>/from-doc</code> để
                AI tự phân tích và sinh ra modules + features.
              </p>
            </div>

            <div style={{
              background: '#f5f7fa', borderRadius: 10, padding: '14 18',
              borderLeft: '4px solid #2e7d32',
            }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 4px 0', color: '#2e7d32' }}>
                🧭 Người điều phối (Orchestrator)
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: '#666', margin: 0 }}>
                Dùng <code>/intake</code> để tiếp nhận yêu cầu, phân loại,
                kiểm tra trùng lặp và đề xuất hướng xử lý.
              </p>
            </div>
          </div>

          {/* Cột phải: Tóm tắt */}
          <div style={{
            flex: 1, background: '#e8eaf6', borderRadius: 12, padding: 20,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px 0', color: '#1a237e', textAlign: 'center' }}>
              BA + AI Studio = Sức mạnh nhân đôi
            </h3>
            <ul style={{ fontSize: 14, lineHeight: 2, color: '#444', margin: 0, paddingLeft: 20 }}>
              <li>Không cần chờ dev làm spec</li>
              <li>Yêu cầu được cấu trúc ngay từ đầu</li>
              <li>Phát hiện sớm conflict & gap</li>
              <li>Bàn giao engineering liền mạch</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
] satisfies Page[];
