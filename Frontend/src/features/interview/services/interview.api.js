import api from "../../../api/axios";

/**
 * @desc  Generate interview report from resume PDF + job description
 * @throws {Error} — caller must handle (429, 503, network, etc.)
 */
export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
}) => {
  const formData = new FormData();
  formData.append("jobDescription", jobDescription || "");
  formData.append("selfDescription", selfDescription || "");

  // Only append the file if one was actually selected
  // Appending undefined/null causes a "undefined" string to be sent
  if (resumeFile instanceof File) {
    formData.append("resume", resumeFile);
  }

  const response = await api.post("/api/interview/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data; // { success, message, interviewReport }
};

/**
 * @desc  Get a single interview report by ID
 * @throws {Error}
 */
export const getInterviewReportById = async (interviewId) => {
  const response = await api.get(`/api/interview/report/${interviewId}`);
  return response.data; // { success, message, interviewReport }
};

/**
 * @desc  Get all interview reports for the logged-in user
 * @param {{ page?: number, limit?: number }} options
 * @throws {Error}
 */
export const getAllInterviewReports = async ({ page = 1, limit = 20 } = {}) => {
  const response = await api.get("/api/interview/", {
    params: { page, limit },
  });
  return response.data; // { success, message, interviewReports, pagination }
};

/**
 * @desc  Generate and download ATS resume PDF
 * @throws {Error} — caller must handle (429, 503, etc.)
 */
export const generateResumePdf = async ({ interviewReportId }) => {
  const response = await api.post(
    `/api/interview/resume/pdf/${interviewReportId}`,
    null,
    { responseType: "blob" },
  );
  return response.data; // Blob
};

/**
 * @desc  Delete an interview report
 * @throws {Error}
 */
export const deleteInterviewReport = async (interviewId) => {
  const response = await api.delete(`/api/interview/${interviewId}`);
  return response.data; // { success, message }
};
