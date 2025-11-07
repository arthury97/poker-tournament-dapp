import React, { useState } from 'react';

function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user has dismissed the disclaimer
    return !localStorage.getItem('disclaimerDismissed');
  });

  const handleDismiss = () => {
    localStorage.setItem('disclaimerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: '#fff',
      padding: '16px 20px',
      boxShadow: '0 -4px 12px rgba(220, 38, 38, 0.3)',
      zIndex: 9998,
      borderTop: '2px solid #991b1b',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
      }}>
        <div style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</div>
        
        <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.5' }}>
          <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
            ⚠️ IMPORTANT DISCLAIMER - READ CAREFULLY
          </strong>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Financial Risk:</strong> Cryptocurrency investments carry significant risk. 
            You may lose your entire investment. Never invest more than you can afford to lose.
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Smart Contract Risk:</strong> Smart contracts may contain bugs or vulnerabilities. 
            Transactions are irreversible. This platform is provided "AS IS" without warranties.
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Not Financial Advice:</strong> Nothing on this platform constitutes financial, 
            investment, legal, or tax advice. Consult professionals before making investment decisions.
          </div>
          
          <div>
            <strong>Regulatory Risk:</strong> Cryptocurrency regulations vary by jurisdiction. 
            You are responsible for ensuring compliance with your local laws.
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          I UNDERSTAND
        </button>
      </div>
    </div>
  );
}

export default DisclaimerBanner;

