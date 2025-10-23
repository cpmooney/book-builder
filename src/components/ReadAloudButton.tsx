import React, { useState, useRef } from 'react';
import ReadAloudModal from './ReadAloudModal';

interface ReadAloudButtonProps {
  content: string;
}

const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({ content }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [charIndex, setCharIndex] = useState(0);

  const handleReadAloud = () => {
    if (!content) {
      alert('No content to read.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(content);
    utterance.onboundary = (event) => {
      if (event.charIndex !== undefined) {
        setCharIndex(event.charIndex);
      }
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setModalOpen(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setModalOpen(false);
    setCharIndex(0);
  };

  const handleForward = () => {
    if (!utteranceRef.current) return;
    window.speechSynthesis.cancel();
    // Move forward 10 seconds (approximate by chars)
    const rate = utteranceRef.current.rate || 1;
    const charsPerSecond = 15 * rate; // estimate
    const newIndex = Math.min(content.length, charIndex + Math.floor(charsPerSecond * 10));
    const utter = new window.SpeechSynthesisUtterance(content.substring(newIndex));
    utter.onboundary = (event) => {
      if (event.charIndex !== undefined) {
        setCharIndex(newIndex + event.charIndex);
      }
    };
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const handleBack = () => {
    if (!utteranceRef.current) return;
    window.speechSynthesis.cancel();
    // Move back 10 seconds (approximate by chars)
    const rate = utteranceRef.current.rate || 1;
    const charsPerSecond = 15 * rate; // estimate
    const newIndex = Math.max(0, charIndex - Math.floor(charsPerSecond * 10));
    const utter = new window.SpeechSynthesisUtterance(content.substring(newIndex));
    utter.onboundary = (event) => {
      if (event.charIndex !== undefined) {
        setCharIndex(newIndex + event.charIndex);
      }
    };
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleReadAloud}
        style={{
          padding: '8px 16px',
          backgroundColor: '#17a2b8',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        🔊 Read Aloud
      </button>
      <ReadAloudModal
        isOpen={modalOpen}
        onClose={handleStop}
        onStop={handleStop}
        onForward={handleForward}
        onBack={handleBack}
      />
    </>
  );
};

export default ReadAloudButton;
