---
feature-id: HH-INTEL-001
document: doc-brief
source-files:
  - docs/inputs/1.TKCT-Cuc HH-KetCauHaTangGiaoThong 13.11.2024 ban in final (1).docx
  - docs/inputs/MOT_VMD_MTIS_URD_ v3.0_PHCV_Final.pdf
  - docs/inputs/MOT_VMD_MTIS_DD_ 3.0_PHCV_Final.pdf
  - docs/inputs/VMD_MTIS_TaiLieuKhaoSat_PM_NoiBo_v1.0_PHCV.pdf
source-type: specification
generated: 2026-06-05
ba-confidence: High
metrics:
  modules: 11
  features: 105
  rules: 160
  entities: 81
  screens: 78
  integrations: 35
  ambiguities-blocking: 0
  ambiguities-nonblocking: 4
  pii-fields-count: 12
  actors-count: 14
---

# Hệ thống thông tin quản lý Kết cấu Hạ tầng Giao thông Hàng hải (MTIS) — Intelligence Brief

## 1. Executive Summary

| Field | Value |
|---|---|
| What the system does | Quản lý tập trung thông số kỹ thuật, tài sản, vận hành bảo trì, quy hoạch kết cấu hạ tầng giao thông hàng hải trên nền GIS và hải đồ điện tử |
| Domain | gov — maritime infrastructure management |
| Business problem solved | Dữ liệu KCHT hàng hải hiện phân tán, thiếu đồng bộ, khó tra cứu và báo cáo; cần CSDL tập trung để quản lý nhà nước hiệu quả |
| Estimated scale | ~2000+ KCHT records, 108 ENC cells, ~50 users (Cục + Cảng vụ + Tổng công ty) |
| Target stakeholders | Cục Hàng hải VN, Cảng vụ, Tổng công ty Bảo đảm AT HH miền Bắc/Nam, VISHIPEL, Bộ GTVT |

## 2. Document Analysis

| Item | Finding |
|---|---|
| Document type | Detailed Design + Cost Estimate (TKCT), supplemented by URD, DD, Survey documents |
| Completeness | actors: explicit, rules: explicit (1,682 requirements in Appendix 01), flows: explicit, data: explicit (DB field definitions in Appendix 06), NFR: explicit, integration: explicit (LGSP/NDXP/MOT shared DB) |
| Analysis strategy | LARGE map-reduce — 11 module workers extracted from TKCT primary source |
| OCR images processed | ~180 screenshots estimated across TKCT document |
| Confidence | High — primary source TKCT is a detailed design document with complete functional requirements catalog (1978 rows in Appendix 01) |

## 3. Actors (canonicalized)

| Role | Slug | Type | Responsibilities | Permissions hint |
|---|---|---|---|---|
| Quản trị hệ thống | system-admin | internal | Quản lý người dùng, phân quyền, cấu hình, sao lưu | Full system access |
| Lãnh đạo Cục | director | internal | Phê duyệt cấp 3, xem tổng quan toàn hệ thống | All read + approve level 3 |
| Lãnh đạo Cảng vụ/Chi cục | port-authority-leader | internal | Phê duyệt cấp 2, quản lý nhân sự cấp dưới | Approve level 2 |
| Chuyên viên quản lý KCHT | infrastructure-officer | internal | Nhập, cập nhật thông số KCHT, quản lý hồ sơ | CRUD infrastructure |
| Chuyên viên quản lý tài sản | asset-officer | internal | Quản lý tài sản KCHT, kiểm kê, báo cáo | CRUD asset |
| Chuyên viên vận hành, bảo trì | maintenance-officer | internal | Theo dõi KH vận hành, bảo trì, sự cố | CRUD ops/maintenance |
| Chuyên viên GIS | gis-officer | internal | Quản lý dữ liệu không gian, cập nhật bản đồ | CRUD spatial |
| Chuyên viên quản lý hải đồ | chart-officer | internal | Biên tập hải đồ điện tử S-57/S-100 | CRUD chart |
| Chuyên viên tổng hợp | reporting-officer | internal | Tạo báo cáo thống kê, xuất PDF/Excel | Read reports |
| Lãnh đạo | senior-leader | internal | Xem tổng quan, phê duyệt đề xuất | Read-only + approve |
| Chuyên viên nghiệp vụ | business-officer | internal | Tra cứu thông tin KCHT, xem báo cáo | Read-only |
| Chuyên viên tích hợp | integration-officer | internal | Quản lý kết nối LGSP, NDXP, giám sát | Manage integration |
| Cá nhân/tổ chức bên ngoài | external-user | external | Tra cứu KCHT qua Web API | Public API |
| Hệ thống | system | system | Đồng bộ LGSP/NDXP, gửi thông báo, sao lưu | System-level |

## 4. Module & Feature Inventory

### Module: User Management [id: M01]
| Property | Value |
|---|---|
| Purpose | Quản lý tài khoản người dùng, phân quyền, đăng nhập |
| Scope | Đăng ký, đăng nhập, quản lý nhóm, phân quyền, tổ chức, khóa/mở tài khoản, xác thực 2 yếu tố |
| Dependencies | None |
| Features | 10 (P0: 5, P1: 5) |

### Module: System Administration [id: M02]
| Property | Value |
|---|---|
| Purpose | Quản trị hệ thống, cấu hình và giám sát |
| Scope | Đơn vị, kết nối liên thông, tài khoản quản trị, phê duyệt, nhật ký, sao lưu |
| Features | 8 (P0: 4, P1: 4) |

### Module: Technical Parameters Management [id: M03] — Core module
| Property | Value |
|---|---|
| Purpose | Quản lý thông số kỹ thuật toàn bộ KCHT hàng hải |
| Scope | 20+ loại đối tượng KCHT (cảng, bến, luồng, phao, đèn, đê, VTS, AIS...), phê duyệt 3 cấp, GIS, lịch sử, tài liệu |
| Features | 26 (P0: 10, P1: 11, P2: 5) |

### Module: Operations & Maintenance [id: M04]
| Property | Value |
|---|---|
| Purpose | Quản lý vận hành khai thác, bảo trì, sự cố |
| Scope | KH vận hành, KH bảo trì, sự cố, lịch sử, báo cáo |
| Features | 8 (P0: 3, P1: 2, P2: 3) |

### Module: Planning Management [id: M05]
| Property | Value |
|---|---|
| Purpose | Quản lý quy hoạch bến cảng |
| Scope | Danh sách quy hoạch, tra cứu, cập nhật năng lực |
| Features | 3 (P0: 2, P1: 1) |

### Module: Asset Management [id: M06] — Large module
| Property | Value |
|---|---|
| Purpose | Quản lý toàn bộ vòng đời tài sản KCHT |
| Scope | Ghi tăng, hao mòn, đánh giá lại, thanh lý, kiểm kê, khai thác, báo cáo |
| Features | 14 (P0: 6, P1: 5, P2: 3) |

### Module: GIS/Map Infrastructure Management [id: M07]
| Property | Value |
|---|---|
| Purpose | Quản lý KCHT trên nền bản đồ GIS |
| Scope | Đối tượng điểm/đường/vùng, bản đồ, biểu tượng, hải đồ ENC |
| Features | 8 (P0: 4, P1: 2, P2: 2) |

### Module: Reporting & Statistics [id: M08]
| Property | Value |
|---|---|
| Purpose | Báo cáo thống kê đa dạng |
| Scope | Tài sản, KCHT, sản lượng, an toàn, thuyền viên, TT48, lọc, xuất |
| Features | 8 (P0: 4, P1: 4) |

### Module: Data Interconnection & Sharing [id: M09]
| Property | Value |
|---|---|
| Purpose | Liên thông chia sẻ dữ liệu |
| Scope | LGSP, NDXP, Web API, CSDL Bộ GTVT, truy vấn ngoài, giám sát |
| Features | 6 (P0: 3, P1: 3) |

### Module: Nautical Chart Editing [id: M10]
| Property | Value |
|---|---|
| Purpose | Biên tập hải đồ điện tử |
| Scope | Import ENC, biên tập, S-57/S-100, chuyển đổi, catalog, xuất bản |
| Features | 10 (P0: 3, P1: 4, P2: 3) |

### Module: Infrastructure Database Creation [id: M11]
| Property | Value |
|---|---|
| Purpose | Tạo lập CSDL KCHT (số hóa) |
| Scope | Số hóa tài liệu, xác thực, nhập CSDL, quản lý phiên bản |
| Features | 4 (P0: 2, P1: 1, P2: 1) |

## 10. Ambiguities

| ID | Severity | Description | Needs |
|---|---|---|---|
| GAP-001 | Non-blocking | Chưa rõ framework frontend/backend — TKCT đã chỉ định SQL Server, Windows Server, GIS, ENC S-57/S-100, còn framework do team dev chọn | team |
| GAP-002 | Resolved | Database: SQL Server 2022 Standard (theo TKCT — đã clear) | resolved |
| GAP-003 | Non-blocking | Chưa rõ cơ chế tích hợp ENC client cụ thể (third-party library hay tự phát triển) — cần hỏi PO | PO |
| GAP-004 | Non-blocking | Chưa rõ số lượng người dùng đồng thời | PO |
| GAP-005 | Non-blocking | Chưa rõ API contract chi tiết cho LGSP/NDXP | artifact |

## 12. Recommended Pipeline Configuration

```yaml
recommended-path: M
rationale: "11 modules, 105 features, multiple actors + integrations + GIS + ENC — path M phù hợp với độ phức tạp trung bình-cao"
risk-score: 4
conditional-stages:
  engineering-ui-ux-designer: true
  engineering-system-architect: true
  utility-security-auditor-design: true
  utility-security-auditor-review: true
  engineering-devops-engineer: true
output-mode: lean
```
