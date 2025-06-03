import { 
  connectSocket, 
  onSocketEvent, 
  solicitarPartidaAtiva 
} from '../services/socket';

// No seu componente
useEffect(() => {
  const handlePresencaAtualizada = (data) => {
    console.log('Presença atualizada:', data);
    // Atualize seu estado aqui
  };

  const handlePartidaAtiva = (partida) => {
    console.log('Partida ativa recebida:', partida);
    // Atualize o estado da partida
  };

  // Conecta e configura listeners
  connectSocket()
    .then(() => {
      onSocketEvent('presencaAtualizada', handlePresencaAtualizada);
      onSocketEvent('partidaAtiva', handlePartidaAtiva);
      solicitarPartidaAtiva();
    })
    .catch(console.error);

  return () => {
    // Limpeza opcional
    onSocketEvent('presencaAtualizada', null);
    onSocketEvent('partidaAtiva', null);
  };
}, []);