import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { getTournamentManagerContract, getPokerTokenContract, ethToUSDT, formatUSDT } from '../utils/contracts';
import { formatDateRange } from '../utils/dateFormat';
import toast from 'react-hot-toast';

const Marketplace = ({ refreshTrigger }) => {
  const { signer, TOURNAMENT_MANAGER_ADDRESS, isConnected, account } = useWeb3();
  const { isAuthenticated } = useAuth();
  const [onChainTournaments, setOnChainTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('available'); // 'available', 'orders', 'newlyMinted'
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tokenQuantity, setTokenQuantity] = useState('');

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
      
      const detailPromises = tournamentAddresses.map(async (address, index) => {
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
            remainingTokens,
            creationIndex: index // For sorting by creation order (newest last)
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

  const loadOrders = async () => {
    if (!isConnected || !signer || !TOURNAMENT_MANAGER_ADDRESS) {
      setOrders([]);
      setIsLoadingOrders(false);
      return;
    }

    try {
      setIsLoadingOrders(true);
      const tournamentManager = getTournamentManagerContract(TOURNAMENT_MANAGER_ADDRESS, signer);
      
      const totalTournaments = await tournamentManager.getTotalTournaments();
      
      if (totalTournaments === 0n || totalTournaments === 0) {
        setOrders([]);
        setIsLoadingOrders(false);
        return;
      }
      
      const allOrders = [];
      
      // Get all tournaments
      const tournamentPromises = [];
      for (let i = 0; i < totalTournaments; i++) {
        tournamentPromises.push(tournamentManager.tournaments(i));
      }
      const tournamentAddresses = await Promise.all(tournamentPromises);
      
      // For each tournament, get orders
      for (const tournamentAddress of tournamentAddresses) {
        try {
          const pokerToken = getPokerTokenContract(tournamentAddress, signer);
          
          // Try to get active orders using getActiveOrders
          let activeOrderIds = [];
          try {
            activeOrderIds = await pokerToken.getActiveOrders();
          } catch (e) {
            // If getActiveOrders doesn't exist, try getting totalOrders and iterating
            try {
              const totalOrders = await pokerToken.totalOrders();
              if (totalOrders > 0n) {
                // Get all order IDs (0 to totalOrders-1)
                for (let i = 0; i < totalOrders; i++) {
                  activeOrderIds.push(i);
                }
              }
            } catch (e2) {
              // Functions might not exist, skip this token
              continue;
            }
          }
          
          if (activeOrderIds.length === 0) continue;
          
          // Get tournament details for context
          const details = await tournamentManager.getTournamentDetails(tournamentAddress);
          
          // Get each active order
          for (const orderId of activeOrderIds) {
            try {
              const order = await pokerToken.orders(orderId);
              if (order.isActive) {
                allOrders.push({
                  orderId: Number(orderId),
                  tournamentAddress,
                  tournamentName: details.name,
                  trader: order.trader,
                  tokenAmount: order.tokenAmount,
                  pricePerToken: order.pricePerToken,
                  isBuyOrder: order.isBuyOrder,
                  timestamp: order.timestamp
                });
              }
            } catch (e) {
              // Skip this order if error
              console.log(`Error loading order ${orderId} for ${tournamentAddress}:`, e.message);
            }
          }
        } catch (error) {
          console.error(`Error loading orders for ${tournamentAddress}:`, error);
        }
      }
      
      setOrders(allOrders);
    } catch (error) {
      console.warn('Could not load orders:', error.message || error);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOnChainTournaments();
    if (activeSubTab === 'orders') {
      loadOrders();
    }
  }, [isConnected, signer, refreshTrigger, activeSubTab]);

  const handlePurchaseClick = (tournament) => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in first to purchase tokens');
      return;
    }

    setSelectedTournament(tournament);
    setTokenQuantity('');
    setShowPurchaseModal(true);
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
      const totalCost = selectedTournament.tokenPrice * tokensToBuy;
      
      toast.loading(`Purchasing ${quantity} tokens...`, { id: 'purchase-tokens' });
      
      const tx = await pokerToken.purchaseTokens({ value: totalCost });
      await tx.wait();
      
      toast.success(`Successfully purchased ${quantity} tokens!`, { id: 'purchase-tokens' });
      
      // Close modal and reset
      setShowPurchaseModal(false);
      setSelectedTournament(null);
      setTokenQuantity('');
      
      // Refresh tournament list
      loadOnChainTournaments();
      if (activeSubTab === 'orders') {
        loadOrders();
      }
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      toast.error(error.reason || error.message || 'Failed to purchase tokens', { id: 'purchase-tokens' });
    }
  };

  const handleExecuteOrder = async (orderId, tournamentAddress, isBuyOrder) => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in first to execute orders');
      return;
    }

    try {
      const pokerToken = getPokerTokenContract(tournamentAddress, signer);
      
      toast.loading('Executing order...', { id: 'execute-order' });
      
      let tx;
      if (isBuyOrder) {
        // Execute buy order means fulfill a SELL order (someone is selling, we buy from them)
        // So we need to call executeBuyOrder which buys tokens from a sell order
        const order = await pokerToken.orders(orderId);
        const totalCost = order.tokenAmount * order.pricePerToken;
        tx = await pokerToken.executeBuyOrder(orderId, { value: totalCost });
      } else {
        // Execute sell order means fulfill a BUY order (someone wants to buy, we sell to them)
        // So we need to call executeSellOrder which sells tokens to fulfill a buy order
        tx = await pokerToken.executeSellOrder(orderId);
      }
      
      await tx.wait();
      toast.success('Order executed successfully!', { id: 'execute-order' });
      
      // Refresh
      loadOrders();
      loadOnChainTournaments();
    } catch (error) {
      console.error('Error executing order:', error);
      toast.error(error.reason || error.message || 'Failed to execute order', { id: 'execute-order' });
    }
  };

  // Filter tournaments - only show available tokens that can be purchased
  const availableTournaments = onChainTournaments.filter(tournament => {
    if (!tournament.isOnChain) return false;
    if (!tournament.isActive) return false;
    if (tournament.tournamentCompleted) return false;
    if (!tournament.remainingTokens || tournament.remainingTokens <= 0) return false;
    if (tournament.tokensSold >= tournament.totalTokens) return false;
    return true;
  });

  // Newly minted tokens (sorted by creation index, newest first)
  const newlyMintedTournaments = [...onChainTournaments]
    .filter(t => t.isOnChain && t.isActive && !t.tournamentCompleted)
    .sort((a, b) => (b.creationIndex || 0) - (a.creationIndex || 0))
    .slice(0, 10); // Show top 10 newest

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

  const renderTokenCard = (tournament, index) => {
    const progress = getProgressPercentage(tournament.tokensSold, tournament.totalTokens);
    const buyInUSDT = formatUSDT(ethToUSDT(tournament.buyInAmount));
    const tokenPriceUSDT = tournament.tokenPrice 
      ? formatUSDT(ethToUSDT(tournament.tokenPrice))
      : '0.00';
    const isSoldOut = tournament.remainingTokens === 0 || tournament.tokensSold >= tournament.totalTokens;
    const canPurchase = isConnected && isAuthenticated && !isSoldOut && !tournament.tournamentCompleted && tournament.isOnChain;

    return (
      <div 
        key={tournament.address || index} 
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
        {tournament.isOnChain && (
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
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '32px',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.15)',
        padding: '4px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}>
        <button
          onClick={() => setActiveSubTab('available')}
          className="btn"
          style={{
            background: activeSubTab === 'available' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'available' ? '#1f2937' : '#ffffff',
            border: 'none',
            flex: 1,
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '700',
            fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
            fontSize: '14px'
          }}
        >
          📊 ALL AVAILABLE TOKENS
        </button>
        <button
          onClick={() => setActiveSubTab('orders')}
          className="btn"
          style={{
            background: activeSubTab === 'orders' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'orders' ? '#1f2937' : '#ffffff',
            border: 'none',
            flex: 1,
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '700',
            fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
            fontSize: '14px'
          }}
        >
          💱 BUY & SELL ORDERS
        </button>
        <button
          onClick={() => setActiveSubTab('newlyMinted')}
          className="btn"
          style={{
            background: activeSubTab === 'newlyMinted' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'newlyMinted' ? '#1f2937' : '#ffffff',
            border: 'none',
            flex: 1,
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '700',
            fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
            fontSize: '14px'
          }}
        >
          🆕 NEWLY MINTED TOKENS
        </button>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'available' && (
        <>
          {isLoading ? (
            <div className="card text-center">
              <div className="loading" style={{ margin: '20px auto' }}></div>
              <p>Loading available tokens...</p>
            </div>
          ) : availableTournaments.length === 0 ? (
            <div className="card text-center" style={{ background: '#ffffff', border: '3px solid #2563eb' }}>
              <h3 style={{ color: '#2563eb', fontSize: '24px', marginBottom: '16px' }}>
                NO TOKENS AVAILABLE
              </h3>
              <p className="text-muted" style={{ fontSize: '16px' }}>
                No tokens are currently available for purchase.
              </p>
              <p className="text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
                Create your first token in the "CREATE TOKEN" tab!
              </p>
            </div>
          ) : (
            <div className="grid grid-2" style={{ gap: '24px' }}>
              {availableTournaments.map((tournament, index) => renderTokenCard(tournament, index))}
            </div>
          )}
        </>
      )}

      {activeSubTab === 'orders' && (
        <>
          {isLoadingOrders ? (
            <div className="card text-center">
              <div className="loading" style={{ margin: '20px auto' }}></div>
              <p>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="card text-center" style={{ background: '#ffffff', border: '3px solid #2563eb' }}>
              <h3 style={{ color: '#2563eb', fontSize: '24px', marginBottom: '16px' }}>
                NO ORDERS AVAILABLE
              </h3>
              <p className="text-muted" style={{ fontSize: '16px' }}>
                No buy or sell orders are currently available to fulfill.
              </p>
              <p className="text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
                Create orders through token contracts to enable trading.
              </p>
            </div>
          ) : (
            <div className="grid grid-2" style={{ gap: '24px' }}>
              {orders.map((order, index) => {
                const totalCostUSDT = formatUSDT(ethToUSDT((order.tokenAmount * order.pricePerToken).toString()));
                const pricePerTokenUSDT = formatUSDT(ethToUSDT(order.pricePerToken.toString()));
                const canExecute = isConnected && isAuthenticated && order.trader.toLowerCase() !== account?.toLowerCase();

                return (
                  <div 
                    key={`${order.tournamentAddress}-${order.orderId}`}
                    className="card"
                    style={{
                      background: '#ffffff',
                      border: `3px solid ${order.isBuyOrder ? '#10b981' : '#f59e0b'}`,
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
                          {order.tournamentName}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
                          Order #{order.orderId}
                        </div>
                      </div>
                      <span style={{
                        background: order.isBuyOrder ? '#10b981' : '#f59e0b',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
                      }}>
                        {order.isBuyOrder ? '🛒 BUY ORDER' : '💰 SELL ORDER'}
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
                            TOKEN AMOUNT
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                            {Number(order.tokenAmount).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ 
                          background: '#f3f4f6', 
                          padding: '12px', 
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            PRICE PER TOKEN
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                            {pricePerTokenUSDT} USDT
                          </div>
                        </div>
                        <div style={{ 
                          background: '#eff6ff', 
                          padding: '12px', 
                          borderRadius: '8px',
                          border: '2px solid #dbeafe',
                          gridColumn: 'span 2'
                        }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            TOTAL VALUE
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>
                            {totalCostUSDT} USDT
                          </div>
                        </div>
                      </div>

                      <div style={{ 
                        padding: '12px', 
                        background: '#f3f4f6', 
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#6b7280',
                        border: '2px solid #e5e7eb'
                      }}>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>Trader:</strong> {order.trader.slice(0, 6)}...{order.trader.slice(-4)}
                        </div>
                        <div>
                          <strong>Created:</strong> {new Date(Number(order.timestamp) * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn"
                      style={{ 
                        width: '100%', 
                        padding: '16px',
                        fontSize: '18px',
                        fontWeight: '700',
                        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        background: order.isBuyOrder ? '#10b981' : '#f59e0b',
                        opacity: canExecute ? 1 : 0.6,
                        cursor: canExecute ? 'pointer' : 'not-allowed'
                      }}
                      disabled={!canExecute}
                      onClick={() => handleExecuteOrder(order.orderId, order.tournamentAddress, order.isBuyOrder)}
                    >
                      {!isConnected 
                        ? 'CONNECT WALLET' 
                        : !isAuthenticated
                        ? 'SIGN IN TO EXECUTE'
                        : order.trader.toLowerCase() === account?.toLowerCase()
                        ? 'YOUR ORDER'
                        : order.isBuyOrder
                        ? 'FULFILL BUY ORDER'
                        : 'FULFILL SELL ORDER'}
                    </button>

                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px', 
                      background: '#f8f9fa', 
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#6c757d',
                      wordBreak: 'break-all'
                    }}>
                      Tournament: {order.tournamentAddress}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeSubTab === 'newlyMinted' && (
        <>
          {isLoading ? (
            <div className="card text-center">
              <div className="loading" style={{ margin: '20px auto' }}></div>
              <p>Loading newly minted tokens...</p>
            </div>
          ) : newlyMintedTournaments.length === 0 ? (
            <div className="card text-center" style={{ background: '#ffffff', border: '3px solid #2563eb' }}>
              <h3 style={{ color: '#2563eb', fontSize: '24px', marginBottom: '16px' }}>
                NO NEWLY MINTED TOKENS
              </h3>
              <p className="text-muted" style={{ fontSize: '16px' }}>
                No recently created tokens found.
              </p>
              <p className="text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
                Create tokens in the "CREATE TOKEN" tab!
              </p>
            </div>
          ) : (
            <div className="grid grid-2" style={{ gap: '24px' }}>
              {newlyMintedTournaments.map((tournament, index) => renderTokenCard(tournament, index))}
            </div>
          )}
        </>
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

export default Marketplace;
