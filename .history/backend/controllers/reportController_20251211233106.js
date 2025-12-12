// backend/controllers/reportController.js
import PDFDocument from "pdfkit";
import User from "../models/User.js";
import { calculateLearningStats } from "./statsController.js";

/** --------- Constants (colors / fonts) --------- **/
const COLORS = {
  primary: "#1D4ED8", // blue-700
  primaryLight: "#BFDBFE",
  headerDark: "#0F172A",
  bgSoft: "#F3F4F6",
  card: "#FFFFFF",
  border: "#E5E7EB",
  textDark: "#111827",
  textMuted: "#6B7280",
  accent: "#F97316",
  success: "#16A34A",
};

const FONT = {
  base: "Helvetica",
  bold: "Helvetica-Bold",
};

/** --------- Helper: overall background + header bar --------- **/
function drawPageFrame(doc, user) {
  const { left, right, top } = doc.page.margins;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - left - right;

  // top dark bar
  doc.save().rect(0, 0, pageWidth, 70).fill(COLORS.headerDark).restore();

  // soft background
  doc
    .save()
    .rect(left - 10, top - 10, contentWidth + 20, doc.page.height)
    .fill(COLORS.bgSoft)
    .restore();

  // logo / brand left
  doc
    .font(FONT.bold)
    .fontSize(20)
    .fillColor(COLORS.accent) // orange
    .text("EduNex", left, 20);

  doc
    .font(FONT.base)
    .fontSize(9)
    .fillColor("#F9FAFB") // light but readable on dark, still ok on white
    .text("Interactive Learning & Mentorship Platform", left, 40);

  // title right
  doc
    .font(FONT.bold)
    .fontSize(18)
    .fillColor("#60A5FA") // brighter blue
    .text("PROGRESS", left, 20, { width: contentWidth, align: "right" });

  doc
    .font(FONT.bold)
    .fontSize(18)
    .fillColor("#60A5FA")
    .text("REPORT", left, 40, { width: contentWidth, align: "right" });

  // white card for main body
  doc
    .save()
    .roundedRect(left - 5, 80, contentWidth + 10, doc.page.height - 120)
    .fill(COLORS.card)
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .stroke()
    .restore();

  // set starting Y inside card
  doc.y = 95;
}

/** --------- Helper: section bar --------- **/
function drawSectionHeader(doc, title) {
  const { left, right } = doc.page.margins;
  const width = doc.page.width - left - right;
  const y = doc.y + 8;

  doc
    .save()
    .roundedRect(left + 8, y, width - 16, 22, 8)
    .fill(COLORS.primary)
    .restore();

  doc
    .font(FONT.bold)
    .fontSize(11)
    .fillColor("#FFFFFF")
    .text(title, left + 18, y + 5);

  doc.y = y + 26;
}

/** --------- Helper: info rows (for student info) --------- **/
function drawInfoRow(doc, label1, value1, label2, value2) {
  const { left, right } = doc.page.margins;
  const width = doc.page.width - left - right;
  const colWidth = (width - 32) / 2; // 2 columns
  const rowHeight = 22;
  const y = doc.y;

  const labelBg = "#E5E7EB";

  // LEFT label cell
  doc
    .save()
    .fillColor(labelBg)
    .roundedRect(left + 12, y, 70, rowHeight, 6)
    .fill()
    .restore();

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(COLORS.textDark)
    .text(label1, left + 16, y + 5, { width: 62 });

  // LEFT value cell
  doc
    .save()
    .fillColor("#FFFFFF")
    .roundedRect(left + 12 + 70, y, colWidth - 70, rowHeight, 6)
    .fill()
    .restore();

  doc
    .font(FONT.base)
    .fontSize(9)
    .fillColor(COLORS.textMuted)
    .text(value1 || "-", left + 12 + 76, y + 5, {
      width: colWidth - 80,
    });

  // RIGHT pair (optional)
  if (label2) {
    const rightX = left + 20 + colWidth;

    doc
      .save()
      .fillColor(labelBg)
      .roundedRect(rightX, y, 80, rowHeight, 6)
      .fill()
      .restore();

    doc
      .font(FONT.bold)
      .fontSize(9)
      .fillColor(COLORS.textDark)
      .text(label2, rightX + 6, y + 5, { width: 72 });

    doc
      .save()
      .fillColor("#FFFFFF")
      .roundedRect(rightX + 80, y, colWidth - 80, rowHeight, 6)
      .fill()
      .restore();

    doc
      .font(FONT.base)
      .fontSize(9)
      .fillColor(COLORS.textMuted)
      .text(value2 || "-", rightX + 84, y + 5, {
        width: colWidth - 84,
      });
  }

  doc.y = y + rowHeight + 4;
}

/** --------- Helper: course table header --------- **/
function drawCourseTableHeader(doc, colWidths) {
  const { left } = doc.page.margins;
  const [w1, w2, w3, w4, w5, w6] = colWidths;
  const y = doc.y + 4;
  const h = 20;

  const xStart = left + 12;

  doc
    .save()
    .roundedRect(xStart, y, w1 + w2 + w3 + w4 + w5 + w6, h, 8)
    .fill(COLORS.headerDark)
    .restore();

  const headers = [
    "Course",
    "Category",
    "Progress",
    "Lessons",
    "Learning Time",
    "Certificate",
  ];
  const widths = [w1, w2, w3, w4, w5, w6];

  doc.font(FONT.bold).fontSize(9).fillColor("#FFFFFF");

  let x = xStart;
  headers.forEach((text, idx) => {
    doc.text(text, x + 4, y + 5, {
      width: widths[idx] - 8,
      align: "center",
    });
    x += widths[idx];
  });

  doc.y = y + h + 2;
}

/** --------- Helper: one course row with grid --------- **/
function drawCourseRow(doc, colWidths, course, altRow) {
  const { left, bottom } = doc.page.margins;
  const [w1, w2, w3, w4, w5, w6] = colWidths;
  const h = 22;
  let y = doc.y;
  const xStart = left + 12;
  const totalW = w1 + w2 + w3 + w4 + w5 + w6;

  // new page check
  if (y + h + 60 > doc.page.height - bottom) {
    doc.addPage();
    drawPageFrame(doc, null); // no user text needed
    doc.y = 110;
    y = doc.y;
  }

  const bg = altRow ? "#F9FAFB" : "#FFFFFF";

  doc.save().fillColor(bg).rect(xStart, y, totalW, h).fill().restore();

  // grid borders
  doc
    .save()
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .rect(xStart, y, totalW, h)
    .stroke()
    .restore();

  doc.font(FONT.base).fontSize(8).fillColor(COLORS.textDark);

  let x = xStart;
  const center = { align: "center" };

  // Course
  doc.text(course.title || "-", x + 4, y + 6, { width: w1 - 8 });
  x += w1;

  // Category
  doc
    .fillColor(COLORS.textMuted)
    .text(course.category || "General", x + 4, y + 6, { width: w2 - 8 });
  x += w2;

  // Progress
  doc
    .fillColor(COLORS.textDark)
    .text(`${course.progress}%`, x + 4, y + 6, { width: w3 - 8, ...center });
  x += w3;

  // Lessons
  doc.text(`${course.lessonsCompleted}/${course.lessonsTotal}`, x + 4, y + 6, {
    width: w4 - 8,
    ...center,
  });
  x += w4;

  // Time
  doc.text(`${course.learningMinutes}m`, x + 4, y + 6, {
    width: w5 - 8,
    ...center,
  });
  x += w5;

  // Certificate
  doc
    .fillColor(course.hasCertificate ? COLORS.success : "#9CA3AF")
    .text(course.hasCertificate ? "Issued" : "—", x + 4, y + 6, {
      width: w6 - 8,
      ...center,
    });

  doc.y = y + h;
}

/** --------- Helper: activity mini-grid --------- **/
function drawActivityGrid(doc, activityLast7Days) {
  const { left, right } = doc.page.margins;
  const width = doc.page.width - left - right;
  const colWidth = width / 7;
  const startY = doc.y + 6;

  // header row
  doc.font(FONT.bold).fontSize(8).fillColor(COLORS.textDark);

  let x = left + 12;
  activityLast7Days.forEach((d) => {
    const label = new Date(d.date).toLocaleDateString(undefined, {
      weekday: "short",
    });
    doc.text(label, x, startY, { width: colWidth, align: "center" });
    x += colWidth;
  });

  const rowY = startY + 15;

  // values row
  x = left + 12;
  doc.save().strokeColor(COLORS.border).lineWidth(0.5);

  activityLast7Days.forEach((d) => {
    doc.rect(x, rowY, colWidth, 18).stroke();
    doc
      .font(FONT.base)
      .fontSize(8)
      .fillColor(COLORS.textMuted)
      .text(`${d.minutes}m`, x, rowY + 4, {
        width: colWidth,
        align: "center",
      });
    x += colWidth;
  });

  doc.restore();
  doc.y = rowY + 22;
}

/** ===================== MAIN CONTROLLER ===================== **/

export const generateProgressReport = async (req, res) => {
  try {
    const studentId = req.user.id;

    const user = await User.findById(studentId).select("name email");
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { summary, perCourse, activityLast7Days } =
      await calculateLearningStats(studentId);

    const doc = new PDFDocument({ margin: 40 });
    const { left, right, bottom } = doc.page.margins;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - left - right;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="edunex-progress-report.pdf"'
    );
    doc.pipe(res);

    // PAGE FRAME + HEADER
    drawPageFrame(doc, user);

    /* -------- STUDENT INFORMATION -------- */
    drawSectionHeader(doc, "Student Information");

    drawInfoRow(doc, "Name", user.name, "Email", user.email);
    drawInfoRow(
      doc,
      "Report Date",
      new Date().toLocaleDateString(),
      "Total Courses",
      summary.totalCourses.toString()
    );
    drawInfoRow(
      doc,
      "Completed Courses",
      summary.completedCourses.toString(),
      "Learning Hours (approx.)",
      summary.totalLearningHours.toString()
    );

    doc.moveDown(1.2);

    /* -------- STUDENT PROGRESS REPORT -------- */
    drawSectionHeader(doc, "Student Progress Report");

    if (perCourse.length === 0) {
      doc
        .font(FONT.base)
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text(
          "No enrolled courses yet. Start your first course on EduNex to see your progress here.",
          left + 14,
          doc.y + 4
        );
      doc.y += 24;
    } else {
      const colWidths = [
        contentWidth * 0.26, // Course
        contentWidth * 0.16, // Category
        contentWidth * 0.12, // Progress
        contentWidth * 0.16, // Lessons
        contentWidth * 0.15, // Time
        contentWidth * 0.15, // Certificate
      ];

      drawCourseTableHeader(doc, colWidths);

      let alt = false;
      perCourse.forEach((c) => {
        drawCourseRow(doc, colWidths, c, alt);
        alt = !alt;
      });
    }

    /* -------- ENGAGEMENT SUMMARY (two columns) -------- */
    if (doc.y + 140 > doc.page.height - bottom) {
      doc.addPage();
      drawPageFrame(doc, user);
    }

    drawSectionHeader(doc, "Engagement Summary");

    const totalMinutes = summary.totalLearningMinutes;
    const avgMinutesPerCourse =
      summary.totalCourses > 0
        ? Math.round(totalMinutes / summary.totalCourses)
        : 0;

    const leftColX = left + 16;
    const rightColX = left + contentWidth / 2 + 8;
    const startY = doc.y + 4;

    doc
      .font(FONT.bold)
      .fontSize(10)
      .fillColor(COLORS.textDark)
      .text("Strengths", leftColX, startY);

    doc
      .font(FONT.base)
      .fontSize(9)
      .fillColor(COLORS.textMuted)
      .list(
        [
          summary.completedCourses > 0
            ? `Has successfully completed ${summary.completedCourses} course(s) on EduNex.`
            : "Beginning their learning journey on EduNex.",
          totalMinutes > 0
            ? `Has spent about ${summary.totalLearningHours} hour(s) learning (${totalMinutes} minutes total).`
            : "Once lessons are completed, total study time will appear here.",
          avgMinutesPerCourse > 0
            ? `Average of ~${avgMinutesPerCourse} minutes of learning time per course.`
            : "Engagement insights will grow as more courses are taken.",
        ],
        leftColX + 4,
        startY + 18,
        { bulletRadius: 1.6 }
      );

    doc
      .font(FONT.bold)
      .fontSize(10)
      .fillColor(COLORS.textDark)
      .text("Areas to Improve", rightColX, startY);

    doc
      .font(FONT.base)
      .fontSize(9)
      .fillColor(COLORS.textMuted)
      .list(
        [
          summary.inProgressCourses > 0
            ? `Try to complete the ${summary.inProgressCourses} course(s) still in progress.`
            : "Consider enrolling in more courses to broaden your skill set.",
          totalMinutes < 180
            ? "Aim for at least 3 hours of focused learning time per week."
            : "Maintain a consistent weekly learning schedule to keep momentum.",
          "Regularly review completed lessons to reinforce key concepts.",
        ],
        rightColX + 4,
        startY + 18,
        { bulletRadius: 1.6 }
      );

    doc.y += 90;

    /* -------- ACTIVITY (LAST 7 DAYS) GRID -------- */
    if (activityLast7Days && activityLast7Days.length > 0) {
      if (doc.y + 60 > doc.page.height - bottom) {
        doc.addPage();
        drawPageFrame(doc, user);
      }

      drawSectionHeader(doc, "Activity (Last 7 Days)");
      drawActivityGrid(doc, activityLast7Days);
    }

    /* -------- Footer -------- */
    const footerY = doc.page.height - bottom + 12;
    doc
      .font(FONT.base)
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text(
        "Generated by EduNex • Interactive Learning & Mentorship Platform",
        left,
        footerY,
        {
          align: "center",
          width: contentWidth,
        }
      );

    doc.end();
  } catch (err) {
    console.error("Error generating progress report PDF:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Failed to generate progress report PDF" });
    }
  }
};
