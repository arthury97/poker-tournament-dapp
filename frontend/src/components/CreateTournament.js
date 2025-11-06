import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { getTournamentManagerContract, parseEther, usdtToEth } from '../utils/contracts';
import { tournamentList, searchTournaments } from '../utils/tournamentData';
import { formatDateRange } from '../utils/dateFormat';
import toast from 'react-hot-toast';

const CreateTournament = ({ onTournamentCreated }) => {
  const { signer, TOURNAMENT_MANAGER_ADDRESS, isConnected } = useWeb3();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [formData, setFormData] = useState({
    symbol: '',
    buyInAmount: '',
    totalTokens: '',
    profitSharePercentage: '80'
  });

  // Filter tournaments based on search query
  const filteredTournaments = useMemo(() => {
    if (!searchQuery.trim()) {
      return tournamentList;
    }
    return searchTournaments(searchQuery);
  }, [searchQuery]);

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
    setSearchQuery(tournament.name);
    setShowDropdown(false);
    
    // Pre-fill form with tournament data
    // Convert tournament buy-in (USD) to USDT equivalent, then to ETH for smart contract
    const buyInUSDT = tournament.buyIn ? tournament.buyIn.toString() : '';
    setFormData(prev => ({
      ...prev,
      symbol: tournament.series.split(' ').map(word => word[0]).join('').toUpperCase() || tournament.name.substring(0, 4).toUpperCase(),
      buyInAmount: buyInUSDT, // Store as USDT in form
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in first to create a token');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!signer) {
      toast.error('Wallet not connected');
      return;
    }

    if (!selectedTournament) {
      toast.error('Please select a tournament first');
      return;
    }

    try {
      setIsLoading(true);

      // Validate form data
      if (!formData.symbol.trim()) {
        throw new Error('Token symbol is required');
      }
      if (!formData.buyInAmount || parseFloat(formData.buyInAmount) <= 0) {
        throw new Error('Buy-in amount must be greater than 0');
      }

      // Convert USDT to ETH for smart contract
      const buyInEth = usdtToEth(formData.buyInAmount);
      if (!formData.totalTokens || parseInt(formData.totalTokens) <= 0) {
        throw new Error('Total tokens must be greater than 0');
      }
      if (parseInt(formData.profitSharePercentage) < 0 || parseInt(formData.profitSharePercentage) > 100) {
        throw new Error('Profit share percentage must be between 0 and 100');
      }

      const tournamentManager = getTournamentManagerContract(TOURNAMENT_MANAGER_ADDRESS, signer);

      // Use tournament name from selected tournament
      const tournamentName = selectedTournament.name;

      // Try createTournament first, fallback to createPlayerToken if it doesn't exist
      let tx;
      let useCreateTournament = true;
      
      try {
        // Try to call createTournament
        tx = await tournamentManager.createTournament(
          tournamentName,
          formData.symbol.trim().toUpperCase(),
          parseEther(buyInEth),
          parseInt(formData.totalTokens),
          parseInt(formData.profitSharePercentage)
        );
      } catch (error) {
        // If createTournament doesn't exist, try createPlayerToken
        if (error.message && error.message.includes('createTournament')) {
          console.log('createTournament not found, trying createPlayerToken...');
          useCreateTournament = false;
          tx = await tournamentManager.createPlayerToken(
            tournamentName,
            formData.symbol.trim().toUpperCase(),
            parseEther(buyInEth),
            parseInt(formData.totalTokens),
            parseInt(formData.profitSharePercentage)
          );
        } else {
          throw error;
        }
      }

      toast.loading('Creating tournament token...', { id: 'create-token' });
      
      const receipt = await tx.wait();
      
      let tournamentAddress = null;
      
      // Method 1: Query events directly from the transaction hash
      console.log('Transaction hash:', receipt.hash);
      console.log('Receipt logs:', receipt.logs.length);
      
      try {
        // Define event topic hashes (manually calculated or from interface)
        let tournamentCreatedTopic = null;
        let playerTokenCreatedTopic = null;
        
        try {
          tournamentCreatedTopic = tournamentManager.interface.getEvent('TournamentCreated').topicHash;
        } catch (e) {
          console.log('TournamentCreated event not in ABI, will try manual extraction');
        }
        
        try {
          playerTokenCreatedTopic = tournamentManager.interface.getEvent('PlayerTokenCreated').topicHash;
        } catch (e) {
          console.log('PlayerTokenCreated event not in ABI, will try manual extraction');
        }
        
        // Look for events in logs by topic
        for (const log of receipt.logs) {
          // Check if this log is from our TournamentManager contract
          if (log.address.toLowerCase() === TOURNAMENT_MANAGER_ADDRESS.toLowerCase()) {
            if (log.topics && log.topics[0]) {
              let isRelevantEvent = false;
              
              // Check if it matches TournamentCreated event
              if (tournamentCreatedTopic && log.topics[0] === tournamentCreatedTopic) {
                isRelevantEvent = true;
              }
              // Check if it matches PlayerTokenCreated event
              else if (playerTokenCreatedTopic && log.topics[0] === playerTokenCreatedTopic) {
                isRelevantEvent = true;
              }
              
              if (isRelevantEvent) {
                try {
                  const parsed = tournamentManager.interface.parseLog(log);
                  if (parsed) {
                    if (parsed.name === 'TournamentCreated' && parsed.args.tournamentAddress) {
                      tournamentAddress = parsed.args.tournamentAddress;
                      console.log('Found TournamentCreated event from topic:', tournamentAddress);
                      break;
                    } else if (parsed.name === 'PlayerTokenCreated' && parsed.args.playerTokenAddress) {
                      tournamentAddress = parsed.args.playerTokenAddress;
                      console.log('Found PlayerTokenCreated event from topic:', tournamentAddress);
                      break;
                    }
                  }
                } catch (e) {
                  // Try to extract address from topics (indexed parameter is in topics[1])
                  // First indexed parameter (playerTokenAddress/tournamentAddress) is in topics[1]
                  if (log.topics[1]) {
                    // topics[1] contains the address, but it's padded to 32 bytes
                    // We need to extract the last 20 bytes (40 hex chars) for the address
                    const addressFromTopic = '0x' + log.topics[1].slice(-40).toLowerCase();
                    tournamentAddress = addressFromTopic;
                    console.log('Extracted address from topic:', tournamentAddress);
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing events by topic:', e);
      }

      // Method 1b: Try parsing logs with interface (fallback)
      if (!tournamentAddress) {
        console.log('Topic parsing failed, trying interface parseLog...');
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === TOURNAMENT_MANAGER_ADDRESS.toLowerCase()) {
            try {
              const parsed = tournamentManager.interface.parseLog(log);
              if (parsed) {
                if (parsed.name === 'TournamentCreated' && parsed.args.tournamentAddress) {
                  tournamentAddress = parsed.args.tournamentAddress;
                  console.log('Found TournamentCreated via parseLog:', tournamentAddress);
                  break;
                } else if (parsed.name === 'PlayerTokenCreated' && parsed.args.playerTokenAddress) {
                  tournamentAddress = parsed.args.playerTokenAddress;
                  console.log('Found PlayerTokenCreated via parseLog:', tournamentAddress);
                  break;
                }
              }
            } catch (e) {
              // Continue to next log
            }
          }
        }
      }

      // Method 1c: Extract address from any TournamentManager log (last resort for event parsing)
      if (!tournamentAddress) {
        console.log('Interface parseLog failed, trying to extract from any TournamentManager log...');
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === TOURNAMENT_MANAGER_ADDRESS.toLowerCase()) {
            // If we have topics and at least 2 topics (event signature + first indexed param)
            // The first indexed param (topic[1]) should be the token address
            if (log.topics && log.topics.length >= 2 && log.topics[1]) {
              const possibleAddress = '0x' + log.topics[1].slice(-40).toLowerCase();
              // Validate it's a valid address (20 bytes = 40 hex chars)
              if (/^0x[a-fA-F0-9]{40}$/.test(possibleAddress) && possibleAddress !== '0x0000000000000000000000000000000000000000') {
                tournamentAddress = possibleAddress;
                console.log('Extracted address from TournamentManager log topic:', tournamentAddress);
                break;
              }
            }
          }
        }
      }

      // Method 2: Try to get from creator's tokens array (most reliable)
      if (!tournamentAddress) {
        console.log('Event parsing failed, trying to get from creator array...');
        try {
          // Get the user's account address
          const userAddress = await signer.getAddress();
          
          // Try getCreatorTournaments first
          try {
            const creatorTournaments = await tournamentManager.getCreatorTournaments(userAddress);
            if (creatorTournaments && creatorTournaments.length > 0) {
              tournamentAddress = creatorTournaments[creatorTournaments.length - 1];
              console.log('Found from getCreatorTournaments:', tournamentAddress);
            }
          } catch (e) {
            console.log('getCreatorTournaments failed, trying getPlayerTokens...');
            // Try getPlayerTokens
            try {
              const playerTokens = await tournamentManager.getPlayerTokens(userAddress);
              if (playerTokens && playerTokens.length > 0) {
                tournamentAddress = playerTokens[playerTokens.length - 1];
                console.log('Found from getPlayerTokens:', tournamentAddress);
              }
            } catch (e2) {
              console.error('getPlayerTokens also failed:', e2);
            }
          }
        } catch (e) {
          console.error('Could not get from creator array:', e);
        }
      }

      // Method 3: Try to get from active tournaments array
      if (!tournamentAddress) {
        console.log('Creator array failed, trying active tournaments array...');
        try {
          if (useCreateTournament) {
            const tournamentsArray = await tournamentManager.getActiveTournaments();
            if (tournamentsArray && tournamentsArray.length > 0) {
              tournamentAddress = tournamentsArray[tournamentsArray.length - 1];
              console.log('Found from getActiveTournaments:', tournamentAddress);
            }
          } else {
            const playerTokensArray = await tournamentManager.getActivePlayerTokens();
            if (playerTokensArray && playerTokensArray.length > 0) {
              tournamentAddress = playerTokensArray[playerTokensArray.length - 1];
              console.log('Found from getActivePlayerTokens:', tournamentAddress);
            }
          }
        } catch (e) {
          console.error('Could not get from active array:', e);
        }
      }

      // Method 4: Try to get by index (last resort)
      if (!tournamentAddress) {
        console.log('Active array failed, trying by index...');
        try {
          if (useCreateTournament) {
            const totalCount = await tournamentManager.getTotalTournaments();
            console.log('Total tournaments:', totalCount.toString());
            if (totalCount > 0n) {
              tournamentAddress = await tournamentManager.tournaments(totalCount - 1n);
              console.log('Found from tournaments array by index:', tournamentAddress);
            }
          } else {
            const totalCount = await tournamentManager.getTotalPlayerTokens();
            console.log('Total player tokens:', totalCount.toString());
            if (totalCount > 0n) {
              tournamentAddress = await tournamentManager.playerTokens(totalCount - 1n);
              console.log('Found from playerTokens array by index:', tournamentAddress);
            }
          }
        } catch (e) {
          console.error('Could not get by index:', e);
        }
      }

      if (tournamentAddress) {
        toast.success('Tournament token created successfully!', { id: 'create-token' });
        
        // Reset form
        setSelectedTournament(null);
        setSearchQuery('');
        setFormData({
          symbol: '',
          buyInAmount: '',
          totalTokens: '',
          profitSharePercentage: '80'
        });

        // Notify parent component
        if (onTournamentCreated) {
          onTournamentCreated(tournamentAddress);
        }
      } else {
        throw new Error('Failed to get tournament address from transaction. Transaction was successful but address could not be retrieved.');
      }

    } catch (error) {
      console.error('Error creating tournament token:', error);
      toast.error(error.message || 'Failed to create tournament token', { id: 'create-token' });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="card" style={{ background: '#ffffff', border: '3px solid #2563eb' }}>
      <h2 style={{ 
        marginBottom: '24px', 
        color: '#2563eb', 
        fontSize: '32px',
        fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
        letterSpacing: '1px'
      }}>
        CREATE TOKEN
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* Tournament Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="tournament-search">
            SELECT TOURNAMENT *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              id="tournament-search"
              className="form-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search tournaments (e.g., WSOP, APT, EPT)..."
              required
              style={{ paddingRight: '40px' }}
            />
            
            {/* Dropdown */}
            {showDropdown && filteredTournaments.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#ffffff',
                border: '2px solid #2563eb',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)'
              }}>
                {filteredTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    onClick={() => handleTournamentSelect(tournament)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.background = '#ffffff'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '700', 
                          color: '#1f2937',
                          marginBottom: '4px',
                          fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif'
                        }}>
                          {tournament.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          {tournament.series}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          📍 {tournament.location}
                        </div>
                        {tournament.startDate && (
                          <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>
                            📅 {formatDateRange(tournament.startDate, tournament.endDate)}
                          </div>
                        )}
                      </div>
                      <div style={{ marginLeft: '12px' }}>
                        {getTypeBadge(tournament.type)}
                      </div>
                    </div>
                    {tournament.buyIn && (
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#2563eb',
                        marginTop: '8px'
                      }}>
                        Buy-in: ${tournament.buyIn.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedTournament && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              background: '#eff6ff', 
              borderRadius: '8px',
              border: '2px solid #dbeafe'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>SELECTED TOURNAMENT:</span>
                {getTypeBadge(selectedTournament.type)}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb', marginBottom: '4px' }}>
                {selectedTournament.name}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                {selectedTournament.series} • {selectedTournament.location}
              </div>
              {selectedTournament.startDate && (
                <div style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600' }}>
                  📅 {formatDateRange(selectedTournament.startDate, selectedTournament.endDate)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="symbol">
            TOKEN SYMBOL *
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            className="form-input"
            value={formData.symbol}
            onChange={handleInputChange}
            placeholder="e.g., WSOP, APT, EPT"
            maxLength="10"
            required
          />
          <small className="text-muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
            Short symbol for your token (auto-filled from tournament selection)
          </small>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="buyInAmount">
            BUY-IN AMOUNT (USDT) *
          </label>
          <input
            type="number"
            id="buyInAmount"
            name="buyInAmount"
            className="form-input"
            value={formData.buyInAmount}
            onChange={handleInputChange}
            placeholder={selectedTournament?.buyIn ? selectedTournament.buyIn.toString() : "3000"}
            step="0.01"
            min="0.01"
            required
          />
          <small className="text-muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
            {selectedTournament?.buyIn && `Tournament buy-in: ${selectedTournament.buyIn.toLocaleString()} USDT`}
            {selectedTournament?.buyIn && ` (≈ ${usdtToEth(selectedTournament.buyIn)} ETH on-chain)`}
          </small>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="totalTokens">
            TOTAL TOKENS *
          </label>
          <input
            type="number"
            id="totalTokens"
            name="totalTokens"
            className="form-input"
            value={formData.totalTokens}
            onChange={handleInputChange}
            placeholder="1000"
            min="1"
            required
          />
          <small className="text-muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
            Total number of tokens to sell (each token = buy-in amount / total tokens)
          </small>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="profitSharePercentage">
            PROFIT SHARE PERCENTAGE *
          </label>
          <input
            type="number"
            id="profitSharePercentage"
            name="profitSharePercentage"
            className="form-input"
            value={formData.profitSharePercentage}
            onChange={handleInputChange}
            placeholder="80"
            min="0"
            max="100"
            required
          />
          <small className="text-muted" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
            Percentage of winnings to share with token holders (0-100%)
          </small>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !isAuthenticated || !isConnected || !selectedTournament}
          style={{ 
            width: '100%', 
            marginTop: '16px',
            padding: '16px',
            fontSize: '18px',
            fontWeight: '700',
            fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}
        >
          {isLoading ? (
            <>
              <div className="loading"></div>
              CREATING TOKEN...
            </>
          ) : (
            'CREATE TOKEN'
          )}
        </button>

        {!isAuthenticated && (
          <p className="text-muted text-center" style={{ marginTop: '16px', fontSize: '14px' }}>
            Please sign in to create a tournament token
          </p>
        )}
        {!isConnected && isAuthenticated && (
          <p className="text-muted text-center" style={{ marginTop: '16px', fontSize: '14px' }}>
            Please connect your wallet to create a tournament token
          </p>
        )}
        {!selectedTournament && (
          <p className="text-muted text-center" style={{ marginTop: '16px', fontSize: '14px' }}>
            Please select a tournament from the list above
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateTournament;
