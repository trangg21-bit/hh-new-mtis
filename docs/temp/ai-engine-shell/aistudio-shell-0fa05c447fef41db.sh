python3 << 'PYEOF'
import json, os

modules_dir = '/Users/thuytrang/workspace/HH.New/docs/modules'
os.makedirs(modules_dir, exist_ok=True)

modules = {
    'M01': {
        'name': 'user-management',
        'name_vn': 'Quản lý người dùng',
        'features_count': 10,
        'purpose': 'Quản lý tài khoản người dùng, phân quyền, đăng nhập, xác thực'
    },
    'M02': {
        'name': 'system-administration',
        'name_vn': 'Quản trị hệ thống',
        'features_count': 8,
        'purpose': 'Quản trị hệ thống, cấu hình, đơn vị, phê duyệt, sao lưu'
    },
    'M03': {
        'name': 'technical-parameters-management',
        'name_vn': 'Quản lý thông số kỹ thuật KCHTGTHH',
        'features_count': 26,
        'purpose': 'Quản lý thông số kỹ thuật toàn bộ KCHT hàng hải (Core)'
    },
    'M04': {
        'name': 'operations-maintenance-management',
        'name_vn': 'Quản lý vận hành khai thác, bảo trì',
        'features_count': 8,
        'purpose': 'Quản lý vận hành khai thác, bảo trì, sự cố KCHT'
    },
    'M05': {
        'name': 'planning-management',
        'name_vn': 'Quản lý quy hoạch KCHTGTHH',
        'features_count': 3,
        'purpose': 'Quản lý quy hoạch bến cảng, kế hoạch đầu tư'
    },
    'M06': {
        'name': 'asset-management',
        'name_vn': 'Quản lý tài sản KCHTGTHH',
        'features_count': 14,
        'purpose': 'Quản lý tài sản kết cấu hạ tầng (ghi tăng, hao mòn, thanh lý, kiểm kê)'
    },
    'M07': {
        'name': 'gis-map-infrastructure-management',
        'name_vn': 'Quản lý KCHT trên nền bản đồ GIS',
        'features_count': 8,
        'purpose': 'Quản lý thông tin KCHT trên nền bản đồ GIS'
    },
    'M08': {
        'name': 'reporting-statistics',
        'name_vn': 'Báo cáo thống kê',
        'features_count': 8,
        'purpose': 'Báo cáo thống kê tài sản, hạ tầng, sản lượng, an toàn'
    },
    'M09': {
        'name': 'data-interconnection-sharing',
        'name_vn': 'Liên thông chia sẻ dữ liệu',
        'features_count': 6,
        'purpose': 'Liên thông chia sẻ dữ liệu với LGSP, NDXP, CSDL Bộ GTVT'
    },
    'M10': {
        'name': 'nautical-chart-editing',
        'name_vn': 'Biên tập hải đồ điện tử',
        'features_count': 10,
        'purpose': 'Biên tập hải đồ điện tử (S-57/S-100)'
    },
    'M11': {
        'name': 'infrastructure-database-creation',
        'name_vn': 'Tạo lập CSDL KCHTGTHH',
        'features_count': 4,
        'purpose': 'Tạo lập cơ sở dữ liệu KCHTGTHH (số hóa, nhập liệu)'
    }
}

stages_queue = [
    'engineering-business-analyst',
    'engineering-ui-ux-designer',
    'engineering-system-architect',
    'utility-security-auditor-design',
    'engineering-technical-lead',
    'engineering-backend-developer',
    'engineering-frontend-developer',
    'engineering-qa-engineer',
    'utility-security-auditor-review',
    'engineering-code-reviewer'
]

for mid, info in modules.items():
    mod_dir = f'{modules_dir}/{mid}-{info["name"]}'
    os.makedirs(mod_dir, exist_ok=True)
    
    # Create _state.md
    state = f"""---
id: {mid}
slug: {info["name"]}
name_vn: "{info["name_vn"]}"
status: in-progress
current-stage: engineering-business-analyst
stages-queue: {json.dumps(stages_queue, ensure_ascii=False)}
pipeline-type: sdlc
output-mode: lean
repo-type: mono
intel-path: docs/intel
risk-score: 4
path: M
feature-count: {info['features_count']}
completed-stages:
  consulting-intelligence-extractor:
    verdict: "Ready for BA"
    source-type: specification
source-type: specification
---

# {mid}: {info['name_vn']}

## Overview
{info['purpose']}

### Features ({info['features_count']} features)
Mapped from TKCT Part II Section II / Appendix 01.

### Dependencies
{json.dumps(get_deps(mid, modules), ensure_ascii=False)}

### KPI
- Feature completion: 0/{info['features_count']}
- Test coverage: 0%
- Review pass rate: 0%

### Agent Flags
- engineering-business-analyst: source-type=specification, blocking-gaps=0, total-modules=11, total-features=105
- engineering-ui-ux-designer: screen-count=78
- engineering-system-architect: integration-flags=LGSP+NDXP+ENC+GIS+VTS+AIS
- utility-security-auditor: pii-found=true, auth-model=role-based
"""

    def get_deps(mid, modules):
        deps_map = {
            'M01': [],
            'M02': ['M01'],
            'M03': ['M01', 'M02', 'M07'],
            'M04': ['M03'],
            'M05': ['M03'],
            'M06': ['M03'],
            'M07': ['M03'],
            'M08': ['M03', 'M06'],
            'M09': ['M01', 'M02', 'M03'],
            'M10': ['M07'],
            'M11': ['M01', 'M03']
        }
        return deps_map.get(mid, [])
    
    state = state.replace('get_deps(mid, modules)', json.dumps(get_deps(mid, modules), ensure_ascii=False))
    
    # Fix the inline get_deps call
    deps = get_deps(mid, modules)
    state = state.replace('get_deps(mid, modules)', json.dumps(deps, ensure_ascii=False))
    
    with open(f'{mod_dir}/_state.md', 'w', encoding='utf-8') as f:
        f.write(state)
    print(f'{mid}-{info["name"]}: _state.md created')

print('\nAll 11 module state files created successfully!')
PYEOF