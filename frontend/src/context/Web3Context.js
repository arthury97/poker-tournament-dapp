import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Contract addresses (update these after deployment)
  const TOURNAMENT_MANAGER_ADDRESS = process.env.REACT_APP_TOURNAMENT_MANAGER_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider();
      if (ethereumProvider) {
        const accounts = await ethereumProvider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const ethereumProvider = await detectEthereumProvider();
      
      if (!ethereumProvider) {
        throw new Error('Please install MetaMask!');
      }

      const accounts = await ethereumProvider.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId.toString());
      setIsConnected(true);

      // Listen for account changes
      ethereumProvider.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      // Listen for chain changes
      ethereumProvider.on('chainChanged', (chainId) => {
        setChainId(chainId);
        window.location.reload();
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia testnet
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'SepoliaETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
        } catch (addError) {
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    TOURNAMENT_MANAGER_ADDRESS,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
