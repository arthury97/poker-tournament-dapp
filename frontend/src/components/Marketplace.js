import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { getTournamentManagerContract, getPokerTokenContract, ethToUSDT, formatUSDT } from '../utils/contracts';
import { tournamentList as predefinedTournaments } from '../utils/tournamentData';
import { formatDateRange } from '../utils/dateFormat';
import toast from 'react-hot-toast';

const Marketplace = ({ refreshTrigger }) => {
  const { signer, TOURNAMENT_MANAGER_ADDRESS, isConnected, account } = useWeb3();
  const { isAuthenticated } = useAuth();
  const [onChainTournaments, setOnChainTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'available'

  const loadOnChainTournaments = async () => {
    if (!isConnected || !signer || !TOURNAMENT_MANAGER_ADDRESS) {
      setOnChainTournaments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const tournamentManager = getTournamentManagerContract(TOURNAMENT_MANAGER_ADDRESS, signer);
      
      const totalTournaments = await tournamentManager.getTotalTournaments();
      
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
      
      const detailPromises = tournamentAddresses.map(async (address) => {
        try {
          const details = await tournamentManager.getTournamentDetails(address);
          const isActive = await tournamentManager.isActiveTournament(address);
          
          // Get token price and remaining tokens
          const pokerToken = getPokerTokenContract(address, signer);
          const tokenPrice = await pokerToken.getTokenPrice();
          const remainingTokens = await pokerToken.getRemainingTokens();
          
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
            isOnChain: true,
            tokenPrice,
            remainingTokens
          };
        } catch (error) {
          console.error(`Error loading tournament ${address}:`, error);
          return null;
        }
      });

      const tournamentDetails = await Promise.all(detailPromises);
      setOnChainTournaments(tournamentDetails.filter(t => t !== null));

    } catch (error) {
      console.warn('Could not load on-chain tournaments:', error.message || error);
      setOnChainTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOnChainTournaments();
  }, [isConnected, signer, refreshTrigger]);

  const handlePurchaseTokens = async (tournamentAddress, tokenPrice) => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in first to purchase tokens');
      return;
    }

    try {
      const pokerToken = getPokerTokenContract(tournamentAddress, signer);
      const tokensToBuy = 100; // Buy 100 tokens
      const totalCost = tokenPrice * BigInt(tokensToBuy);
      
      toast.loading('Purchasing tokens...', { id: 'purchase-tokens' });
      
      const tx = await pokerToken.purchaseTokens({ value: totalCost });
      await tx.wait();
      
      toast.success(`Successfully purchased ${tokensToBuy} tokens!`, { id: 'purchase-tokens' });
      
      // Refresh tournament list
      loadOnChainTournaments();
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      toast.error(error.reason || error.message || 'Failed to purchase tokens', { id: 'purchase-tokens' });
    }
  };

  // Combine on-chain and predefined tournaments
  const allTournaments = [
    ...onChainTournaments,
    ...predefinedTournaments.map(t => ({
      ...t,
      isOnChain: false,
      address: null,
      tokenPrice: parseFloat(t.buyInAmount) / t.totalTokens,
      remainingTokens: t.totalTokens - t.tokensSold,
      tournamentCompleted: t.status === 'completed',
      isActive: t.status === 'active'
    }))
  ];

  // Filter tournaments
  const filteredTournaments = allTournaments.filter(tournament => {
    if (filter === 'active') return tournament.isActive && !tournament.tournamentCompleted;
    if (filter === 'completed') return tournament.tournamentCompleted;
    if (filter === 'available') return tournament.remainingTokens > 0 && !tournament.tournamentCompleted;
    return true; // 'all'
  });

  const getProgressPercentage = (tokensSold, totalTokens) => {
    if (!tokensSold || !totalTokens) return 0;
    return Math.round((Number(tokensSold) / Number(totalTokens)) * 100);
  };

  const getTypeBadge = (tournament) => {
    if (tournament.type === 'online') {
      return <span style={{ background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>ONLINE</span>;
    }
    return <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>IN-PERSON</span>;
  };

  const getStatusBadge = (tournament) => {
    if (tournament.tournamentCompleted) {
      return <span style={{ background: '#6b7280', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>COMPLETED</span>;
    }
    if (tournament.tokensSold >= tournament.totalTokens) {
      return <span style={{ background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>SOLD OUT</span>;
    }
    return <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>AVAILABLE</span>;
  };

  return (
    <div>
      <h2 style={{ 
        marginBottom: '32px',
        color: '#2563eb', 
        fontSize: '36px',
        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
        letterSpacing: '1px',
        textAlign: 'center'
      }}>
        🛒 MARKETPLACE
      </h2>

      {/* Filter Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {['all', 'active', 'available', 'completed'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className="btn"
            style={{
              background: filter === filterOption ? '#2563eb' : 'rgba(255, 255, 255, 0.2)',
              color: filter === filterOption ? '#ffffff' : '#ffffff',
              border: `2px solid ${filter === filterOption ? '#2563eb' : 'rgba(255, 255, 255, 0.3)'}`,
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            {filterOption.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card text-center">
          <div className="loading" style={{ margin: '20px auto' }}></div>
          <p>Loading marketplace...</p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="card text-center" style={{ background: '#ffffff', border: '3px solid #2563eb' }}>
          <h3 style={{ color: '#2563eb', fontSize: '24px', marginBottom: '16px' }}>
            NO TOKENS AVAILABLE
          </h3>
          <p className="text-muted" style={{ fontSize: '16px' }}>
            {filter === 'all' 
              ? 'No tokens are available in the marketplace yet.' 
              : `No ${filter} tokens available.`}
          </p>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
            Create your first token in the "CREATE TOKEN" tab!
          </p>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: '24px' }}>
          {filteredTournaments.map((tournament, index) => {
            const progress = getProgressPercentage(tournament.tokensSold, tournament.totalTokens);
            const buyInUSDT = formatUSDT(ethToUSDT(tournament.buyInAmount));
            const tokenPriceUSDT = tournament.tokenPrice 
              ? formatUSDT(ethToUSDT(tournament.tokenPrice))
              : '0.00';
            const isSoldOut = tournament.remainingTokens === 0 || tournament.tokensSold >= tournament.totalTokens;
            const canPurchase = isConnected && isAuthenticated && !isSoldOut && !tournament.tournamentCompleted && tournament.isOnChain;

            return (
              <div 
                key={tournament.address || tournament.id || index} 
                className="card"
                style={{
                  background: '#ffffff',
                  border: '3px solid #2563eb',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)',
                  position: 'relative'
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
                    {tournament.series && (
                      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
                        {tournament.series}
                      </div>
                    )}
                    {tournament.location && (
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        📍 {tournament.location}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {tournament.type && getTypeBadge(tournament)}
                    {getStatusBadge(tournament)}
                  </div>
                </div>

                {/* Tournament Info */}
                <div style={{ marginBottom: '20px' }}>
                  {tournament.startDate && tournament.endDate && (
                    <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
                      📅 {formatDateRange(tournament.startDate, tournament.endDate)}
                    </div>
                  )}
                  
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
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                        {tokenPriceUSDT} USDT
                      </div>
                    </div>
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
                  </div>

                  {/* Progress Bar */}
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
                        SALES PROGRESS
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb' }}>
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

                  {tournament.prizePool && (
                    <div style={{ 
                      background: '#eff6ff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #dbeafe',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                        PRIZE POOL
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>
                        {tournament.prizePool} USDT
                      </div>
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                {tournament.isOnChain ? (
                  <button
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', 
                      padding: '16px',
                      fontSize: '18px',
                      fontWeight: '700',
                      fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      opacity: canPurchase ? 1 : 0.6,
                      cursor: canPurchase ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!canPurchase}
                    onClick={() => handlePurchaseTokens(tournament.address, tournament.tokenPrice)}
                  >
                    {!isConnected 
                      ? 'CONNECT WALLET' 
                      : !isAuthenticated
                      ? 'SIGN IN TO BUY'
                      : isSoldOut
                      ? 'SOLD OUT'
                      : tournament.tournamentCompleted
                      ? 'COMPLETED'
                      : `BUY TOKENS (${tokenPriceUSDT} USDT each)`}
                  </button>
                ) : (
                  <div style={{ 
                    padding: '12px', 
                    background: '#f3f4f6', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <strong>Preview:</strong> This is a predefined tournament. Create tokens in the "CREATE TOKEN" tab to make it available for purchase.
                  </div>
                )}

                {/* Contract Address */}
                {tournament.address && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px', 
                    background: '#f8f9fa', 
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#6c757d',
                    wordBreak: 'break-all'
                  }}>
                    Contract: {tournament.address}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Marketplace;

