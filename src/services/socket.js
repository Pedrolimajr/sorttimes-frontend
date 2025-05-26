import { io } from 'socket.io-client';

// Usando a URL do backend no Render
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket']
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

export default socket;