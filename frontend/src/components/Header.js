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
