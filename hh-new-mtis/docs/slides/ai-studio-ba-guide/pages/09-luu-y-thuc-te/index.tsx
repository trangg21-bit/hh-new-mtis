import type { Page } from '../types';

export default [
  {
    id: 'tips',
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
          🎯 Các Lưu ý Thực tế
        </h2>
        <div style={{ width: 80, height: 3, background: '#0f3460', marginBottom: 24, borderRadius: 2 }} />

        <div style={{ display: 'flex', flexDirection: 'row', gap: 20 }}>
          {/* Cột trái: Tips */}
          <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TipBox
              icon="⏳"
              title="Chạy background agents"
              color="#1565c0"
              body="Khi gọi skill lớn (from-doc, from-idea), luôn set <code>background: true</code> 
              để không phải chờ đợi. Bạn làm việc khác trong lúc AI xử lý."
            />
            <TipBox
              icon="📖"
              title="Đọc transcript subagent"
              color="#e65100"
              body="Sau khi agent chạy xong, dùng <code>read_subagent_transcript()</code> để đọc 
              toàn bộ luồng suy nghĩ — không chỉ verdict cuối."
            />
            <TipBox
              icon="🔍"
              title="Tra catalog thường xuyên"
              color="#2e7d32"
              body="Dùng <code>ai-kit-query preset=module-status-summary</code> để xem 
              module nào đang ở stage nào. Giống như dashboard dự án."
            />
            <TipBox
              icon="🔄"
              title="Auto-pass mode"
              color="#6a1b9a"
              body="Khi chạy pipeline overnight, bật auto-pass bằng flag. AI tự động approve 
              các checkpoint không gây hại. Sáng hôm sau chỉ review những chỗ thực sự cần."
            />
          </div>

          {/* Cột phải: Checklist */}
          <div style={{
            flex: 0.7, background: '#f5f7fa', borderRadius: 12, padding: 20,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 12px 0', color: '#0f3460' }}>
              ✅ BA Daily Checklist
            </h3>
            <div style={{ fontSize: 14, lineHeight: 2.2, color: '#444' }}>
              <div>☐ Kiểm tra catalog hôm nay có gì mới?</div>
              <div>☐ Có yêu cầu intake từ dev/khách hàng?</div>
              <div>☐ Module nào đang chờ BA review spec?</div>
              <div>☐ Reviewer block module nào cần BA vào?</div>
              <div>☐ Đã cập nhật intel layer chưa?</div>
              <div>☐ Chạy <code>intel-snapshot</code> để đồng bộ?</div>
            </div>
            <div style={{
              marginTop: 16, padding: 12, background: '#e3f2fd', borderRadius: 8,
              fontSize: 13, color: '#1565c0', textAlign: 'center',
            }}>
              🧠 Mất 5 phút mỗi sáng, tiết kiệm 2 tiếng mỗi ngày!
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: 12, background: '#fff3e0', borderRadius: 8,
          fontSize: 14, color: '#e65100', textAlign: 'center', border: '1px solid #ffe0b2',
        }}>
          ⚠️ Nguyên tắc vàng: <strong>AI hỗ trợ, BA quyết định.</strong> 
          Đừng tin AI mù quáng — luôn review kết quả trước khi bàn giao.
        </div>
      </div>
    ),
  },
] satisfies Page[];

function TipBox({ icon, title, color, body }: { icon: string; title: string; color: string; body: string }) {
  return (
    <div style={{
      background: '#f5f7fa', borderRadius: 10, padding: '12 16',
      borderLeft: `4px solid ${color}`,
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px 0', color }}>
        {icon} {title}
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: '#666', margin: 0 }}
        dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}
