import API from "./axios";

export const addTransactionAPI = (transactionData) => {
  return API.post("/transactions", transactionData);
};

export const uploadReceiptAPI = (file) => {
  const formData = new FormData();
  formData.append("receipt", file);
  return API.post("/transactions/upload-receipt", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getTransactionsAPI = () => API.get("transactions");

export const deleteTransactionAPI = (id) => API.delete(`transactions/${id}`);

export const updateTransactionAPI = (id, updatedData) => API.put(`transactions/${id}`, updatedData);