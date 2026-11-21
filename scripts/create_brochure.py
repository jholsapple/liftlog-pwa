from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "setritual-app-brochure.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = landscape(letter)
PANEL_W = PAGE_W / 3

BG = HexColor("#101210")
SURFACE = HexColor("#1A1D1A")
SURFACE_2 = HexColor("#242824")
ACCENT = HexColor("#D4F564")
TEXT = HexColor("#F7F8F4")
MUTED = HexColor("#A6ACA1")
FAINT = HexColor("#696F67")
RED = HexColor("#FF7272")


def rounded_rect(c, x, y, w, h, radius=14, fill=SURFACE, stroke=None):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)


def wrap_lines(text, font, size, max_width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def paragraph(c, text, x, top, width, size=10, leading=14, color=MUTED, font="Helvetica"):
    c.setFont(font, size)
    c.setFillColor(color)
    y = top
    for line in wrap_lines(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def label(c, text, x, y, color=ACCENT):
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(color)
    c.drawString(x, y, text.upper())


def heading(c, text, x, top, width, size=24, leading=26, color=TEXT):
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(color)
    y = top
    for line in wrap_lines(text, "Helvetica-Bold", size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def bullet_list(c, items, x, top, width, size=9.5, gap=10):
    y = top
    for item in items:
        c.setFillColor(ACCENT)
        c.circle(x + 3, y - 2, 2.2, fill=1, stroke=0)
        y = paragraph(c, item, x + 14, y + 1, width - 14, size=size, leading=13, color=TEXT)
        y -= gap
    return y


def dumbbell(c, cx, cy, scale=1, color=ACCENT):
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(4 * scale)
    c.line(cx - 20 * scale, cy, cx + 20 * scale, cy)
    for sign in (-1, 1):
        x = cx + sign * 24 * scale
        c.roundRect(x - 5 * scale, cy - 15 * scale, 10 * scale, 30 * scale, 3 * scale, fill=1, stroke=0)
        x2 = cx + sign * 34 * scale
        c.roundRect(x2 - 4 * scale, cy - 11 * scale, 8 * scale, 22 * scale, 3 * scale, fill=1, stroke=0)


def phone_mockup(c, x, y, w, h):
    c.setFillColor(HexColor("#070807"))
    c.setStrokeColor(HexColor("#373C36"))
    c.setLineWidth(1.2)
    c.roundRect(x, y, w, h, 20, fill=1, stroke=1)
    c.setFillColor(SURFACE)
    c.roundRect(x + 8, y + 8, w - 16, h - 16, 14, fill=1, stroke=0)
    c.setFillColor(HexColor("#070807"))
    c.roundRect(x + w / 2 - 22, y + h - 13, 44, 6, 3, fill=1, stroke=0)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(TEXT)
    c.drawString(x + 18, y + h - 34, "Good morning")
    c.setFont("Helvetica", 5.5)
    c.setFillColor(MUTED)
    c.drawString(x + 18, y + h - 45, "MONDAY, NOVEMBER 20")

    rounded_rect(c, x + 16, y + h - 112, w - 32, 54, 8, SURFACE_2)
    label(c, "TODAY'S WORKOUT", x + 25, y + h - 75)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(TEXT)
    c.drawString(x + 25, y + h - 91, "Strength A")
    c.setFont("Helvetica", 5.5)
    c.setFillColor(MUTED)
    c.drawString(x + 25, y + h - 102, "5 exercises  |  15 working sets")

    rounded_rect(c, x + 16, y + h - 154, w - 32, 28, 7, ACCENT)
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(BG)
    c.drawCentredString(x + w / 2, y + h - 144, "BEGIN STRENGTH A")

    c.setFont("Helvetica-Bold", 6)
    c.setFillColor(MUTED)
    c.drawString(x + 18, y + 43, "TODAY")
    c.drawString(x + 56, y + 43, "PLAN")
    c.drawString(x + 89, y + 43, "HISTORY")
    c.drawString(x + 135, y + 43, "RECORDS")


def footer(c, panel_x, text="SETRITUAL  |  TRAIN ON YOUR TERMS"):
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(FAINT)
    c.drawString(panel_x + 20, 20, text)


def fold_guides(c):
    c.saveState()
    c.setStrokeColor(Color(1, 1, 1, alpha=0.13))
    c.setDash(2, 4)
    c.setLineWidth(0.5)
    for x in (PANEL_W, PANEL_W * 2):
        c.line(x, 8, x, PAGE_H - 8)
    c.restoreState()


def page_outside(c):
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Fold-in flap
    x = 0
    label(c, "WHY SETRITUAL", x + 24, PAGE_H - 46)
    y = heading(c, "Less friction. More focus.", x + 24, PAGE_H - 76, PANEL_W - 48, 24, 27)
    y -= 14
    y = paragraph(
        c,
        "SetRitual keeps planning, logging, progress, and reflection in one calm training space - without turning every workout into a spreadsheet.",
        x + 24,
        y,
        PANEL_W - 48,
        10.5,
        15,
    )
    y -= 22
    bullet_list(
        c,
        [
            "Start a planned workout or build one as you go.",
            "Log weight, reps, intervals, rest, and notes while you train.",
            "See personal records and meaningful progress over time.",
            "Keep your data local and export a backup whenever you want.",
        ],
        x + 24,
        y,
        PANEL_W - 48,
    )
    rounded_rect(c, x + 24, 68, PANEL_W - 48, 78, 12, SURFACE_2)
    label(c, "DESIGNED FOR REAL TRAINING", x + 40, 124)
    paragraph(c, "Fast during a session. Useful after it. Flexible enough to grow with you.", x + 40, 105, PANEL_W - 80, 9.5, 13, TEXT)
    footer(c, x)

    # Back panel
    x = PANEL_W
    c.setFillColor(SURFACE)
    c.rect(x, 0, PANEL_W, PAGE_H, fill=1, stroke=0)
    dumbbell(c, x + 48, PAGE_H - 58, 0.6)
    y = heading(c, "Built around your ritual.", x + 24, PAGE_H - 112, PANEL_W - 48, 23, 26)
    y -= 12
    y = paragraph(
        c,
        "Your workout should feel personal. SetRitual gives you structure when you want it and freedom when you do not.",
        x + 24,
        y,
        PANEL_W - 48,
        10.5,
        15,
    )
    rounded_rect(c, x + 24, 226, PANEL_W - 48, 128, 14, BG)
    label(c, "AVAILABLE NOW", x + 40, 330)
    bullet_list(
        c,
        ["Installable offline-first web app", "Workout plans and free sessions", "History, records, themes, and backups"],
        x + 40,
        304,
        PANEL_W - 80,
        9,
        7,
    )
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(TEXT)
    c.drawString(x + 24, 174, "Try the current app")
    c.setFont("Helvetica", 8)
    c.setFillColor(ACCENT)
    c.drawString(x + 24, 158, "jholsapple.github.io/liftlog-pwa")
    c.linkURL("https://jholsapple.github.io/liftlog-pwa/", (x + 24, 150, x + PANEL_W - 24, 172), relative=0)
    paragraph(c, "SetRitual is an independent training app in active development.", x + 24, 112, PANEL_W - 48, 8.5, 12, MUTED)
    footer(c, x, "PRIVATE BY DEFAULT  |  EXPORTABLE BY DESIGN")

    # Front cover
    x = PANEL_W * 2
    c.setFillColor(BG)
    c.rect(x, 0, PANEL_W, PAGE_H, fill=1, stroke=0)
    label(c, "WORKOUT PLANNER + TRAINING LOG", x + 24, PAGE_H - 42)
    c.setFont("Helvetica-Bold", 33)
    c.setFillColor(TEXT)
    c.drawString(x + 24, PAGE_H - 86, "Set")
    c.setFillColor(ACCENT)
    c.drawString(x + 78, PAGE_H - 86, "Ritual")
    paragraph(c, "Plan clearly. Train confidently. Learn from every session.", x + 24, PAGE_H - 112, PANEL_W - 48, 11, 15, TEXT, "Helvetica-Bold")
    phone_mockup(c, x + 44, 82, PANEL_W - 88, 342)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(ACCENT)
    c.drawCentredString(x + PANEL_W / 2, 48, "YOUR TRAINING. YOUR DATA. YOUR RITUAL.")
    fold_guides(c)
    c.showPage()


def feature_panel(c, panel_index, step, title, body, bullets, icon):
    x = panel_index * PANEL_W
    c.setFillColor(BG if panel_index != 1 else SURFACE)
    c.rect(x, 0, PANEL_W, PAGE_H, fill=1, stroke=0)
    label(c, f"{step}  /  {icon}", x + 24, PAGE_H - 42)
    y = heading(c, title, x + 24, PAGE_H - 77, PANEL_W - 48, 25, 28)
    y -= 12
    y = paragraph(c, body, x + 24, y, PANEL_W - 48, 10.5, 15)
    y -= 24
    bullet_list(c, bullets, x + 24, y, PANEL_W - 48, 9.4, 9)


def page_inside(c):
    feature_panel(
        c,
        0,
        "01",
        "Plan the work.",
        "Create a plan that matches your goals - or bring in the program you already trust.",
        [
            "Generate strength, muscle, conditioning, or cardio plans.",
            "Import plain-text programs and organize workouts by plan.",
            "Set rep ranges, percentages, intervals, and workout days.",
            "Edit every plan and workout as your needs change.",
        ],
        "PLAN",
    )
    rounded_rect(c, 24, 62, PANEL_W - 48, 92, 13, SURFACE_2)
    label(c, "ONE HOME FOR EVERY PROGRAM", 40, 130)
    paragraph(c, "Strength blocks, cardio sessions, and free workouts stay organized without getting in your way.", 40, 111, PANEL_W - 80, 9, 13, TEXT)

    feature_panel(
        c,
        1,
        "02",
        "Own the session.",
        "SetRitual is built to stay readable when your hands are busy and your attention belongs on the next set.",
        [
            "See what is up next and jump directly to it.",
            "Edit weight and reps during the workout.",
            "Use flexible rest timers and live session progress.",
            "Add exercises, sets, notes, and free-form sessions on the fly.",
        ],
        "TRAIN",
    )
    rounded_rect(c, PANEL_W + 24, 62, PANEL_W - 48, 92, 13, BG)
    label(c, "FINISH WITH A COMPLETE RECORD", PANEL_W + 40, 130)
    paragraph(c, "Elapsed time stops, completed work is saved, and the session becomes part of your training history.", PANEL_W + 40, 111, PANEL_W - 80, 9, 13, TEXT)

    feature_panel(
        c,
        2,
        "03",
        "Learn what works.",
        "Turn completed workouts into context: where you are progressing, what is consistent, and what deserves attention next.",
        [
            "Review session history and exercise trends.",
            "Track volume, personal records, and true one-rep maxes.",
            "Repeat or edit past sessions without rebuilding them.",
            "Use local backups so your history remains yours.",
        ],
        "LEARN",
    )
    rounded_rect(c, PANEL_W * 2 + 24, 62, PANEL_W - 48, 112, 13, SURFACE_2)
    label(c, "COMING IN 2.0", PANEL_W * 2 + 40, 150)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(TEXT)
    c.drawString(PANEL_W * 2 + 40, 130, "A coach that knows your training")
    paragraph(c, "Optional sync, iOS and Android apps, post-workout feedback, progress conversations, and a personal AI Coach - with secure, explicit data sharing.", PANEL_W * 2 + 40, 111, PANEL_W - 80, 8.8, 12, MUTED)

    fold_guides(c)
    c.showPage()


def build():
    c = canvas.Canvas(str(OUTPUT), pagesize=landscape(letter))
    c.setTitle("SetRitual App Brochure")
    c.setAuthor("SetRitual")
    c.setSubject("Workout planning, logging, progress, and SetRitual 2.0")
    page_outside(c)
    page_inside(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
