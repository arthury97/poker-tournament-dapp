import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import WalletModal from './WalletModal';
import toast from 'react-hot-toast';

const Header = ({ onNavigateToDashboard, isDashboardActive = false }) => {
  const { account, isConnected, connectWallet, disconnectWallet, isLoading, chainId } = useWeb3();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleConnect = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in first to connect your wallet');
      setShowAuthModal(true);
      return;
    }

    // Show wallet selection modal
    setShowWalletModal(true);
  };

  const handleWalletSelect = async (walletType) => {
    try {
      await connectWallet(walletType);
      toast.success(`${walletType === 'metamask' ? 'MetaMask' : 'Coinbase Wallet'} connected successfully!`);
    } catch (error) {
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success('Wallet disconnected');
  };

  const handleSignOut = () => {
    signOut();
    disconnectWallet();
    toast.success('Signed out successfully');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (chainId) => {
    switch (chainId) {
      case '1':
        return 'Ethereum Mainnet';
      case '11155111':
        return 'Sepolia Testnet';
      case '1337':
        return 'Localhost';
      default:
        return `Chain ${chainId}`;
    }
  };

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '2px solid #e5e7eb',
      padding: '20px 0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <h1 style={{
              color: '#2563eb',
              fontSize: '42px',
              fontWeight: '900',
              fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
              margin: 0,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: '2px 2px 0px rgba(0, 0, 0, 0.1)'
            }}>
              STAKED
            </h1>
            {chainId && (
              <span style={{
                background: '#e5e7eb',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#4b5563',
                border: '1px solid #d1d5db',
                fontWeight: '600'
              }}>
                {getChainName(chainId)}
              </span>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {isAuthenticated && onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  background: isDashboardActive ? '#1d4ed8' : '#2563eb',
                  color: '#ffffff',
                  border: `2px solid ${isDashboardActive ? '#1d4ed8' : '#2563eb'}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: isDashboardActive ? '0 4px 12px rgba(29, 78, 216, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isDashboardActive) {
                    e.target.style.background = '#1d4ed8';
                    e.target.style.borderColor = '#1d4ed8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDashboardActive) {
                    e.target.style.background = '#2563eb';
                    e.target.style.borderColor = '#2563eb';
                  }
                }}
              >
                📊 DASHBOARD
              </button>
            )}
            {!isAuthenticated ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn btn-primary"
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '14px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                SIGN IN
              </button>
            ) : (
              <>
                {user && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f3f4f6',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #d1d5db'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981'
                    }}></div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {user.name || user.email}
                    </span>
                  </div>
                )}
                {isConnected ? (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#f3f4f6',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid #d1d5db'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#2563eb'
                      }}></div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {formatAddress(account)}
                      </span>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="btn btn-primary"
                    disabled={isLoading}
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '14px',
                      fontWeight: '700',
                      fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div className="loading"></div>
                        CONNECTING...
                      </>
                    ) : (
                      'CONNECT WALLET'
                    )}
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  SIGN OUT
                </button>
              </>
            )}
          </div>
          
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
          />
          
          <WalletModal 
            isOpen={showWalletModal} 
            onClose={() => setShowWalletModal(false)}
            onSelectWallet={handleWalletSelect}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
