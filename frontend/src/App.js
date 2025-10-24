import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
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
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '4px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <button
                onClick={() => setActiveTab('demo')}
                className="btn"
                style={{
                  background: activeTab === 'demo' ? 'white' : 'transparent',
                  color: activeTab === 'demo' ? '#333' : 'white',
                  border: 'none',
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
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
                  background: activeTab === 'create' ? 'white' : 'transparent',
                  color: activeTab === 'create' ? '#333' : 'white',
                  border: 'none',
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                ➕ Create Tournament
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
            <div className="card" style={{ marginTop: '40px', background: 'rgba(255, 255, 255, 0.95)' }}>
              <h3 style={{ marginBottom: '16px', color: '#333' }}>How It Works</h3>
              <div className="grid grid-3">
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    1️⃣
                  </div>
                  <h4 style={{ marginBottom: '8px', color: '#333' }}>Create Tournament</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    Set up your poker tournament with buy-in amount, total tokens, and profit share percentage.
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    2️⃣
                  </div>
                  <h4 style={{ marginBottom: '8px', color: '#333' }}>Sell Tokens</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    Public can buy your tournament tokens, funding your poker buy-in. Each token represents a share of potential winnings.
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    3️⃣
                  </div>
                  <h4 style={{ marginBottom: '8px', color: '#333' }}>Share Winnings</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    If you win the tournament, winnings are automatically distributed to token holders based on their token ownership.
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="card" style={{ marginTop: '24px', background: 'rgba(255, 255, 255, 0.95)' }}>
              <h3 style={{ marginBottom: '16px', color: '#333' }}>Features</h3>
              <div className="grid grid-2">
                <div>
                  <h4 style={{ color: '#333', marginBottom: '8px' }}>🔒 Secure & Transparent</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    All transactions are recorded on the Ethereum blockchain, ensuring transparency and security.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#333', marginBottom: '8px' }}>⚡ Instant Settlement</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    Winnings are distributed automatically through smart contracts, eliminating manual processes.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#333', marginBottom: '8px' }}>🎯 Flexible Profit Sharing</h4>
                  <p className="text-muted" style={{ fontSize: '14px' }}>
                    Tournament creators can set their own profit sharing percentage (0-100%).
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#333', marginBottom: '8px' }}>🌐 Decentralized</h4>
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
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Web3Provider>
  );
}

export default App;
