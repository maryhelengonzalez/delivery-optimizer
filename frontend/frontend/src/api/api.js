import axios from "axios";

const API = axios.create({
  baseURL: "https://delivery-optimizer-wwx8.onrender.com",
});

/* ---------------- DRIVERS ---------------- */

export const getDrivers = async () => {
  const res = await API.get("/drivers");
  return res.data;
};

export const createDriver = async (name) => {
  const res = await API.post("/drivers", { name });
  return res.data;
};

/* ---------------- ORDERS ---------------- */

export const getOrders = async () => {
  const res = await API.get("/orders");
  return res.data;
};

export const createOrder = async (pickup_address, dropoff_address) => {
  const res = await API.post("/orders", {
    pickup_address,
    dropoff_address,
  });

  // IMPORTANT: backend returns { order, routes }
  return res.data;
};

/* ---------------- ROUTES ---------------- */

export const selectRoute = async (order_id, route_type) => {
  const res = await API.post("/select-route", {
    order_id,
    route_type,
  });
  return res.data;
};

/* ---------------- DISPATCH ---------------- */

export const getDispatch = async () => {
  const res = await API.get("/dispatch-preview");
  return res.data;
};