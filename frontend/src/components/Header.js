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
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      borderBottom: '1px solid #e5e7eb',
      padding: '12px 0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Left: Logo + FX Rate */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Logo */}
            <h1 
              onClick={onNavigateToHome}
              style={{
                color: '#2563eb',
                fontSize: '28px',
                fontWeight: '900',
                fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                margin: 0,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#2563eb';
              }}
            >
              STAKED
            </h1>
            
            {/* FX Rate Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '600',
                color: '#6b7280',
                letterSpacing: '0.5px'
              }}>
                USDT/USD
              </span>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '700',
                color: '#1f2937',
                fontFamily: 'monospace'
              }}>
                {usdtPrice.toFixed(4)}
              </span>
              {priceService.isUsingLivePrice() && (
                <span style={{ 
                  width: '5px', 
                  height: '5px', 
                  borderRadius: '50%', 
                  background: '#10b981',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></span>
              )}
            </div>
          </div>

          {/* Right: Dashboard + Wallet + User Menu */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Dashboard Button */}
            {isAuthenticated && onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: isDashboardActive ? '#2563eb' : 'transparent',
                  color: isDashboardActive ? '#ffffff' : '#6b7280',
                  border: '1px solid ' + (isDashboardActive ? '#2563eb' : '#e5e7eb'),
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isDashboardActive) {
                    e.target.style.background = '#f9fafb';
                    e.target.style.color = '#1f2937';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDashboardActive) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#6b7280';
                  }
                }}
              >
                📊 Dashboard
              </button>
            )}

            {/* Wallet Connection */}
            {!isAuthenticated ? (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{ 
                  padding: '8px 20px', 
                  fontSize: '13px',
                  fontWeight: '600',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.background = '#2563eb'}
              >
                Sign In
              </button>
            ) : (
              <>
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    disabled={web3IsLoading}
                    style={{ 
                      padding: '8px 20px', 
                      fontSize: '13px',
                      fontWeight: '600',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: web3IsLoading ? 'not-allowed' : 'pointer',
                      opacity: web3IsLoading ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => !web3IsLoading && (e.target.style.background = '#1d4ed8')}
                    onMouseLeave={(e) => !web3IsLoading && (e.target.style.background = '#2563eb')}
                  >
                    {web3IsLoading ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                ) : (
                  <div style={{
                    padding: '6px 12px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#059669',
                    fontFamily: 'monospace'
                  }}>
                    {formatAddress(account)}
                  </div>
                )}

                {/* User Menu Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{
                      padding: '8px',
                      background: showUserMenu ? '#f3f4f6' : 'transparent',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => !showUserMenu && (e.target.style.background = '#f9fafb')}
                    onMouseLeave={(e) => !showUserMenu && (e.target.style.background = 'transparent')}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
                      transform: showUserMenu ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s'
                    }}>
                      <path d="M2 4L6 8L10 4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '280px',
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      zIndex: 1001,
                      overflow: 'hidden'
                    }}>
                      {/* User Info */}
                      <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #e5e7eb',
                        background: '#f9fafb'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          {user?.name || user?.email}
                        </div>
                        {isConnected && balance !== null && (
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb' }}>
                            {formatUSDT(ethToUSDT(balance))} USDT
                          </div>
                        )}
                      </div>

                      {/* Network Selector */}
                      {chainId && (
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Network
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                handleNetworkSwitch('1');
                                setShowUserMenu(false);
                              }}
                              disabled={isSwitchingNetwork}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: chainId === '1' ? '#2563eb' : '#f3f4f6',
                                color: chainId === '1' ? '#ffffff' : '#6b7280',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isSwitchingNetwork ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: isSwitchingNetwork ? 0.6 : 1
                              }}
                            >
                              Mainnet
                            </button>
                            <button
                              onClick={() => {
                                handleNetworkSwitch('11155111');
                                setShowUserMenu(false);
                              }}
                              disabled={isSwitchingNetwork}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: chainId === '11155111' ? '#2563eb' : '#f3f4f6',
                                color: chainId === '11155111' ? '#ffffff' : '#6b7280',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isSwitchingNetwork ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: isSwitchingNetwork ? 0.6 : 1
                              }}
                            >
                              Sepolia
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ padding: '8px' }}>
                        {isConnected && (
                          <button
                            onClick={() => {
                              handleDisconnect();
                              setShowUserMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#6b7280',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#f3f4f6';
                              e.target.style.color = '#1f2937';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#6b7280';
                            }}
                          >
                            🔌 Disconnect Wallet
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleSignOut();
                            setShowUserMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#dc2626',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#fef2f2';
                            e.target.style.color = '#b91c1c';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#dc2626';
                          }}
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
