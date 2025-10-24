import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getTournamentManagerContract, parseEther } from '../utils/contracts';
import toast from 'react-hot-toast';

const CreateTournament = ({ onTournamentCreated }) => {
  const { signer, TOURNAMENT_MANAGER_ADDRESS, isConnected } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    buyInAmount: '',
    totalTokens: '',
    profitSharePercentage: '80'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!signer) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);

      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Tournament name is required');
      }
      if (!formData.symbol.trim()) {
        throw new Error('Tournament symbol is required');
      }
      if (!formData.buyInAmount || parseFloat(formData.buyInAmount) <= 0) {
        throw new Error('Buy-in amount must be greater than 0');
      }
      if (!formData.totalTokens || parseInt(formData.totalTokens) <= 0) {
        throw new Error('Total tokens must be greater than 0');
      }
      if (parseInt(formData.profitSharePercentage) < 0 || parseInt(formData.profitSharePercentage) > 100) {
        throw new Error('Profit share percentage must be between 0 and 100');
      }

      const tournamentManager = getTournamentManagerContract(TOURNAMENT_MANAGER_ADDRESS, signer);

      const tx = await tournamentManager.createTournament(
        formData.name.trim(),
        formData.symbol.trim().toUpperCase(),
        parseEther(formData.buyInAmount),
        parseInt(formData.totalTokens),
        parseInt(formData.profitSharePercentage)
      );

      toast.loading('Creating tournament...', { id: 'create-tournament' });
      
      const receipt = await tx.wait();
      
      // Find the TournamentCreated event
      const event = receipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = tournamentManager.interface.parseLog(event);
        const tournamentAddress = parsedEvent.args.tournamentAddress;
        
        toast.success('Tournament created successfully!', { id: 'create-tournament' });
        
        // Reset form
        setFormData({
          name: '',
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
        throw new Error('Failed to get tournament address from transaction');
      }

    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error(error.message || 'Failed to create tournament', { id: 'create-tournament' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '24px', color: '#333' }}>Create New Tournament</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Tournament Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., World Series of Poker"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="symbol">
            Token Symbol *
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            className="form-input"
            value={formData.symbol}
            onChange={handleInputChange}
            placeholder="e.g., WSOP"
            maxLength="10"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="buyInAmount">
            Buy-in Amount (ETH) *
          </label>
          <input
            type="number"
            id="buyInAmount"
            name="buyInAmount"
            className="form-input"
            value={formData.buyInAmount}
            onChange={handleInputChange}
            placeholder="1.0"
            step="0.01"
            min="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="totalTokens">
            Total Tokens *
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
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="profitSharePercentage">
            Profit Share Percentage *
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
          <small className="text-muted">
            Percentage of winnings to share with token holders (0-100%)
          </small>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !isConnected}
          style={{ width: '100%', marginTop: '16px' }}
        >
          {isLoading ? (
            <>
              <div className="loading"></div>
              Creating Tournament...
            </>
          ) : (
            'Create Tournament'
          )}
        </button>

        {!isConnected && (
          <p className="text-muted text-center" style={{ marginTop: '16px' }}>
            Please connect your wallet to create a tournament
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateTournament;
