import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import CreateTournament from './components/CreateTournament';
import TournamentList from './components/TournamentList';
import DemoTournament from './components/DemoTournament';

function App() {
  const [activeTab, setActiveTab] = useState('demo');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTournamentCreated = (tournamentAddress) => {
    // Trigger refresh of tournament list
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('tournaments');
  };

  return (
    <AuthProvider>
      <Web3Provider>
        <div style={{ minHeight: '100vh' }}>
          <Header />
        
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
                onClick={() => setActiveTab('demo')}
                className="btn"
                style={{
                  background: activeTab === 'demo' ? '#ffffff' : 'transparent',
                  color: activeTab === 'demo' ? '#1f2937' : '#ffffff',
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
                🎮 Demo
              </button>
              <button
                onClick={() => setActiveTab('tournaments')}
                className="btn"
                style={{
                  background: activeTab === 'tournaments' ? 'white' : 'transparent',
                  color: activeTab === 'tournaments' ? '#333' : 'white',
                  border: 'none',
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                🏆 Tournaments
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
            {activeTab === 'demo' && (
              <DemoTournament />
            )}

            {activeTab === 'tournaments' && (
              <TournamentList refreshTrigger={refreshTrigger} />
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
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '2px solid #2563eb',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#2563eb',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fff',
              },
            },
          }}
        />
        </div>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
