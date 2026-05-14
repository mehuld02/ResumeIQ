import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById,
  generateResumePdf,
} from "../services/interview.api";

import { useContext, useEffect, useCallback } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, setReport, reports, setReports } =
    context;

  // =========================
  // GENERATE REPORT
  // =========================
  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
  }) => {
    setLoading(true);

    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });

      // axios returns the payload under response.data
      const interviewReport = response?.data?.interviewReport;

      if (!interviewReport) {
        console.log(
          "Generate Report Error: interviewReport missing in response",
          response,
        );
        return null;
      }

      setReport(interviewReport);
      return interviewReport;
    } catch (error) {
      console.log("Generate Report Error:", error?.response || error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GET REPORT BY ID
  // =========================
  const getReportById = useCallback(
    async (id) => {
      setLoading(true);

      try {
        const { data } = await getInterviewReportById(id);

        const interviewReport = data?.interviewReport;

        if (!interviewReport) {
          throw new Error("Report not found");
        }

        setReport(interviewReport);
        return interviewReport;
      } catch (error) {
        console.log("Get Report By ID Error:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setReport],
  );

  // =========================
  // GET ALL REPORTS
  // =========================
  const getReports = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getAllInterviewReports();

      const interviewReports = data?.interviewReports || [];

      setReports(interviewReports);
      return interviewReports;
    } catch (error) {
      console.log("Get Reports Error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setReports]);

  // =========================
  // DOWNLOAD RESUME PDF
  // =========================
  const getResumePdf = async (interviewReportId) => {
    setLoading(true);

    try {
      const response = await generateResumePdf({ interviewReportId });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${interviewReportId}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.log("PDF Download Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // AUTO LOAD
  // =========================
  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    } else {
      getReports();
    }
  }, [interviewId, getReportById, getReports]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
  };
};
