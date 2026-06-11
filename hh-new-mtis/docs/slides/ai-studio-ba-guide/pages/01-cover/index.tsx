import type { Page } from '../types';

export default [
  {
    id: 'cover',
    element: (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff', fontFamily: '"Segoe UI", Arial, sans-serif',
        padding: 60, textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 72, marginBottom: 24, opacity: 0.9 }}>🤖</div>
        {/* Main title */}
        <h1 style={{ fontSize: 48, fontWeight: 700, margin: '0 0 12px 0', letterSpacing: 1 }}>
          Hướng dẫn sử dụng AI Studio
        </h1>
        <h2 style={{ fontSize: 36, fontWeight: 300, margin: '0 0 8px 0', color: '#64ffda' }}>
          dành cho Business Analyst (BA)
        </h2>
        {/* Divider */}
        <div style={{ width: 120, height: 3, background: '#64ffda', margin: '24px 0', borderRadius: 2 }} />
        {/* Subtitle */}
        <p style={{ fontSize: 18, color: '#b0bec5', maxWidth: 600, lineHeight: 1.6 }}>
          Từ ý tưởng đến Pipeline — Cách BA làm chủ quy trình phát triển <br />
          phần mềm với AI Studio
        </p>
        {/* Meta */}
        <div style={{ marginTop: 40, fontSize: 14, color: '#78909c' }}>
          ETC — AI Studio Runtime
        </div>
      </div>
    ),
  },
] satisfies Page[];
