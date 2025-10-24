import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getPokerTokenContract, formatEther } from '../utils/contracts';
import toast from 'react-hot-toast';

const DemoTournament = () => {
  const { signer, isConnected } = useWeb3();
  const [tournamentInfo, setTournamentInfo] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [potentialWinnings, setPotentialWinnings] = useState(0);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const DEMO_TOURNAMENT_ADDRESS = process.env.REACT_APP_DEMO_TOURNAMENT_ADDRESS;

  const loadTournamentData = async () => {
    if (!isConnected || !signer || !DEMO_TOURNAMENT_ADDRESS) return;

    try {
      const tournament = getPokerTokenContract(DEMO_TOURNAMENT_ADDRESS, signer);
      
      // Get tournament info
      const info = await tournament.getTournamentInfo();
      setTournamentInfo(info);

      // Get user's token balance
      const balance = await tournament.balanceOf(signer.address);
      setUserBalance(Number(balance));

      // Get potential winnings
      const winnings = await tournament.getPotentialWinnings(signer.address);
      setPotentialWinnings(winnings);

      // Check if user has claimed
      const claimed = await tournament.hasClaimedWinnings(signer.address);
      setHasClaimed(claimed);

    } catch (error) {
      console.error('Error loading tournament data:', error);
    }
  };

  useEffect(() => {
    loadTournamentData();
  }, [isConnected, signer]);

  const handleClaimWinnings = async () => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const tournament = getPokerTokenContract(DEMO_TOURNAMENT_ADDRESS, signer);
      
      const tx = await tournament.claimWinnings();
      toast.loading('Claiming winnings...', { id: 'claim-winnings' });
      
      await tx.wait();
      toast.success('Winnings claimed successfully!', { id: 'claim-winnings' });
      
      // Reload data
      await loadTournamentData();
    } catch (error) {
      console.error('Error claiming winnings:', error);
      toast.error(error.message || 'Failed to claim winnings', { id: 'claim-winnings' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!tournamentInfo) {
    return (
      <div className="card text-center">
        <div className="loading" style={{ margin: '20px auto' }}></div>
        <p>Loading demo tournament...</p>
      </div>
    );
  }

  const progressPercentage = Math.round((Number(tournamentInfo.tokensSold) / Number(tournamentInfo.totalTokens)) * 100);
  const shareableWinnings = (Number(formatEther(tournamentInfo.totalWinnings)) * Number(tournamentInfo.profitSharePercentage)) / 100;
  const winningsPerToken = shareableWinnings / Number(tournamentInfo.tokensSold);

  return (
    <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white' }}>🏆 {tournamentInfo.name}</h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Demo Tournament - Completed!</p>
        </div>
        <span style={{ 
          background: 'rgba(255, 255, 255, 0.2)', 
          padding: '8px 16px', 
          borderRadius: '20px', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ✅ Completed
        </span>
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'white' }}>📊 Tournament Results</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Total Winnings</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatEther(tournamentInfo.totalWinnings)} ETH</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Profit Share</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{Number(tournamentInfo.profitSharePercentage)}%</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Shareable Amount</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{shareableWinnings.toFixed(3)} ETH</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Per Token</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{winningsPerToken.toFixed(4)} ETH</div>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'white' }}>👤 Your Participation</h3>
        
        {userBalance > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ opacity: 0.8 }}>Your Token Balance:</span>
              <span style={{ fontWeight: 'bold' }}>{userBalance} tokens</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ opacity: 0.8 }}>Your Potential Winnings:</span>
              <span style={{ fontWeight: 'bold' }}>{formatEther(potentialWinnings)} ETH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ opacity: 0.8 }}>Status:</span>
              <span style={{ fontWeight: 'bold', color: hasClaimed ? '#4ade80' : '#fbbf24' }}>
                {hasClaimed ? '✅ Claimed' : '⏳ Available'}
              </span>
            </div>

            {!hasClaimed && potentialWinnings > 0 && (
              <button
                onClick={handleClaimWinnings}
                className="btn btn-success"
                disabled={isLoading}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white'
                }}
              >
                {isLoading ? (
                  <>
                    <div className="loading"></div>
                    Claiming...
                  </>
                ) : (
                  `Claim ${formatEther(potentialWinnings)} ETH`
                )}
              </button>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.8 }}>
            <p>You don't own any tokens in this tournament.</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              This was a demo tournament with 5 participants who each bought 20 tokens.
            </p>
          </div>
        )}
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: '20px', 
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'white' }}>📈 Demo Summary</h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>
          <p>✅ <strong>5 participants</strong> each bought <strong>20 tokens</strong> (100 tokens total)</p>
          <p>✅ Tournament creator won <strong>10 ETH</strong> in the poker tournament</p>
          <p>✅ <strong>3.5 ETH</strong> distributed to token holders (35% profit share)</p>
          <p>✅ Each participant received <strong>0.7 ETH</strong> (20 tokens × 0.035 ETH per token)</p>
          <p>✅ Tournament creator kept <strong>6.5 ETH</strong> (65% of winnings)</p>
        </div>
      </div>

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: '8px',
        fontSize: '12px',
        opacity: 0.8
      }}>
        <div>Contract: {DEMO_TOURNAMENT_ADDRESS?.slice(0, 10)}...{DEMO_TOURNAMENT_ADDRESS?.slice(-8)}</div>
      </div>
    </div>
  );
};

export default DemoTournament;
