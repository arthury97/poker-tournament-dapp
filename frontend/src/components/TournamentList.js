import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getTournamentManagerContract, getPokerTokenContract, formatEther } from '../utils/contracts';
import toast from 'react-hot-toast';

const TournamentList = ({ refreshTrigger }) => {
  const { signer, TOURNAMENT_MANAGER_ADDRESS, isConnected } = useWeb3();
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTournaments = async () => {
    if (!isConnected || !signer) return;

    try {
      setIsLoading(true);
      const tournamentManager = getTournamentManagerContract(TOURNAMENT_MANAGER_ADDRESS, signer);
      
      const totalTournaments = await tournamentManager.getTotalTournaments();
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
            isActive
          };
        } catch (error) {
          console.error(`Error loading tournament ${address}:`, error);
          return null;
        }
      });

      const tournamentDetails = await Promise.all(detailPromises);
      setTournaments(tournamentDetails.filter(t => t !== null));

    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, [isConnected, signer, refreshTrigger]);

  const handlePurchaseTokens = async (tournamentAddress, buyInAmount, totalTokens) => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const pokerToken = getPokerTokenContract(tournamentAddress, signer);
      const tokenPrice = await pokerToken.getTokenPrice();
      const tokensToBuy = 100; // Buy 100 tokens
      const ethAmount = (tokenPrice * BigInt(tokensToBuy)).toString();

      const tx = await pokerToken.purchaseTokens({ value: ethAmount });
      toast.loading('Purchasing tokens...', { id: 'purchase-tokens' });
      
      await tx.wait();
      toast.success('Tokens purchased successfully!', { id: 'purchase-tokens' });
      
      // Reload tournaments to update token counts
      loadTournaments();
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
      loadTournaments();
    } catch (error) {
      console.error('Error claiming winnings:', error);
      toast.error(error.message || 'Failed to claim winnings', { id: 'claim-winnings' });
    }
  };

  const getStatusBadge = (tournament) => {
    if (!tournament.isActive) {
      return <span style={{ background: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Inactive</span>;
    }
    if (tournament.tournamentCompleted) {
      return <span style={{ background: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Completed</span>;
    }
    return <span style={{ background: '#007bff', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Active</span>;
  };

  const getProgressPercentage = (tokensSold, totalTokens) => {
    return Math.round((Number(tokensSold) / Number(totalTokens)) * 100);
  };

  if (!isConnected) {
    return (
      <div className="card text-center">
        <h3>Connect Your Wallet</h3>
        <p className="text-muted">Please connect your wallet to view tournaments</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card text-center">
        <div className="loading" style={{ margin: '20px auto' }}></div>
        <p>Loading tournaments...</p>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="card text-center">
        <h3>No Tournaments Found</h3>
        <p className="text-muted">Create your first tournament to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', color: '#333' }}>Active Tournaments</h2>
      <div className="grid grid-2">
        {tournaments.map((tournament, index) => (
          <div key={index} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>{tournament.name}</h3>
              {getStatusBadge(tournament)}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="text-muted">Buy-in:</span>
                <span>{formatEther(tournament.buyInAmount)} ETH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="text-muted">Tokens Sold:</span>
                <span>{Number(tournament.tokensSold)} / {Number(tournament.totalTokens)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="text-muted">Progress:</span>
                <span>{getProgressPercentage(tournament.tokensSold, tournament.totalTokens)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="text-muted">Profit Share:</span>
                <span>{Number(tournament.profitSharePercentage)}%</span>
              </div>
              {tournament.tournamentCompleted && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-muted">Total Winnings:</span>
                  <span>{formatEther(tournament.totalWinnings)} ETH</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ 
              background: '#e9ecef', 
              borderRadius: '4px', 
              height: '8px', 
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                height: '100%',
                width: `${getProgressPercentage(tournament.tokensSold, tournament.totalTokens)}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tournament.isActive && !tournament.tournamentCompleted && (
                <button
                  className="btn btn-primary"
                  onClick={() => handlePurchaseTokens(tournament.address, tournament.buyInAmount, tournament.totalTokens)}
                  style={{ flex: 1, minWidth: '120px' }}
                >
                  Buy Tokens
                </button>
              )}
              
              {tournament.tournamentCompleted && !tournament.winningsDistributed && (
                <button
                  className="btn btn-success"
                  onClick={() => handleClaimWinnings(tournament.address)}
                  style={{ flex: 1, minWidth: '120px' }}
                >
                  Claim Winnings
                </button>
              )}
            </div>

            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              background: '#f8f9fa', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#6c757d'
            }}>
              <div>Address: {tournament.address.slice(0, 10)}...{tournament.address.slice(-8)}</div>
              <div>Owner: {tournament.tournamentOwner.slice(0, 10)}...{tournament.tournamentOwner.slice(-8)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentList;
