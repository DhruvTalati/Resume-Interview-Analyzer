import api from "../../../api/axios";

export const generateReportApi = async ({
  jobDescription,
  selfDescription,
  resumeFile,
}) => {
  const formData = new FormData();
  formData.append("jobDescription", jobDescription);
  if (selfDescription) formData.append("selfDescription", selfDescription);
  if (resumeFile) formData.append("resume", resumeFile);

  const { data } = await api.post("/api/interview/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getReportsApi = async () => {
  const { data } = await api.get("/api/interview/?page=1&limit=20");
  return data;
};

export const getReportByIdApi = async (id) => {
  const { data } = await api.get(`/api/interview/report/${id}`);
  return data;
};

export const deleteReportApi = async (id) => {
  const { data } = await api.delete(`/api/interview/${id}`);
  return data;
};

// FIX: was sending null as body — Express JSON parser chokes on literal null.
// Send an empty object {} instead so body-parser succeeds.
export const getResumePdfApi = async (id) => {
  const { data } = await api.post(
    `/api/interview/resume/pdf/${id}`,
    {}, // ← was: null
    { responseType: "arraybuffer" },
  );
  return data;
};
