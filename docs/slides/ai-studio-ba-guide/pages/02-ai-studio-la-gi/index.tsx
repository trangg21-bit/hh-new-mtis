import type { Page } from '../types';

export default [
  {
    id: 'what-is',
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
          🤖 AI Studio là gì?
        </h2>
        <div style={{ width: 80, height: 3, background: '#0f3460', marginBottom: 24, borderRadius: 2 }} />

        <p style={{ fontSize: 18, lineHeight: 1.7, margin: '0 0 20px 0', color: '#555' }}>
          <strong>AI Studio</strong> là nền tảng <strong>agent-driven</strong> — nơi các AI Agent chuyên biệt
          cộng tác để thực hiện quy trình phát triển phần mềm.
        </p>

        <div style={{ display: 'flex', flexDirection: 'row', gap: 20, marginTop: 8 }}>
          {/* Card 1 */}
          <div style={{
            flex: 1, background: '#f5f7fa', borderRadius: 12, padding: 20,
            borderLeft: '4px solid #64ffda',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px 0', color: '#1a1a2e' }}>
              🧠 Agents chuyên biệt
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#666', margin: 0 }}>
              Mỗi Agent đảm nhận một vai trò trong nhóm: BA, System Architect,
              Developer, QA, Reviewer... giống như một team thực thụ.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            flex: 1, background: '#f5f7fa', borderRadius: 12, padding: 20,
            borderLeft: '4px solid #ffd54f',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px 0', color: '#1a1a2e' }}>
              📋 Pipeline có cấu trúc
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#666', margin: 0 }}>
              Từ ý tưởng → Requirements → Architecture → Code → Test →
              Review. AI Studio quản lý trạng thái từng bước.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            flex: 1, background: '#f5f7fa', borderRadius: 12, padding: 20,
            borderLeft: '4px solid #ff7043',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px 0', color: '#1a1a2e' }}>
              🛠️ Skill đóng gói
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#666', margin: 0 }}>
              Các kịch bản được đóng gói thành <strong>Skill</strong> — gọi
              một lệnh, cả pipeline tự động chạy.
            </p>
          </div>
        </div>

        <div style={{
          marginTop: 24, padding: 16, background: '#e8f5e9', borderRadius: 8,
          fontSize: 15, color: '#2e7d32', textAlign: 'center', border: '1px solid #c8e6c9',
        }}>
          💡 <strong>Tương tự:</strong> Giống như bạn có một team phát triển ảo
          — BA là người "lái" team đó bằng các skill và lệnh điều phối.
        </div>
      </div>
    ),
  },
] satisfies Page[];
