import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { getTournamentManagerContract, getPokerTokenContract, ethToUSDT, formatUSDT } from '../utils/contracts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { signer, TOURNAMENT_MANAGER_ADDRESS, isConnected, account } = useWeb3();
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('created');
  const [createdTournaments, setCreatedTournaments] = useState([]);
  const [portfolioTokens, setPortfolioTokens] = useState([]);
  const [isLoadingCreated, setIsLoadingCreated] = useState(false);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);

  // Load tournaments created by the user
  const loadCreatedTournaments = useCallback(async () => {
    if (!isConnected || !signer || !TOURNAMENT_MANAGER_ADDRESS || !account) {
      setCreatedTournaments([]);
      return;
    }

    try {
      setIsLoadingCreated(true);
      
      // Verify contract exists at this address
      const code = await signer.provider.getCode(TOURNAMENT_MANAGER_ADDRESS);
      if (code === '0x' || code === '0x0') {
        console.warn('⚠️ No contract found at address:', TOURNAMENT_MANAGER_ADDRESS);
        console.warn('Make sure you are connected to the correct network (localhost:1337)');
        setCreatedTournaments([]);
        setIsLoadingCreated(false);
        return;
      }
      
      const tournamentManager = getTournamentManagerContract(TOURNAMENT_MANAGER_ADDRESS, signer);
      
      // Try to get tournaments created by this user (try both function names)
      let creatorTournaments = [];
      try {
        creatorTournaments = await tournamentManager.getCreatorTournaments(account);
      } catch (error) {
        // If getCreatorTournaments doesn't exist or returns BAD_DATA, try getPlayerTokens
        if (error.code === 'BAD_DATA' || error.message?.includes('could not decode result data')) {
          console.log('getCreatorTournaments not available, trying getPlayerTokens...');
          try {
            creatorTournaments = await tournamentManager.getPlayerTokens(account);
          } catch (e2) {
            // If both fail, check if it's a network/contract issue
            if (e2.code === 'BAD_DATA' || e2.message?.includes('could not decode result data')) {
              console.warn('⚠️ getPlayerTokens also not available - contract may not be deployed or is old version');
              console.warn('Contract address:', TOURNAMENT_MANAGER_ADDRESS);
              console.warn('Error:', e2.message);
              // Don't show error to user, just return empty array
            } else {
              console.warn('Could not get creator tournaments:', e2);
            }
            setCreatedTournaments([]);
            setIsLoadingCreated(false);
            return;
          }
        } else {
          // Other error (network, etc.)
          console.warn('Error getting creator tournaments:', error);
          setCreatedTournaments([]);
          setIsLoadingCreated(false);
          return;
        }
      }
      
      if (creatorTournaments.length === 0) {
        setCreatedTournaments([]);
        setIsLoadingCreated(false);
        return;
      }

      // Get details for each tournament
      const detailPromises = creatorTournaments.map(async (address) => {
        try {
          // Try to get tournament details (try both function names)
          let details, isActive;
          try {
            details = await tournamentManager.getTournamentDetails(address);
            isActive = await tournamentManager.isActiveTournament(address);
          } catch (error) {
            // If getTournamentDetails doesn't exist, try getPlayerTokenDetails
            try {
              const playerDetails = await tournamentManager.getPlayerTokenDetails(address);
              // Map player token details to tournament details format
              details = {
                name: playerDetails.playerName,
                buyInAmount: playerDetails.buyInAmount,
                totalTokens: playerDetails.totalTokens,
                tokensSold: playerDetails.tokensSold,
                profitSharePercentage: playerDetails.profitSharePercentage,
                tournamentCompleted: playerDetails.tournamentCompleted,
                totalWinnings: playerDetails.playerWinnings,
                winningsDistributed: playerDetails.winningsDistributed,
                tournamentOwner: playerDetails.playerOwner
              };
              isActive = await tournamentManager.isActivePlayerToken(address);
            } catch (e2) {
              console.error(`Error loading tournament details for ${address}:`, e2);
              return null;
            }
          }
          
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
      setCreatedTournaments(tournamentDetails.filter(t => t !== null));

    } catch (error) {
      console.warn('Could not load created tournaments:', error.message || error);
      setCreatedTournaments([]);
    } finally {
      setIsLoadingCreated(false);
    }
  }, [isConnected, signer, TOURNAMENT_MANAGER_ADDRESS, account]);

  // Load user's portfolio (tokens they own)
  const loadPortfolio = useCallback(async () => {
    if (!isConnected || !signer || !TOURNAMENT_MANAGER_ADDRESS || !account) {
      setPortfolioTokens([]);
      return;
    }

    try {
      setIsLoadingPortfolio(true);
      
      // Verify contract exists at this address
      const code = await signer.provider.getCode(TOURNAMENT_MANAGER_ADDRESS);
      if (code === '0x' || code === '0x0') {
        console.warn('⚠️ No contract found at address:', TOURNAMENT_MANAGER_ADDRESS);
        console.warn('Make sure you are connected to the correct network (localhost:1337)');
        setPortfolioTokens([]);
        setIsLoadingPortfolio(false);
        return;
      }
      
      const tournamentManager = getTournamentManagerContract(TOURNAMENT_MANAGER_ADDRESS, signer);
      
      // Try to get total tournaments (try both function names)
      let totalTournaments = 0n;
      let useTournaments = true;
      try {
        totalTournaments = await tournamentManager.getTotalTournaments();
      } catch (error) {
        // If getTotalTournaments doesn't exist, try getTotalPlayerTokens
        try {
          totalTournaments = await tournamentManager.getTotalPlayerTokens();
          useTournaments = false;
        } catch (e2) {
          console.warn('Could not get total tournaments:', e2);
          setPortfolioTokens([]);
          setIsLoadingPortfolio(false);
          return;
        }
      }
      
      if (totalTournaments === 0n || totalTournaments === 0) {
        setPortfolioTokens([]);
        setIsLoadingPortfolio(false);
        return;
      }

      // Get all tournament addresses
      const tournamentPromises = [];
      for (let i = 0; i < totalTournaments; i++) {
        if (useTournaments) {
          tournamentPromises.push(tournamentManager.tournaments(i));
        } else {
          tournamentPromises.push(tournamentManager.playerTokens(i));
        }
      }
      const tournamentAddresses = await Promise.all(tournamentPromises);

      // Check user's balance in each tournament
      const portfolioPromises = tournamentAddresses.map(async (address) => {
        try {
          const tokenContract = getPokerTokenContract(address, signer);
          const balance = await tokenContract.balanceOf(account);
          
          // Only include tournaments where user has tokens
          if (balance > 0n) {
            // Try to get tournament details (try both function names)
            let details;
            try {
              details = await tournamentManager.getTournamentDetails(address);
            } catch (error) {
              // If getTournamentDetails doesn't exist, try getPlayerTokenDetails
              try {
                const playerDetails = await tournamentManager.getPlayerTokenDetails(address);
                // Map player token details to tournament details format
                details = {
                  name: playerDetails.playerName,
                  buyInAmount: playerDetails.buyInAmount,
                  totalTokens: playerDetails.totalTokens,
                  tokensSold: playerDetails.tokensSold,
                  profitSharePercentage: playerDetails.profitSharePercentage,
                  tournamentCompleted: playerDetails.tournamentCompleted,
                  totalWinnings: playerDetails.playerWinnings,
                  winningsDistributed: playerDetails.winningsDistributed,
                  tournamentOwner: playerDetails.playerOwner
                };
              } catch (e2) {
                console.error(`Error loading tournament details for ${address}:`, e2);
                return null;
              }
            }
            
            const potentialWinnings = await tokenContract.getPotentialWinnings(account);
            const hasClaimed = await tokenContract.hasClaimedWinnings(account);
            const tokenPrice = await tokenContract.getTokenPrice();
            
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
              balance: balance.toString(),
              potentialWinnings: potentialWinnings.toString(),
              hasClaimed,
              tokenPrice: tokenPrice.toString()
            };
          }
          return null;
        } catch (error) {
          console.error(`Error loading portfolio for ${address}:`, error);
          return null;
        }
      });

      const portfolioData = await Promise.all(portfolioPromises);
      setPortfolioTokens(portfolioData.filter(t => t !== null));

    } catch (error) {
      console.warn('Could not load portfolio:', error.message || error);
      setPortfolioTokens([]);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [isConnected, signer, TOURNAMENT_MANAGER_ADDRESS, account]);

  useEffect(() => {
    if (activeSection === 'created') {
      loadCreatedTournaments();
    } else {
      loadPortfolio();
    }
  }, [activeSection, loadCreatedTournaments, loadPortfolio]);

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
      
      // Reload portfolio
      loadPortfolio();
    } catch (error) {
      console.error('Error claiming winnings:', error);
      toast.error(error.message || 'Failed to claim winnings', { id: 'claim-winnings' });
    }
  };

  const getProgressPercentage = (tokensSold, totalTokens) => {
    if (!tokensSold || !totalTokens) return 0;
    return Math.round((Number(tokensSold) / Number(totalTokens)) * 100);
  };

  if (!isAuthenticated || !isConnected) {
    return (
      <div className="card text-center" style={{ background: '#ffffff', border: '3px solid #2563eb' }}>
        <h2 style={{ 
          color: '#2563eb', 
          fontSize: '32px',
          fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
          letterSpacing: '1px',
          marginBottom: '16px'
        }}>
          DASHBOARD
        </h2>
        <p className="text-muted" style={{ fontSize: '16px' }}>
          {!isAuthenticated 
            ? 'Please sign in to view your dashboard' 
            : 'Please connect your wallet to view your created tokens and portfolio'}
        </p>
      </div>
    );
  }

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
        USER DASHBOARD
      </h2>

      {/* Section Navigation */}
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
          onClick={() => setActiveSection('created')}
          className="btn"
          style={{
            background: activeSection === 'created' ? '#ffffff' : 'transparent',
            color: activeSection === 'created' ? '#1f2937' : '#ffffff',
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
          🎯 CREATED TOKENS
        </button>
        <button
          onClick={() => setActiveSection('portfolio')}
          className="btn"
          style={{
            background: activeSection === 'portfolio' ? '#ffffff' : 'transparent',
            color: activeSection === 'portfolio' ? '#1f2937' : '#ffffff',
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
          💼 PORTFOLIO
        </button>
      </div>

      {/* Created Tokens Section */}
      {activeSection === 'created' && (
        <div>
          {isLoadingCreated ? (
            <div className="card text-center">
              <div className="loading" style={{ margin: '20px auto' }}></div>
              <p>Loading your created tokens...</p>
            </div>
          ) : createdTournaments.length === 0 ? (
            <div className="card text-center" style={{ background: '#ffffff', border: '3px solid #2563eb' }}>
              <h3 style={{ color: '#2563eb', fontSize: '24px', marginBottom: '16px' }}>
                NO TOKENS CREATED
              </h3>
              <p className="text-muted" style={{ fontSize: '16px', marginBottom: '16px' }}>
                You haven't created any tournament tokens yet.
              </p>
              <p className="text-muted" style={{ fontSize: '14px' }}>
                Go to the "CREATE TOKEN" tab to create your first tournament token!
              </p>
            </div>
          ) : (
            <div className="grid grid-2" style={{ gap: '24px' }}>
              {createdTournaments.map((tournament, index) => {
                const progress = getProgressPercentage(tournament.tokensSold, tournament.totalTokens);
                const buyInUSDT = formatUSDT(ethToUSDT(tournament.buyInAmount));
                
                return (
                  <div 
                    key={tournament.address || index} 
                    className="card"
                    style={{
                      background: '#ffffff',
                      border: '3px solid #2563eb',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
                    }}
                  >
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
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280',
                          fontWeight: '600'
                        }}>
                          Created by you
                        </div>
                      </div>
                      <span style={{
                        background: tournament.tournamentCompleted ? '#10b981' : '#2563eb',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
                      }}>
                        {tournament.tournamentCompleted ? 'COMPLETED' : 'ACTIVE'}
                      </span>
                    </div>

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
                            PROGRESS
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                            {progress}%
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

                      {/* Progress bar */}
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
                            TOKEN SALES PROGRESS
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

                      {tournament.tournamentCompleted && (
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

                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px', 
                      background: '#f8f9fa', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#6c757d'
                    }}>
                      <div>Contract: {tournament.address?.slice(0, 10)}...{tournament.address?.slice(-8)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Portfolio Section */}
      {activeSection === 'portfolio' && (
        <div>
          {isLoadingPortfolio ? (
            <div className="card text-center">
              <div className="loading" style={{ margin: '20px auto' }}></div>
              <p>Loading your portfolio...</p>
            </div>
          ) : portfolioTokens.length === 0 ? (
            <div className="card text-center" style={{ background: '#ffffff', border: '3px solid #2563eb' }}>
              <h3 style={{ color: '#2563eb', fontSize: '24px', marginBottom: '16px' }}>
                EMPTY PORTFOLIO
              </h3>
              <p className="text-muted" style={{ fontSize: '16px', marginBottom: '16px' }}>
                You don't own any tournament tokens yet.
              </p>
              <p className="text-muted" style={{ fontSize: '14px' }}>
                Browse tournaments and purchase tokens to build your portfolio!
              </p>
            </div>
          ) : (
            <div>
              {/* Portfolio Summary */}
              <div className="card" style={{ 
                background: '#ffffff', 
                border: '3px solid #2563eb',
                marginBottom: '24px'
              }}>
                <h3 style={{ 
                  marginBottom: '16px', 
                  color: '#2563eb', 
                  fontSize: '24px',
                  fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
                }}>
                  PORTFOLIO SUMMARY
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px' 
                }}>
                  <div style={{ 
                    background: '#f3f4f6', 
                    padding: '16px', 
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      TOTAL HOLDINGS
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                      {portfolioTokens.length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      tournaments
                    </div>
                  </div>
                  <div style={{ 
                    background: '#f3f4f6', 
                    padding: '16px', 
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      TOTAL TOKENS
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                      {portfolioTokens.reduce((sum, t) => sum + Number(t.balance), 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ 
                    background: '#eff6ff', 
                    padding: '16px', 
                    borderRadius: '8px',
                    border: '2px solid #dbeafe'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                      POTENTIAL WINNINGS
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                      {formatUSDT(ethToUSDT(
                        portfolioTokens.reduce((sum, t) => sum + BigInt(t.potentialWinnings || '0'), 0n)
                      ))} USDT
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Tokens */}
              <div className="grid grid-2" style={{ gap: '24px' }}>
                {portfolioTokens.map((token, index) => {
                  const tokenValueUSDT = formatUSDT(ethToUSDT(
                    (BigInt(token.balance) * BigInt(token.tokenPrice)).toString()
                  ));
                  const potentialWinningsUSDT = formatUSDT(ethToUSDT(token.potentialWinnings));
                  
                  return (
                    <div 
                      key={token.address || index} 
                      className="card"
                      style={{
                        background: '#ffffff',
                        border: '3px solid #2563eb',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
                      }}
                    >
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
                            {token.name}
                          </h3>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            fontWeight: '600'
                          }}>
                            Your Holdings
                          </div>
                        </div>
                        <span style={{
                          background: token.tournamentCompleted ? '#10b981' : '#2563eb',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
                        }}>
                          {token.tournamentCompleted ? 'COMPLETED' : 'ACTIVE'}
                        </span>
                      </div>

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
                              YOUR TOKENS
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                              {Number(token.balance).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ 
                            background: '#f3f4f6', 
                            padding: '12px', 
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb'
                          }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                              TOKEN VALUE
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                              {tokenValueUSDT} USDT
                            </div>
                          </div>
                          <div style={{ 
                            background: '#eff6ff', 
                            padding: '12px', 
                            borderRadius: '8px',
                            border: '2px solid #dbeafe'
                          }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                              POTENTIAL WINNINGS
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                              {potentialWinningsUSDT} USDT
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
                              {Number(token.profitSharePercentage)}%
                            </div>
                          </div>
                        </div>

                        {token.tournamentCompleted && !token.winningsDistributed && !token.hasClaimed && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleClaimWinnings(token.address)}
                            style={{ 
                              width: '100%',
                              padding: '16px',
                              fontSize: '18px',
                              fontWeight: '700',
                              fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                              marginTop: '16px'
                            }}
                          >
                            CLAIM {potentialWinningsUSDT} USDT
                          </button>
                        )}

                        {token.tournamentCompleted && token.hasClaimed && (
                          <div style={{ 
                            background: '#10b981',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: '700',
                            marginTop: '16px'
                          }}>
                            ✅ WINNINGS CLAIMED
                          </div>
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
                        <div>Contract: {token.address?.slice(0, 10)}...{token.address?.slice(-8)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

