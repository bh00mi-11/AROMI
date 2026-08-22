"""
AROMI PDF Generation Service
Generates official, government-grade PDF reports with full Unicode (Hindi/Devanagari) support.
- Monthly Progress Report (MPR)
- ECCE Daily Activity Session Plan
- Child Health & Nutrition Dossier
"""
import io
import os
import json
from datetime import datetime, date
from typing import Optional, List, Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── 1. Font Registration ──────────────────────────────────────────────────────
FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"

# Search for system Devanagari fonts
NOTO_DEVA_REG = "/usr/share/fonts/noto/NotoSansDevanagari-Regular.ttf"
NOTO_DEVA_BOLD = "/usr/share/fonts/noto/NotoSansDevanagari-Bold.ttf"
NOTO_SERIF_REG = "/usr/share/fonts/noto/NotoSerifDevanagari-Regular.ttf"
NOTO_SERIF_BOLD = "/usr/share/fonts/noto/NotoSerifDevanagari-Bold.ttf"
DEJAVU_REG = "/usr/share/fonts/TTF/DejaVuSans.ttf"
DEJAVU_BOLD = "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"

try:
    if os.path.exists(NOTO_DEVA_REG):
        pdfmetrics.registerFont(TTFont("AROMI-Deva", NOTO_DEVA_REG))
        FONT_REGULAR = "AROMI-Deva"
    elif os.path.exists(NOTO_SERIF_REG):
        pdfmetrics.registerFont(TTFont("AROMI-Deva", NOTO_SERIF_REG))
        FONT_REGULAR = "AROMI-Deva"
    elif os.path.exists(DEJAVU_REG):
        pdfmetrics.registerFont(TTFont("AROMI-Deva", DEJAVU_REG))
        FONT_REGULAR = "AROMI-Deva"

    if os.path.exists(NOTO_DEVA_BOLD):
        pdfmetrics.registerFont(TTFont("AROMI-Deva-Bold", NOTO_DEVA_BOLD))
        FONT_BOLD = "AROMI-Deva-Bold"
    elif os.path.exists(NOTO_SERIF_BOLD):
        pdfmetrics.registerFont(TTFont("AROMI-Deva-Bold", NOTO_SERIF_BOLD))
        FONT_BOLD = "AROMI-Deva-Bold"
    elif os.path.exists(DEJAVU_BOLD):
        pdfmetrics.registerFont(TTFont("AROMI-Deva-Bold", DEJAVU_BOLD))
        FONT_BOLD = "AROMI-Deva-Bold"
    elif FONT_REGULAR == "AROMI-Deva":
        FONT_BOLD = "AROMI-Deva"
except Exception as e:
    print(f"Warning: Font registration failed ({e}), falling back to standard fonts.")

# ── 2. Color Palette & Styles ─────────────────────────────────────────────────
NAVY_PRIMARY = colors.HexColor("#0d2847")
NAVY_LIGHT = colors.HexColor("#1e3a5f")
GOLD_ACCENT = colors.HexColor("#b45309")
BG_HEADER = colors.HexColor("#0f2c4c")
BG_ALT_ROW = colors.HexColor("#f8fafc")
BG_ALERT_RED = colors.HexColor("#fef2f2")
BORDER_COLOR = colors.HexColor("#cbd5e1")
TEXT_DARK = colors.HexColor("#1e293b")
TEXT_MUTED = colors.HexColor("#64748b")
SUCCESS_GREEN = colors.HexColor("#047857")
WARNING_AMBER = colors.HexColor("#b45309")
DANGER_RED = colors.HexColor("#b91c1c")

MONTH_NAMES_HI = [
    "", "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
]
MONTH_NAMES_EN = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


def _get_styles():
    base = getSampleStyleSheet()
    
    style_gov_title = ParagraphStyle(
        "GovTitle",
        fontName=FONT_BOLD,
        fontSize=12,
        leading=15,
        textColor=NAVY_PRIMARY,
        alignment=1,  # Center
    )
    style_gov_sub = ParagraphStyle(
        "GovSub",
        fontName=FONT_BOLD,
        fontSize=10,
        leading=13,
        textColor=GOLD_ACCENT,
        alignment=1,
    )
    style_gov_ministry = ParagraphStyle(
        "GovMinistry",
        fontName=FONT_REGULAR,
        fontSize=8.5,
        leading=11,
        textColor=TEXT_MUTED,
        alignment=1,
    )
    style_sec_header = ParagraphStyle(
        "SecHeader",
        fontName=FONT_BOLD,
        fontSize=9.5,
        leading=12,
        textColor=NAVY_PRIMARY,
    )
    style_tbl_head = ParagraphStyle(
        "TblHead",
        fontName=FONT_BOLD,
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0,
    )
    style_tbl_cell = ParagraphStyle(
        "TblCell",
        fontName=FONT_REGULAR,
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK,
    )
    style_tbl_cell_bold = ParagraphStyle(
        "TblCellBold",
        fontName=FONT_BOLD,
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK,
    )
    style_tbl_cell_center = ParagraphStyle(
        "TblCellCenter",
        fontName=FONT_REGULAR,
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK,
        alignment=1,
    )
    style_tbl_cell_right = ParagraphStyle(
        "TblCellRight",
        fontName=FONT_REGULAR,
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK,
        alignment=2,
    )
    style_body = ParagraphStyle(
        "BodyText",
        fontName=FONT_REGULAR,
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK,
    )
    style_note = ParagraphStyle(
        "NoteText",
        fontName=FONT_REGULAR,
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_MUTED,
    )
    return {
        "title": style_gov_title,
        "sub": style_gov_sub,
        "ministry": style_gov_ministry,
        "sec_head": style_sec_header,
        "th": style_tbl_head,
        "td": style_tbl_cell,
        "td_bold": style_tbl_cell_bold,
        "td_center": style_tbl_cell_center,
        "td_right": style_tbl_cell_right,
        "body": style_body,
        "note": style_note,
    }


def _add_page_decorations(canvas, doc, title="AROMI - ICDS Official Report"):
    canvas.saveState()
    # Header bar
    canvas.setStrokeColor(NAVY_PRIMARY)
    canvas.setLineWidth(1)
    canvas.line(36, doc.pagesize[1] - 30, doc.pagesize[0] - 36, doc.pagesize[1] - 30)
    
    # Footer bar
    canvas.line(36, 35, doc.pagesize[0] - 36, 35)
    
    # Top tiny text
    canvas.setFont(FONT_REGULAR if FONT_REGULAR != "AROMI-Deva" else "Helvetica", 7)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(36, doc.pagesize[1] - 25, "AROMI | महिला एवं बाल विकास विभाग (WCD) — अधिकृत शासकीय प्रतिवेदन")
    canvas.drawRightString(doc.pagesize[0] - 36, doc.pagesize[1] - 25, f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    
    # Bottom text
    canvas.drawString(36, 24, "समेकित बाल विकास सेवा योजना (ICDS) • NCF-ECCE • Confidential Official Record")
    canvas.drawRightString(doc.pagesize[0] - 36, 24, f"Page {doc.page}")
    canvas.restoreState()


# ── 3. Monthly Progress Report (MPR) PDF ───────────────────────────────────────
def generate_mpr_pdf(mpr_data: Dict[str, Any], worker_data: Optional[Dict[str, Any]] = None) -> bytes:
    """
    Generates the official ICDS Anganwadi Monthly Progress Report (MPR) in PDF format.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42,
    )
    
    styles = _get_styles()
    elements = []
    
    month_num = int(mpr_data.get("month", 1))
    year_num = int(mpr_data.get("year", 2026))
    month_name_hi = MONTH_NAMES_HI[month_num] if 1 <= month_num <= 12 else str(month_num)
    month_name_en = MONTH_NAMES_EN[month_num] if 1 <= month_num <= 12 else str(month_num)
    
    centre_id = mpr_data.get("centre_id") or (worker_data.get("centre_id") if worker_data else "AWC-PUNE-007")
    centre_name = worker_data.get("centre_name") if worker_data else "आंगनवाड़ी केंद्र (AWC)"
    worker_name = worker_data.get("name") if worker_data else "श्रीमती प्रिया शर्मा"
    sector = worker_data.get("sector", "शिवाजी नगर सेक्टर 02") if worker_data else "सेक्टर 02"
    district = worker_data.get("district", "पुणे (महाराष्ट्र)") if worker_data else "पुणे"
    
    # Header
    elements.append(Paragraph("भारत सरकार / Government of India", styles["ministry"]))
    elements.append(Paragraph("महिला एवं बाल विकास मंत्रालय / Ministry of Women & Child Development", styles["ministry"]))
    elements.append(Paragraph("समेकित बाल विकास सेवा योजना (ICDS) — मासिक प्रगति प्रतिवेदन (MPR)", styles["title"]))
    elements.append(Paragraph(f"मासिक प्रगति प्रतिवेदन — {month_name_hi} {year_num} ({month_name_en} {year_num})", styles["sub"]))
    elements.append(Spacer(1, 8))
    
    # Metadata Box
    mpr_id = mpr_data.get("mpr_id") or mpr_data.get("id") or "NEW"
    ref_no = f"AROMI-MPR-{year_num}-{str(month_num).padStart(2,'0') if hasattr(str(month_num), 'padStart') else f'{month_num:02d}'}-{mpr_id}"
    
    meta_table_data = [
        [
            Paragraph(f"<b>आंगनवाड़ी केंद्र:</b> {centre_name} ({centre_id})", styles["td"]),
            Paragraph(f"<b>प्रतिवेदन माह/वर्ष:</b> {month_name_hi} {year_num}", styles["td"]),
        ],
        [
            Paragraph(f"<b>कार्यकर्ता का नाम:</b> {worker_name} (AWW)", styles["td"]),
            Paragraph(f"<b>सेक्टर / ब्लॉक:</b> {sector}", styles["td"]),
        ],
        [
            Paragraph(f"<b>जिला / राज्य:</b> {district}", styles["td"]),
            Paragraph(f"<b>आधिकारिक संदर्भ संख्या:</b> {ref_no}", styles["td"]),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 252])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))
    
    # Section 1: Demographics & Nutritional Status
    elements.append(Paragraph("1. पोषण एवं स्वास्थ्य स्थिति सारांश (Nutritional Classification & Growth)", styles["sec_head"]))
    elements.append(Spacer(1, 3))
    
    total = int(mpr_data.get("total_children", 0))
    normal = int(mpr_data.get("normal_count", 0))
    mam = int(mpr_data.get("mam_count", 0))
    sam = int(mpr_data.get("sam_count", 0))
    normal_pct = round((normal / total * 100), 1) if total > 0 else 0.0
    mam_pct = round((mam / total * 100), 1) if total > 0 else 0.0
    sam_pct = round((sam / total * 100), 1) if total > 0 else 0.0
    
    nutrition_table_data = [
        [
            Paragraph("क्र.", styles["th"]),
            Paragraph("पोषण वर्गीकरण (WHO Classification)", styles["th"]),
            Paragraph("कुल बच्चे (Count)", styles["th"]),
            Paragraph("प्रतिशत (Percentage)", styles["th"]),
            Paragraph("प्रशासनिक टिप्पणी (Status)", styles["th"]),
        ],
        [
            Paragraph("1", styles["td_center"]),
            Paragraph("सामान्य पोषण (Normal Green)", styles["td_bold"]),
            Paragraph(str(normal), styles["td_center"]),
            Paragraph(f"{normal_pct}%", styles["td_center"]),
            Paragraph("संतोषजनक (Satisfactory)", styles["td"]),
        ],
        [
            Paragraph("2", styles["td_center"]),
            Paragraph("MAM - मध्यम कुपोषण (Moderate Acute Malnutrition)", styles["td_bold"]),
            Paragraph(str(mam), styles["td_center"]),
            Paragraph(f"{mam_pct}%", styles["td_center"]),
            Paragraph("विशेष पूरक पोषण व सतत निगरानी", styles["td"]),
        ],
        [
            Paragraph("3", styles["td_center"]),
            Paragraph("SAM - गंभीर कुपोषण (Severe Acute Malnutrition)", styles["td_bold"]),
            Paragraph(str(sam), styles["td_center"]),
            Paragraph(f"{sam_pct}%", styles["td_center"]),
            Paragraph("🔴 उच्च प्राथमिकता / NRC व PHC रेफरल", styles["td"]),
        ],
        [
            Paragraph("—", styles["td_center"]),
            Paragraph("<b>कुल पंजीकृत बच्चे (Total Registered)</b>", styles["td_bold"]),
            Paragraph(f"<b>{total}</b>", styles["td_center"]),
            Paragraph("<b>100.0%</b>", styles["td_center"]),
            Paragraph("सक्रिय लाभार्थी रजिस्टर अनुसार", styles["td_bold"]),
        ],
    ]
    nut_tbl = Table(nutrition_table_data, colWidths=[25, 230, 75, 75, 117])
    nut_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_HEADER),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, BG_ALT_ROW]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(nut_tbl)
    elements.append(Spacer(1, 10))
    
    # Section 2: Attendance, Supplementary Nutrition & ECCE
    elements.append(Paragraph("2. उपस्थिति, पूरक पोषण (SNP/THR) एवं ईसीसीई सत्र (Attendance & Operations)", styles["sec_head"]))
    elements.append(Spacer(1, 3))
    
    avg_att = mpr_data.get("avg_attendance_pct", 0)
    att_days = mpr_data.get("total_attendance_days", 0)
    thr = mpr_data.get("thr_beneficiaries", total)
    ecce_sessions = mpr_data.get("ecce_sessions_held", 22)
    visits_done = mpr_data.get("home_visits_completed", mpr_data.get("home_visits_done", 0))
    immunised = mpr_data.get("immunisation_completed", 0)
    ifa_pct = mpr_data.get("ifa_syrup_distributed_pct", 100)
    phc_refs = mpr_data.get("phc_referrals", 0)
    
    ops_table_data = [
        [
            Paragraph("मापदंड / सेवा मद (Operational Metric)", styles["th"]),
            Paragraph("उपलब्धि / संख्या (Recorded Value)", styles["th"]),
            Paragraph("मानक / लक्ष्य (Target Benchmark)", styles["th"]),
            Paragraph("टिप्पणी / कैफियत (Remarks)", styles["th"]),
        ],
        [
            Paragraph("औसत मासिक उपस्थिति (Average Attendance)", styles["td"]),
            Paragraph(f"<b>{avg_att}%</b> ({att_days} कुल दिवस)", styles["td"]),
            Paragraph("≥ 75.0%", styles["td_center"]),
            Paragraph("बायोमेट्रिक / रजिस्टर सत्यापन", styles["td"]),
        ],
        [
            Paragraph("टेक होम राशन (THR) वितरण", styles["td"]),
            Paragraph(f"<b>{thr}</b> पात्र लाभार्थी", styles["td"]),
            Paragraph(f"{total} (100%)", styles["td_center"]),
            Paragraph("माह के प्रथम व तृतीय मंगलवार", styles["td"]),
        ],
        [
            Paragraph("ईसीसीई प्री-स्कूल शिक्षण सत्र (ECCE Sessions)", styles["td"]),
            Paragraph(f"<b>{ecce_sessions}</b> सत्र पूर्ण", styles["td"]),
            Paragraph("22–24 दिवस", styles["td_center"]),
            Paragraph("NCF-ECCE पाठ योजना अनुसार", styles["td"]),
        ],
        [
            Paragraph("गृह भेंट पूर्ण (Home Visits Completed)", styles["td"]),
            Paragraph(f"<b>{visits_done}</b> गृह भेंट", styles["td"]),
            Paragraph("उच्च जोखिम प्राथमिकता", styles["td_center"]),
            Paragraph("SAM/MAM एवं धात्री माताएं", styles["td"]),
        ],
        [
            Paragraph("टीकाकरण व स्वास्थ्य जांच (Immunisation Status)", styles["td"]),
            Paragraph(f"<b>{immunised} / {total}</b> अद्यतन", styles["td"]),
            Paragraph("100% आयु अनुरूप", styles["td_center"]),
            Paragraph("ANM / VHSND दिवस पर सत्यापित", styles["td"]),
        ],
        [
            Paragraph("IFA सिरप / पोषण अनुपूरक वितरण", styles["td"]),
            Paragraph(f"<b>{ifa_pct}%</b> कवरेज", styles["td"]),
            Paragraph("100%", styles["td_center"]),
            Paragraph("एनीमिया मुक्त भारत गाइडलाइन", styles["td"]),
        ],
        [
            Paragraph("PHC / NRC चिकित्सकीय रेफरल", styles["td"]),
            Paragraph(f"<b>{phc_refs}</b> प्रकरण अग्रेषित", styles["td"]),
            Paragraph("शीघ्र पहचान व उपचार", styles["td_center"]),
            Paragraph("प्राथमिक स्वास्थ्य केंद्र समन्वय", styles["td"]),
        ],
    ]
    ops_tbl = Table(ops_table_data, colWidths=[180, 110, 95, 137])
    ops_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_HEADER),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_ALT_ROW]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(ops_tbl)
    elements.append(Spacer(1, 10))
    
    # Section 3: AI Executive Summary & Supervisor Insights
    elements.append(Paragraph("3. एआई विश्लेषणात्मक सारांश व आगामी कार्ययोजना (AI Executive Summary)", styles["sec_head"]))
    elements.append(Spacer(1, 3))
    
    summary_hi = mpr_data.get("summary_hindi") or (
        f"माह {month_name_hi} {year_num} में कुल {total} पंजीकृत बच्चों में से {normal} बच्चे सामान्य पोषण स्तर पर हैं। "
        f"{mam} बच्चे MAM तथा {sam} बच्चे SAM श्रेणी में चिह्नित किए गए हैं। "
        f"मासिक औसत उपस्थिति {avg_att}% दर्ज की गई है। कुल {visits_done} गृह भेंट पूर्ण की गईं तथा {phc_refs} बच्चों को PHC रेफरल प्रदान किया गया।"
    )
    
    summary_box_data = [
        [
            Paragraph(f"<b>📊 मासिक विश्लेषण एवं मुख्य बिंदु:</b><br/>{summary_hi}", styles["body"])
        ]
    ]
    sum_tbl = Table(summary_box_data, colWidths=[522])
    sum_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#93c5fd")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(sum_tbl)
    elements.append(Spacer(1, 14))
    
    # Section 4: Formal Verification & Signatures Block
    elements.append(KeepTogether([
        Paragraph("4. अधिकृत सत्यापन एवं प्रमाणन (Official Sign-off & Certification)", styles["sec_head"]),
        Spacer(1, 4),
        Paragraph("प्रमाणित किया जाता है कि उपरोक्त मासिक प्रगति प्रतिवेदन में दी गई समस्त प्रविष्टियां आंगनवाड़ी केंद्र के मूल पंजियों एवं वास्तविक रिकॉर्ड से सत्यापित हैं।", styles["note"]),
        Spacer(1, 12),
        Table([
            [
                Paragraph("<b>हस्ताक्षर आंगनवाड़ी कार्यकर्ता (AWW)</b><br/><br/><br/>___________________________<br/>नाम: " + worker_name + "<br/>दिनांक: " + datetime.now().strftime("%d/%m/%Y"), styles["td"]),
                Paragraph("<b>हस्ताक्षर पर्यवेक्षक / मुख्य सेविका</b><br/><br/><br/>___________________________<br/>नाम: श्रीमती एस. कुलकर्णी<br/>दिनांक: _______________", styles["td"]),
                Paragraph("<b>अनुमोदन बाल विकास परियोजना अधिकारी (CDPO)</b><br/><br/><br/>___________________________<br/>पदमुद्रा एवं सील<br/>दिनांक: _______________", styles["td"]),
            ]
        ], colWidths=[174, 174, 174], style=[
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fafafa")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ])
    ]))
    
    doc.build(elements, onFirstPage=_add_page_decorations, onLaterPages=_add_page_decorations)
    buffer.seek(0)
    return buffer.getvalue()


# ── 4. ECCE Daily Activity Plan PDF ───────────────────────────────────────────
def generate_activity_plan_pdf(plan_data: Dict[str, Any], worker_data: Optional[Dict[str, Any]] = None) -> bytes:
    """
    Generates the official NCF-ECCE Daily Activity & Curriculum Session Plan PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42,
    )
    
    styles = _get_styles()
    elements = []
    
    centre_name = worker_data.get("centre_name") if worker_data else "आंगनवाड़ी केंद्र (AWC)"
    worker_name = worker_data.get("name") if worker_data else "श्रीमती प्रिया शर्मा"
    
    raw_plan = plan_data.get("plan") if isinstance(plan_data.get("plan"), dict) else plan_data
    session_title = raw_plan.get("session_title", "दैनिक ईसीसीई गतिविधि एवं शिक्षण सत्र")
    total_minutes = raw_plan.get("total_duration_minutes", 45)
    age_group = plan_data.get("age_group", "3-5")
    child_count = plan_data.get("child_count", 6)
    activities = raw_plan.get("activities", [])
    tips = raw_plan.get("tips_for_worker", "")
    offline_note = raw_plan.get("offline_note", "यह योजना बिना इंटरनेट के भी उपयोग की जा सकती है")
    
    plan_date_str = plan_data.get("plan_date")
    if isinstance(plan_date_str, (datetime, date)):
        plan_date_str = plan_date_str.strftime("%d/%m/%Y")
    elif not plan_date_str:
        plan_date_str = datetime.now().strftime("%d/%m/%Y")
    
    # Header
    elements.append(Paragraph("समेकित बाल विकास सेवा योजना (ICDS) • प्रारंभिक बाल्यावस्था देखभाल एवं शिक्षा (ECCE)", styles["ministry"]))
    elements.append(Paragraph("राष्ट्रीय पाठ्यचर्या रूपरेखा (NCF-ECCE) — दैनिक गतिविधि एवं पाठ योजना", styles["title"]))
    elements.append(Paragraph(f"सत्र शीर्षक: {session_title}", styles["sub"]))
    elements.append(Spacer(1, 8))
    
    # Administrative Metadata
    meta_table_data = [
        [
            Paragraph(f"<b>आंगनवाड़ी केंद्र:</b> {centre_name}", styles["td"]),
            Paragraph(f"<b>सत्र दिनांक:</b> {plan_date_str}", styles["td"]),
        ],
        [
            Paragraph(f"<b>योजना निर्माता:</b> {worker_name} (AWW)", styles["td"]),
            Paragraph(f"<b>लक्षित आयु वर्ग:</b> {age_group} वर्ष • <b>उपस्थिति:</b> {child_count} बच्चे", styles["td"]),
        ],
        [
            Paragraph(f"<b>कुल समयावधि:</b> ⏱ {total_minutes} मिनट", styles["td"]),
            Paragraph("<b>पाठ्यचर्या मानक:</b> NCF-ECCE 2026 / NEP 2020", styles["td"]),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[260, 262])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))
    
    # Section: Activities Breakdown
    elements.append(Paragraph("दैनिक गतिविधियां एवं क्रियान्वयन चरण (Scheduled Activities & Pedagogy)", styles["sec_head"]))
    elements.append(Spacer(1, 4))
    
    for idx, act in enumerate(activities, 1):
        act_name = act.get("name", f"गतिविधि {idx}")
        act_type = act.get("type", "गतिविधि")
        act_duration = act.get("duration_minutes", 15)
        materials = ", ".join(act.get("materials_needed", ["स्थानीय उपलब्ध सामग्री"])) if isinstance(act.get("materials_needed"), list) else str(act.get("materials_needed", "उपलब्ध सामग्री"))
        steps = act.get("steps", [])
        learning_obj = act.get("learning_objective", "शारीरिक व मानसिक विकास")
        
        steps_html = "<br/>".join([f"<b>{s_idx}.</b> {s}" for s_idx, s in enumerate(steps, 1)]) if steps else "निर्देशानुसार संचालित करें।"
        
        act_box_data = [
            [
                Paragraph(f"<b>गतिविधि {idx}: {act_name}</b>", ParagraphStyle("ActHead", fontName=FONT_BOLD, fontSize=9, textColor=colors.white)),
                Paragraph(f"⏱ {act_duration} मिनट | प्रकार: {act_type}", ParagraphStyle("ActSub", fontName=FONT_BOLD, fontSize=8.5, textColor=colors.white, alignment=2)),
            ],
            [
                Paragraph(f"<b>📦 आवश्यक शिक्षण सामग्री (Materials):</b> {materials}", styles["td"]),
                Paragraph("", styles["td"]),
            ],
            [
                Paragraph(f"<b>🎯 अधिगम प्रतिफल (Learning Objective):</b> {learning_obj}", styles["td_bold"]),
                Paragraph("", styles["td"]),
            ],
            [
                Paragraph(f"<b>📝 क्रियान्वयन चरण (Pedagogical Steps):</b><br/>{steps_html}", styles["td"]),
                Paragraph("", styles["td"]),
            ],
        ]
        
        act_table = Table(act_box_data, colWidths=[380, 142])
        act_table.setStyle(TableStyle([
            ('SPAN', (0, 1), (1, 1)),
            ('SPAN', (0, 2), (1, 2)),
            ('SPAN', (0, 3), (1, 3)),
            ('BACKGROUND', (0, 0), (-1, 0), NAVY_PRIMARY),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#ffffff")),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('LINEBELOW', (0, 1), (-1, 1), 0.5, colors.HexColor("#f1f5f9")),
            ('LINEBELOW', (0, 2), (-1, 2), 0.5, colors.HexColor("#f1f5f9")),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(act_table)
        elements.append(Spacer(1, 6))
    
    # Worker Guidelines Box
    if tips:
        elements.append(Spacer(1, 4))
        tips_data = [
            [
                Paragraph(f"<b>💡 शिक्षिका / कार्यकर्ता हेतु विशेष मार्गदर्शन:</b><br/>{tips}", styles["body"])
            ]
        ]
        tips_tbl = Table(tips_data, colWidths=[522])
        tips_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef3c7")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#fcd34d")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(tips_tbl)
    
    # Offline Note
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"ℹ️ {offline_note}", styles["note"]))
    elements.append(Spacer(1, 10))
    
    # Signatures
    elements.append(KeepTogether([
        Table([
            [
                Paragraph("<b>सत्र संचालक (आंगनवाड़ी कार्यकर्ता)</b><br/><br/><br/>___________________________<br/>" + worker_name + "<br/>हस्ताक्षर व दिनांक", styles["td"]),
                Paragraph("<b>निरीक्षण व मूल्यांकन (पर्यवेक्षक / मुख्य सेविका)</b><br/><br/><br/>___________________________<br/>सत्र गुणवत्ता: [ ] उत्तम  [ ] सामान्य<br/>हस्ताक्षर व टीप", styles["td"]),
            ]
        ], colWidths=[261, 261], style=[
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fafafa")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ])
    ]))
    
    doc.build(elements, onFirstPage=_add_page_decorations, onLaterPages=_add_page_decorations)
    buffer.seek(0)
    return buffer.getvalue()


# ── 5. Child Health & Nutrition Dossier PDF ────────────────────────────────────
def generate_child_dossier_pdf(child_data: Dict[str, Any], growth_records: List[Dict[str, Any]], visits: List[Dict[str, Any]], worker_data: Optional[Dict[str, Any]] = None) -> bytes:
    """
    Generates the official Child Health & Nutrition Dossier / Growth Card PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42,
    )
    
    styles = _get_styles()
    elements = []
    
    c_name = child_data.get("name", "अज्ञात लाभार्थी")
    c_id = child_data.get("id", 1)
    c_gender = "बालक (Male)" if child_data.get("gender") in ("M", "male", "Male") else "बालिका (Female)"
    c_dob = str(child_data.get("dob", ""))
    c_age = child_data.get("age_months", 0)
    c_status = str(child_data.get("nutrition_status", "unknown")).upper()
    c_mother = child_data.get("mother_name", "—")
    c_father = child_data.get("father_name", "—")
    centre_name = worker_data.get("centre_name") if worker_data else "आंगनवाड़ी केंद्र (AWC)"
    worker_name = worker_data.get("name") if worker_data else "श्रीमती प्रिया शर्मा"
    
    # Header
    elements.append(Paragraph("महिला एवं बाल विकास विभाग • समेकित बाल विकास सेवा योजना (ICDS)", styles["ministry"]))
    elements.append(Paragraph("बाल स्वास्थ्य, पोषण एवं वृद्धि निगरानी कार्ड (Child Health Dossier)", styles["title"]))
    elements.append(Paragraph(f"व्यक्तिगत स्वास्थ्य अभिलेख — {c_name} (Case ID: AROMI-2026-{str(c_id).zfill(5)})", styles["sub"]))
    elements.append(Spacer(1, 8))
    
    # Demographics Table
    demo_table_data = [
        [
            Paragraph(f"<b>बालक/बालिका का नाम:</b> {c_name}", styles["td"]),
            Paragraph(f"<b>केस संदर्भ संख्या:</b> AROMI-2026-{str(c_id).zfill(5)}", styles["td"]),
        ],
        [
            Paragraph(f"<b>माता का नाम:</b> {c_mother}", styles["td"]),
            Paragraph(f"<b>पिता का नाम:</b> {c_father}", styles["td"]),
        ],
        [
            Paragraph(f"<b>जन्म तिथि (DOB):</b> {c_dob} (आयु: {c_age} माह)", styles["td"]),
            Paragraph(f"<b>लिंग:</b> {c_gender}", styles["td"]),
        ],
        [
            Paragraph(f"<b>वर्तमान पोषण स्तर:</b> <b>{c_status}</b>", styles["td_bold"]),
            Paragraph(f"<b>आंगनवाड़ी केंद्र:</b> {centre_name}", styles["td"]),
        ],
    ]
    demo_table = Table(demo_table_data, colWidths=[260, 262])
    demo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(demo_table)
    elements.append(Spacer(1, 10))
    
    # Growth History
    elements.append(Paragraph("शारीरिक माप एवं पोषण वृद्धि इतिहास (Growth Monitoring History)", styles["sec_head"]))
    elements.append(Spacer(1, 3))
    
    growth_rows = [
        [
            Paragraph("माप दिनांक", styles["th"]),
            Paragraph("वजन (kg)", styles["th"]),
            Paragraph("ऊंचाई (cm)", styles["th"]),
            Paragraph("MUAC (cm)", styles["th"]),
            Paragraph("वर्गीकरण", styles["th"]),
            Paragraph("एआई टिप्पणी व विश्लेषण", styles["th"]),
        ]
    ]
    
    for r in growth_records[:6]:
        r_date = str(r.get("recorded_date", ""))
        r_wt = str(r.get("weight_kg", "—"))
        r_ht = str(r.get("height_cm", "—"))
        r_muac = str(r.get("muac_cm", "—"))
        r_st = str(r.get("nutrition_status", "—")).upper()
        r_notes = str(r.get("ai_notes", "—"))[:80]
        
        growth_rows.append([
            Paragraph(r_date, styles["td"]),
            Paragraph(r_wt, styles["td_center"]),
            Paragraph(r_ht, styles["td_center"]),
            Paragraph(r_muac, styles["td_center"]),
            Paragraph(f"<b>{r_st}</b>", styles["td_center"]),
            Paragraph(r_notes, styles["td"]),
        ])
    
    if len(growth_rows) == 1:
        growth_rows.append([
            Paragraph("कोई पूर्व माप दर्ज नहीं है।", styles["td"]),
            Paragraph("—", styles["td_center"]),
            Paragraph("—", styles["td_center"]),
            Paragraph("—", styles["td_center"]),
            Paragraph(c_status, styles["td_center"]),
            Paragraph("प्रथम पंजीयन", styles["td"]),
        ])
    
    growth_tbl = Table(growth_rows, colWidths=[65, 50, 50, 55, 65, 237])
    growth_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_HEADER),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_ALT_ROW]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(growth_tbl)
    elements.append(Spacer(1, 10))
    
    # Home Visits & Interventions
    elements.append(Paragraph("गृह भेंट एवं चिकित्सकीय अनुवर्ती कार्रवाई (Home Visits & Interventions)", styles["sec_head"]))
    elements.append(Spacer(1, 3))
    
    visit_rows = [
        [
            Paragraph("भेंट दिनांक", styles["th"]),
            Paragraph("प्राथमिकता", styles["th"]),
            Paragraph("उद्देश्य / कारण", styles["th"]),
            Paragraph("स्थिति", styles["th"]),
        ]
    ]
    for v in visits[:4]:
        v_dt = str(v.get("scheduled_date") or v.get("visited_date") or "—")
        v_pr = str(v.get("priority", "LOW")).upper()
        v_rsn = str(v.get("visit_reason", "नियमित स्वास्थ्य एवं पोषण परामर्श"))
        v_cmp = "पूर्ण (Done)" if v.get("completed") else "नियोजित (Scheduled)"
        visit_rows.append([
            Paragraph(v_dt, styles["td"]),
            Paragraph(v_pr, styles["td_center"]),
            Paragraph(v_rsn, styles["td"]),
            Paragraph(v_cmp, styles["td_center"]),
        ])
    if len(visit_rows) == 1:
        visit_rows.append([
            Paragraph("नियमित अनुसूची", styles["td"]),
            Paragraph("NORMAL", styles["td_center"]),
            Paragraph("मासिक गृह भेंट एवं पोषण परामर्श", styles["td"]),
            Paragraph("नियोजित", styles["td_center"]),
        ])
    
    visit_tbl = Table(visit_rows, colWidths=[80, 75, 277, 90])
    visit_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_HEADER),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_ALT_ROW]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(visit_tbl)
    elements.append(Spacer(1, 14))
    
    # Sign-off
    elements.append(KeepTogether([
        Table([
            [
                Paragraph(f"<b>आंगनवाड़ी कार्यकर्ता:</b> {worker_name}<br/>हस्ताक्षर व दिनांक: ________________", styles["td"]),
                Paragraph("<b>प्राथमिक स्वास्थ्य केंद्र (PHC) / MO:</b><br/>सील व हस्ताक्षर: ________________", styles["td"]),
            ]
        ], colWidths=[261, 261], style=[
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fafafa")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ])
    ]))
    
    doc.build(elements, onFirstPage=_add_page_decorations, onLaterPages=_add_page_decorations)
    buffer.seek(0)
    return buffer.getvalue()
