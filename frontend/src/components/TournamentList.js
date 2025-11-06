import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { getTournamentManagerContract, getPokerTokenContract, ethToUSDT, formatUSDT } from '../utils/contracts';
import { tournamentList as predefinedTournaments } from '../utils/tournamentData';
import { formatDateRange } from '../utils/dateFormat';
import toast from 'react-hot-toast';

const TournamentList = ({ refreshTrigger }) => {
  const { signer, TOURNAMENT_MANAGER_ADDRESS, isConnected } = useWeb3();
  const { isAuthenticated } = useAuth();
  const [onChainTournaments, setOnChainTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tokenQuantity, setTokenQuantity] = useState('');

  const loadOnChainTournaments = async () => {
    // Don't try to load if wallet is not connected or contract address is missing
    if (!isConnected || !signer || !TOURNAMENT_MANAGER_ADDRESS) {
      setOnChainTournaments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const tournamentManager = getTournamentManagerContract(TOURNAMENT_MANAGER_ADDRESS, signer);
      
      const totalTournaments = await tournamentManager.getTotalTournaments();
      
      // If no tournaments exist, just set empty array
      if (totalTournaments === 0n || totalTournaments === 0) {
        setOnChainTournaments([]);
        setIsLoading(false);
        return;
      }
      
      const tournamentPromises = [];

      for (let i = 0; i < totalTournaments; i++) {
        tournamentPromises.push(tournamentManager.tournaments(i));
      }

      const tournamentAddresses = await Promise.all(tournamentPromises);
      
      // Get details for each tournament
      const detailPromises = tournamentAddresses.map(async (address) => {
        try {
          const details = await tournamentManager.getTournamentDetails(address);
          const isActive = await tournamentManager.isActiveTournament(address);
          
          return {
            address,
            name: details.name,
            buyInAmount: details.buyInAmount,
            totalTokens: details.totalTokens,
            tokensSold: details.tokensSold,
            profitSharePercentage: details.profitSharePercentage,
            tournamentCompleted: details.tournamentCompleted,
            totalWinnings: details.totalWinnings,
            winningsDistributed: details.winningsDistributed,
            tournamentOwner: details.tournamentOwner,
            isActive,
            isOnChain: true
          };
        } catch (error) {
          console.error(`Error loading tournament ${address}:`, error);
          return null;
        }
      });

      const tournamentDetails = await Promise.all(detailPromises);
      setOnChainTournaments(tournamentDetails.filter(t => t !== null));

    } catch (error) {
      // Silently handle errors - these are usually expected:
      // - Contract not deployed at address (first time setup)
      // - Network connection issues
      // - RPC errors
      // - Contract call reverts
      // Predefined tournaments will still display, so no need to show error
      console.warn('Could not load on-chain tournaments:', error.message || error);
      setOnChainTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOnChainTournaments();
  }, [isConnected, signer, refreshTrigger]);

  const handlePurchaseClick = async (tournament) => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in first to purchase tokens');
      return;
    }

    try {
      // Get current token price and remaining tokens
      const pokerToken = getPokerTokenContract(tournament.address, signer);
      const tokenPrice = await pokerToken.getTokenPrice();
      const remainingTokens = await pokerToken.getRemainingTokens();
      
      setSelectedTournament({
        ...tournament,
        tokenPrice,
        remainingTokens
      });
      setTokenQuantity('');
      setShowPurchaseModal(true);
    } catch (error) {
      console.error('Error loading tournament details:', error);
      toast.error('Failed to load tournament details');
    }
  };

  const handlePurchaseTokens = async () => {
    if (!selectedTournament) return;

    const quantity = parseInt(tokenQuantity);
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (quantity > selectedTournament.remainingTokens) {
      toast.error(`Only ${selectedTournament.remainingTokens.toString()} tokens available`);
      return;
    }

    try {
      const pokerToken = getPokerTokenContract(selectedTournament.address, signer);
      const tokensToBuy = BigInt(quantity);
      const ethAmount = (selectedTournament.tokenPrice * tokensToBuy).toString();

      toast.loading(`Purchasing ${quantity} tokens...`, { id: 'purchase-tokens' });
      
      const tx = await pokerToken.purchaseTokens({ value: ethAmount });
      await tx.wait();
      
      toast.success(`Successfully purchased ${quantity} tokens!`, { id: 'purchase-tokens' });
      
      // Close modal and reset
      setShowPurchaseModal(false);
      setSelectedTournament(null);
      setTokenQuantity('');
      
      // Reload tournaments to update token counts
      loadOnChainTournaments();
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      toast.error(error.message || 'Failed to purchase tokens', { id: 'purchase-tokens' });
    }
  };

  const handleClaimWinnings = async (tournamentAddress) => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const pokerToken = getPokerTokenContract(tournamentAddress, signer);
      const tx = await pokerToken.claimWinnings();
      toast.loading('Claiming winnings...', { id: 'claim-winnings' });
      
      await tx.wait();
      toast.success('Winnings claimed successfully!', { id: 'claim-winnings' });
      
      // Reload tournaments
      loadOnChainTournaments();
    } catch (error) {
      console.error('Error claiming winnings:', error);
      toast.error(error.message || 'Failed to claim winnings', { id: 'claim-winnings' });
    }
  };

  const getTypeBadge = (type) => {
    if (type === 'online') {
      return (
        <span style={{
          background: '#2563eb',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '700',
          fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
        }}>
          🌐 ONLINE
        </span>
      );
    }
    return (
      <span style={{
        background: '#1f2937',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '700',
        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
      }}>
        🏛️ IN-PERSON
      </span>
    );
  };

  const getStatusBadge = (tournament) => {
    if (tournament.isOnChain) {
      if (!tournament.isActive) {
        return <span style={{ background: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Inactive</span>;
      }
      if (tournament.tournamentCompleted) {
        return <span style={{ background: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Completed</span>;
      }
      return <span style={{ background: '#2563eb', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Active</span>;
    }
    return (
      <span style={{
        background: '#10b981',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '700',
        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
      }}>
        AVAILABLE
      </span>
    );
  };

  const getProgressPercentage = (tokensSold, totalTokens) => {
    if (!tokensSold || !totalTokens) return 0;
    return Math.round((Number(tokensSold) / Number(totalTokens)) * 100);
  };

  // Combine predefined tournaments with on-chain tournaments
  const allTournaments = [
    ...predefinedTournaments.map(t => ({
      ...t,
      isOnChain: false,
      buyInAmount: null, // Will be set when token is created
      totalTokens: null,
      tokensSold: null,
      profitSharePercentage: null
    })),
    ...onChainTournaments
  ];

  return (
    <div>
      {isLoading && (
        <div className="card text-center">
          <div className="loading" style={{ margin: '20px auto' }}></div>
          <p>Loading on-chain tournaments...</p>
        </div>
      )}

      <div className="grid grid-2" style={{ gap: '24px' }}>
        {allTournaments.map((tournament, index) => {
          const isPredefined = !tournament.isOnChain;
          const buyInUSDT = tournament.buyInAmount ? formatUSDT(ethToUSDT(tournament.buyInAmount)) : (tournament.buyIn ? formatUSDT(tournament.buyIn) : 'N/A');
          const progress = tournament.isOnChain ? getProgressPercentage(tournament.tokensSold, tournament.totalTokens) : 0;

          return (
            <div 
              key={tournament.id || tournament.address || index} 
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
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: '#2563eb', 
                    fontSize: '24px',
                    fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                    letterSpacing: '1px',
                    marginBottom: '8px'
                  }}>
                    {tournament.name}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                    {tournament.series || 'Custom Tournament'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    📍 {tournament.location}
                  </div>
                  {tournament.startDate && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#2563eb',
                      fontWeight: '600'
                    }}>
                      📅 {formatDateRange(tournament.startDate, tournament.endDate)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  {tournament.type && getTypeBadge(tournament.type)}
                  {getStatusBadge(tournament)}
                </div>
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
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                      {buyInUSDT} USDT
                    </div>
                    {tournament.buyIn && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        ${tournament.buyIn.toLocaleString()} USD
                      </div>
                    )}
                  </div>
                  {tournament.prizePool && (
                    <div style={{ 
                      background: '#f3f4f6', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                        PRIZE POOL
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                        ${tournament.prizePool}
                      </div>
                    </div>
                  )}
                  {tournament.isOnChain && tournament.totalTokens && (
                    <>
                      <div style={{ 
                        background: '#f3f4f6', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                          TOKENS SOLD
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                          {Number(tournament.tokensSold)} / {Number(tournament.totalTokens)}
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
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                          {Number(tournament.profitSharePercentage)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress bar for on-chain tournaments */}
                {tournament.isOnChain && tournament.totalTokens && (
                  <div style={{ marginBottom: '16px' }}>
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
                        PROGRESS
                      </span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '700', 
                        color: '#2563eb'
                      }}>
                        {progress}%
                      </span>
                    </div>
                    
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
                  </div>
                )}

                {tournament.isOnChain && tournament.tournamentCompleted && (
                  <div style={{ 
                    background: '#eff6ff',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #dbeafe',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                      TOTAL WINNINGS
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>
                      {formatUSDT(ethToUSDT(tournament.totalWinnings))} USDT
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isPredefined ? (
                <div style={{ 
                  padding: '16px', 
                  background: '#f3f4f6', 
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    margin: 0,
                    fontWeight: '600'
                  }}>
                    Create tokens for this tournament in the <strong>"CREATE TOKEN"</strong> tab
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {tournament.isActive && !tournament.tournamentCompleted && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handlePurchaseClick(tournament)}
                      disabled={!isConnected || !isAuthenticated}
                      style={{ 
                        flex: 1, 
                        minWidth: '120px',
                        fontWeight: '700',
                        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      BUY TOKENS
                    </button>
                  )}
                  
                  {tournament.tournamentCompleted && !tournament.winningsDistributed && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleClaimWinnings(tournament.address)}
                      disabled={!isConnected || !isAuthenticated}
                      style={{ 
                        flex: 1, 
                        minWidth: '120px',
                        fontWeight: '700',
                        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      CLAIM WINNINGS
                    </button>
                  )}

                  {tournament.address && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px', 
                      background: '#f8f9fa', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#6c757d',
                      width: '100%'
                    }}>
                      <div>Contract: {tournament.address.slice(0, 10)}...{tournament.address.slice(-8)}</div>
                      <div>Owner: {tournament.tournamentOwner?.slice(0, 10)}...{tournament.tournamentOwner?.slice(-8)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allTournaments.length === 0 && !isLoading && (
        <div className="card text-center">
          <h3 style={{ color: '#2563eb', fontSize: '24px' }}>NO TOURNAMENTS AVAILABLE</h3>
          <p className="text-muted">Create your first tournament token to get started!</p>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedTournament && (
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
        }} onClick={() => {
          setShowPurchaseModal(false);
          setSelectedTournament(null);
          setTokenQuantity('');
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              marginTop: 0,
              marginBottom: '24px',
              fontSize: '24px',
              fontWeight: '900',
              fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#2563eb'
            }}>
              PURCHASE TOKENS
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>Tournament:</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                {selectedTournament.name}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>Token Price:</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                {formatUSDT(ethToUSDT(selectedTournament.tokenPrice))} USDT per token
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>Available Tokens:</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                {selectedTournament.remainingTokens.toString()} tokens
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: '#1f2937'
              }}>
                QUANTITY
              </label>
              <input
                type="number"
                min="1"
                max={selectedTournament.remainingTokens.toString()}
                value={tokenQuantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (parseInt(value) > 0 && parseInt(value) <= selectedTournament.remainingTokens)) {
                    setTokenQuantity(value);
                  }
                }}
                placeholder="Enter quantity"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              {tokenQuantity && (
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  Total Cost: <strong style={{ color: '#2563eb' }}>
                    {formatUSDT(ethToUSDT(selectedTournament.tokenPrice * BigInt(parseInt(tokenQuantity) || 0)))} USDT
                  </strong>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedTournament(null);
                  setTokenQuantity('');
                }}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handlePurchaseTokens}
                className="btn btn-primary"
                disabled={!tokenQuantity || parseInt(tokenQuantity) <= 0 || parseInt(tokenQuantity) > selectedTournament.remainingTokens}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '700',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  opacity: (!tokenQuantity || parseInt(tokenQuantity) <= 0 || parseInt(tokenQuantity) > selectedTournament.remainingTokens) ? 0.6 : 1,
                  cursor: (!tokenQuantity || parseInt(tokenQuantity) <= 0 || parseInt(tokenQuantity) > selectedTournament.remainingTokens) ? 'not-allowed' : 'pointer'
                }}
              >
                PURCHASE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentList;
