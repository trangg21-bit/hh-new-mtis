import type { Page } from '../types';

export default [
  {
    id: 'collaborate',
    element: (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff', fontFamily: '"Segoe UI", Arial, sans-serif',
        padding: '40 60',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 6px 0', color: '#64ffda' }}>
          🤝 Cộng tác với các Agent khác
        </h2>
        <div style={{ width: 80, height: 3, background: '#64ffda', marginBottom: 20, borderRadius: 2 }} />

        <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 20px 0', color: '#b0bec5' }}>
          BA không làm một mình. Sau khi bạn scaffold xong, pipeline đi qua 
          <strong> 5 chặng</strong> — mỗi chặng do một Agent chuyên biệt đảm nhận.
        </p>

        {/* Pipeline flow */}
        <div style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          justifyContent: 'center', gap: 4, marginBottom: 20, flexWrap: 'wrap' as const,
        }}>
          <AgentBox role="BA" emoji="👤" sub="You!" active={true} />
          <Arrow3 />
          <AgentBox role="System Architect" emoji="🏛️" sub="Thiết kế routes, entities" active={false} />
          <Arrow3 />
          <AgentBox role="Tech Lead" emoji="👨‍💻" sub="Chia task, lên wave" active={false} />
          <Arrow3 />
          <AgentBox role="Developer" emoji="⚡" sub="Viết code" active={false} />
          <Arrow3 />
          <AgentBox role="QA" emoji="🧪" sub="Test + Evidence" active={false} />
          <Arrow3 />
          <AgentBox role="Reviewer" emoji="🔍" sub="Quality gate" active={false} />
        </div>

        {/* Chi tiết */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 14 }}>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 16,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px 0', color: '#64ffda' }}>
              👤 BA: Đầu vào quyết định đầu ra
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 1.7, color: '#b0bec5', margin: 0, paddingLeft: 16 }}>
              <li>Bạn viết Lean Spec (Acceptance Criteria + Business Rules)</li>
              <li>SA dựa vào đó để thiết kế architecture</li>
              <li>Spec tốt → Code đúng ngay từ lần đầu</li>
              <li>Spec mơ hồ → Rework, tốn thời gian</li>
            </ul>
          </div>

          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 16,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px 0', color: '#ffd54f' }}>
              🔄 Vòng phản hồi
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 1.7, color: '#b0bec5', margin: 0, paddingLeft: 16 }}>
              <li>Reviewer block → quay lại BA để sửa spec</li>
              <li>QA tìm bug → BA cập nhật business rule</li>
              <li>SA thấy bất khả thi → BA điều chỉnh yêu cầu</li>
              <li>Tất cả đều trong pipeline, không lo mất trace</li>
            </ul>
          </div>

          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 16,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px 0', color: '#ff7043' }}>
              ⚠️ BA không nên làm
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 1.7, color: '#b0bec5', margin: 0, paddingLeft: 16 }}>
              <li>Không viết code thay Dev</li>
              <li>Không thiết kế DB thay SA</li>
              <li>Không viết test thay QA</li>
              <li>Không tự merge code vào nhánh chính</li>
              <li><strong>Hãy để các Agent làm việc của họ!</strong></li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
] satisfies Page[];

function AgentBox({ role, emoji, sub, active }: { role: string; emoji: string; sub: string; active: boolean }) {
  return (
    <div style={{
      background: active ? 'rgba(100,255,218,0.15)' : 'rgba(255,255,255,0.06)',
      borderRadius: 8, padding: '8 12', textAlign: 'center',
      border: active ? '1px solid #64ffda' : '1px solid transparent',
      minWidth: 80,
    }}>
      <div style={{ fontSize: 20 }}>{emoji}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: active ? '#64ffda' : '#b0bec5', marginTop: 2 }}>
        {role}
      </div>
      <div style={{ fontSize: 9, color: '#78909c' }}>{sub}</div>
    </div>
  );
}

function Arrow3() {
  return <span style={{ color: '#78909c', fontSize: 14, fontWeight: 300 }}>→</span>;
}
