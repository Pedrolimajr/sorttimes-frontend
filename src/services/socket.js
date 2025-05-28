// Atualize o arquivo de serviço do Socket.IO (services/socket.js)
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'https://sorttimes-backend.onrender.com', {
  withCredentials: true,
  transports: ['websocket', 'polling'], // Fallback para polling
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: false // Conectaremos manualmente
});

// Função para conectar com tratamento de erros
export const connectSocket = () => {
  return new Promise((resolve, reject) => {
    socket.connect();
    
    socket.on('connect', () => {
      console.log('Socket.IO conectado');
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      console.error('Erro de conexão Socket.IO:', err);
      reject(err);
    });

    setTimeout(() => {
      if (!socket.connected) {
        reject(new Error('Timeout de conexão Socket.IO'));
      }
    }, 5000);
  });
};

export default socket;