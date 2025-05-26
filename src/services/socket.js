import { io } from 'socket.io-client';

// Usando a URL do backend no Render
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'https://sorttimes-backend.onrender.com';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Listeners de conexão com logs melhorados
socket.on('connect', () => {
  console.log('[Socket.IO] Conectado ao servidor:', SOCKET_URL);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket.IO] Desconectado:', reason);
});

socket.on('connect_error', (error) => {
  console.error('[Socket.IO] Erro de conexão:', error.message);
});

socket.on('error', (error) => {
  console.error('[Socket.IO] Erro geral:', error);
});

export default socket;