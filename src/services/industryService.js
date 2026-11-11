import { api } from "./authService";

export const industryService = {
  getMyCompany: () => api.get("/companies/me"),
  updateMyCompany: (company) => api.patch("/companies/profile", company),
  getMyOpportunities: (params = {}) => api.get("/opportunities/mine", { params }),
  getPublicOpportunities: (params = {}) => api.get("/opportunities", { params }),
  getOpportunity: (id) => api.get(`/opportunities/${id}`),
  createOpportunity: (opportunity) => api.post("/opportunities", opportunity),
  updateOpportunity: (id, opportunity) => api.patch(`/opportunities/${id}`, opportunity),
  updateOpportunityStatus: (id, status) => api.patch(`/opportunities/${id}/status`, { status }),
  deleteOpportunity: (id) => api.delete(`/opportunities/${id}`),
};
