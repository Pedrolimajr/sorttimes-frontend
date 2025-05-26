import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  autoConnect: false,
  withCredentials: true
});

// Listeners de conexão
socket.on('connect', () => {
  console.log('Conectado ao servidor Socket.IO');
});

socket.on('disconnect', () => {
  console.log('Desconectado do servidor Socket.IO');
});

socket.on('error', (error) => {
  console.error('Erro na conexão Socket.IO:', error);
});

export default socket;