import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// DRIVERS
export const getDrivers = async () => {
  const res = await api.get("/drivers");
  return res.data;
};

export const createDriver = async (name) => {
  const res = await api.post("/drivers", { name });
  return res.data;
};

// ORDERS
export const getOrders = async () => {
  const res = await api.get("/orders");
  return res.data;
};

export const createOrder = async (pickup_address, dropoff_address) => {
  const res = await api.post("/orders", {
    pickup_address,
    dropoff_address,
  });
  return res.data;
};

// DISPATCH
export const getDispatchPreview = async () => {
  const res = await api.get("/dispatch-preview");
  return res.data;
};