"""
Phase 1b: Generate discovery report and summary statistics.
Also extract high-level document metadata.
"""
import os
import json

intel_dir = r"C:\Users\trangtt1\HH.new\intel"

discovery = {
    "project": "MTIS - Maritime Transport Infrastructure Information System",
    "owner": "Cục Hàng hải Việt Nam - Bộ Xây dựng",
    "extraction_date": "2026-06-04",
    "documents": [],
    "total_documents": 0,
    "total_size_mb": 0,
    "total_extracted_chars": 0,
    "total_pages": 0,
    "document_types": {}
}

files = {
    "1.TKCT-Cuc HH-KetCauHaTangGiaoThong 13.11.2024 ban in final.docx": {
        "kind": "TKCT (Thiết kế chi tiết)",
        "file": "TKCT_raw.txt",
        "raw_size": 11635781,
        "paras": 1870,
        "tables": 83
    },
    "MOT_VMD_MTIS_DD_ 3.0_PHCV_Final (2).pdf": {
        "kind": "DD (Detailed Design v3.0)",
        "file": "DD_raw.txt",
        "raw_size": 134181168,
        "pages": 3971
    },
    "MOT_VMD_MTIS_TH_1.0 (2).pdf": {
        "kind": "TH (Technical Handbook v1.0)",
        "file": "TH_raw.txt",
        "raw_size": 3742320,
        "pages": 44
    },
    "MOT_VMD_MTIS_URD_ v3.0_PHCV_Final (1).pdf": {
        "kind": "URD (User Requirements Document v3.0)",
        "file": "URD_raw.txt",
        "raw_size": 10220912,
        "pages": 2561
    },
    "MOT_VMD_MTIS_URD_v3.0_PHCV (3).docx": {
        "kind": "URD (User Requirements Document v3.0 - alternate format)",
        "file": "URD_docx_raw.txt",
        "raw_size": 4388936,
        "paras": 6671,
        "tables": 2461
    },
    "VMD_MTIS_TaiLieuKhaoSat_PM_NoiBo_v1.0_PHCV.pdf": {
        "kind": "Survey (Khảo sát nội bộ)",
        "file": "Survey_raw.txt",
        "raw_size": 107690385,
        "pages": 1015
    },
    "VMD_MTIS_TaiLieuKhaoSat_PM_NoiBo_v1.0_Phụ lục_PHCV.pdf": {
        "kind": "Survey Appendix (Phụ lục khảo sát)",
        "file": "SurveyAppendix_raw.txt",
        "raw_size": 14745988,
        "pages": 964
    }
}

total_size = 0
total_chars = 0
total_pages = 0

for fname, info in files.items():
    raw_path = os.path.join(intel_dir, info["file"])
    extracted_size = os.path.getsize(raw_path) if os.path.exists(raw_path) else 0
    with open(raw_path, "r", encoding="utf-8") as f:
        text = f.read()
    total_chars += len(text)
    total_size += info["raw_size"]
    
    pages = info.get("pages", info.get("paras", 0))
    total_pages += pages
    
    # Get document-level metadata from first 3000 chars
    preview = text[:3000].replace("\n", " ").replace("\r", "")
    
    doc_entry = {
        "filename": fname,
        "kind": info["kind"],
        "source_format": "PDF" if fname.endswith(".pdf") else "DOCX",
        "raw_size_mb": round(info["raw_size"] / (1024*1024), 1),
        "extracted_size_mb": round(extracted_size / (1024*1024), 1),
        "size_reduction_pct": round(100 - (extracted_size / info["raw_size"] * 100) if info["raw_size"] > 0 else 0, 1),
        "pages_or_paras": pages,
        "tables": info.get("tables", 0),
        "extracted_chars": len(text),
        "extracted_size_mb": round(len(text) / (1024*1024), 2),
        "content_preview": preview[:500]
    }
    discovery["documents"].append(doc_entry)
    
    # Count document types
    dtype = info["kind"].split("(")[0].strip()
    discovery["document_types"][dtype] = discovery["document_types"].get(dtype, 0) + 1

discovery["total_documents"] = len(files)
discovery["total_size_mb"] = round(total_size / (1024*1024), 1)
discovery["total_extracted_chars"] = total_chars
discovery["total_extracted_mb"] = round(total_chars / (1024*1024), 2)
discovery["total_pages"] = total_pages

with open(os.path.join(intel_dir, "01-discovery-report.json"), "w", encoding="utf-8") as f:
    json.dump(discovery, f, ensure_ascii=False, indent=2)

print("Discovery report saved.")
print(f"Total: {discovery['total_documents']} documents, {discovery['total_size_mb']}MB source, {discovery['total_extracted_mb']}MB text, {discovery['total_pages']} pages")
print(f"Document types: {discovery['document_types']}")
