// In production the React build is served by Nginx on the same origin as the ALB,
// so API calls to /api/* are routed by the ALB to the backend EC2.
// In local dev, Vite proxies /api/* → http://localhost:8000.
// Override with VITE_API_URL only when the API lives on a different origin.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export default API_BASE;
