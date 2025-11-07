import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import CreateTournament from './components/CreateTournament';
import TournamentList from './components/TournamentList';
import Marketplace from './components/Marketplace';
import Dashboard from './components/Dashboard';
import DisclaimerBanner from './components/DisclaimerBanner';

// Component to handle wallet disconnection on user sign out
const WalletDisconnectHandler = () => {
  const { isAuthenticated } = useAuth();
  const { isConnected, disconnectWallet } = useWeb3();
  const [prevAuthState, setPrevAuthState] = useState(isAuthenticated);

  useEffect(() => {
    // If user was authenticated and now is not, disconnect wallet
    if (prevAuthState && !isAuthenticated && isConnected) {
      disconnectWallet();
    }
    setPrevAuthState(isAuthenticated);
  }, [isAuthenticated, prevAuthState, isConnected, disconnectWallet]);

  return null;
};

function App() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTournamentCreated = (tournamentAddress) => {
    // Trigger refresh of tournament list
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('tournaments');
  };

  return (
    <AuthProvider>
      <Web3Provider>
        <WalletDisconnectHandler />
        <div style={{ minHeight: '100vh' }}>
          <Header 
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            isDashboardActive={activeTab === 'dashboard'}
            onNavigateToHome={() => setActiveTab('marketplace')}
          />
        
        <main style={{ padding: '40px 0' }}>
          <div className="container">
            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '32px',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '4px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <button
                onClick={() => setActiveTab('marketplace')}
                className="btn"
                style={{
                  background: activeTab === 'marketplace' ? '#ffffff' : 'transparent',
                  color: activeTab === 'marketplace' ? '#1f2937' : '#ffffff',
                  border: 'none',
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease'
                }}
              >
                🛒 MARKETPLACE
              </button>
              <button
                onClick={() => setActiveTab('tournaments')}
                className="btn"
                style={{
                  background: activeTab === 'tournaments' ? '#ffffff' : 'transparent',
                  color: activeTab === 'tournaments' ? '#1f2937' : '#ffffff',
                  border: 'none',
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease'
                }}
              >
                🏆 TOURNAMENTS
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className="btn"
                style={{
                  background: activeTab === 'create' ? '#ffffff' : 'transparent',
                  color: activeTab === 'create' ? '#1f2937' : '#ffffff',
                  border: 'none',
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease'
                }}
              >
                💎 CREATE TOKEN
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'marketplace' && (
              <Marketplace refreshTrigger={refreshTrigger} />
            )}

            {activeTab === 'tournaments' && (
              <TournamentList refreshTrigger={refreshTrigger} />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard />
            )}

            {activeTab === 'create' && (
              <CreateTournament onTournamentCreated={handleTournamentCreated} />
            )}

            {/* Info Section */}
            <div className="card" style={{ marginTop: '40px', background: '#ffffff' }}>
              <h3 style={{ marginBottom: '16px', color: '#2563eb', fontSize: '28px' }}>HOW IT WORKS</h3>
              <div className="grid grid-3">
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#2563eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    1️⃣
                  </div>
                  <h4 style={{ marginBottom: '8px', color: '#1f2937', fontSize: '20px' }}>CREATE TOKEN</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    Select a tournament and create tokens to fund your buy-in, sharing potential winnings with token holders.
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#2563eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    2️⃣
                  </div>
                  <h4 style={{ marginBottom: '8px', color: '#1f2937', fontSize: '20px' }}>SELL TOKENS</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    Public can buy your tournament tokens, funding your poker buy-in. Each token represents a share of potential winnings.
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#2563eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    3️⃣
                  </div>
                  <h4 style={{ marginBottom: '8px', color: '#1f2937', fontSize: '20px' }}>SHARE WINNINGS</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    If you win the tournament, winnings are automatically distributed to token holders based on their token ownership.
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="card" style={{ marginTop: '24px', background: '#ffffff' }}>
              <h3 style={{ marginBottom: '16px', color: '#2563eb', fontSize: '28px' }}>FEATURES</h3>
              <div className="grid grid-2">
                <div>
                  <h4 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '18px' }}>🔒 SECURE & TRANSPARENT</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    All transactions are recorded on the Ethereum blockchain, ensuring transparency and security.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '18px' }}>⚡ INSTANT SETTLEMENT</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    Winnings are distributed automatically through smart contracts, eliminating manual processes.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '18px' }}>🎯 FLEXIBLE PROFIT SHARING</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    Tournament creators can set their own profit sharing percentage (0-100%).
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '18px' }}>🌐 DECENTRALIZED</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    No central authority controls the platform. Everything runs on smart contracts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          containerClassName="toast-container"
          containerStyle={{
            top: 80,
            right: 12,
          }}
          toastOptions={{
            duration: 4000,
            success: {
              duration: 3000,
            },
            error: {
              duration: 5000,
            },
          }}
        >
          {(t) => {
            console.log('🎨 Toast rendering with ID:', t.id);
            return (
              <div style={{
                background: '#2563eb',
                color: '#fff',
                border: '2px solid #1e40af',
                borderRadius: '12px',
                padding: '16px',
                paddingRight: '48px',
                maxWidth: '360px',
                minWidth: '320px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                fontSize: '14px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: 'auto',
              }}>
                {t.icon && (
                  <span style={{ 
                    fontSize: '20px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {t.icon}
                  </span>
                )}
                <div style={{ flex: 1, lineHeight: '1.5' }}>
                  {typeof t.message === 'string' ? t.message : t.message}
                </div>
                <button
                  ref={(el) => {
                    if (el) console.log('✨ X button mounted in DOM');
                  }}
                  onClick={(e) => {
                    console.log('🔴 X button CLICKED - dismissing toast:', t.id);
                    e.preventDefault();
                    e.stopPropagation();
                    toast.dismiss(t.id);
                    console.log('✅ toast.dismiss() called');
                  }}
                  onMouseDown={(e) => {
                    console.log('🔵 X button MOUSEDOWN detected');
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseEnter={(e) => {
                    console.log('👆 Mouse ENTERED X button area');
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseOver={() => {
                    console.log('🖱️ Mouse OVER X button');
                  }}
                  type="button"
                  aria-label="Close"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: '1',
                    padding: 0,
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    zIndex: 99999,
                    pointerEvents: 'auto',
                  }}
                >
                  ×
                </button>
              </div>
            );
          }}
        </Toaster>
        
        {/* Disclaimer Banner */}
        <DisclaimerBanner />
        </div>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
