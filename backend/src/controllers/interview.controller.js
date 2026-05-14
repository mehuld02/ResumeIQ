const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterviewReportController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume PDF is required",
      });
    }

    const resumeContent = await new pdfParse.PDFParse(
      Uint8Array.from(req.file.buffer),
    ).getText();

    const { selfDescription, jobDescription } = req.body;

    const interViewReportByAi = await generateInterviewReport({
      resume: resumeContent.text,
      selfDescription,
      jobDescription,
    });

    console.log(
      "RAW AI RESPONSE:",
      JSON.stringify(interViewReportByAi, null, 2),
    );

    // Helper: try to parse values that may be JSON strings (AI sometimes returns stringified JSON or wraps JSON in backticks)
    const tryParseJson = (value) => {
      if (!value && value !== 0) return null;
      if (Array.isArray(value) || typeof value === "object") return value;
      if (typeof value === "string") {
        let s = value.trim();
        // remove surrounding backticks if present
        if (s.startsWith("`") && s.endsWith("`")) {
          s = s.slice(1, -1).trim();
        }
        // remove wrapping quotes
        if (
          (s.startsWith('"') && s.endsWith('"')) ||
          (s.startsWith("'") && s.endsWith("'"))
        ) {
          s = s.slice(1, -1);
        }

        try {
          return JSON.parse(s);
        } catch (e) {
          // Not JSON - return original string
          return value;
        }
      }

      return value;
    };

    const asArray = (val) => {
      const parsed = tryParseJson(val);
      if (Array.isArray(parsed)) return parsed;
      if (parsed == null) return [];
      // if it's a single object, wrap it
      if (typeof parsed === "object") return [parsed];
      // if it's a string that looks like JSON array, try parse again
      if (typeof parsed === "string") {
        try {
          const p2 = JSON.parse(parsed);
          return Array.isArray(p2) ? p2 : [p2];
        } catch (e) {
          return [];
        }
      }

      return [];
    };

    // Normalize fields coming from AI
    const rawTech = asArray(interViewReportByAi.technicalQuestions);
    const technicalQuestions = rawTech
      .map((q) => (typeof q === "string" ? tryParseJson(q) : q))
      .filter((q) => q && q.question && q.intention && q.answer)
      .map((q) => ({
        question: String(q.question),
        intention: String(q.intention),
        answer: String(q.answer),
      }));

    const rawBeh = asArray(interViewReportByAi.behavioralQuestions);
    const behavioralQuestions = rawBeh
      .map((q) => (typeof q === "string" ? tryParseJson(q) : q))
      .filter((q) => q && q.question && q.intention && q.answer)
      .map((q) => ({
        question: String(q.question),
        intention: String(q.intention),
        answer: String(q.answer),
      }));

    const skillGaps = asArray(interViewReportByAi.skillGaps)
      .map((s) => (typeof s === "string" ? tryParseJson(s) : s))
      .filter((s) => s && s.skill && s.severity)
      .map((s) => ({ skill: String(s.skill), severity: String(s.severity) }));

    // AI might return daysPlan instead of preparationPlan and use different keys
    let preparationPlanRaw =
      interViewReportByAi.preparationPlan || interViewReportByAi.daysPlan || [];
    preparationPlanRaw = asArray(preparationPlanRaw);

    // Map items to expected shape: { day, focus, tasks }
    const preparationPlan = preparationPlanRaw
      .map((item, idx) => {
        const it = typeof item === "string" ? tryParseJson(item) : item;
        if (!it || typeof it !== "object") return null;
        // item may have {day, focus, tasks} or {day, topic, task}
        const dayRaw = it.day || it.Day || it.dayNumber || null;
        const day = Number(dayRaw) || idx + 1; // default day to index+1
        const focus =
          it.focus ||
          it.topic ||
          it.Topic ||
          (it.task ? String(it.task).slice(0, 120) : "General");
        let tasks = it.tasks || it.task || it.Task || [];
        if (typeof tasks === "string") tasks = [tasks];
        if (!Array.isArray(tasks)) tasks = [];
        return { day, focus: String(focus), tasks };
      })
      .filter(Boolean);

    // Derive title if AI didn't provide one
    const titleFromAi = interViewReportByAi.title;
    const title =
      (typeof titleFromAi === "string" && titleFromAi.trim()) ||
      (jobDescription && jobDescription.split("\n")[0].slice(0, 200)) ||
      "Untitled Position";

    const matchScore = Number(interViewReportByAi.matchScore) || undefined;

    const payload = {
      user: req.user.id,
      resume: resumeContent.text,
      selfDescription,
      jobDescription,
      title,
      matchScore,
      technicalQuestions,
      behavioralQuestions,
      skillGaps,
      preparationPlan,
    };

    const interviewReport = await interviewReportModel.create(payload);

    res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
  const { interviewId } = req.params;

  const interviewReport = await interviewReportModel.findOne({
    _id: interviewId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({
      message: "Interview report not found.",
    });
  }

  res.status(200).json({
    message: "Interview report fetched successfully.",
    interviewReport,
  });
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
  const interviewReports = await interviewReportModel
    .find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .select(
      "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
    );

  res.status(200).json({
    message: "Interview reports fetched successfully.",
    interviewReports,
  });
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
  const { interviewReportId } = req.params;

  const interviewReport =
    await interviewReportModel.findById(interviewReportId);

  if (!interviewReport) {
    return res.status(404).json({
      message: "Interview report not found.",
    });
  }

  const { resume, jobDescription, selfDescription } = interviewReport;

  const pdfBuffer = await generateResumePdf({
    resume,
    jobDescription,
    selfDescription,
  });

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
  });

  res.send(pdfBuffer);
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
};
