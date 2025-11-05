import React from 'react';

const WalletModal = ({ isOpen, onClose, onSelectWallet }) => {
  if (!isOpen) return null;

  // Check if wallets are available
  const isMetaMaskAvailable = typeof window !== 'undefined' && (window.ethereum?.isMetaMask || window.ethereum?.providers?.some(p => p.isMetaMask));
  const isCoinbaseAvailable = typeof window !== 'undefined' && (window.ethereum?.isCoinbaseWallet || window.ethereum?.providers?.some(p => p.isCoinbaseWallet));

  const handleWalletSelect = (walletType) => {
    onSelectWallet(walletType);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '3px solid #2563eb'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            color: '#2563eb',
            fontSize: '28px',
            fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
            letterSpacing: '1px'
          }}>
            SELECT WALLET
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* MetaMask Option */}
          <button
            onClick={() => handleWalletSelect('metamask')}
            disabled={!isMetaMaskAvailable}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              background: isMetaMaskAvailable ? '#f3f4f6' : '#e5e7eb',
              border: `3px solid ${isMetaMaskAvailable ? '#2563eb' : '#d1d5db'}`,
              borderRadius: '12px',
              cursor: isMetaMaskAvailable ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: isMetaMaskAvailable ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (isMetaMaskAvailable) {
                e.target.style.background = '#eff6ff';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (isMetaMaskAvailable) {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              background: '#f6851b',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0
            }}>
              🦊
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '4px',
                fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
              }}>
                METAMASK
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {isMetaMaskAvailable 
                  ? 'Connect using your MetaMask wallet' 
                  : 'MetaMask not detected - Please install MetaMask'}
              </div>
            </div>
            {isMetaMaskAvailable && (
              <div style={{
                fontSize: '20px',
                color: '#2563eb'
              }}>
                →
              </div>
            )}
          </button>

          {/* Coinbase Wallet Option */}
          <button
            onClick={() => handleWalletSelect('coinbase')}
            disabled={!isCoinbaseAvailable}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              background: isCoinbaseAvailable ? '#f3f4f6' : '#e5e7eb',
              border: `3px solid ${isCoinbaseAvailable ? '#2563eb' : '#d1d5db'}`,
              borderRadius: '12px',
              cursor: isCoinbaseAvailable ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: isCoinbaseAvailable ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (isCoinbaseAvailable) {
                e.target.style.background = '#eff6ff';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (isCoinbaseAvailable) {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              background: '#0052ff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0
            }}>
              🟦
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '4px',
                fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
              }}>
                COINBASE WALLET
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {isCoinbaseAvailable 
                  ? 'Connect using your Coinbase Wallet' 
                  : 'Coinbase Wallet not detected - Please install Coinbase Wallet'}
              </div>
            </div>
            {isCoinbaseAvailable && (
              <div style={{
                fontSize: '20px',
                color: '#2563eb'
              }}>
                →
              </div>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#eff6ff',
          borderRadius: '8px',
          border: '2px solid #dbeafe'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#1f2937',
            lineHeight: '1.6'
          }}>
            <strong>Don't have a wallet?</strong><br />
            Install <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>MetaMask</a> or <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Coinbase Wallet</a> to get started.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;

