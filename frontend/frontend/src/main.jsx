import { StrictMode } from 'react'
import "leaflet/dist/leaflet.css";
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./styles/dashboard.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
