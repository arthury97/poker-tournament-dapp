import React from 'react';
import { useWeb3 } from '../context/Web3Context';

const DemoTournament = () => {
  const { isConnected } = useWeb3();

  // Demo tournaments data
  const demoTournaments = [
    {
      id: 1,
      name: 'Taiwan APT',
      symbol: 'TAPT',
      buyInAmount: '2.5',
      totalTokens: 1000,
      tokensSold: 750,
      profitSharePercentage: 40,
      status: 'active',
      totalWinnings: '0',
      description: 'Asia Poker Tour Taiwan - Main Event',
      location: 'Taipei, Taiwan',
      prizePool: '50,000',
      startDate: '2025-12-15'
    },
    {
      id: 2,
      name: 'WSOP Global',
      symbol: 'WSOP',
      buyInAmount: '5.0',
      totalTokens: 2000,
      tokensSold: 1850,
      profitSharePercentage: 35,
      status: 'active',
      totalWinnings: '0',
      description: 'World Series of Poker Global Championship',
      location: 'Las Vegas, USA',
      prizePool: '100,000',
      startDate: '2025-12-20'
    }
  ];

  const getProgressPercentage = (tokensSold, totalTokens) => {
    return Math.round((tokensSold / totalTokens) * 100);
  };

  const getTokenPrice = (buyInAmount, totalTokens) => {
    return (parseFloat(buyInAmount) / totalTokens).toFixed(4);
  };

  return (
    <div>
      <h2 style={{ 
        marginBottom: '32px', 
        color: '#2563eb', 
        fontSize: '36px',
        textAlign: 'center'
      }}>
        DEMO TOURNAMENTS
      </h2>
      
      <div className="grid grid-2" style={{ gap: '24px' }}>
        {demoTournaments.map((tournament) => {
          const progress = getProgressPercentage(tournament.tokensSold, tournament.totalTokens);
          const tokenPrice = getTokenPrice(tournament.buyInAmount, tournament.totalTokens);
          const tokensRemaining = tournament.totalTokens - tournament.tokensSold;
          
          return (
            <div 
              key={tournament.id} 
              className="card"
              style={{
                background: '#ffffff',
                border: '3px solid #2563eb',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
              }}
            >
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                marginBottom: '20px',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '16px'
              }}>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    color: '#2563eb', 
                    fontSize: '28px',
                    fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                    letterSpacing: '1px'
                  }}>
                    {tournament.name}
                  </h3>
                  <p style={{ 
                    margin: '8px 0 0 0', 
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {tournament.description}
                  </p>
                </div>
                <span style={{ 
                  background: '#2563eb', 
                  color: 'white', 
                  padding: '8px 16px', 
                  borderRadius: '20px', 
                  fontSize: '14px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
                }}>
                  {tournament.status.toUpperCase()}
                </span>
              </div>

              {/* Tournament Details */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    background: '#f3f4f6', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      BUY-IN
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                      {tournament.buyInAmount ? (parseFloat(tournament.buyInAmount) * 3000).toFixed(2) : '0.00'} USDT
                    </div>
                  </div>
                  <div style={{ 
                    background: '#f3f4f6', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      PRIZE POOL
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                      ${tournament.prizePool}
                    </div>
                  </div>
                  <div style={{ 
                    background: '#f3f4f6', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      PROFIT SHARE
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>
                      {tournament.profitSharePercentage}%
                    </div>
                  </div>
                  <div style={{ 
                    background: '#f3f4f6', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      TOKEN PRICE
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                      {(parseFloat(tokenPrice) * 3000).toFixed(2)} USDT
                    </div>
                  </div>
                </div>

                {/* Location and Date */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  padding: '12px',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '2px solid #dbeafe'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      LOCATION
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                      📍 {tournament.location}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      START DATE
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                      📅 {tournament.startDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Token Sales Progress */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: '#1f2937',
                    fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
                  }}>
                    TOKEN SALES PROGRESS
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: '#2563eb'
                  }}>
                    {progress}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div style={{ 
                  background: '#e5e7eb', 
                  borderRadius: '8px', 
                  height: '16px', 
                  marginBottom: '8px',
                  overflow: 'hidden',
                  border: '2px solid #d1d5db'
                }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                    height: '100%',
                    width: `${progress}%`,
                    transition: 'width 0.3s ease',
                    borderRadius: '6px'
                  }}></div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '600'
                }}>
                  <span>{tournament.tokensSold} / {tournament.totalTokens} tokens sold</span>
                  <span>{tokensRemaining} tokens remaining</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '16px',
                  fontSize: '18px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
                disabled={!isConnected}
                onClick={() => {
                  if (!isConnected) {
                    alert('Please connect your wallet to purchase tokens');
                  } else {
                    alert(`To purchase tokens for ${tournament.name}, switch to the "Tournaments" tab where you can interact with live tournaments on the blockchain.`);
                  }
                }}
              >
                {isConnected ? 'VIEW TOURNAMENT' : 'CONNECT WALLET TO PARTICIPATE'}
              </button>

              {/* Info Note */}
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#f3f4f6', 
                borderRadius: '8px',
                fontSize: '12px',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                textAlign: 'center'
              }}>
                <strong>Note:</strong> These are demo tournaments. Connect your wallet and create real tournaments in the "Create Tournament" tab.
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="card" style={{ 
        marginTop: '32px', 
        background: '#ffffff',
        border: '3px solid #2563eb'
      }}>
        <h3 style={{ 
          marginBottom: '16px', 
          color: '#2563eb', 
          fontSize: '24px',
          fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
        }}>
          HOW TO PARTICIPATE
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px' 
        }}>
          <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>1️⃣</div>
            <h4 style={{ marginBottom: '8px', color: '#1f2937', fontSize: '18px' }}>
              CONNECT WALLET
            </h4>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Connect your wallet (MetaMask or Coinbase Wallet) to the blockchain network
            </p>
          </div>
          <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>2️⃣</div>
            <h4 style={{ marginBottom: '8px', color: '#1f2937', fontSize: '18px' }}>
              BUY TOKENS
            </h4>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Purchase tokens to fund the tournament buy-in and share in potential winnings
            </p>
          </div>
          <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>3️⃣</div>
            <h4 style={{ marginBottom: '8px', color: '#1f2937', fontSize: '18px' }}>
              CLAIM WINNINGS
            </h4>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              If the tournament creator wins, claim your share of the profits automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoTournament;
