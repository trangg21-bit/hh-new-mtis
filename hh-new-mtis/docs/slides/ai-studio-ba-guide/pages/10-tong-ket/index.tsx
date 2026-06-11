import type { Page } from '../types';

export default [
  {
    id: 'summary',
    element: (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff', fontFamily: '"Segoe UI", Arial, sans-serif',
        padding: '40 60',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 6px 0', color: '#64ffda', textAlign: 'center' }}>
          🎯 Tổng kết
        </h2>
        <div style={{ width: 80, height: 3, background: '#64ffda', margin: '0 auto 20px', borderRadius: 2 }} />

        {/* 3 cột recap */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 24 }}>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💡</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px 0', color: '#64ffda' }}>
              Từ Ý tưởng
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#b0bec5', margin: 0 }}>
              /from-idea biến "trong đầu" thành pipeline có cấu trúc
            </p>
          </div>

          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px 0', color: '#ffd54f' }}>
              Từ Tài liệu
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#b0bec5', margin: 0 }}>
              /from-doc ăn SRS/BRD, nhả ra modules + features sẵn sàng
            </p>
          </div>

          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🚀</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px 0', color: '#ff7043' }}>
              Đến Bàn giao
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#b0bec5', margin: 0 }}>
              Pipeline chạy BA → SA → Dev → QA → Reviewer. Bạn chỉ việc "lái"
            </p>
          </div>
        </div>

        {/* Hành động tiếp theo */}
        <div style={{
          background: 'rgba(100,255,218,0.1)', borderRadius: 12, padding: 20,
          border: '1px solid rgba(100,255,218,0.3)',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 12px 0', color: '#64ffda', textAlign: 'center' }}>
            📋 Next Steps cho BA
          </h3>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, lineHeight: 2, color: '#b0bec5' }}>
                <div>1️⃣ Thử ngay <code>/from-idea</code> với 1 ý tưởng nhỏ</div>
                <div>2️⃣ Lấy 1 file SRS có sẵn, chạy <code>/from-doc</code></div>
                <div>3️⃣ Làm quen với <code>ai-kit-query</code> để tra catalog</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, lineHeight: 2, color: '#b0bec5' }}>
                <div>4️⃣ Đọc transcript của các agent để hiểu luồng</div>
                <div>5️⃣ Chạy <code>/resume-module</code> trên module đầu tiên</div>
                <div>6️⃣ Review kết quả và lặp lại!</div>
              </div>
            </div>
          </div>
        </div>

        <p style={{
          fontSize: 14, color: '#78909c', textAlign: 'center', marginTop: 20,
          fontStyle: 'italic',
        }}>
          "AI Studio không thay thế BA — nó giúp BA làm việc ở tầm cao hơn." 🚀
        </p>
      </div>
    ),
  },
] satisfies Page[];
