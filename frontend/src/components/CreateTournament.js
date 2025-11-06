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

      // Since static calls are failing (ABI mismatch), we'll execute the transaction
      // and then query the contract state to find the newly created token
      let tx;
      let useCreateTournament = true;
      
      // Get the count BEFORE the transaction
      let totalTokensBefore = 0n;
      try {
        try {
          totalTokensBefore = await tournamentManager.getTotalTournaments();
        } catch {
          try {
            totalTokensBefore = await tournamentManager.getTotalPlayerTokens();
            useCreateTournament = false;
          } catch {
            console.log('Could not get total count before transaction');
          }
        }
        console.log('Total tokens before transaction:', totalTokensBefore.toString());
      } catch (e) {
        console.log('Error getting pre-transaction count:', e.message);
      }

      // Execute the transaction - try both functions
      try {
        console.log('Attempting to call createTournament...');
        tx = await tournamentManager.createTournament(
          tournamentName,
          formData.symbol.trim().toUpperCase(),
          parseEther(buyInEth),
          parseInt(formData.totalTokens),
          parseInt(formData.profitSharePercentage)
        );
        useCreateTournament = true;
      } catch (error) {
        console.log('createTournament failed, trying createPlayerToken...', error.message);
        try {
          tx = await tournamentManager.createPlayerToken(
            tournamentName,
            formData.symbol.trim().toUpperCase(),
            parseEther(buyInEth),
            parseInt(formData.totalTokens),
            parseInt(formData.profitSharePercentage)
          );
          useCreateTournament = false;
        } catch (e2) {
          throw new Error(`Both createTournament and createPlayerToken failed. Please verify the contract is deployed correctly. Error: ${e2.message}`);
        }
      }

      toast.loading('Creating tournament token...', { id: 'create-token' });
      
      // Wait for transaction and check status
      let receipt;
      try {
        receipt = await tx.wait();
      } catch (error) {
        console.error('Transaction failed:', error);
        throw new Error('Transaction failed: ' + (error.reason || error.message));
      }
      
      // Check if transaction was successful
      if (receipt.status === 0) {
        throw new Error('Transaction reverted. Please check your inputs and try again.');
      }
      
      console.log('Transaction confirmed:', receipt.hash);
      console.log('Transaction status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
      console.log('Total logs:', receipt.logs?.length || 0);
      console.log('TournamentManager address:', TOURNAMENT_MANAGER_ADDRESS);
      
      let tournamentAddress = null;
      
      // Method 1: Try to get the transaction trace to find contract creation
      // In Hardhat/local networks, we can sometimes get the trace
      console.log('Looking for contract creation in transaction...');
      try {
        // Try to get transaction trace (if available on local network)
        const txHash = receipt.hash;
        try {
          // For local Hardhat node, we can try to get the trace
          const trace = await signer.provider.send('debug_traceTransaction', [txHash, { tracer: 'callTracer' }]);
          console.log('Transaction trace:', trace);
          // Look for contract creation in trace
          if (trace && trace.calls) {
            const findContractCreation = (calls) => {
              for (const call of calls) {
                // Contract creation has 'to' as null and creates a new address
                if (call.type === 'CREATE' || call.type === 'CREATE2') {
                  if (call.output && call.output.length >= 40) {
                    const addr = '0x' + call.output.slice(-40);
                    if (/^0x[a-fA-F0-9]{40}$/.test(addr)) {
                      return addr;
                    }
                  }
                }
                if (call.calls && call.calls.length > 0) {
                  const found = findContractCreation(call.calls);
                  if (found) return found;
                }
              }
              return null;
            };
            const createdAddress = findContractCreation(trace.calls);
            if (createdAddress) {
              tournamentAddress = createdAddress;
              console.log('✅ Found contract creation from transaction trace:', tournamentAddress);
            }
          }
        } catch (traceError) {
          console.log('Could not get transaction trace (may not be available):', traceError.message);
        }
        
        // Also check all log addresses - any new contract will have code
        if (!tournamentAddress) {
          const addressesToCheck = new Set();
          for (const log of receipt.logs || []) {
            if (log.address && log.address.toLowerCase() !== TOURNAMENT_MANAGER_ADDRESS.toLowerCase()) {
              addressesToCheck.add(log.address);
            }
          }
          
          // Check each address to see if it's a contract
          for (const addr of addressesToCheck) {
            try {
              const code = await signer.provider.getCode(addr);
              if (code && code !== '0x') {
                // This is a contract - likely our newly created token
                tournamentAddress = addr;
                console.log('✅ Found contract address from logs:', tournamentAddress);
                break;
              }
            } catch (e) {
              // Continue checking
            }
          }
        }
      } catch (e) {
        console.log('Error checking contract creations:', e.message);
      }
      
      // Method 2: Query contract state to get the newly created token
      // Since we know the count before, we can get the last item after
      if (!tournamentAddress) {
        console.log('Querying contract state to find newly created token...');
        try {
          if (useCreateTournament) {
            try {
              const totalAfter = await tournamentManager.getTotalTournaments();
              console.log('Total tournaments after:', totalAfter.toString());
              if (totalAfter > totalTokensBefore) {
                tournamentAddress = await tournamentManager.tournaments(totalAfter - 1n);
                console.log('✅ Found address by querying tournaments array:', tournamentAddress);
              }
            } catch (e) {
              console.log('Could not query tournaments array:', e.message);
            }
          }
          
          // Try playerTokens as fallback
          if (!tournamentAddress) {
            try {
              const totalAfter = await tournamentManager.getTotalPlayerTokens();
              console.log('Total player tokens after:', totalAfter.toString());
              if (totalAfter > totalTokensBefore) {
                tournamentAddress = await tournamentManager.playerTokens(totalAfter - 1n);
                console.log('✅ Found address by querying playerTokens array:', tournamentAddress);
              }
            } catch (e) {
              console.log('Could not query playerTokens array:', e.message);
            }
          }
        } catch (queryError) {
          console.error('Error querying contract state:', queryError);
        }
      }
      
      // Method 2: Try to extract from logs if we have them
      if (!tournamentAddress && receipt.logs && receipt.logs.length > 0) {
        console.log('Trying to extract address from transaction logs...');
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === TOURNAMENT_MANAGER_ADDRESS.toLowerCase()) {
            try {
              const parsed = tournamentManager.interface.parseLog(log);
              if (parsed) {
                if (parsed.name === 'TournamentCreated' && parsed.args.tournamentAddress) {
                  tournamentAddress = parsed.args.tournamentAddress;
                  console.log('✅ Found TournamentCreated event:', tournamentAddress);
                  break;
                } else if (parsed.name === 'PlayerTokenCreated' && parsed.args.playerTokenAddress) {
                  tournamentAddress = parsed.args.playerTokenAddress;
                  console.log('✅ Found PlayerTokenCreated event:', tournamentAddress);
                  break;
                }
              }
            } catch (e) {
              // Try manual extraction from topics
              if (log.topics && log.topics.length >= 2 && log.topics[1]) {
                const possibleAddress = '0x' + log.topics[1].slice(-40).toLowerCase();
                if (/^0x[a-fA-F0-9]{40}$/.test(possibleAddress) && possibleAddress !== '0x0000000000000000000000000000000000000000') {
                  tournamentAddress = possibleAddress;
                  console.log('✅ Extracted address from log topic:', tournamentAddress);
                  break;
                }
              }
            }
          }
        }
      }
      
      // If still no address, provide helpful error message
      if (!tournamentAddress) {
        const errorMsg = `Transaction succeeded but address could not be retrieved.
        
The transaction was successful (hash: ${receipt.hash}) but we couldn't find the token address.

Possible causes:
1. The contract functions (getTotalTournaments/getTotalPlayerTokens) don't exist or return empty data
2. Events are not being emitted
3. The contract address (${TOURNAMENT_MANAGER_ADDRESS}) might be incorrect

Please check:
- Verify the contract is deployed at ${TOURNAMENT_MANAGER_ADDRESS}
- Check if the contract has the createTournament or createPlayerToken function
- Verify the contract emits events when creating tokens

You can check the transaction on a block explorer: ${receipt.hash}`;
        
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Log all receipt logs for debugging
      if (receipt.logs && receipt.logs.length > 0) {
        console.log('=== ALL RECEIPT LOGS ===');
        receipt.logs.forEach((log, index) => {
          console.log(`Log ${index}:`, {
            address: log.address,
            addressMatches: log.address.toLowerCase() === TOURNAMENT_MANAGER_ADDRESS.toLowerCase(),
            topicsCount: log.topics?.length || 0,
            firstTopic: log.topics?.[0] || 'none',
            secondTopic: log.topics?.[1] || 'none',
            dataLength: log.data?.length || 0
          });
        });
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
        console.log('All receipt logs:', receipt.logs.map(log => ({
          address: log.address,
          topicsCount: log.topics?.length || 0,
          topics: log.topics?.slice(0, 3) || [],
          dataLength: log.data?.length || 0
        })));
        
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
        
        // Also check logs from other addresses (contract creation logs)
        if (!tournamentAddress) {
          console.log('Checking all logs for contract addresses...');
          for (const log of receipt.logs) {
            // Look for any log with at least 2 topics where topic[1] might be an address
            if (log.topics && log.topics.length >= 2 && log.topics[1]) {
              const possibleAddress = '0x' + log.topics[1].slice(-40).toLowerCase();
              if (/^0x[a-fA-F0-9]{40}$/.test(possibleAddress) && possibleAddress !== '0x0000000000000000000000000000000000000000') {
                // Check if this address is a contract (has code)
                try {
                  const code = await signer.provider.getCode(possibleAddress);
                  if (code && code !== '0x') {
                    tournamentAddress = possibleAddress;
                    console.log('Found contract address from log (verified has code):', tournamentAddress);
                    break;
                  }
                } catch (e) {
                  // Continue checking other logs
                }
              }
            }
          }
        }
      }

      // Method 2: Try to get from creator's tokens array (if functions exist)
      if (!tournamentAddress) {
        console.log('Event parsing failed, trying to get from creator array...');
        try {
          // Get the user's account address
          const userAddress = await signer.getAddress();
          
          // Try getCreatorTournaments first (only if it exists in contract)
          try {
            // Check if function exists by trying to call it
            const creatorTournaments = await tournamentManager.getCreatorTournaments(userAddress);
            if (creatorTournaments && Array.isArray(creatorTournaments) && creatorTournaments.length > 0) {
              tournamentAddress = creatorTournaments[creatorTournaments.length - 1];
              console.log('Found from getCreatorTournaments:', tournamentAddress);
            }
          } catch (e) {
            // Silently skip if function doesn't exist
            console.log('getCreatorTournaments not available:', e.message);
            // Try getPlayerTokens
            try {
              const playerTokens = await tournamentManager.getPlayerTokens(userAddress);
              if (playerTokens && Array.isArray(playerTokens) && playerTokens.length > 0) {
                tournamentAddress = playerTokens[playerTokens.length - 1];
                console.log('Found from getPlayerTokens:', tournamentAddress);
              }
            } catch (e2) {
              // Silently skip if function doesn't exist
              console.log('getPlayerTokens not available:', e2.message);
            }
          }
        } catch (e) {
          console.log('Could not get from creator array (functions may not exist):', e.message);
        }
      }

      // Method 3: Try to get from active tournaments array (if functions exist)
      if (!tournamentAddress) {
        console.log('Creator array failed, trying active tournaments array...');
        try {
          if (useCreateTournament) {
            try {
              const tournamentsArray = await tournamentManager.getActiveTournaments();
              if (tournamentsArray && Array.isArray(tournamentsArray) && tournamentsArray.length > 0) {
                tournamentAddress = tournamentsArray[tournamentsArray.length - 1];
                console.log('Found from getActiveTournaments:', tournamentAddress);
              }
            } catch (e) {
              console.log('getActiveTournaments not available:', e.message);
            }
          } else {
            try {
              const playerTokensArray = await tournamentManager.getActivePlayerTokens();
              if (playerTokensArray && Array.isArray(playerTokensArray) && playerTokensArray.length > 0) {
                tournamentAddress = playerTokensArray[playerTokensArray.length - 1];
                console.log('Found from getActivePlayerTokens:', tournamentAddress);
              }
            } catch (e) {
              console.log('getActivePlayerTokens not available:', e.message);
            }
          }
        } catch (e) {
          console.log('Could not get from active array:', e.message);
        }
      }

      // Method 4: Try to get by index (last resort - only if functions exist)
      if (!tournamentAddress) {
        console.log('Active array failed, trying by index...');
        try {
          if (useCreateTournament) {
            try {
              const totalCount = await tournamentManager.getTotalTournaments();
              console.log('Total tournaments:', totalCount.toString());
              if (totalCount && totalCount > 0n) {
                tournamentAddress = await tournamentManager.tournaments(totalCount - 1n);
                console.log('Found from tournaments array by index:', tournamentAddress);
              }
            } catch (e) {
              console.log('getTotalTournaments/tournaments not available:', e.message);
            }
          } else {
            try {
              const totalCount = await tournamentManager.getTotalPlayerTokens();
              console.log('Total player tokens:', totalCount.toString());
              if (totalCount && totalCount > 0n) {
                tournamentAddress = await tournamentManager.playerTokens(totalCount - 1n);
                console.log('Found from playerTokens array by index:', tournamentAddress);
              }
            } catch (e) {
              console.log('getTotalPlayerTokens/playerTokens not available:', e.message);
            }
          }
        } catch (e) {
          console.log('Could not get by index:', e.message);
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
