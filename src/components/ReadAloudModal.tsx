import React from 'react';

interface ReadAloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStop: () => void;
  onForward: () => void;
  onBack: () => void;
}

const modalStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const boxStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  padding: '32px',
  minWidth: '320px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const ReadAloudModal: React.FC<ReadAloudModalProps> = ({ isOpen, onClose, onStop, onForward, onBack }) => {
  if (!isOpen) return null;
  return (
    <div style={modalStyle}>
      <div style={boxStyle}>
        <h2>Read Aloud Controls</h2>
        <div style={{ display: 'flex', gap: '16px', margin: '24px 0' }}>
          <button type="button" onClick={onBack} style={{ padding: '8px 16px' }}>⏪ Back 10s</button>
          <button type="button" onClick={onStop} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>⏹️ Stop</button>
          <button type="button" onClick={onForward} style={{ padding: '8px 16px' }}>⏩ Forward 10s</button>
        </div>
        <button type="button" onClick={onClose} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#007bff', fontSize: '16px', cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
};

export default ReadAloudModal;
