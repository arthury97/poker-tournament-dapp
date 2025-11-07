import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { ethToUSDT, formatUSDT, updateConversionRate, getEthToUsdtRate } from '../utils/contracts';
import { priceService } from '../services/priceService';
import AuthModal from './AuthModal';
import WalletModal from './WalletModal';
import toast from 'react-hot-toast';

const Header = ({ onNavigateToDashboard, isDashboardActive = false, onNavigateToHome }) => {
  const { account, isConnected, connectWallet, disconnectWallet, isLoading: web3IsLoading, chainId, balance, switchNetwork } = useWeb3();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [usdtPrice, setUsdtPrice] = useState(1.00);

  // Update USDT price every 60 seconds
  useEffect(() => {
    const updatePrice = async () => {
      await updateConversionRate();
      const rate = await priceService.getUsdtToUsdRate();
      setUsdtPrice(rate);
    };

    // Initial update
    updatePrice();

    // Set up interval for updates every 60 seconds
    const interval = setInterval(updatePrice, 60000);

    return () => clearInterval(interval);
  }, []);

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
      
      // Save wallet address to user's Firestore document
      if (isAuthenticated && account) {
        try {
          await saveWalletAddress(account);
        } catch (error) {
          console.error('Error saving wallet address:', error);
          // Don't fail the connection if saving fails
        }
      }
      
      toast.success(`${walletType === 'metamask' ? 'MetaMask' : 'Coinbase Wallet'} connected successfully!`);
    } catch (error) {
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success('Wallet disconnected');
  };

  const handleSignOut = async () => {
    // Disconnect wallet first
    disconnectWallet();
    // Then sign out from Firebase
    await signOut();
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

  const handleNetworkSwitch = async (targetChainId) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (chainId === targetChainId) {
      return; // Already on this network
    }

    try {
      setIsSwitchingNetwork(true);
      await switchNetwork(targetChainId);
      toast.success(`Switching to ${getChainName(targetChainId)}...`);
      // The page will reload automatically when chain changes
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error(error.message || 'Failed to switch network');
      setIsSwitchingNetwork(false);
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
            <h1 
              onClick={onNavigateToHome}
              style={{
                color: '#2563eb',
                fontSize: '42px',
                fontWeight: '900',
                fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                margin: 0,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#1d4ed8';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#2563eb';
                e.target.style.transform = 'scale(1)';
              }}
            >
              STAKED
            </h1>
            {chainId && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {/* Network Toggle */}
                <div style={{
                  display: 'flex',
                  background: '#f3f4f6',
                  padding: '4px',
                  borderRadius: '20px',
                  border: '1px solid #d1d5db',
                  gap: '4px'
                }}>
                  <button
                    onClick={() => handleNetworkSwitch('1')}
                    disabled={isSwitchingNetwork || web3IsLoading}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: (isSwitchingNetwork || web3IsLoading) ? 'not-allowed' : 'pointer',
                      background: chainId === '1' ? '#2563eb' : 'transparent',
                      color: chainId === '1' ? '#ffffff' : '#6b7280',
                      transition: 'all 0.2s ease',
                      opacity: (isSwitchingNetwork || web3IsLoading) ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isSwitchingNetwork && !web3IsLoading && chainId !== '1') {
                        e.target.style.background = '#e5e7eb';
                        e.target.style.color = '#1f2937';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSwitchingNetwork && !web3IsLoading && chainId !== '1') {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#6b7280';
                      }
                    }}
                  >
                    Mainnet
                  </button>
                  <button
                    onClick={() => handleNetworkSwitch('11155111')}
                    disabled={isSwitchingNetwork || web3IsLoading}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: (isSwitchingNetwork || web3IsLoading) ? 'not-allowed' : 'pointer',
                      background: chainId === '11155111' ? '#2563eb' : 'transparent',
                      color: chainId === '11155111' ? '#ffffff' : '#6b7280',
                      transition: 'all 0.2s ease',
                      opacity: (isSwitchingNetwork || web3IsLoading) ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isSwitchingNetwork && !web3IsLoading && chainId !== '11155111') {
                        e.target.style.background = '#e5e7eb';
                        e.target.style.color = '#1f2937';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSwitchingNetwork && !web3IsLoading && chainId !== '11155111') {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#6b7280';
                      }
                    }}
                  >
                    Sepolia
                  </button>
                </div>
              </div>
            )}
            
            {/* Price Indicator - USDT to USD conversion */}
            <div style={{
              background: '#f3f4f6',
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid #d1d5db',
              fontSize: '12px',
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '14px' }}>💵</span>
              <span>1 USDT = ${usdtPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD</span>
              {priceService.isUsingLivePrice() && (
                <span style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: '#10b981',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></span>
              )}
            </div>
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
                    gap: '12px',
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
                    {isConnected && balance !== null && (
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '700', 
                        color: '#2563eb',
                        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
                      }}>
                        {formatUSDT(ethToUSDT(balance))} USDT
                      </span>
                    )}
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
                    disabled={web3IsLoading}
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '14px',
                      fontWeight: '700',
                      fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {web3IsLoading ? (
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
