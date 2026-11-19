import { api } from "./authService";

export const userService = {
  list: () => api.get("/users"),
  setActive: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
};
