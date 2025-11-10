import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import { PeraWalletConnect } from '@perawallet/connect';
import { Buffer } from 'buffer';
import contractUtils from '../utils/contractUtils';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

const WalletContext = createContext();

const ADDRESS_REGEX = /^[A-Z2-7]{58}$/;

const toBytes = (value) => {
  if (!value) return undefined;

  if (value.type === 'Buffer' && Array.isArray(value.data)) {
    return new Uint8Array(value.data);
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }

  if (value instanceof Uint8Array) {
    return value;
  }

  if (typeof value === 'object' && value.buffer instanceof ArrayBuffer) {
    return new Uint8Array(value.buffer);
  }

  if (typeof value === 'string') {
    if (ADDRESS_REGEX.test(value)) {
      try {
        return algosdk.decodeAddress(value).publicKey;
      } catch (err) {
        console.warn('[wallet] Failed to decode address string:', err);
      }
    }

    try {
      return Uint8Array.from(Buffer.from(value, 'base64'));
    } catch (err) {
      console.warn('[wallet] Failed to decode base64 string:', err);
    }
  }

  return value;
};

const instantiateTxnIfPossible = (txnLike) => {
  if (!txnLike || typeof txnLike !== 'object') {
    return null;
  }

  if (typeof txnLike.get_obj_for_encoding === 'function') {
    return txnLike;
  }

  if (typeof algosdk.Transaction === 'function') {
    try {
      return new algosdk.Transaction(txnLike);
    } catch (err) {
      console.warn('[wallet] Failed to instantiate transaction via Transaction constructor:', err);
    }
  }

  return null;
};

const buildEncodingObject = (txnLike) => {
  if (!txnLike || typeof txnLike !== 'object') {
    throw new Error('Invalid transaction payload received from wallet.');
  }

  if (typeof txnLike.get_obj_for_encoding === 'function') {
    return txnLike.get_obj_for_encoding();
  }

  const obj = {};

  const type =
    txnLike.type ||
    (txnLike.tag ? Buffer.from(toBytes(txnLike.tag) || []).toString() : undefined);

  if (!type) {
    throw new Error('Transaction type missing from wallet payload.');
  }

  obj.type = type;

  const snd = toBytes(txnLike.snd || txnLike.from?.publicKey);
  if (snd) obj.snd = snd;

  const rcv = toBytes(txnLike.rcv || txnLike.to?.publicKey);
  if (rcv) obj.rcv = rcv;

  const fee = txnLike.fee ?? txnLike.fee ?? txnLike.fe;
  if (fee !== undefined) obj.fee = fee;

  const fv = txnLike.fv ?? txnLike.firstRound;
  if (fv !== undefined) obj.fv = fv;

  const lv = txnLike.lv ?? txnLike.lastRound;
  if (lv !== undefined) obj.lv = lv;

  const gh = toBytes(txnLike.gh || txnLike.genesisHash);
  if (gh) obj.gh = gh;

  const gen = txnLike.gen || txnLike.genesisID;
  if (gen) obj.gen = gen;

  const grp = toBytes(txnLike.grp || txnLike.group);
  if (grp && grp.length > 0) obj.grp = grp;

  const lx = toBytes(txnLike.lx || txnLike.lease);
  if (lx && lx.length > 0) obj.lx = lx;

  const note = toBytes(txnLike.note);
  if (note && note.length > 0) obj.note = note;

  const amt = txnLike.amt ?? txnLike.amount;
  if (amt !== undefined) obj.amt = amt;

  if (Array.isArray(txnLike.appArgs)) {
    obj.apaa = txnLike.appArgs.map(toBytes);
  } else if (Array.isArray(txnLike.apaa)) {
    obj.apaa = txnLike.apaa.map(toBytes);
  }

  if (Array.isArray(txnLike.appAccounts)) {
    obj.apat = txnLike.appAccounts.map((account) => {
      if (account?.publicKey) {
        return toBytes(account.publicKey);
      }
      if (typeof account === 'string') {
        return toBytes(account);
      }
      return toBytes(account);
    });
  } else if (Array.isArray(txnLike.apat)) {
    obj.apat = txnLike.apat.map(toBytes);
  }

  if (txnLike.appIndex !== undefined) {
    obj.apid = txnLike.appIndex;
  } else if (txnLike.apid !== undefined) {
    obj.apid = txnLike.apid;
  }

  if (txnLike.appOnComplete !== undefined) {
    obj.apan = txnLike.appOnComplete;
  } else if (txnLike.apan !== undefined) {
    obj.apan = txnLike.apan;
  }

  return obj;
};

const encodeUnsignedTxnToBase64 = (txn) => {
  if (!txn) {
    throw new Error('Attempted to encode an empty transaction.');
  }

  const instantiatedTxn = instantiateTxnIfPossible(txn);

  console.log('[wallet] encodeUnsignedTxnToBase64: received payload', {
    type: typeof txn,
    isArray: Array.isArray(txn),
    hasTxn: txn && typeof txn === 'object' && ('txn' in txn || '_txn' in txn || 'transaction' in txn),
    keys: txn && typeof txn === 'object' ? Object.keys(txn) : null,
    sample: txn && typeof txn === 'object' ? JSON.parse(JSON.stringify(txn, (_, value) => (typeof value === 'bigint' ? Number(value) : value))) : txn,
  });

  try {
    if (txn instanceof Uint8Array) {
      return Buffer.from(txn).toString('base64');
    }

    if (instantiatedTxn) {
      const txnBytes = algosdk.encodeUnsignedTransaction(instantiatedTxn);
      return Buffer.from(txnBytes).toString('base64');
    }

    if (typeof txn === 'string') {
      return txn;
    }

    const encodingObject = buildEncodingObject(txn);

    console.debug('[wallet] encodeUnsignedTxnToBase64: encoding object', {
      keys: Object.keys(encodingObject),
    });

    const txnBytes = algosdk.encodeObj(encodingObject);
    return Buffer.from(txnBytes).toString('base64');
  } catch (error) {
    console.error('[wallet] encodeUnsignedTxnToBase64: failed to encode transaction', {
      error,
    });
    throw error;
  }
};

const normalizeSignedTxn = (signedTxn) => {
  if (!signedTxn) {
    throw new Error('Signed transaction payload is empty.');
  }

  if (signedTxn instanceof Uint8Array) {
    return signedTxn;
  }

  if (Array.isArray(signedTxn) && signedTxn.length > 0) {
    return normalizeSignedTxn(signedTxn[0]);
  }

  if (signedTxn.blob) {
    return Uint8Array.from(Buffer.from(signedTxn.blob, 'base64'));
  }

  if (typeof signedTxn === 'string') {
    return Uint8Array.from(Buffer.from(signedTxn, 'base64'));
  }

  if (signedTxn.signedTxn) {
    return Uint8Array.from(Buffer.from(signedTxn.signedTxn, 'base64'));
  }

  throw new Error('Unsupported signed transaction format returned by wallet.');
};

const peraWallet = new PeraWalletConnect({
  chainId: 416002, // TestNet chain ID (416001 for MainNet)
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contractState, setContractState] = useState(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);

  // Algorand TestNet configuration
  const algodClient = new algosdk.Algodv2(
    '',
    'https://testnet-api.algonode.cloud',
    ''
  );

  // Check for reconnection on mount
  useEffect(() => {
    // Check if Pera Wallet was previously connected
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          console.log('Pera Wallet reconnected:', accounts[0]);
        }
      })
      .catch((error) => {
        console.log('Pera Wallet not previously connected');
      });
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      console.log('Initializing Pera Wallet connection...');

      const accounts = await peraWallet.connect();
      console.log('Pera Wallet returned accounts:', accounts);
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        console.log('✅ Pera Wallet connected successfully:', accounts[0]);
        
        peraWallet.connector?.on('disconnect', () => {
          console.log('Pera Wallet disconnected');
          disconnectWallet();
        });
        
        return;
      }
      
      throw new Error('Failed to connect wallet. Please try again.');
      
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      
      // User-friendly error messages
      if (error.message && error.message.includes('rejected')) {
        alert('Connection was cancelled. Please try again.');
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };


  const disconnectWallet = async () => {
    try {
      await peraWallet.disconnect();
      
      setAccount(null);
      setIsConnected(false);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const signTransactionGroup = useCallback(
    async (txns) => {
      if (!isConnected) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      console.log('Signing transaction group with', txns.length, 'transactions');

      try {
        const peraPayload = txns.map((txn) => ({
          txn: encodeUnsignedTxnToBase64(txn),
          signers: [account],
        }));

        const signedGroups = await peraWallet.signTransaction([peraPayload]);

        if (!signedGroups || signedGroups.length === 0) {
          throw new Error('Failed to sign transaction group with Pera Wallet.');
        }

        return signedGroups.flat().map(normalizeSignedTxn);
      } catch (error) {
        console.error('Failed to sign transaction group:', error);

        if (error.message && error.message.includes('User Rejected Request')) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('rejected')) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('SignTxnsError')) {
          throw new Error('Failed to sign transaction. Please check your wallet connection.');
        }

        throw error;
      }
    },
    [account, isConnected]
  );

  const signTransaction = useCallback(
    async (txn) => {
      const signedGroup = await signTransactionGroup([txn]);
      if (!signedGroup || signedGroup.length === 0) {
        throw new Error('Wallet did not return a signed transaction.');
      }
      return signedGroup[0];
    },
    [signTransactionGroup]
  );

  const getAccountInfo = async () => {
    if (!account) return null;
    
    try {
      const accountInfo = await algodClient.accountInformation(account).do();
      return accountInfo;
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  };

  // Smart contract functions
  const loadContractState = useCallback(async () => {
    if (!contractUtils.getAppId()) {
      console.warn('Contract app ID not set');
      return null;
    }

    try {
      setIsLoadingContract(true);
      const state = await contractUtils.getCurrentBounty();
      setContractState(state);
      return state;
    } catch (error) {
      console.error('Failed to load contract state:', error);
      setContractState(null);
      return null;
    } finally {
      setIsLoadingContract(false);
    }
  }, []);

  useEffect(() => {
    loadContractState();
  }, [loadContractState]);

  useEffect(() => {
    if (isConnected) {
      loadContractState();
    }
  }, [isConnected, loadContractState]);

  const createBounty = async (amount, deadline, taskDescription, verifierAddress) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txns = await contractUtils.createBounty(
        account,
        amount,
        deadline,
        taskDescription,
        verifierAddress
      );

      // Sign transaction group
      const signedTxns = await signTransactionGroup(txns);

      // Submit transaction group
      const txId = await contractUtils.submitTransactionGroup(signedTxns);
      
      // Wait for confirmation
      await contractUtils.waitForConfirmation(txId);
      
      // Reload contract state
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to create bounty:', error);
      
      // Provide user-friendly error messages
      if (error.message && error.message.includes('User Rejected Request')) {
        throw new Error('Transaction was cancelled. Please try again and approve the transaction in your wallet.');
      } else if (error.message && error.message.includes('SignTxnsError')) {
        throw new Error('Failed to sign transaction. Please check your wallet connection and try again.');
      } else {
        throw error;
      }
    }
  };

  const acceptBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.acceptBounty(account);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to accept bounty:', error);
      throw error;
    }
  };

  const approveBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.approveBounty(account);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to approve bounty:', error);
      throw error;
    }
  };

  const claimBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.claimBounty(account);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to claim bounty:', error);
      throw error;
    }
  };

  const refundBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.refundBounty(account);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to refund bounty:', error);
      throw error;
    }
  };

  const canPerformAction = (action) => {
    if (!account || !contractState) return false;
    return contractUtils.canPerformAction(account, action, contractState);
  };

  const value = {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    signTransaction,
    signTransactionGroup,
    getAccountInfo,
    algodClient,
    // Smart contract functions
    contractState,
    isLoadingContract,
    loadContractState,
    createBounty,
    acceptBounty,
    approveBounty,
    claimBounty,
    refundBounty,
    canPerformAction
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
