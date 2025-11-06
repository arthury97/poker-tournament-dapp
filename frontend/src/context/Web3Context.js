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
  const [balance, setBalance] = useState(null);

  // Contract addresses (update these after deployment)
  // Sepolia deployment: 0x5c4606b4F7b327Bd2996A0BCB5d5578dA2427138
  // Localhost: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  const TOURNAMENT_MANAGER_ADDRESS = process.env.REACT_APP_TOURNAMENT_MANAGER_ADDRESS || '0x5c4606b4F7b327Bd2996A0BCB5d5578dA2427138';

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider();
      if (ethereumProvider) {
        const accounts = await ethereumProvider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          // Auto-detect wallet type for reconnection
          let walletType = 'metamask'; // Default
          if (window.ethereum) {
            if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
              // Multiple wallets - check which one has connected accounts
              const coinbaseProvider = window.ethereum.providers.find(p => p.isCoinbaseWallet);
              if (coinbaseProvider) {
                try {
                  const coinbaseAccounts = await coinbaseProvider.request({ method: 'eth_accounts' });
                  if (coinbaseAccounts.length > 0) {
                    walletType = 'coinbase';
                  }
                } catch {
                  // Use default
                }
              }
            } else if (window.ethereum.isCoinbaseWallet) {
              walletType = 'coinbase';
            }
          }
          await connectWallet(walletType);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectWallet = async (walletType = 'metamask') => {
    try {
      setIsLoading(true);
      let ethereumProvider = null;

      // Detect available providers
      if (typeof window !== 'undefined' && window.ethereum) {
        // Check if multiple providers are available (browser extension wallets)
        if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
          // Multiple wallets installed
          if (walletType === 'metamask') {
            ethereumProvider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
          } else if (walletType === 'coinbase') {
            ethereumProvider = window.ethereum.providers.find(p => p.isCoinbaseWallet) || window.ethereum;
          } else {
            ethereumProvider = window.ethereum;
          }
        } else {
          // Single provider or legacy MetaMask
          ethereumProvider = window.ethereum;
          
          // Verify it's the correct wallet type if requested
          if (walletType === 'metamask' && !ethereumProvider.isMetaMask) {
            throw new Error('MetaMask not found. Please install MetaMask or select Coinbase Wallet.');
          }
          if (walletType === 'coinbase' && !ethereumProvider.isCoinbaseWallet) {
            throw new Error('Coinbase Wallet not found. Please install Coinbase Wallet or select MetaMask.');
          }
        }
      } else {
        // Try to detect provider
        ethereumProvider = await detectEthereumProvider();
        
        if (!ethereumProvider) {
          throw new Error('No wallet found. Please install MetaMask or Coinbase Wallet!');
        }
      }

      if (!ethereumProvider) {
        throw new Error(`Please install ${walletType === 'metamask' ? 'MetaMask' : 'Coinbase Wallet'}!`);
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
      
      // Fetch balance
      const balance = await provider.getBalance(accounts[0]);
      setBalance(balance);

      // Listen for account changes
      ethereumProvider.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          // Update balance for new account
          const currentProvider = new ethers.BrowserProvider(ethereumProvider);
          const newBalance = await currentProvider.getBalance(accounts[0]);
          setBalance(newBalance);
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
    setBalance(null);
  };
  
  // Update balance when account changes
  useEffect(() => {
    const updateBalance = async () => {
      if (provider && account) {
        try {
          const newBalance = await provider.getBalance(account);
          setBalance(newBalance);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };
    
    updateBalance();
    // Update balance every 10 seconds
    const interval = setInterval(updateBalance, 10000);
    
    return () => clearInterval(interval);
  }, [provider, account]);

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

  const switchToMainnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // Ethereum Mainnet
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://etherscan.io/'],
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

  const switchNetwork = async (targetChainId) => {
    if (targetChainId === '1' || targetChainId === '0x1') {
      await switchToMainnet();
    } else if (targetChainId === '11155111' || targetChainId === '0xaa36a7') {
      await switchToSepolia();
    }
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnected,
    isLoading,
    balance,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    switchToMainnet,
    switchNetwork,
    TOURNAMENT_MANAGER_ADDRESS,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
