import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import apiService from '../utils/api';
import contractUtils, { GLOBAL_STATE_KEYS } from '../utils/contractUtils';

const statusStyles = {
  open: { label: 'Open', badge: 'bg-gradient-to-r from-secondary-400/25 to-secondary-500/40 text-secondary-100 border border-secondary-300/40' },
  accepted: { label: 'Accepted', badge: 'bg-gradient-to-r from-primary-500/20 to-primary-600/40 text-primary-100 border border-primary-300/40' },
  approved: { label: 'Approved', badge: 'bg-gradient-to-r from-accent-400/25 to-accent-500/45 text-accent-50 border border-accent-300/40' },
  claimed: { label: 'Claimed', badge: 'bg-white/10 text-white/80 border border-white/20' },
  refunded: { label: 'Refunded', badge: 'bg-red-500/20 text-red-100 border border-red-400/40' },
  rejected: { label: 'Rejected', badge: 'bg-orange-500/20 text-orange-100 border border-orange-400/40' },
};

const filters = [
  { id: 'all', label: 'All states' },
  { id: 'open', label: 'Open' },
  { id: 'accepted', label: 'In Progress' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const BountyList = () => {
  const { account, isConnected, acceptBounty } = useWallet();
  const navigate = useNavigate();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [acceptingBountyId, setAcceptingBountyId] = useState(null);

  // Add a refresh function that can be called from outside
  const refreshBounties = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Refreshing bounties...');
      
      const response = await apiService.getBounties({
        status: filter !== 'all' ? filter : undefined,
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      let bountiesArray = [];
      if (response && Array.isArray(response.bounties)) {
        bountiesArray = response.bounties;
      } else if (Array.isArray(response)) {
        bountiesArray = response;
      } else if (response && response.value && Array.isArray(response.value)) {
        bountiesArray = response.value;
      } else if (response && response.data && Array.isArray(response.data)) {
        bountiesArray = response.data;
      }

      const transformedBounties = bountiesArray.map((bounty, index) => {
        let displayId = bounty.contractId;
        if (displayId === null || displayId === undefined || displayId === '') {
          displayId = bounty.id || bounty._id || `db-${index}`;
        }
        
        return {
          id: String(displayId),
          contractId: bounty.contractId ? String(bounty.contractId) : null,
          databaseId: bounty.id || bounty._id,
          title: bounty.title || 'Untitled Bounty',
          description: bounty.description || '',
          amount: typeof bounty.amount === 'number' ? bounty.amount : parseFloat(bounty.amount) || 0,
          deadline: bounty.deadline,
          status: (bounty.status || 'open').toLowerCase(),
          client: bounty.clientAddress || bounty.client_address,
          freelancer: bounty.freelancerAddress || bounty.freelancer_address,
          verifier: bounty.verifierAddress || bounty.verifier_address,
          createdAt: bounty.createdAt || bounty.created_at || new Date().toISOString(),
        };
      });

      setBounties(transformedBounties);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error refreshing bounties:', error);
      setError(`Failed to refresh bounties: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let isMounted = true;

    const fetchBounties = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔍 Fetching all bounties with filter:', filter);
        
        // Fetch bounties from backend API
        const response = await apiService.getBounties({
          status: filter !== 'all' ? filter : undefined,
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        console.log('📥 Raw API response:', {
          response,
          responseType: typeof response,
          hasBounties: !!response.bounties,
          bountiesIsArray: Array.isArray(response.bounties),
          responseIsArray: Array.isArray(response)
        });

        if (!isMounted) return;

        // Ensure response has bounties array - handle multiple response formats
        let bountiesArray = [];
        if (response && Array.isArray(response.bounties)) {
          bountiesArray = response.bounties;
          console.log('✅ Found bounties in response.bounties:', bountiesArray.length);
        } else if (Array.isArray(response)) {
          bountiesArray = response;
          console.log('✅ Response is directly an array:', bountiesArray.length);
        } else if (response && response.value && Array.isArray(response.value)) {
          bountiesArray = response.value;
          console.log('✅ Found bounties in response.value:', bountiesArray.length);
        } else if (response && response.data && Array.isArray(response.data)) {
          bountiesArray = response.data;
          console.log('✅ Found bounties in response.data:', bountiesArray.length);
        } else {
          console.warn('⚠️ Response format unexpected:', {
            response,
            responseType: typeof response,
            hasBounties: !!response?.bounties,
            bountiesIsArray: Array.isArray(response?.bounties),
            responseIsArray: Array.isArray(response)
          });
          bountiesArray = [];
        }
        
        console.log('📋 Bounties array before transformation:', {
          count: bountiesArray.length,
          bounties: bountiesArray
        });
        
        // Transform API response to match component's expected format
        const transformedBounties = bountiesArray.map((bounty, index) => {
          // Handle contractId - it might be a number, string, or missing
          // Use contractId if available, otherwise use database id
          let displayId = bounty.contractId;
          if (displayId === null || displayId === undefined || displayId === '') {
            // Use the database ID as fallback for display
            displayId = bounty.id || bounty._id || `db-${index}`;
          }
          
          return {
            id: String(displayId), // Use contractId for ID if available, otherwise database id
            contractId: bounty.contractId ? String(bounty.contractId) : null, // Store contractId separately
            databaseId: bounty.id || bounty._id, // Store database ID separately
            title: bounty.title || 'Untitled Bounty',
            description: bounty.description || '',
            amount: typeof bounty.amount === 'number' ? bounty.amount : parseFloat(bounty.amount) || 0,
            deadline: bounty.deadline,
            status: (bounty.status || 'open').toLowerCase(), // Normalize status to lowercase
            client: bounty.clientAddress || bounty.client_address,
            freelancer: bounty.freelancerAddress || bounty.freelancer_address,
            verifier: bounty.verifierAddress || bounty.verifier_address,
            createdAt: bounty.createdAt || bounty.created_at || new Date().toISOString(),
          };
        });

        console.log('✅ Transformed bounties for display:', {
          count: transformedBounties.length,
          bounties: transformedBounties
        });
        
        // Ensure we have valid bounties array
        if (!Array.isArray(transformedBounties)) {
          console.error('❌ CRITICAL: transformedBounties is not an array!', transformedBounties);
          transformedBounties = [];
        }
        
        console.log('💾 Setting bounties state with', transformedBounties.length, 'bounties');
        console.log('💾 Bounties to set:', transformedBounties.map(b => ({ 
          id: b.id, 
          contractId: b.contractId, 
          title: b.title, 
          status: b.status 
        })));
        
        if (isMounted) {
          setBounties(transformedBounties);
          
          // Log after a short delay to see if state was set
          setTimeout(() => {
            console.log('🔍 State check after setBounties - bounties count:', transformedBounties.length);
          }, 100);
        }
      } catch (error) {
        console.error('❌ Error loading bounties:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        });
        if (isMounted) {
          setError(`Failed to load bounties: ${error.message || 'Unknown error'}. Please check the console for details.`);
          setBounties([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBounties();

    return () => {
      isMounted = false;
    };
  }, [filter]);

  // Refresh bounties when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, refreshing bounties...');
        refreshBounties();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh on focus (user switches back to tab)
    window.addEventListener('focus', refreshBounties);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshBounties);
    };
  }, [refreshBounties]);

  const filteredBounties = useMemo(() => {
    console.log('🔄 Filtering bounties:', {
      filter,
      totalBounties: bounties.length,
      bounties: bounties.map(b => ({ id: b.id, status: b.status, title: b.title })),
      bountiesIsArray: Array.isArray(bounties),
      bountiesType: typeof bounties
    });
    
    // Ensure bounties is an array
    if (!Array.isArray(bounties)) {
      console.error('❌ CRITICAL: bounties is not an array!', { bounties, type: typeof bounties });
      return [];
    }
    
    let result;
    if (filter === 'all') {
      result = bounties;
      console.log('✅ Filter is "all", returning all', result.length, 'bounties');
    } else {
      // Case-insensitive status comparison
      const filterStatus = filter.toLowerCase();
      result = bounties.filter((bounty) => {
        const bountyStatus = (bounty.status || 'open').toLowerCase();
        const matches = bountyStatus === filterStatus;
        if (!matches) {
          console.log(`❌ Bounty ${bounty.id} (${bounty.title}) status "${bountyStatus}" doesn't match filter "${filterStatus}"`);
        }
        return matches;
      });
      console.log('✅ Filter is', filter, ', returning', result.length, 'bounties out of', bounties.length);
    }
    
    console.log('📋 Filtered bounties result:', {
      count: result.length,
      bounties: result.map(b => ({ id: b.id, status: b.status, title: b.title })),
      isArray: Array.isArray(result)
    });
    return result;
  }, [bounties, filter]);

  const formatDate = (value) => {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

  const handleAcceptBounty = async (bounty) => {
    console.log('🚀 handleAcceptBounty called with:', bounty);
    console.log('🚀 Current state:', { isConnected, account, acceptingBountyId });
    
    if (!isConnected || !account) {
      console.warn('⚠️ Wallet not connected');
      alert('Please connect your wallet first');
      return;
    }

    if (account === bounty.client) {
      console.warn('⚠️ User trying to accept their own bounty');
      alert('You cannot accept your own bounty');
      return;
    }

    // Use contractId for API call, fallback to databaseId or id
    const apiBountyId = bounty.contractId || bounty.databaseId || bounty.id;
    if (!apiBountyId) {
      alert('Bounty ID is missing. Please refresh the page.');
      return;
    }

    // Contract requires numeric contractId
    // If missing, try to get it from contract state
    let contractBountyId = bounty.contractId ? parseInt(bounty.contractId) : null;
    let hasValidContractId = contractBountyId !== null && !isNaN(contractBountyId);
    
    if (!hasValidContractId) {
      console.log('⚠️ Bounty missing contract ID, attempting to fetch from contract state...');
      console.log('[BountyList] Bounty data:', {
        id: bounty.id,
        contractId: bounty.contractId,
        transactionId: bounty.transactionId || bounty.createTransactionId,
        client: bounty.client || bounty.clientAddress,
        amount: bounty.amount
      });
      
      try {
        let foundBountyId = null;
        
        // First, try to list all boxes to see what exists
        const allBoxes = await contractUtils.listAllBountyBoxes();
        console.log(`[BountyList] Found ${allBoxes.length} boxes on-chain`);
        
        if (allBoxes.length > 0) {
          // Try to match by client address and amount
          const bountyClient = (bounty.client || bounty.clientAddress || bounty.client_address || '').toUpperCase().trim();
          const bountyAmount = Math.round(parseFloat(bounty.amount || 0) * 1000000);
          
          console.log(`[BountyList] Searching ${allBoxes.length} existing boxes for match...`);
          console.log(`[BountyList] Looking for: client=${bountyClient}, amount=${bountyAmount} microAlgos`);
          
          for (const boxBounty of allBoxes) {
            const boxClient = (boxBounty.clientAddress || '').toUpperCase().trim();
            const boxAmount = Math.round(parseFloat(boxBounty.amount || 0) * 1000000);
            const amountDiff = Math.abs(bountyAmount - boxAmount);
            const clientMatch = boxClient === bountyClient;
            const amountMatch = amountDiff < 1000; // Allow 0.001 ALGO difference
            
            console.log(`[BountyList] Checking box bounty ID ${boxBounty.bountyId}:`, {
              boxClient,
              boxAmount: boxAmount / 1000000,
              bountyClient,
              bountyAmount: bountyAmount / 1000000,
              clientMatch,
              amountMatch,
              amountDiff: amountDiff / 1000000
            });
            
            // Match by client and amount (with tolerance)
            if (clientMatch && amountMatch) {
              foundBountyId = boxBounty.bountyId;
              console.log(`✅ Found matching bounty in existing boxes with ID: ${boxBounty.bountyId}`);
              break;
            } else if (clientMatch && amountDiff < 10000) {
              // If client matches but amount is slightly off (within 0.01 ALGO), still consider it
              console.log(`⚠️ Client matches but amount differs by ${amountDiff / 1000000} ALGO. Considering as match.`);
              foundBountyId = boxBounty.bountyId;
              break;
            }
          }
        }
        
        // If we found a match, update the database
        if (foundBountyId !== null) {
          try {
            const originalToken = apiService.getAuthToken();
            apiService.setAuthToken(account);
            await apiService.updateBounty(apiBountyId, { contractId: String(foundBountyId) });
            console.log(`✅ Updated bounty with contract ID: ${foundBountyId}`);
            
            // Update local bounty state
            bounty.contractId = String(foundBountyId);
            contractBountyId = foundBountyId;
            hasValidContractId = true;
            
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
          } catch (updateError) {
            console.warn('⚠️ Failed to update bounty with contract ID:', updateError);
            // Still use the found ID for this transaction
            contractBountyId = foundBountyId;
            hasValidContractId = true;
          }
        }
        
        // If still no match, try the old method (checking by bounty_count)
        if (!hasValidContractId) {
          // Try to get the latest bounty count from contract
          const contractState = await contractUtils.getContractState();
          const bountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
          console.log(`[BountyList] Contract has ${bountyCount} bounties (IDs 0-${bountyCount - 1})`);
          
          if (bountyCount > 0) {
            // Reset foundBountyId for the second search
            foundBountyId = null;
            const bountyClient = (bounty.client || bounty.clientAddress || bounty.client_address || '').toUpperCase().trim();
            const bountyAmount = Math.round(parseFloat(bounty.amount || 0) * 1000000);
            const bountyTitle = (bounty.title || '').trim();
            const bountyDescription = (bounty.description || '').trim();
            
            console.log(`[BountyList] Searching for bounty with:`, {
              client: bountyClient,
              amount: bountyAmount,
              title: bountyTitle.substring(0, 50)
            });
            
            // Check from most recent to oldest - search ALL bounties if needed
            // Start with recent ones first, but if not found, search all
            const searchRange = Math.min(50, bountyCount); // Increased from 20 to 50
            const startIndex = Math.max(0, bountyCount - searchRange);
            console.log(`[BountyList] Searching ${searchRange} bounties (IDs ${startIndex} to ${bountyCount - 1})`);
            
            for (let i = bountyCount - 1; i >= startIndex; i--) {
              try {
                console.log(`[BountyList] Checking bounty ID ${i}...`);
                const boxBounty = await contractUtils.getBountyFromBox(i);
                
                if (!boxBounty) {
                  console.log(`[BountyList] Bounty ID ${i} box is null or empty`);
                  continue;
                }
                
                // Check if this bounty matches by client address and amount
                const boxClient = (boxBounty.clientAddress || '').toUpperCase().trim();
                const boxAmount = Math.round(parseFloat(boxBounty.amount || 0) * 1000000); // Convert to microAlgos
                
                console.log(`[BountyList] Bounty ID ${i} details:`, {
                  boxClient,
                  boxAmount,
                  bountyClient,
                  bountyAmount,
                  clientMatch: boxClient === bountyClient,
                  amountMatch: Math.abs(bountyAmount - boxAmount) < 1000
                });
                
                // Match by client and amount (primary match)
                const amountDiff = Math.abs(bountyAmount - boxAmount);
                const clientMatch = boxClient === bountyClient;
                const amountMatch = amountDiff < 1000; // Allow 0.001 ALGO difference
                
                if (clientMatch && amountMatch) {
                  // Additional verification: check if title/description matches if available
                  const boxTaskDesc = (boxBounty.taskDescription || '').trim();
                  const matchesDescription = !bountyTitle || boxTaskDesc.includes(bountyTitle) || boxTaskDesc.includes(bountyDescription);
                  
                  if (matchesDescription || !bountyTitle) {
                    foundBountyId = i;
                    console.log(`✅ Found matching bounty on-chain with ID: ${i}`, {
                      client: boxClient,
                      amount: boxAmount / 1000000,
                      status: boxBounty.status,
                      taskDesc: boxTaskDesc.substring(0, 50)
                    });
                    break;
                  } else {
                    console.log(`[BountyList] Bounty ID ${i} matches client/amount but not description`);
                  }
                } else if (clientMatch && amountDiff < 10000) {
                  // If client matches but amount is slightly off (within 0.01 ALGO), still consider it
                  console.log(`⚠️ Bounty ID ${i}: Client matches but amount differs by ${amountDiff / 1000000} ALGO. Considering as match.`);
                  foundBountyId = i;
                  break;
                } else {
                  console.log(`[BountyList] Bounty ID ${i} does not match: clientMatch=${clientMatch}, amountDiff=${amountDiff / 1000000} ALGO`);
                }
              } catch (boxError) {
                // Continue checking other bounties
                console.log(`[BountyList] Could not read box ${i}:`, boxError.message);
                // If it's a 404, the box doesn't exist - this is expected for some IDs
                if (boxError.message && boxError.message.includes('404')) {
                  console.log(`[BountyList] Box ${i} does not exist (404) - this is normal if bounty_count was incremented but box wasn't created`);
                }
                continue;
              }
            }
            
            if (foundBountyId !== null) {
              // Update the bounty with the found contract ID
              try {
                const originalToken = apiService.getAuthToken();
                apiService.setAuthToken(account);
                await apiService.updateBounty(apiBountyId, { contractId: String(foundBountyId) });
                console.log(`✅ Updated bounty with contract ID: ${foundBountyId}`);
                
                // Update local bounty state
                bounty.contractId = String(foundBountyId);
                
                // Use the found ID
                contractBountyId = foundBountyId;
                hasValidContractId = true;
                
                if (originalToken) {
                  apiService.setAuthToken(originalToken);
                } else {
                  apiService.removeAuthToken();
                }
              } catch (updateError) {
                console.warn('⚠️ Failed to update bounty with contract ID:', updateError);
                // Still use the found ID for this transaction
                contractBountyId = foundBountyId;
                hasValidContractId = true;
              }
            } else {
              console.warn(`[BountyList] Could not find matching bounty on-chain. Searched ${searchRange} most recent bounties.`);
              console.warn(`[BountyList] Bounty details:`, {
                client: bountyClient,
                amount: bountyAmount,
                title: bountyTitle
              });
              
              // Try to list all boxes to see what actually exists
              try {
                console.log(`[BountyList] Attempting to list all boxes to diagnose the issue...`);
                const contractState = await contractUtils.getContractState();
                const allBoxes = await contractUtils.listAllBountyBoxes();
                console.log(`[BountyList] Found ${allBoxes.length} boxes on-chain`);
                
                if (allBoxes.length === 0) {
                  console.warn(`[BountyList] No boxes found on-chain, but bounty_count = ${bountyCount}. This suggests the bounty creation may have failed.`);
                } else {
                  console.log(`[BountyList] Available boxes:`, allBoxes.map(b => ({
                    bountyId: b.bountyId,
                    client: b.clientAddress,
                    amount: b.amount
                  })));
                }
              } catch (listError) {
                console.warn(`[BountyList] Could not list boxes:`, listError);
              }
            }
          } else {
            console.warn(`[BountyList] Contract has no bounties yet (bounty_count = 0)`);
          }
        }
      } catch (stateError) {
        console.error('❌ Failed to fetch contract state:', stateError);
      }
    }
      
    // If still no valid contract ID, try one more thing: check if we have a transaction ID
    // and try to find the bounty by checking ALL boxes (not just recent ones)
    if (!hasValidContractId && (bounty.transactionId || bounty.createTransactionId)) {
      console.log('[BountyList] Still no contractId found. Trying exhaustive search of ALL boxes...');
      try {
        const contractState = await contractUtils.getContractState();
        const totalBountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
        console.log(`[BountyList] Exhaustive search: checking ALL ${totalBountyCount} bounties...`);
        
        const bountyClient = (bounty.client || bounty.clientAddress || bounty.client_address || '').toUpperCase().trim();
        const bountyAmount = Math.round(parseFloat(bounty.amount || 0) * 1000000);
        
        // Search ALL bounties from newest to oldest
        for (let i = totalBountyCount - 1; i >= 0; i--) {
          try {
            const boxBounty = await contractUtils.getBountyFromBox(i);
            if (boxBounty) {
              const boxClient = (boxBounty.clientAddress || '').toUpperCase().trim();
              const boxAmount = Math.round(parseFloat(boxBounty.amount || 0) * 1000000);
              const amountDiff = Math.abs(bountyAmount - boxAmount);
              const clientMatch = boxClient === bountyClient;
              
              if (clientMatch && amountDiff < 1000) {
                console.log(`✅ Found matching bounty in exhaustive search: ID ${i}`);
                let foundBountyId = i;
                
                // Update the database
                try {
                  const originalToken = apiService.getAuthToken();
                  apiService.setAuthToken(account);
                  await apiService.updateBounty(apiBountyId, { contractId: String(i) });
                  console.log(`✅ Updated bounty with contract ID: ${i}`);
                  
                  bounty.contractId = String(i);
                  contractBountyId = i;
                  hasValidContractId = true;
                  
                  if (originalToken) {
                    apiService.setAuthToken(originalToken);
                  } else {
                    apiService.removeAuthToken();
                  }
                  break; // Found it, exit loop
                } catch (updateError) {
                  console.warn('⚠️ Failed to update bounty with contract ID:', updateError);
                  contractBountyId = i;
                  hasValidContractId = true;
                  break;
                }
              }
            }
          } catch (boxError) {
            // Continue searching
            continue;
          }
        }
      } catch (exhaustiveError) {
        console.warn('[BountyList] Exhaustive search failed:', exhaustiveError);
      }
    }
    
    // If still no valid contract ID, show error with more helpful information
    if (!hasValidContractId) {
      // Try to get bounty count and list all boxes for error message
      let bountyCountForError = 0;
      let allBoxesForError = [];
      try {
        const contractState = await contractUtils.getContractState();
        bountyCountForError = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
        allBoxesForError = await contractUtils.listAllBountyBoxes();
      } catch (e) {
        console.warn('Could not get contract state for error message:', e);
      }
      
      const bountyClient = (bounty.client || bounty.clientAddress || bounty.client_address || '').toUpperCase().trim();
      const bountyAmount = Math.round(parseFloat(bounty.amount || 0) * 1000000);
      
      // Build detailed error message
      let errorMsg = `This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.\n\n` +
        `Bounty Details:\n` +
        `- Client: ${bounty.client || bounty.clientAddress || 'Unknown'}\n` +
        `- Amount: ${bounty.amount || 'Unknown'} ALGO (${bountyAmount} microAlgos)\n` +
        `- Title: ${bounty.title || 'N/A'}\n\n` +
        `Diagnosis:\n` +
        `- Contract reports ${bountyCountForError} bounties exist\n` +
        `- Found ${allBoxesForError.length} boxes on-chain\n`;
      
      if (allBoxesForError.length > 0) {
        errorMsg += `- Available bounties on-chain:\n`;
        allBoxesForError.forEach((b, idx) => {
          const boxClient = (b.clientAddress || '').toUpperCase().trim();
          const boxAmount = Math.round(parseFloat(b.amount || 0) * 1000000);
          const clientMatch = boxClient === bountyClient;
          const amountDiff = Math.abs(bountyAmount - boxAmount);
          errorMsg += `  ${idx + 1}. ID ${b.bountyId}: Client=${clientMatch ? 'MATCH' : 'NO MATCH'}, Amount=${b.amount} ALGO (diff: ${(amountDiff / 1000000).toFixed(6)} ALGO)\n`;
        });
      } else if (bountyCountForError > 0) {
        errorMsg += `- ⚠️ WARNING: Contract reports ${bountyCountForError} bounties but no boxes found!\n` +
          `  This suggests the bounty creation transaction may have failed after incrementing the counter.\n` +
          `  The boxes were likely never created, meaning these bounties cannot be used.\n\n`;
      } else {
        errorMsg += `- No boxes found on-chain (bounty may not have been created)\n\n`;
      }
      
      // Add transaction ID if available
      const txId = bounty.transactionId || bounty.createTransactionId;
      const explorerUrl = txId ? `https://testnet.algoexplorer.io/tx/${txId}` : null;
      
      errorMsg += `Possible solutions:\n` +
        `1. Check the bounty creation transaction on AlgoExplorer${explorerUrl ? `:\n   ${explorerUrl}` : ' (transaction ID not available)'}\n` +
        `2. If the transaction failed or boxes are missing, you may need to recreate the bounty\n` +
        `3. If you just created this bounty, wait 1-2 minutes for indexing and try again\n` +
        `4. Verify the client address and amount match exactly\n` +
        `5. If bounty_count > 0 but boxes don't exist, the creation partially failed - recreate the bounty\n` +
        `6. Contact support if the issue persists`;
      
      console.error('[BountyList] Could not find contract ID:', {
        bounty,
        bountyCount: bountyCountForError,
        availableBoxes: allBoxesForError.map(b => ({
          id: b.bountyId,
          client: b.clientAddress,
          amount: b.amount
        }))
      });
      
      alert(errorMsg);
      return;
    }

    try {
      setAcceptingBountyId(apiBountyId);
      
      // Set auth token for API call (wallet address as Bearer token)
      const originalToken = apiService.getAuthToken();
      apiService.setAuthToken(account);
      
      try {
        // First update backend - use the ID that works for API (contractId or databaseId)
        console.log('📤 Calling API to accept bounty with ID:', apiBountyId);
        await apiService.acceptBounty(apiBountyId);
        console.log('✅ Backend updated successfully');
      } catch (apiError) {
        console.error('❌ API error:', apiError);
        throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
      } finally {
        // Restore original token
        if (originalToken) {
          apiService.setAuthToken(originalToken);
        } else {
          apiService.removeAuthToken();
        }
      }
      
      // Then call contract - use numeric contractId
      console.log('📤 Calling smart contract to accept bounty with contract ID:', contractBountyId);
      const txId = await acceptBounty(contractBountyId);
      console.log('✅ Contract transaction successful:', txId);
      
      // Store transaction ID in database
      if (txId && apiBountyId) {
        try {
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          await apiService.updateBountyTransaction(apiBountyId, txId, 'accept');
          console.log('✅ Transaction ID stored successfully');
          if (originalToken) {
            apiService.setAuthToken(originalToken);
          } else {
            apiService.removeAuthToken();
          }
        } catch (txError) {
          console.warn('⚠️ Failed to store transaction ID:', txError);
          // Don't throw - the transaction succeeded on-chain
        }
      }
      
      alert(`Bounty accepted successfully! Transaction ID: ${txId}\n\nYou will be redirected to the bounty details page.`);
      
      // Navigate to detail page first
      navigate(`/bounty/${apiBountyId}`);
      
      // Refresh bounties list in background
      const response = await apiService.getBounties({
        status: filter !== 'all' ? filter : undefined,
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      let bountiesArray = [];
      if (response && Array.isArray(response.bounties)) {
        bountiesArray = response.bounties;
      } else if (Array.isArray(response)) {
        bountiesArray = response;
      } else if (response && response.value && Array.isArray(response.value)) {
        bountiesArray = response.value;
      } else if (response && response.data && Array.isArray(response.data)) {
        bountiesArray = response.data;
      }

      const transformedBounties = bountiesArray.map((b, index) => {
        let displayId = b.contractId;
        if (displayId === null || displayId === undefined || displayId === '') {
          displayId = b.id || b._id || `db-${index}`;
        }
        
        return {
          id: String(displayId),
          contractId: b.contractId ? String(b.contractId) : null,
          databaseId: b.id || b._id,
          title: b.title || 'Untitled Bounty',
          description: b.description || '',
          amount: typeof b.amount === 'number' ? b.amount : parseFloat(b.amount) || 0,
          deadline: b.deadline,
          status: (b.status || 'open').toLowerCase(),
          client: b.clientAddress || b.client_address,
          freelancer: b.freelancerAddress || b.freelancer_address,
          verifier: b.verifierAddress || b.verifier_address,
          createdAt: b.createdAt || b.created_at || new Date().toISOString(),
        };
      });

      setBounties(transformedBounties);
    } catch (error) {
      console.error('Failed to accept bounty:', error);
      alert(`Failed to accept bounty: ${error.message || 'Unknown error'}`);
    } finally {
      setAcceptingBountyId(null);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="chip">Explore programmable escrows</span>
          <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
            Live bounties ready for trusted collaboration
          </h1>
          <p className="mt-2 text-sm text-white/60 md:max-w-2xl">
            Each bounty is backed by Algorand smart contracts. Filter by state, drill into timelines, and connect
            your wallet to accept in seconds.
          </p>
        </div>
        <div className="flex gap-3 self-start">
          <button
            type="button"
            onClick={refreshBounties}
            disabled={loading}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh bounties list"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link to="/create" className="btn-primary">
            Launch bounty
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1">
        {filters.map(({ id, label }) => {
          const isActive = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/80 via-secondary-400/80 to-primary-600/80 text-white shadow-glow'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="glass-card border border-red-500/40 bg-red-500/10 p-6 text-red-200">
          <p className="font-semibold">Error loading bounties</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="glass-card flex flex-col items-center gap-4 p-12 text-white/60">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-secondary-300"></div>
          <p>Loading bounties…</p>
        </div>
      ) : filteredBounties.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-4 p-12 text-center text-white/60">
          <svg className="h-12 w-12 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h.01M14.25 9.75h.01M8.25 13.5a4.5 4.5 0 007.5 0" />
          </svg>
          <h3 className="text-lg font-semibold text-white">No bounties in this state (yet)</h3>
          <p className="text-sm">
            {filter === 'all'
              ? 'Be the first to launch a bounty and automate your payouts.'
              : 'Switch filters or create a new bounty tailored to your workflow.'}
          </p>
          <Link to="/create" className="btn-outline mt-2">
            Create bounty
          </Link>
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-white/40">
              <p>Debug: Total bounties in state: {bounties.length}</p>
              <p>Filter: {filter}</p>
              <p>Filtered count: {filteredBounties.length}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="glass-card border border-blue-500/40 bg-blue-500/10 p-4 text-xs text-blue-200">
              <p>🔍 Debug Info:</p>
              <p>Total bounties: {bounties.length}</p>
              <p>Filter: {filter}</p>
              <p>Filtered bounties: {filteredBounties.length}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
            </div>
          )}
          {filteredBounties.map((bounty) => {
            const statusStyle = statusStyles[bounty.status] || statusStyles.open;
            return (
              <div key={bounty.id} className="tilt-card glass-card p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="tag">
                        {bounty.contractId ? `Bounty #${bounty.contractId}` : `Bounty ${bounty.id?.slice(0, 8) || '—'}`}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${statusStyle.badge}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white">{bounty.title}</h2>
                    <p className="text-sm text-white/65">{bounty.description}</p>
                    <div className="grid gap-3 text-sm text-white/60 md:grid-cols-2">
                      <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-white/40">Client</p>
                        <p className="mt-2 font-medium text-white">{formatAddress(bounty.client)}</p>
                      </div>
                      <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-white/40">Deadline</p>
                        <p className="mt-2 font-medium text-white">{formatDate(bounty.deadline)}</p>
                      </div>
                      {bounty.freelancer && (
                        <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Freelancer</p>
                          <p className="mt-2 font-medium text-white">{formatAddress(bounty.freelancer)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-6">
                    <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-right">
                      <p className="text-xs uppercase tracking-[0.32em] text-white/40">Reward</p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {typeof bounty.amount === 'number' ? bounty.amount.toFixed(2) : parseFloat(bounty.amount || 0).toFixed(2)} ALGO
                      </p>
                      <p className="text-xs text-white/45">Locked in escrow</p>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row" style={{ position: 'relative', zIndex: 10 }}>
                      <Link 
                        to={`/bounty/${bounty.contractId || bounty.databaseId || bounty.id}`} 
                        className="btn-outline text-sm"
                        style={{ position: 'relative', zIndex: 11, cursor: 'pointer' }}
                        onClick={(e) => {
                          console.log('🔗 View details clicked for bounty:', bounty.id, bounty.contractId);
                          const targetId = bounty.contractId || bounty.databaseId || bounty.id;
                          console.log('🔗 Navigating to:', `/bounty/${targetId}`);
                          // Don't prevent default - let Link handle navigation
                        }}
                      >
                        View details
                      </Link>
                      {bounty.status === 'open' && account && account !== bounty.client && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('✅ Accept bounty button clicked for:', bounty);
                            console.log('✅ Button state:', { 
                              disabled: acceptingBountyId === (bounty.contractId || bounty.databaseId || bounty.id),
                              acceptingBountyId,
                              bountyId: bounty.contractId || bounty.databaseId || bounty.id
                            });
                            if (!acceptingBountyId) {
                              handleAcceptBounty(bounty);
                            }
                          }}
                          disabled={acceptingBountyId === (bounty.contractId || bounty.databaseId || bounty.id)}
                          className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            position: 'relative', 
                            zIndex: 11, 
                            cursor: acceptingBountyId === (bounty.contractId || bounty.databaseId || bounty.id) ? 'not-allowed' : 'pointer',
                            pointerEvents: acceptingBountyId === (bounty.contractId || bounty.databaseId || bounty.id) ? 'none' : 'auto'
                          }}
                        >
                          {acceptingBountyId === (bounty.contractId || bounty.databaseId || bounty.id) ? 'Accepting...' : 'Accept bounty'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-white/40">Created {formatDate(bounty.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BountyList;
