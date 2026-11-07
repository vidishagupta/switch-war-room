import { createServer } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const { server } = createServer();

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SwitchWarRoom Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`🔗 REST API endpoint: http://localhost:${PORT}/api/incidents`);
  console.log(`🛡️ Switch Trust Guardrails: Active`);
  console.log(`====================================================`);
});

