"""
PDF Report Generator using ReportLab.

Generates a professional single-page PDF containing:
- Analysis metadata (sample ID, protocol, dilution, volume)
- Colony count results
- CFU/ml calculation
- Timestamp and operator info
"""

import os
import uuid
from pathlib import Path
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

from app.config import settings


async def generate_analysis_pdf(analysis) -> str:
    """
    Generate a PDF report for the given analysis ORM object.
    Returns the file path of the generated PDF.
    """
    report_dir = Path(settings.UPLOAD_DIR) / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)

    filename = f"PlateSense_Report_{analysis.sample_id}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = str(report_dir / filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="BrandTitle",
        fontSize=24,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0047AB"),
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeader",
        fontSize=14,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0047AB"),
        spaceBefore=16,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="MetaLabel",
        fontSize=9,
        fontName="Helvetica",
        textColor=colors.HexColor("#888888"),
    ))

    elements = []

    # ── Header ───────────────────────────────────────────
    elements.append(Paragraph("PlateSense", styles["BrandTitle"]))
    elements.append(Paragraph("Colony Count Analysis Report", styles["Heading2"]))
    elements.append(Spacer(1, 4 * mm))
    elements.append(HRFlowable(
        width="100%", thickness=1, color=colors.HexColor("#E0D5C8")
    ))
    elements.append(Spacer(1, 6 * mm))

    # ── Sample Information ───────────────────────────────
    elements.append(Paragraph("Sample Information", styles["SectionHeader"]))
    sample_data = [
        ["Sample ID", str(analysis.sample_id)],
        ["Media Type", str(analysis.media_type or "N/A").upper()],
        ["Protocol", str(analysis.protocol or "N/A")],
        ["Incubation", str(analysis.incubation_info or "N/A")],
        ["Volume Plated", f"{analysis.volume_plated_ml} mL"],
        ["Dilution Factor", f"10^{analysis.dilution_factor}"],
    ]
    sample_table = Table(sample_data, colWidths=[50 * mm, 120 * mm])
    sample_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#0047AB")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#333333")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#F0E8E0")),
    ]))
    elements.append(sample_table)
    elements.append(Spacer(1, 5 * mm))

    # ── Results ──────────────────────────────────────────
    elements.append(Paragraph("Analysis Results", styles["SectionHeader"]))
    results_data = [
        ["AI Colony Count", str(analysis.ai_colony_count or "—")],
        ["AI Confidence", f"{(analysis.ai_confidence or 0) * 100:.1f}%"],
        ["Final Colony Count", str(analysis.final_colony_count or "—")],
        ["Calculated CFU/mL", f"{analysis.calculated_cfu_ml:.2e}" if analysis.calculated_cfu_ml else "—"],
        ["Status", str(analysis.status).upper()],
    ]
    results_table = Table(results_data, colWidths=[50 * mm, 120 * mm])
    results_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#0047AB")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#333333")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#F0E8E0")),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F9F5F0")),
    ]))
    elements.append(results_table)
    elements.append(Spacer(1, 5 * mm))

    # ── Analyzed Image ───────────────────────────────────
    if analysis.image:
        elements.append(Paragraph("Plate Visualization", styles["SectionHeader"]))
        try:
            from PIL import Image, ImageDraw
            
            # Resolve absolute path to the original image
            # The stored_path already contains "uploads/" (e.g. "uploads/plates/...")
            img_rel_path = analysis.image.stored_path
            img_path = Path(img_rel_path).resolve()
            
            # If not found at the direct path, try relative to the root settings.UPLOAD_DIR's parent
            if not img_path.exists():
                # Some paths might be relative to the 'api' directory
                img_path = Path(os.getcwd()) / img_rel_path
            
            if not img_path.exists():
                raise FileNotFoundError(f"Image not found at {img_path}")
            
            with Image.open(str(img_path)) as img:
                img = img.convert("RGB")
                draw = ImageDraw.Draw(img)
                w, h = img.size
                
                # Draw boxes (Deep Sky Blue)
                box_color = (0, 191, 255) # #00BFFF
                for colony in (analysis.colonies or []):
                    px = (colony.position_x / 100) * w
                    py = (colony.position_y / 100) * h
                    bw = ((colony.bbox_width or 1.5) / 100) * w
                    bh = ((colony.bbox_height or 1.5) / 100) * h
                    
                    left = px - bw/2
                    top = py - bh/2
                    right = px + bw/2
                    bottom = py + bh/2
                    
                    draw.rectangle([left, top, right, bottom], outline=box_color, width=max(2, int(w/400)))

                # Save temporary analyzed image in the reports directory
                temp_img_path = Path(file_path).with_suffix(".analyzed.jpg")
                img.save(str(temp_img_path), "JPEG", quality=85)
                
                from reportlab.platypus import Image as RLImage
                available_width = A4[0] - 40 * mm
                aspect = h / w
                display_h = available_width * aspect
                
                if display_h > 60 * mm:
                    display_h = 60 * mm
                    available_width = display_h / aspect
                
                elements.append(RLImage(str(temp_img_path), width=available_width, height=display_h))
                elements.append(Spacer(1, 2 * mm))
                elements.append(Paragraph("Figure 1: AI-identified colonies with bounding box overlays.", styles["MetaLabel"]))
        except Exception as e:
            elements.append(Paragraph(f"Image Visualization Unavailable: {str(e)}", styles["MetaLabel"]))
            elements.append(Paragraph(f"Path attempted: {analysis.image.stored_path}", styles["MetaLabel"]))
            
    elements.append(Spacer(1, 4 * mm))

    # ── Notes ────────────────────────────────────────────
    if analysis.notes:
        elements.append(Paragraph("Notes", styles["SectionHeader"]))
        elements.append(Paragraph(analysis.notes, styles["Normal"]))
        elements.append(Spacer(1, 4 * mm))

    # ── Footer ───────────────────────────────────────────
    elements.append(HRFlowable(
        width="100%", thickness=1, color=colors.HexColor("#E0D5C8")
    ))
    elements.append(Spacer(1, 4 * mm))
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    elements.append(Paragraph(
        f"Generated by PlateSense Archive System • {now}",
        styles["MetaLabel"],
    ))

    doc.build(elements)
    return file_path
