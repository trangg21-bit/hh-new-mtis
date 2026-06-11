import type { DesignSystem, Page, SlideMeta } from '@ai-studio/slide-studio';

// ─── Panel-tweakable design tokens ────────────────────────────────────────────
export const design: DesignSystem = {
  palette: {
    bg: '#08090a',
    text: '#f7f8f8',
    accent: '#7170ff',
  },
  fonts: {
    display: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
    body: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  },
  typeScale: {
    hero: 168,
    body: 36,
  },
  radius: 16,
};

// ─── Local constants ──────────────────────────────────────────────────────────
const palette = {
  bg: design.palette.bg,
  text: design.palette.text,
  accent: design.palette.accent,
  surface: '#0e0f12',
  surfaceHi: '#14161a',
  surfaceMax: '#1a1c21',
  textSoft: '#c7c9d1',
  muted: '#6f727c',
  dim: '#3e4048',
  border: 'rgba(255,255,255,0.07)',
  borderBright: 'rgba(255,255,255,0.14)',
  accentSoft: '#a3a0ff',
  accent2: '#5e6ad2',
  mint: '#68cc9a',
  amber: '#e0b25c',
  ocean: '#4fc3f7',
  oceanSoft: '#80d8ff',
  coral: '#ff6b6b',
  coralSoft: '#ff8a80',
  inspect: '#3b82f6',
  inspectFill: 'rgba(59,130,246,0.10)',
};

const font = {
  sans: design.fonts.body,
  display: design.fonts.display,
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
};

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  letterSpacing: '-0.015em',
  overflow: 'hidden',
  position: 'relative' as const,
};

// ─── Shared animations ────────────────────────────────────────────────────────
const styles = `
  @keyframes es-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes es-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes es-blink {
    0%, 49%   { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  @keyframes gs-type {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes gs-thumbIn {
    from { opacity: 0; transform: translateY(24px) scale(.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes gs-crosshair {
    0%   { transform: translate(-60px, 40px); }
    55%  { transform: translate(0, 0); }
    100% { transform: translate(0, 0); }
  }
  @keyframes gs-outline {
    0%, 40% { opacity: 0; transform: scale(1.02); }
    60%     { opacity: 1; transform: scale(1); }
    100%    { opacity: 1; transform: scale(1); }
  }
  @keyframes gs-popover {
    0%, 60% { opacity: 0; transform: translateY(6px) scale(.96); }
    80%     { opacity: 1; transform: translateY(0) scale(1); }
    100%    { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes gs-morph {
    0%, 30% { color: ${palette.text}; text-shadow: 0 0 0 transparent; }
    55%     { color: ${palette.accent}; text-shadow: 0 0 28px ${palette.accent}55; }
    100%    { color: ${palette.accent}; text-shadow: 0 0 0 transparent; }
  }
  @keyframes gs-strike {
    from { background-size: 0 1px; }
    to   { background-size: 100% 1px; }
  }
  @keyframes gs-pulse {
    0%, 100% { box-shadow: 0 0 0 0 ${palette.inspect}00; }
    50%      { box-shadow: 0 0 0 8px ${palette.inspect}22; }
  }
  @keyframes mtis-wave {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes mtis-nodeIn {
    from { opacity: 0; transform: scale(0); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes mtis-link {
    from { stroke-dashoffset: 400; }
    to   { stroke-dashoffset: 0; }
  }
  .es-fadeUp { opacity: 0; animation: es-fadeUp 0.9s cubic-bezier(.2,.7,.2,1) forwards; }
  .es-fadeIn { opacity: 0; animation: es-fadeIn 1.2s ease forwards; }
  .es-caret::after {
    content: '';
    display: inline-block;
    width: 0.06em;
    height: 0.9em;
    background: currentColor;
    margin-left: 0.08em;
    vertical-align: baseline;
    animation: es-blink 1.05s steps(1) infinite;
  }
  .gs-type {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    animation: gs-type 1.6s steps(40, end) forwards;
  }
  .gs-stream { opacity: 0; animation: es-fadeIn .45s ease forwards; }
  .gs-thumbIn  { opacity: 0; animation: gs-thumbIn .75s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-crosshair  { animation: gs-crosshair 1.6s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-outline    { opacity: 0; animation: gs-outline 1.9s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-popover    { opacity: 0; animation: gs-popover 2.3s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-morph      { animation: gs-morph 2.4s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-pulse { animation: gs-pulse 2s ease-in-out infinite; }
  .mtis-wave {
    position: absolute;
    width: 200%;
    height: 100%;
    background: linear-gradient(90deg, transparent, ${palette.ocean}22, transparent);
    animation: mtis-wave 3s linear infinite;
  }
  .mtis-nodeIn { animation: mtis-nodeIn .5s cubic-bezier(.2,.7,.2,1) forwards; }
`;

const Styles = () => <style>{styles}</style>;

// ─── Shared chrome ────────────────────────────────────────────────────────────
const GridBg = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      backgroundSize: '96px 96px',
      maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
    }}
  />
);

const Eyebrow = ({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) => (
  <div
    className={className}
    style={{
      fontFamily: font.mono,
      fontSize: 22,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: palette.muted,
      ...style,
    }}
  >
    {children}
  </div>
);

const TrafficLights = () => (
  <div style={{ display: 'flex', gap: 10 }}>
    {['#ff5f56', '#ffbd2e', '#27c93f'].map((c) => (
      <span
        key={c}
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: c,
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.25)`,
        }}
      />
    ))}
  </div>
);

const WindowShell = ({
  title,
  badge,
  children,
  style,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      borderRadius: 'var(--osd-radius)',
      boxShadow: '0 40px 80px -30px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    <div
      style={{
        height: 52,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: palette.surfaceHi,
        borderBottom: `1px solid ${palette.border}`,
        flexShrink: 0,
      }}
    >
      <TrafficLights />
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontFamily: font.mono,
          fontSize: 20,
          color: palette.muted,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </div>
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end' }}>{badge}</div>
    </div>
    {children}
  </div>
);

// ─── Module Card (reusable) ──────────────────────────────────────────────────
const ModuleCard = ({
  id,
  name,
  count,
  color = palette.accentSoft,
  delay = 0,
}: {
  id: string;
  name: string;
  count: number;
  color?: string;
  delay?: number;
}) => (
  <div
    className="es-fadeUp"
    style={{
      animationDelay: `${delay}s`,
      padding: '18px 20px',
      borderRadius: 14,
      border: `1px solid ${palette.border}`,
      background: palette.surface,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: `${color}18`,
        border: `1px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font.mono,
        fontSize: 13,
        color,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {id}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: palette.text }}>{name}</div>
      <div style={{ fontFamily: font.mono, fontSize: 14, color: palette.muted, marginTop: 2 }}>
        {count} features
      </div>
    </div>
  </div>
);

// ─── Slide 1: Cover ──────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '140px 140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow className="es-fadeUp" style={{ animationDelay: '0.05s' }}>
          mtis · overview
        </Eyebrow>
        <div
          className="es-fadeUp"
          style={{
            animationDelay: '0.05s',
            fontFamily: font.mono,
            fontSize: 20,
            color: palette.muted,
            border: `1px solid ${palette.border}`,
            padding: '8px 16px',
            borderRadius: 999,
          }}
        >
          v1
        </div>
      </div>

      <div>
        <h1
          className="es-fadeUp"
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            lineHeight: 0.98,
            fontWeight: 600,
            margin: 0,
            letterSpacing: '-0.045em',
            animationDelay: '0.15s',
          }}
        >
          Maritime Transport
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${palette.oceanSoft}, var(--osd-accent))`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Infrastructure System.
          </span>
        </h1>
        <p
          className="es-fadeUp"
          style={{
            marginTop: 48,
            maxWidth: 1100,
            fontSize: 'var(--osd-size-body)',
            lineHeight: 1.35,
            color: palette.textSoft,
            animationDelay: '0.35s',
          }}
        >
          Quản lý tập trung thông số kỹ thuật, tài sản, vận hành bảo trì, quy hoạch kết cấu hạ tầng
          giao thông hàng hải trên nền GIS và hải đồ điện tử.
        </p>
      </div>

      <div
        className="es-fadeUp"
        style={{
          animationDelay: '0.55s',
          display: 'flex',
          gap: 48,
          fontFamily: font.mono,
          fontSize: 22,
          color: palette.muted,
        }}
      >
        <span>
          <span style={{ color: palette.oceanSoft }}>11</span> modules
        </span>
        <span>
          <span style={{ color: palette.oceanSoft }}>105</span> features
        </span>
        <span>
          <span style={{ color: palette.oceanSoft }}>14</span> roles
        </span>
        <span>
          <span style={{ color: palette.oceanSoft }}>78</span> screens
        </span>
        <span>
          <span style={{ color: palette.oceanSoft }}>35</span> integrations
        </span>
      </div>
    </div>
  </div>
);

// ─── Slide 2: Problem ─────────────────────────────────────────────────────────
const Problem: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '100px 140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 48,
      }}
    >
      <div className="es-fadeUp">
        <Eyebrow>the problem</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 100,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.0,
          }}
        >
          Data scattered.{' '}
          <span
            style={{
              color: palette.coralSoft,
            }}
          >
            No single source of truth.
          </span>
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 28,
        }}
      >
        {[
          {
            icon: '🗂️',
            title: 'Phân tán',
            desc: 'Dữ liệu KCHT hàng hải nằm rải rác ở nhiều đơn vị, nhiều định dạng — không đồng bộ.',
          },
          {
            icon: '🔍',
            title: 'Khó tra cứu',
            desc: 'Không có hệ thống tập trung để tra cứu thông số kỹ thuật, lịch sử, tài liệu KCHT.',
          },
          {
            icon: '📊',
            title: 'Thiếu báo cáo',
            desc: 'Báo cáo thống kê thủ công, mất thời gian, độ tin cậy thấp, khó tổng hợp cho lãnh đạo.',
          },
        ].map((item, i) => (
          <div
            key={item.title}
            className="es-fadeUp"
            style={{
              animationDelay: `${0.3 + i * 0.12}s`,
              padding: '36px 32px',
              borderRadius: 18,
              border: `1px solid ${palette.border}`,
              background: palette.surface,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 48 }}>{item.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{item.title}</div>
            <div style={{ fontSize: 22, color: palette.textSoft, lineHeight: 1.4 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Slide 3: Solution — System Overview ─────────────────────────────────────
const Solution: Page = () => {
  const layers = [
    { name: 'Presentation', tech: 'React SPA · GIS Client · ENC Viewer', color: palette.oceanSoft },
    { name: 'API Gateway', tech: 'NestJS / FastAPI · REST · WebSocket', color: palette.accentSoft },
    { name: 'Core Services', tech: 'User Mgmt · Asset · O&M · Planning · Reporting', color: palette.accent },
    { name: 'GIS & Spatial', tech: 'Geoserver / PostGIS · S-57/S-100', color: palette.mint },
    { name: 'Data Layer', tech: 'SQL Server 2022 · Redis · MinIO', color: palette.amber },
    { name: 'Integration', tech: 'LGSP · NDXP · MOT Shared DB · Web API', color: palette.coralSoft },
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 120px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>the solution</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
            }}
          >
            Centralized platform.{' '}
            <span style={{ color: palette.oceanSoft }}>End-to-end.</span>
          </h2>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            minHeight: 0,
          }}
        >
          {/* LEFT — layered architecture mock */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              justifyContent: 'center',
            }}
          >
            {layers.map((layer, i) => (
              <div
                key={layer.name}
                className="gs-thumbIn"
                style={{
                  animationDelay: `${0.3 + i * 0.1}s`,
                  padding: '16px 22px',
                  borderRadius: 12,
                  border: `1px solid ${layer.color}44`,
                  background: `${layer.color}0a`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: layer.color,
                    boxShadow: `0 0 12px ${layer.color}66`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: palette.text }}>
                    {layer.name}
                  </div>
                  <div style={{ fontFamily: font.mono, fontSize: 15, color: palette.muted, marginTop: 2 }}>
                    {layer.tech}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — description */}
          <div
            className="es-fadeUp"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 32,
              padding: '0 20px',
            }}
          >
            <p style={{ fontSize: 30, lineHeight: 1.45, color: palette.textSoft, margin: 0 }}>
              Hệ thống thông tin quản lý Kết cấu Hạ tầng Giao thông Hàng hải — <strong style={{ color: palette.text }}>MTIS</strong> — được xây dựng để giải quyết bài toán dữ liệu phân tán bằng một nền tảng tập trung, hiện đại.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['Cục Hàng hải VN', 'Cảng vụ', 'Tổng công ty BĐAT HH', 'VISHIPEL', 'Bộ GTVT'].map((s) => (
                <span
                  key={s}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    background: `${palette.ocean}18`,
                    border: `1px solid ${palette.ocean}44`,
                    fontFamily: font.mono,
                    fontSize: 16,
                    color: palette.oceanSoft,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Slide 4: Modules ────────────────────────────────────────────────────────
const Modules: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '90px 120px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <div className="es-fadeUp">
        <Eyebrow>01 / 11 modules</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
          }}
        >
          11 modules.{' '}
          <span style={{ color: palette.accentSoft }}>105 features.</span>
        </h2>
        <p
          style={{
            marginTop: 20,
            fontSize: 28,
            color: palette.textSoft,
          }}
        >
          Từ quản lý người dùng đến biên tập hải đồ điện tử — phủ toàn bộ nghiệp vụ.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridAutoRows: 'min-content',
          gap: 14,
          alignContent: 'start',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <ModuleCard id="M01" name="User Management" count={10} color={palette.ocean} delay={0.2} />
        <ModuleCard id="M02" name="System Administration" count={8} color={palette.oceanSoft} delay={0.25} />
        <ModuleCard id="M03" name="Technical Parameters" count={26} color={palette.accent} delay={0.3} />
        <ModuleCard id="M04" name="Operations & Maintenance" count={8} color={palette.mint} delay={0.35} />
        <ModuleCard id="M05" name="Planning Management" count={3} color={palette.amber} delay={0.4} />
        <ModuleCard id="M06" name="Asset Management" count={14} color={palette.coralSoft} delay={0.45} />
        <ModuleCard id="M07" name="GIS / Map Infrastructure" count={8} color={palette.ocean} delay={0.5} />
        <ModuleCard id="M08" name="Reporting & Statistics" count={8} color={palette.accentSoft} delay={0.55} />
        <ModuleCard id="M09" name="Data Interconnection" count={6} color={palette.mint} delay={0.6} />
        <ModuleCard id="M10" name="Nautical Chart Editing" count={10} color={palette.amber} delay={0.65} />
        <ModuleCard id="M11" name="Infrastructure DB Creation" count={4} color={palette.coralSoft} delay={0.7} />
      </div>
    </div>
  </div>
);

// ─── Slide 5: Core — M03 Technical Parameters ────────────────────────────────
const CoreModule: Page = () => {
  const types = [
    'Cảng biển', 'Bến cảng', 'Cầu cảng', 'Luồng hàng hải',
    'Phao báo hiệu', 'Đèn biển', 'Đê chắn sóng', 'Trạm VTS',
    'Trạm AIS', 'Cảng vụ', 'Khu neo đậu', 'Trạm thủy văn',
    'Kè bảo vệ bờ', 'Tuyến ống ngầm', 'Cáp ngầm', 'Khu tránh bão',
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 120px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>core · m03</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
            }}
          >
            Technical Parameters.{' '}
            <span style={{ color: palette.accentSoft }}>26 features.</span>
          </h2>
          <p
            style={{
              marginTop: 20,
              fontSize: 28,
              color: palette.textSoft,
            }}
          >
            Quản lý thông số kỹ thuật cho 20+ loại đối tượng KCHT hàng hải.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            alignContent: 'start',
          }}
        >
          {types.map((t, i) => (
            <div
              key={t}
              className="gs-thumbIn"
              style={{
                animationDelay: `${0.2 + i * 0.04}s`,
                padding: '14px 18px',
                borderRadius: 10,
                border: `1px solid ${palette.border}`,
                background: palette.surface,
                fontFamily: font.mono,
                fontSize: 17,
                color: palette.textSoft,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Slide 6: Actors & Roles ─────────────────────────────────────────────────
const Actors: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '90px 120px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <div className="es-fadeUp">
        <Eyebrow>actors · 14 roles</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
          }}
        >
          Role-based access.{' '}
          <span style={{ color: palette.oceanSoft }}>3-tier approval.</span>
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: '1fr 1fr',
          gap: 20,
          minHeight: 0,
        }}
      >
        {[
          { role: 'Quản trị hệ thống', desc: 'Người dùng, phân quyền, cấu hình, sao lưu', tag: 'admin', color: palette.coralSoft },
          { role: 'Lãnh đạo Cục', desc: 'Phê duyệt cấp 3, tổng quan toàn hệ thống', tag: 'approve-3', color: palette.accent },
          { role: 'Lãnh đạo Cảng vụ', desc: 'Phê duyệt cấp 2, quản lý nhân sự', tag: 'approve-2', color: palette.accentSoft },
          { role: 'Chuyên viên KCHT', desc: 'Nhập, cập nhật thông số KCHT, hồ sơ', tag: 'crud', color: palette.ocean },
          { role: 'Chuyên viên GIS', desc: 'Dữ liệu không gian, cập nhật bản đồ', tag: 'spatial', color: palette.mint },
          { role: 'Chuyên viên hải đồ', desc: 'Biên tập hải đồ S-57/S-100', tag: 'chart', color: palette.amber },
        ].map((a, i) => (
          <div
            key={a.role}
            className="es-fadeUp"
            style={{
              animationDelay: `${0.2 + i * 0.08}s`,
              padding: '24px 28px',
              borderRadius: 14,
              border: `1px solid ${palette.border}`,
              background: palette.surface,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: palette.text }}>{a.role}</div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: `${a.color}18`,
                  border: `1px solid ${a.color}44`,
                  fontFamily: font.mono,
                  fontSize: 12,
                  color: a.color,
                }}
              >
                {a.tag}
              </span>
            </div>
            <div style={{ fontSize: 20, color: palette.textSoft, lineHeight: 1.35 }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Slide 7: GIS & ENC ──────────────────────────────────────────────────────
const GisEnc: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '90px 120px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <div className="es-fadeUp">
        <Eyebrow>gis · enc</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
          }}
        >
          Spatial data.{' '}
          <span style={{ color: palette.oceanSoft }}>Nautical charts.</span>
        </h2>
        <p
          style={{
            marginTop: 20,
            fontSize: 28,
            color: palette.textSoft,
          }}
        >
          Quản lý đối tượng điểm/đường/vùng trên nền bản đồ GIS và hải đồ điện tử ENC.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 36,
          minHeight: 0,
        }}
      >
        {/* LEFT — GIS */}
        <WindowShell title="GIS Map Infrastructure · M07">
          <div
            style={{
              flex: 1,
              padding: '28px 32px',
              background: palette.surface,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {[
              { label: 'Đối tượng điểm', desc: 'Phao, đèn, trạm VTS/AIS, cảng vụ' },
              { label: 'Đối tượng đường', desc: 'Luồng hàng hải, tuyến ống, cáp ngầm' },
              { label: 'Đối tượng vùng', desc: 'Khu neo đậu, khu tránh bão, vùng nước' },
              { label: 'Bản đồ nền', desc: 'Tiles, WMS, WFS — nhiều tỷ lệ' },
            ].map((item, i) => (
              <div
                key={item.label}
                className="gs-stream"
                style={{
                  animationDelay: `${0.3 + i * 0.1}s`,
                  padding: '14px 18px',
                  borderRadius: 10,
                  border: `1px solid ${palette.border}`,
                  background: palette.surfaceHi,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>{item.label}</div>
                <div style={{ fontFamily: font.mono, fontSize: 16, color: palette.muted, marginTop: 4 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </WindowShell>

        {/* RIGHT — ENC */}
        <WindowShell title="Nautical Chart Editing · M10">
          <div
            style={{
              flex: 1,
              padding: '28px 32px',
              background: palette.surface,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {[
              { label: 'Import ENC', desc: 'S-57 / S-100 — 108 mảnh hải đồ' },
              { label: 'Biên tập', desc: 'Cập nhật thông tin hàng hải trên hải đồ' },
              { label: 'Chuyển đổi', desc: 'S-57 ↔ S-100, raster ↔ vector' },
              { label: 'Xuất bản', desc: 'Catalog hải đồ, phân phối đến tàu thuyền' },
            ].map((item, i) => (
              <div
                key={item.label}
                className="gs-stream"
                style={{
                  animationDelay: `${0.5 + i * 0.1}s`,
                  padding: '14px 18px',
                  borderRadius: 10,
                  border: `1px solid ${palette.border}`,
                  background: palette.surfaceHi,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>{item.label}</div>
                <div style={{ fontFamily: font.mono, fontSize: 16, color: palette.muted, marginTop: 4 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </WindowShell>
      </div>
    </div>
  </div>
);

// ─── Slide 8: Integrations ────────────────────────────────────────────────────
const Integrations: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '90px 120px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <div className="es-fadeUp">
        <Eyebrow>integrations · 35 endpoints</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
          }}
        >
          Connected. Interoperable.{' '}
          <span style={{ color: palette.mint }}>LGSP ready.</span>
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 28,
          minHeight: 0,
        }}
      >
        {/* LEFT — system diagram */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          {[
            { name: 'LGSP', desc: 'Kết nối liên thông Cục Hàng hải', color: palette.accent },
            { name: 'NDXP', desc: 'Nền tảng chia sẻ dữ liệu quốc gia', color: palette.ocean },
            { name: 'CSDL Bộ GTVT', desc: 'Đồng bộ dữ liệu với Bộ Giao thông', color: palette.mint },
            { name: 'Web API Public', desc: 'Tra cứu KCHT cho tổ chức bên ngoài', color: palette.amber },
          ].map((item, i) => (
            <div
              key={item.name}
              className="gs-thumbIn"
              style={{
                animationDelay: `${0.3 + i * 0.1}s`,
                padding: '20px 24px',
                borderRadius: 14,
                border: `1px solid ${item.color}44`,
                background: `${item.color}0a`,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: palette.text }}>{item.name}</div>
                <div style={{ fontSize: 18, color: palette.textSoft }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — monitoring */}
        <WindowShell title="integration monitor">
          <div
            style={{
              flex: 1,
              padding: '28px 32px',
              background: palette.surface,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              fontFamily: font.mono,
              fontSize: 18,
            }}
          >
            {[
              { route: 'LGSP sync', status: '🟢', last: '2m ago' },
              { route: 'NDXP gateway', status: '🟢', last: '1m ago' },
              { route: 'MOT shared DB', status: '🟡', last: '15m ago' },
              { route: 'Web API public', status: '🟢', last: '30s ago' },
              { route: 'ENC catalog push', status: '🟢', last: '1h ago' },
            ].map((item, i) => (
              <div
                key={item.route}
                className="gs-stream"
                style={{
                  animationDelay: `${0.4 + i * 0.08}s`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: palette.surfaceHi,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <span>{item.status}</span>
                <span style={{ color: palette.text, flex: 1 }}>{item.route}</span>
                <span style={{ color: palette.muted }}>{item.last}</span>
              </div>
            ))}
          </div>
        </WindowShell>
      </div>
    </div>
  </div>
);

// ─── Slide 9: Feature Pipeline ───────────────────────────────────────────────
const Pipeline: Page = () => {
  const stages = [
    { label: 'BA', name: 'Business Analysis', color: palette.ocean, status: 'done' },
    { label: 'SA', name: 'System Architecture', color: palette.accentSoft, status: 'done' },
    { label: 'Designer', name: 'UI/UX Design', color: palette.accent, status: 'done' },
    { label: 'Security', name: 'Security Review', color: palette.coralSoft, status: 'done' },
    { label: 'Tech Lead', name: 'Tech Lead', color: palette.amber, status: 'done' },
    { label: 'Dev', name: 'Development', color: palette.mint, status: 'active' },
    { label: 'QA', name: 'Quality Assurance', color: palette.ocean, status: 'pending' },
    { label: 'Reviewer', name: 'Code Review', color: palette.accentSoft, status: 'pending' },
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 120px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>pipeline · 8-stage SDLC</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
            }}
          >
            From analysis to deploy.{' '}
            <span style={{ color: palette.mint }}>AI-assisted.</span>
          </h2>
          <p
            style={{
              marginTop: 20,
              fontSize: 28,
              color: palette.textSoft,
            }}
          >
            Mỗi feature đi qua 8 giai đoạn — có agent chuyên biệt cho từng bước.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          {/* Pipeline row */}
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
            {stages.map((s, i) => (
              <div
                key={s.label}
                className="gs-thumbIn"
                style={{
                  animationDelay: `${0.2 + i * 0.06}s`,
                  flex: 1,
                  maxWidth: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background:
                      s.status === 'done'
                        ? s.color
                        : s.status === 'active'
                          ? palette.surfaceHi
                          : palette.surface,
                    border:
                      s.status === 'active'
                        ? `2px solid ${s.color}`
                        : `1px solid ${s.status === 'done' ? 'transparent' : palette.dim}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: font.mono,
                    fontSize: 18,
                    fontWeight: 600,
                    color: s.status === 'done' ? palette.bg : s.status === 'active' ? s.color : palette.dim,
                    position: 'relative',
                    boxShadow:
                      s.status === 'active' ? `0 0 20px ${s.color}33` : 'none',
                  }}
                >
                  {s.status === 'done' ? '✓' : s.label}
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: s.status === 'active' ? s.color : palette.muted,
                    fontFamily: font.mono,
                    lineHeight: 1.3,
                  }}
                >
                  {s.name}
                </div>
              </div>
            ))}
          </div>

          {/* Status bar */}
          <div
            className="es-fadeUp"
            style={{
              animationDelay: '0.8s',
              alignSelf: 'center',
              padding: '16px 28px',
              borderRadius: 999,
              background: `${palette.mint}12`,
              border: `1px solid ${palette.mint}44`,
              fontFamily: font.mono,
              fontSize: 20,
              color: palette.mint,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: palette.mint,
                boxShadow: `0 0 12px ${palette.mint}`,
              }}
            />
            In development — 5/8 stages complete
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Slide 10: Architecture Stack ─────────────────────────────────────────────
const Architecture: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '90px 120px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <div className="es-fadeUp">
        <Eyebrow>tech stack</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
          }}
        >
          Modern stack.{' '}
          <span style={{ color: palette.accentSoft }}>Enterprise ready.</span>
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          minHeight: 0,
        }}
      >
        {[
          {
            title: 'Backend',
            items: ['NestJS / FastAPI', 'REST + WebSocket', 'SQL Server 2022', 'Redis Cache', 'MinIO Storage'],
            color: palette.accent,
          },
          {
            title: 'Frontend',
            items: ['React SPA', 'GIS Client', 'ENC Viewer', 'TypeScript', 'Monorepo (pnpm + Turbo)'],
            color: palette.ocean,
          },
          {
            title: 'Infrastructure',
            items: ['Geoserver / PostGIS', 'Docker Compose', 'LGSP / NDXP Gateway', 'S-57 / S-100 ENC', 'Playwright E2E'],
            color: palette.mint,
          },
        ].map((group, i) => (
          <div
            key={group.title}
            className="es-fadeUp"
            style={{
              animationDelay: `${0.2 + i * 0.1}s`,
              borderRadius: 18,
              border: `1px solid ${group.color}44`,
              background: `${group.color}06`,
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: group.color,
                letterSpacing: '-0.015em',
              }}
            >
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.items.map((item, j) => (
                <div
                  key={item}
                  className="gs-stream"
                  style={{
                    animationDelay: `${0.4 + i * 0.1 + j * 0.05}s`,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: `1px solid ${palette.border}`,
                    background: palette.surface,
                    fontFamily: font.mono,
                    fontSize: 17,
                    color: palette.textSoft,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Slide 11: Scale & Data ───────────────────────────────────────────────────
const Scale: Page = () => {
  const metrics = [
    { value: '~2,000+', label: 'KCHT records', color: palette.accent },
    { value: '108', label: 'ENC chart cells', color: palette.ocean },
    { value: '~50', label: 'Concurrent users', color: palette.mint },
    { value: '1,978', label: 'Functional requirements', color: palette.amber },
    { value: '81', label: 'Database entities', color: palette.coralSoft },
    { value: '12', label: 'PII fields protected', color: palette.accentSoft },
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 120px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>by the numbers</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
            }}
          >
            Scale &amp; scope.{' '}
            <span style={{ color: palette.oceanSoft }}>By the numbers.</span>
          </h2>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: '1fr 1fr',
            gap: 24,
            minHeight: 0,
          }}
        >
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className="es-fadeUp"
              style={{
                animationDelay: `${0.2 + i * 0.08}s`,
                borderRadius: 16,
                border: `1px solid ${palette.border}`,
                background: palette.surface,
                padding: '28px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: m.color,
                  lineHeight: 1,
                }}
              >
                {m.value}
              </div>
              <div style={{ fontSize: 24, color: palette.textSoft }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Slide 12: Recap / Close ──────────────────────────────────────────────────
const Recap: Page = () => {
  const items = [
    { n: '01', title: 'Modules', caption: '11 modules, 105 features' },
    { n: '02', title: 'GIS & ENC', caption: 'Spatial + nautical chart editing' },
    { n: '03', title: 'Roles', caption: '14 actors, 3-tier approval' },
    { n: '04', title: 'Integrations', caption: 'LGSP, NDXP, MOT, Web API' },
    { n: '05', title: 'Pipeline', caption: '8-stage AI-assisted SDLC' },
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '140px 140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Eyebrow className="es-fadeUp">recap</Eyebrow>

        <div className="es-fadeUp" style={{ animationDelay: '0.15s' }}>
          <h2
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 160,
              fontWeight: 600,
              letterSpacing: '-0.045em',
              lineHeight: 0.98,
              margin: 0,
            }}
          >
            MTIS —
            <br />
            <span
              style={{
                background: `linear-gradient(90deg, ${palette.accentSoft}, ${palette.accent})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              transforming maritime.
            </span>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 20,
          }}
        >
          {items.map((s, i) => (
            <div
              key={s.n}
              className="es-fadeUp"
              style={{
                animationDelay: `${0.35 + i * 0.1}s`,
                padding: '24px 24px',
                border: `1px solid ${palette.border}`,
                borderRadius: 14,
                background: palette.surface,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 20,
                  color: palette.accentSoft,
                  letterSpacing: '0.12em',
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 18,
                  color: palette.muted,
                }}
              >
                {s.caption}
              </div>
            </div>
          ))}
        </div>

        <div
          className="es-fadeUp"
          style={{
            animationDelay: '0.75s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: font.mono,
            fontSize: 22,
            color: palette.muted,
          }}
        >
          <span>
            Cục Hàng hải Việt Nam —{' '}
            <span style={{ color: palette.text }}>Hệ thống quản lý KCHT Giao thông Hàng hải</span>
          </span>
          <span>MTIS v1</span>
        </div>
      </div>
    </div>
  );
};

// ─── Slide export ────────────────────────────────────────────────────────────
export const meta: SlideMeta = {
  title: 'MTIS — Hệ thống Quản lý Kết cấu Hạ tầng Giao thông Hàng hải',
};

export default [
  Cover,
  Problem,
  Solution,
  Modules,
  CoreModule,
  Actors,
  GisEnc,
  Integrations,
  Pipeline,
  Architecture,
  Scale,
  Recap,
] satisfies Page[];
