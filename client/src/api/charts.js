import API from "./axios";

export const fetchSpendingTrend = async (userId, month, year) => {
  const res = await API.get(`/report/trend/${userId}/${month}/${year}`);
  return res.data.trend;
};

export const fetchCategoryBreakdown = async (userId, month, year) => {
  const res = await API.get(`/report/category-breakdown/${userId}/${month}/${year}`);
  return res.data;
};
