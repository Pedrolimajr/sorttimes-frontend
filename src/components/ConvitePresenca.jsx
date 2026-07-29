import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const ConvitePresenca = React.forwardRef(({ data, horario, local }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: '500px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#0d1117',
        color: '#c9d1d9',
        padding: '30px',
        border: '1px solid #30363d',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        backgroundImage: 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.1), transparent 40%), radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.1), transparent 40%)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img
          src="/img/logo_time.png"
          alt="Logo"
          style={{ width: '80px', height: '80px', margin: '0 auto', borderRadius: '12px' }}
        />
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#58a6ff', margin: '10px 0 0', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Convocação
        </h1>
        <p style={{ fontSize: '14px', color: '#8b949e', margin: '0' }}>
          Confirme sua presença para a partida!
        </p>
      </div>

      <div style={{ borderTop: '1px solid #30363d', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaCalendarAlt style={{ color: '#58a6ff', fontSize: '20px' }} />
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: '#8b949e', fontWeight: 'bold' }}>DATA</p>
            <p style={{ margin: '0', fontSize: '16px', color: 'white', fontWeight: 'bold' }}>{data}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaClock style={{ color: '#58a6ff', fontSize: '20px' }} />
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: '#8b949e', fontWeight: 'bold' }}>HORÁRIO</p>
            <p style={{ margin: '0', fontSize: '16px', color: 'white', fontWeight: 'bold' }}>{horario}</p>
          </div>
        </div>
        {local && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaMapMarkerAlt style={{ color: '#58a6ff', fontSize: '20px' }} />
            <div>
              <p style={{ margin: '0', fontSize: '12px', color: '#8b949e', fontWeight: 'bold' }}>LOCAL</p>
              <p style={{ margin: '0', fontSize: '16px', color: 'white', fontWeight: 'bold' }}>{local}</p>
            </div>
          </div>
        )}
      </div>

      <p style={{ marginTop: '25px', fontSize: '14px', textAlign: 'center', color: '#8b949e' }}>
        Acesse o link no WhatsApp para confirmar.
      </p>
    </div>
  );
});

export default ConvitePresenca;