import type { Page } from '../types';

export default [
  {
    id: 'from-idea',
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
          💡 Từ Ý tưởng → Pipeline với /from-idea
        </h2>
        <div style={{ width: 80, height: 3, background: '#64ffda', marginBottom: 24, borderRadius: 2 }} />

        <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 20px 0', color: '#b0bec5' }}>
          <strong>"Anh ơi, em có ý tưởng này..."</strong> — Câu nói quen thuộc nhất 
          với BA. <code>/from-idea</code> là skill giúp bạn không bị "đuối" khi mọi thứ
          còn mơ hồ.
        </p>

        {/* Flow diagram */}
        <div style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          justifyContent: 'center', gap: 8, marginBottom: 20,
        }}>
          <StepBox label="Ý tưởng" sub="Khách hàng nói" color="#64ffda" />
          <Arrow />
          <StepBox label="PRFAQ" sub="Vòng 1" color="#ffd54f" />
          <Arrow />
          <StepBox label="Impact Map" sub="Vòng 2" color="#ffd54f" />
          <Arrow />
          <StepBox label="Event Storm" sub="Vòng 3" color="#ffd54f" />
          <Arrow />
          <StepBox label="Story Map" sub="Vòng 4 + Premortem" color="#ffd54f" />
          <Arrow />
          <StepBox label="Pipeline sẵn sàng" sub="Module + Feature tree" color="#64ffda" />
        </div>

        {/* 2 cột: trước và sau */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 20 }}>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 18,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px 0', color: '#ef9a9a' }}>
              ❌ Trước khi có AI Studio
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 1.8, color: '#b0bec5', margin: 0, paddingLeft: 18 }}>
              <li>Họp 3 buổi để clarify requirement</li>
              <li>BA viết BRD mất 2 tuần</li>
              <li>Dev đọc xong: "Không hiểu, làm lại"</li>
              <li>QA: "Test case nào?" — BA ngơ ngác</li>
            </ul>
          </div>

          <div style={{
            flex: 1, background: 'rgba(100,255,218,0.08)', borderRadius: 10, padding: 18,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px 0', color: '#64ffda' }}>
              ✅ Với AI Studio
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 1.8, color: '#b0bec5', margin: 0, paddingLeft: 18 }}>
              <li>Gọi /from-idea, ngồi trả lời 4 vòng (~30 phút)</li>
              <li>AI tự sinh intel + feature-brief</li>
              <li>Pipeline sẵn sàng cho engineering</li>
              <li>BA chỉ việc review và bàn giao</li>
            </ul>
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#78909c', marginTop: 16, textAlign: 'center', fontStyle: 'italic' }}>
          📌 Ví dụ thực tế: "App quản lý lịch họp cho startup" → sau 4 vòng phỏng vấn,
          AI sinh ra 3 modules, 12 features, mỗi feature có brief riêng.
        </p>
      </div>
    ),
  },
] satisfies Page[];

function StepBox({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10 14',
      textAlign: 'center', minWidth: 90, border: `1px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color }}>{label}</div>
      <div style={{ fontSize: 10, color: '#78909c' }}>{sub}</div>
    </div>
  );
}

function Arrow() {
  return <span style={{ color: '#78909c', fontSize: 18, fontWeight: 300 }}>→</span>;
}
