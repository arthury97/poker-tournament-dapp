import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import toast from 'react-hot-toast';

const Header = () => {
  const { account, isConnected, connectWallet, disconnectWallet, isLoading, chainId } = useWeb3();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success('Wallet disconnected');
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
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '16px 0',
      position: 'sticky',
      top: 0,
      zIndex: 1000
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '24px',
              fontWeight: '700',
              margin: 0
            }}>
              🃏 Poker Tournament DApp
            </h1>
            {chainId && (
              <span style={{
                background: '#f8f9fa',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#6c757d',
                border: '1px solid #e9ecef'
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
            {isConnected ? (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8f9fa',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#28a745'
                  }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
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
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                {isLoading ? (
                  <>
                    <div className="loading"></div>
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
