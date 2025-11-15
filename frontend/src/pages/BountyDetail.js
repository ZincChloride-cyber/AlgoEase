import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import contractUtils, { GLOBAL_STATE_KEYS } from '../utils/contractUtils';
import apiService from '../utils/api';

  const statusStyles = {
  open: { label: 'Open', badge: 'bg-gradient-to-r from-secondary-400/25 to-secondary-500/40 text-secondary-100 border border-secondary-300/40' },
  accepted: { label: 'Accepted', badge: 'bg-gradient-to-r from-primary-500/20 to-primary-600/40 text-primary-100 border border-primary-300/40' },
  submitted: { label: 'Submitted', badge: 'bg-gradient-to-r from-blue-500/20 to-blue-600/40 text-blue-100 border border-blue-300/40' },
  approved: { label: 'Approved', badge: 'bg-gradient-to-r from-accent-400/25 to-accent-500/45 text-accent-50 border border-accent-300/40' },
  claimed: { label: 'Claimed', badge: 'bg-white/10 text-white/80 border border-white/20' },
  refunded: { label: 'Refunded', badge: 'bg-red-500/20 text-red-100 border border-red-400/40' },
  rejected: { label: 'Rejected', badge: 'bg-orange-500/20 text-orange-100 border border-orange-400/40' },
};

const BountyDetail = () => {
  const { id } = useParams();
  const {
    account,
    isConnected,
    contractState,
    loadContractState,
    acceptBounty,
    submitBounty,
    approveBounty,
    rejectBounty,
    claimBounty,
    refundBounty,
    canPerformAction,
  } = useWallet();

  const [bounty, setBounty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    description: '',
    links: ''
  });
  const [submittingWork, setSubmittingWork] = useState(false);
  const [contractIdWarning, setContractIdWarning] = useState(null);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [submissionTxId, setSubmissionTxId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadBountyData = async () => {
      try {
        setLoading(true);
        console.log('📥 Loading bounty data for ID:', id);
        // Fetch bounty from API
        const bountyData = await apiService.getBounty(id);
        console.log('✅ Bounty data received:', bountyData);
        
        // Check if contract ID is missing and try to resolve it
        let resolvedBountyData = { ...bountyData };
        if (!bountyData.contractId && !bountyData.contract_id) {
          console.log('⚠️ Bounty missing contract ID, attempting to fetch from contract state...');
          try {
            // Try to get the latest bounty count from contract
            const contractState = await contractUtils.getContractState();
            const bountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
            
            if (bountyCount > 0) {
              // Try to find the bounty by checking recent bounties
              const bountyClient = (bountyData.clientAddress || bountyData.client_address || '').toUpperCase().trim();
              const bountyAmount = Math.round(parseFloat(bountyData.amount || 0) * 1000000);
              
              let foundBountyId = null;
              // Check the last 20 bounties (enough to cover most cases)
              for (let i = bountyCount - 1; i >= Math.max(0, bountyCount - 20); i--) {
                try {
                  const boxBounty = await contractUtils.getBountyFromBox(i);
                  const boxClient = (boxBounty.clientAddress || '').toUpperCase().trim();
                  
                  if (boxClient === bountyClient) {
                    // Check amount matches (within small tolerance for rounding)
                    const boxAmount = parseInt(boxBounty.amount || 0);
                    
                    if (Math.abs(bountyAmount - boxAmount) < 1000) { // Allow 0.001 ALGO difference
                      foundBountyId = i;
                      console.log(`✅ Found matching bounty on-chain with ID: ${i}`);
                      break;
                    }
                  }
                } catch (boxError) {
                  // Continue checking other bounties
                  continue;
                }
              }
              
              if (foundBountyId !== null) {
                // Update the bounty with the found contract ID
                try {
                  if (account) {
                    apiService.setAuthToken(account);
                  }
                  const updatedBounty = await apiService.updateBounty(id, { contractId: String(foundBountyId) });
                  console.log(`✅ Updated bounty with contract ID: ${foundBountyId}`);
                  resolvedBountyData = updatedBounty;
                } catch (updateError) {
                  console.warn('⚠️ Failed to update bounty with contract ID:', updateError);
                  // Still use the found ID locally
                  resolvedBountyData.contractId = String(foundBountyId);
                  resolvedBountyData.contract_id = foundBountyId;
                }
              } else {
                console.warn('⚠️ Could not find matching bounty on-chain');
                // Set warning message if contract ID couldn't be found
                if (isMounted) {
                  setContractIdWarning('This bounty does not have a contract ID. It may not have been deployed to the smart contract yet. Some actions may be unavailable.');
                }
              }
            }
          } catch (stateError) {
            console.error('❌ Failed to fetch contract state:', stateError);
            // Continue without contract ID - user can still view the bounty
            if (isMounted) {
              setContractIdWarning('Could not verify contract ID. The bounty may not be deployed on-chain yet.');
            }
          }
        }
        
        if (isMounted) {
          // V2 Contract: Creator is also the verifier (no separate verifier)
          // If verifier is null/empty, use client address as verifier
          const clientAddr = resolvedBountyData.clientAddress || resolvedBountyData.client_address;
          const verifierAddr = resolvedBountyData.verifierAddress || resolvedBountyData.verifier_address || clientAddr;
          
          setBounty({
            ...resolvedBountyData,
            client: clientAddr,
            freelancer: resolvedBountyData.freelancerAddress || resolvedBountyData.freelancer_address,
            verifier: verifierAddr, // Use client address if verifier is not set (V2 contract: creator = verifier)
            requirements: resolvedBountyData.requirements || [],
            submissions: resolvedBountyData.submissions || [],
          });
        }
      } catch (error) {
        console.error('❌ Failed to load bounty data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          response: error.response
        });
        if (isMounted) {
          setBounty(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadBountyData();
    }

    return () => {
      isMounted = false;
    };
  }, [id, account]);

  const actions = useMemo(() => {
    if (!bounty || !isConnected) return [];
    // For API calls, always use the database ID (id) - this is the UUID from the database
    // For contract calls, we need the numeric contractId
    const apiBountyId = id; // Always use database ID for API calls
    // For contract calls, we need a numeric contractId
    const contractBountyId = bounty.contractId ? parseInt(bounty.contractId) : null;
    const hasValidContractId = contractBountyId !== null && !isNaN(contractBountyId);
    
    console.log('🔍 Bounty ID mapping:', {
      dbId: id,
      bountyContractId: bounty.contractId,
      contractBountyId: contractBountyId,
      hasValidContractId: hasValidContractId,
      bountyObject: bounty
    });
    
    // Normalize addresses for comparison (case-insensitive)
    const accountNormalized = (account || '').toUpperCase().trim();
    const isVerifier = accountNormalized === ((bounty.verifier || bounty.verifierAddress || bounty.verifier_address) || '').toUpperCase().trim();
    const isClient = accountNormalized === ((bounty.client || bounty.clientAddress || bounty.client_address) || '').toUpperCase().trim();
    const isFreelancer = accountNormalized === ((bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address) || '').toUpperCase().trim();
    
    return [
      bounty.status === 'open' && !isClient && {
        label: 'Accept bounty',
        action: 'accept',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          // If missing, try to get it from contract state
          let finalContractBountyId = contractBountyId;
          let finalHasValidContractId = hasValidContractId;
          
          if (!finalHasValidContractId) {
            console.log('⚠️ Bounty missing contract ID, attempting to fetch from contract state...');
            try {
              // Try to get the latest bounty count from contract
              const contractState = await contractUtils.getContractState();
              const bountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
              
              if (bountyCount > 0) {
                // Try to find the bounty by checking recent bounties
                // Since we don't know which one it is, we'll check the last few
                let foundBountyId = null;
                const bountyClient = (bounty.client || bounty.clientAddress || bounty.client_address || '').toUpperCase().trim();
                const bountyAmount = Math.round(parseFloat(bounty.amount || 0) * 1000000);
                
                for (let i = bountyCount - 1; i >= Math.max(0, bountyCount - 10); i--) {
                  try {
                    const boxBounty = await contractUtils.getBountyFromBox(i);
                    // Check if this bounty matches by client address
                    const boxClient = (boxBounty.clientAddress || '').toUpperCase().trim();
                    
                    if (boxClient === bountyClient) {
                      // Check amount matches (within small tolerance for rounding)
                      const boxAmount = parseInt(boxBounty.amount || 0);
                      
                      if (Math.abs(bountyAmount - boxAmount) < 1000) { // Allow 0.001 ALGO difference
                        foundBountyId = i;
                        console.log(`✅ Found matching bounty on-chain with ID: ${i}`);
                        break;
                      }
                    }
                  } catch (boxError) {
                    // Continue checking other bounties
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
                    // Update local state
                    setBounty({ ...bounty, contractId: String(foundBountyId) });
                    // Use the found ID
                    finalContractBountyId = foundBountyId;
                    finalHasValidContractId = true;
                    if (originalToken) {
                      apiService.setAuthToken(originalToken);
                    } else {
                      apiService.removeAuthToken();
                    }
                  } catch (updateError) {
                    console.warn('⚠️ Failed to update bounty with contract ID:', updateError);
                    // Still use the found ID for this transaction
                    finalContractBountyId = foundBountyId;
                    finalHasValidContractId = true;
                  }
                }
              }
            } catch (stateError) {
              console.error('❌ Failed to fetch contract state:', stateError);
            }
            
            // If still no valid contract ID, throw error
            if (!finalHasValidContractId) {
              throw new Error(
                `This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.\n\n` +
                `Please ensure:\n` +
                `1. The bounty was successfully created on-chain\n` +
                `2. The contract ID was saved to the database\n` +
                `3. Try refreshing the page or contact support if the issue persists\n\n` +
                `If you just created this bounty, wait a few seconds and try again.`
              );
            }
          }

          // Set auth token for API call (wallet address as Bearer token)
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          
          try {
            // First update backend
            console.log('📤 Calling API to accept bounty with ID:', apiBountyId);
            await apiService.acceptBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error:', apiError);
            throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
          }
          
          // Then call contract
          console.log('📤 Calling smart contract to accept bounty with contract ID:', finalContractBountyId);
          const txId = await acceptBounty(finalContractBountyId);
          console.log('✅ Contract transaction successful:', txId);
          
          // Store transaction ID and contractId in database (auth token still set from above)
          if (txId) {
            try {
              console.log('💾 Storing transaction ID and contractId in database...');
              console.log('💾 Using bounty ID:', id, 'for transaction update');
              // Use the database ID (id) not contractId for the API call
              await apiService.updateBountyTransaction(
                id, 
                txId, 
                'accept',
                finalContractBountyId !== null && finalContractBountyId !== undefined ? String(finalContractBountyId) : null
              );
              console.log('✅ Transaction ID and contractId stored successfully');
            } catch (txError) {
              console.error('❌ Failed to store transaction ID:', txError);
              console.error('❌ Error details:', {
                message: txError.message,
                status: txError.status,
                response: txError.response
              });
              // Don't throw - the transaction succeeded on-chain, this is just metadata
            }
          } else {
            console.warn('⚠️ No transaction ID returned from acceptBounty');
          }
          
          // Restore original token after all API calls
          if (originalToken) {
            apiService.setAuthToken(originalToken);
          } else {
            apiService.removeAuthToken();
          }
          
          return txId;
        },
        style: 'btn-primary',
      },
      bounty.status === 'accepted' && isFreelancer && {
        label: 'Submit work',
        action: 'submit',
        handler: async () => {
          setShowSubmissionForm(true);
        },
        style: 'btn-primary',
      },
      bounty.status === 'submitted' && (isVerifier || isClient) && {
        label: 'Approve work',
        action: 'approve',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error(
              `This bounty does not have a valid contract ID.\n\n` +
              `Database ID: ${id}\n` +
              `Contract ID: ${bounty.contractId || 'Not set'}\n\n` +
              `The bounty may not have been deployed to the smart contract yet, or the contract ID may be missing from the database.\n\n` +
              `Please check:\n` +
              `- The bounty was successfully created on-chain\n` +
              `- The contract ID was saved to the database\n` +
              `- Try refreshing the page or recreating the bounty`
            );
          }

          // Set auth token for API call
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          
          // Don't update backend status first - wait for contract transaction to succeed
          // This ensures database stays in sync with blockchain
          console.log('📤 Preparing to approve bounty with ID:', apiBountyId);
          
          // CRITICAL: Verify freelancer address exists and is not zero
          const dbFreelancerAddress = bounty.freelancerAddress || bounty.freelancer_address;
          const zeroAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ';
          
          if (!dbFreelancerAddress || dbFreelancerAddress === zeroAddress) {
            throw new Error(
              `Bounty has not been accepted yet.\n\n` +
              `A freelancer must accept the bounty before it can be approved.\n` +
              `Current status: ${bounty.status}\n` +
              `Freelancer address: ${dbFreelancerAddress || 'Not set'}\n\n` +
              `Please wait for a freelancer to accept the bounty.`
            );
          }
          
          // CRITICAL: Verify the current user is the client or verifier
          const accountNormalized = (account || '').toUpperCase().trim();
          const clientNormalized = ((bounty.client || bounty.clientAddress || bounty.client_address) || '').toUpperCase().trim();
          const verifierNormalized = ((bounty.verifier || bounty.verifierAddress || bounty.verifier_address) || '').toUpperCase().trim();
          
          if (accountNormalized !== clientNormalized && accountNormalized !== verifierNormalized) {
            throw new Error(
              `Only the client or verifier can approve this bounty.\n\n` +
              `Your address: ${account}\n` +
              `Client address: ${bounty.client || bounty.clientAddress || bounty.client_address}\n` +
              `Verifier address: ${bounty.verifier || bounty.verifierAddress || bounty.verifier_address}\n\n` +
              `Please connect with the client or verifier wallet to approve.`
            );
          }
          
          console.log('🔍 Verifying bounty exists on contract before approval...');
          let bountyData = null;
          let boxReadFailed = false;
          
          try {
            // First, check contract state to see how many bounties exist
            let contractBountyCount = null;
            try {
              const contractState = await contractUtils.getContractState();
              contractBountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
              console.log(`[BountyDetail] Contract has ${contractBountyCount} bounties (IDs 0-${contractBountyCount - 1})`);
            } catch (stateError) {
              console.warn('[BountyDetail] Could not get contract state:', stateError);
            }
            
            try {
              bountyData = await contractUtils.getBountyFromBox(contractBountyId);
            } catch (boxError) {
              boxReadFailed = true;
              console.warn('⚠️ Could not read bounty box, but continuing with database data:', boxError.message);
              
              // If box doesn't exist but we have database data, we can still proceed
              // The contract will handle the transaction, and if the box doesn't exist, it will fail there
              if (contractBountyCount !== null && contractBountyId >= contractBountyCount) {
                // Bounty ID is out of range
                throw new Error(
                  `Bounty ID ${contractBountyId} does not exist.\n\n` +
                  `The contract only has ${contractBountyCount} bounties (IDs 0-${contractBountyCount - 1}).\n\n` +
                  `Please verify the bounty ID in the database matches the on-chain bounty ID.`
                );
              }
              
              // If box read failed but bounty ID is valid, warn but continue
              console.warn('⚠️ Box read failed, but proceeding with approval using database freelancer address');
              console.warn('⚠️ The contract transaction may fail if the box truly doesn\'t exist');
            }
            
            // If we got bounty data from box, verify it
            if (bountyData) {
              // Check status - must be SUBMITTED (6) for approval
              const status = bountyData.status;
              if (status !== 6) { // STATUS_SUBMITTED = 6
                const statusText = status === 0 ? 'OPEN' : 
                                  status === 1 ? 'ACCEPTED' : 
                                  status === 2 ? 'APPROVED' :
                                  status === 3 ? 'CLAIMED' :
                                  status === 4 ? 'REFUNDED' :
                                  status === 5 ? 'REJECTED' :
                                  status === 6 ? 'SUBMITTED' :
                                  `STATUS_${status}`;
                throw new Error(
                  `Bounty must be submitted before it can be approved.\n\n` +
                  `Current status: ${statusText} (${status})\n` +
                  `Required status: SUBMITTED (6)\n\n` +
                  `The freelancer must submit their work before you can approve it.`
                );
              }
              
              if (!bountyData.freelancerAddress) {
                throw new Error(
                  `Bounty exists but has not been accepted yet.\n\n` +
                  `A freelancer must accept the bounty before it can be approved.\n` +
                  `Current status: ${bountyData.status}\n\n` +
                  `Please wait for a freelancer to accept the bounty.`
                );
              }
              
              // Verify freelancer address matches database
              if (bountyData.freelancerAddress !== dbFreelancerAddress) {
                console.warn('⚠️ Freelancer address mismatch:', {
                  database: dbFreelancerAddress,
                  onChain: bountyData.freelancerAddress
                });
              }
              
              console.log('✅ Bounty verified on contract:', {
                bountyId: contractBountyId,
                freelancer: bountyData.freelancerAddress,
                status: bountyData.status
              });
            } else if (boxReadFailed) {
              // Box read failed - but we can still proceed if we have valid database data
              // The contract transaction will fail if the box truly doesn't exist
              console.warn('⚠️ Box read failed, but proceeding with approval using database data');
              console.warn('⚠️ The contract transaction will validate the box exists');
              
              // Only throw if bounty ID is out of range
              if (contractBountyCount !== null && contractBountyId >= contractBountyCount) {
                throw new Error(
                  `Bounty ID ${contractBountyId} does not exist.\n\n` +
                  `The contract only has ${contractBountyCount} bounties (IDs 0-${contractBountyCount - 1}).\n\n` +
                  `Please verify the bounty ID in the database matches the on-chain bounty ID.`
                );
              }
              
              // Continue with approval - contract will handle validation
              console.log('✅ Proceeding with approval - contract will validate');
            }
          } catch (verifyError) {
            console.error('❌ Bounty verification failed:', verifyError);
            // If it's already a formatted error, throw it as-is
            if (verifyError.message?.includes('Bounty not found') || 
                verifyError.message?.includes('has not been accepted') ||
                verifyError.message?.includes('does not exist')) {
              throw verifyError;
            }
            // Otherwise, provide a generic error
            throw new Error(
              `Failed to verify bounty on blockchain: ${verifyError.message}\n\n` +
              `Please check:\n` +
              `- The bounty was successfully created on-chain\n` +
              `- The contract ID matches: ${contractUtils.getAppId()} (V5)\n` +
              `- The bounty ID is correct: ${contractBountyId}`
            );
          }
          
          // Call contract first (transfers funds directly to freelancer)
          console.log('📤 Calling smart contract to approve bounty with contract ID:', contractBountyId);
          let txId = null;
          try {
            // Get freelancer address from database as fallback if box read fails
            const dbFreelancerAddress = bounty.freelancerAddress || bounty.freelancer_address;
            
            // Pass freelancer address from database as fallback if box read fails
            txId = await approveBounty(contractBountyId, dbFreelancerAddress);
            console.log('✅ Contract transaction successful:', txId);
            
            // Now update backend after successful contract transaction
            try {
              console.log('📤 Updating backend after successful contract transaction...');
              await apiService.approveBounty(apiBountyId);
              console.log('✅ Backend updated successfully');
            } catch (apiError) {
              console.error('❌ API error updating backend:', apiError);
              // Don't throw - the contract transaction succeeded, backend update is secondary
              console.warn('⚠️ Contract transaction succeeded but backend update failed. Status may be out of sync.');
            }
            
            // Store transaction ID and contractId in database
            if (txId) {
              try {
                console.log('💾 Storing transaction ID and contractId in database...');
                console.log('💾 Using bounty ID:', id, 'for transaction update');
                // Use the database ID (id) not contractId for the API call
                await apiService.updateBountyTransaction(
                  id, 
                  txId, 
                  'approve',
                  contractBountyId !== null && contractBountyId !== undefined ? String(contractBountyId) : null
                );
                console.log('✅ Transaction ID and contractId stored successfully');
              } catch (txError) {
                console.error('❌ Failed to store transaction ID:', txError);
                console.error('❌ Error details:', {
                  message: txError.message,
                  status: txError.status,
                  response: txError.response
                });
                // Don't throw - the transaction succeeded on-chain, this is just metadata
              }
            } else {
              console.warn('⚠️ No transaction ID returned from approveBounty');
            }
            
            // Restore original token after all API calls
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
            
            return txId;
          } catch (contractError) {
            // Restore original token on error too
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
            console.error('❌ Contract error:', contractError);
            
            // Check for specific error types and provide helpful messages
            const errorMessage = contractError.message || String(contractError);
            
            // Status validation error
            if (errorMessage.includes('Status must be SUBMITTED') || 
                errorMessage.includes('must be submitted before') ||
                errorMessage.includes('assert failed') && errorMessage.includes('pc=921')) {
              throw new Error(
                `Cannot approve bounty: The bounty must be in SUBMITTED status before approval.\n\n` +
                `Current workflow state:\n` +
                `1. ✅ Bounty created (OPEN)\n` +
                `2. ✅ Freelancer accepted (ACCEPTED)\n` +
                `3. ❌ Work not submitted yet (REQUIRED)\n` +
                `4. ⏳ Approval (waiting for submission)\n\n` +
                `The freelancer must submit their work before you can approve it.\n\n` +
                `Please ask the freelancer to submit their work, then try approving again.`
              );
            }
            
            // Box read error
            if (errorMessage.includes('Failed to read bounty data') || 
                errorMessage.includes('box not found') ||
                errorMessage.includes('does not exist')) {
              throw new Error(
                `Failed to approve bounty: ${errorMessage}\n\n` +
                `This usually means:\n` +
                `- The bounty may not exist on the smart contract yet\n` +
                `- The contract ID (${bounty.contractId}) may be incorrect\n` +
                `- The bounty may need to be recreated\n\n` +
                `Please check the bounty details and try again.`
              );
            }
            
            // Logic eval error (smart contract assertion failure)
            if (errorMessage.includes('logic eval error') || 
                errorMessage.includes('assert failed')) {
              // Extract more details if available
              let detailedMessage = `Smart contract validation failed.\n\n`;
              
              if (errorMessage.includes('pc=921')) {
                detailedMessage += `The contract rejected the approval because the bounty status is not SUBMITTED.\n\n`;
                detailedMessage += `Required workflow:\n`;
                detailedMessage += `1. Freelancer accepts bounty (status: ACCEPTED)\n`;
                detailedMessage += `2. Freelancer submits work (status: SUBMITTED) ← REQUIRED\n`;
                detailedMessage += `3. Verifier approves (status: APPROVED)\n\n`;
                detailedMessage += `The freelancer must submit their work before you can approve it.\n`;
              } else {
                detailedMessage += `Error details: ${errorMessage}\n\n`;
                detailedMessage += `This usually means:\n`;
                detailedMessage += `- The bounty state doesn't meet the contract requirements\n`;
                detailedMessage += `- The transaction parameters are incorrect\n`;
                detailedMessage += `- The bounty may be in an invalid state\n`;
              }
              
              throw new Error(detailedMessage);
            }
            
            // Generic error - pass through with context
            throw new Error(
              `Failed to approve bounty: ${errorMessage}\n\n` +
              `Please check:\n` +
              `- The bounty status is SUBMITTED (freelancer must submit work first)\n` +
              `- You are the client or verifier for this bounty\n` +
              `- The bounty exists on the smart contract\n` +
              `- Your wallet is connected and has sufficient balance`
            );
          }
        },
        style: 'btn-primary',
      },
      (bounty.status === 'accepted' || bounty.status === 'submitted') && (isVerifier || isClient) && {
        label: 'Reject work',
        action: 'reject',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error('This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.');
          }

          // Set auth token for API call
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          try {
            // First update backend
            console.log('📤 Calling API to reject bounty with ID:', apiBountyId);
            await apiService.rejectBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error:', apiError);
            throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
          } finally {
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
          }
          // Then call contract (refunds to client)
          // Get client address from database as fallback
          const clientAddress = bounty.client || bounty.clientAddress || bounty.client_address;
          console.log('📤 Calling smart contract to reject bounty with contract ID:', contractBountyId);
          console.log('📤 Using client address:', clientAddress);
          const txId = await rejectBounty(contractBountyId, clientAddress);
          console.log('✅ Contract transaction successful:', txId);
          
          // Store transaction ID and contractId in database
          if (txId) {
            try {
              const originalToken = apiService.getAuthToken();
              apiService.setAuthToken(account);
              await apiService.updateBountyTransaction(
                id, 
                txId, 
                'reject',
                contractBountyId !== null && contractBountyId !== undefined ? String(contractBountyId) : null
              );
              console.log('✅ Transaction ID and contractId stored successfully');
              if (originalToken) {
                apiService.setAuthToken(originalToken);
              } else {
                apiService.removeAuthToken();
              }
            } catch (txError) {
              console.warn('⚠️ Failed to store transaction ID:', txError);
              // Don't throw - transaction succeeded on-chain
            }
          }
          
          return txId;
        },
        style: 'btn-outline',
      },
      bounty.status === 'approved' && isFreelancer && {
        label: 'Claim payment',
        action: 'claim',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error('This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.');
          }

          // CRITICAL: Verify the connected wallet is the freelancer
          const accountNormalized = (account || '').toUpperCase().trim();
          const freelancerAddress = (bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address || '').toUpperCase().trim();
          
          if (accountNormalized !== freelancerAddress) {
            throw new Error(
              `Only the freelancer can claim this bounty.\n\n` +
              `Your address: ${account}\n` +
              `Freelancer address: ${bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address}\n\n` +
              `Please connect with the freelancer wallet to claim.`
            );
          }

          // CRITICAL: Verify bounty status is APPROVED on-chain before claiming
          console.log('🔍 Verifying bounty status on-chain before claim...');
          try {
            const bountyData = await contractUtils.getBountyFromBox(contractBountyId);
            if (bountyData) {
              const onChainStatus = bountyData.status;
              console.log(`[Claim] On-chain status: ${onChainStatus} (expected 2 for APPROVED)`);
              
              if (onChainStatus !== 2) { // STATUS_APPROVED = 2
                const statusText = onChainStatus === 0 ? 'OPEN' : 
                                  onChainStatus === 1 ? 'ACCEPTED' : 
                                  onChainStatus === 2 ? 'APPROVED' :
                                  onChainStatus === 3 ? 'CLAIMED' :
                                  onChainStatus === 4 ? 'REFUNDED' :
                                  onChainStatus === 5 ? 'REJECTED' :
                                  onChainStatus === 6 ? 'SUBMITTED' :
                                  `STATUS_${onChainStatus}`;
                throw new Error(
                  `Bounty must be approved before claiming.\n\n` +
                  `Current on-chain status: ${statusText} (${onChainStatus})\n` +
                  `Required status: APPROVED (2)\n\n` +
                  `The client or verifier must approve the work before you can claim payment.`
                );
              }
              
              // Verify freelancer address matches
              const onChainFreelancer = (bountyData.freelancerAddress || '').toUpperCase().trim();
              if (onChainFreelancer && onChainFreelancer !== accountNormalized) {
                throw new Error(
                  `Freelancer address mismatch.\n\n` +
                  `Your address: ${account}\n` +
                  `On-chain freelancer: ${bountyData.freelancerAddress}\n\n` +
                  `Only the freelancer who accepted the bounty can claim it.`
                );
              }
              
              console.log('✅ Bounty verified on-chain - status is APPROVED and freelancer matches');
            }
          } catch (verifyError) {
            console.warn('⚠️ Could not verify on-chain status, but proceeding with claim:', verifyError.message);
            // Continue - contract will validate
          }

          // Call contract FIRST (transfers funds to freelancer)
          // The contract will validate status and sender
          console.log('📤 Calling smart contract to claim bounty with contract ID:', contractBountyId);
          console.log('📤 Sender (must be freelancer):', account);
          console.log('📤 Freelancer address from DB:', freelancerAddress);
          
          let txId = null;
          try {
            txId = await claimBounty(contractBountyId, freelancerAddress);
            console.log('✅ Contract transaction successful:', txId);
          } catch (contractError) {
            console.error('❌ Contract error:', contractError);
            // Provide helpful error message
            if (contractError.message?.includes('logic eval error') || contractError.message?.includes('err opcode')) {
              throw new Error(
                `Smart contract rejected the claim transaction.\n\n` +
                `This usually means:\n` +
                `- The bounty status is not APPROVED on-chain\n` +
                `- The connected wallet is not the freelancer\n` +
                `- The bounty may have already been claimed\n\n` +
                `Please verify:\n` +
                `- You are connected with the freelancer wallet\n` +
                `- The bounty has been approved by the client/verifier\n` +
                `- The bounty has not already been claimed\n\n` +
                `Error: ${contractError.message}`
              );
            }
            throw contractError;
          }
          
          // Update backend AFTER successful contract transaction
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          try {
            console.log('📤 Updating backend after successful contract transaction...');
            await apiService.claimBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error updating backend:', apiError);
            // Don't throw - the contract transaction succeeded, backend update is secondary
            console.warn('⚠️ Contract transaction succeeded but backend update failed. Status may be out of sync.');
          } finally {
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
          }
          
          // Store transaction ID and contractId in database
          if (txId) {
            try {
              const originalToken = apiService.getAuthToken();
              apiService.setAuthToken(account);
              await apiService.updateBountyTransaction(
                id, 
                txId, 
                'claim',
                contractBountyId !== null && contractBountyId !== undefined ? String(contractBountyId) : null
              );
              console.log('✅ Transaction ID and contractId stored successfully');
              if (originalToken) {
                apiService.setAuthToken(originalToken);
              } else {
                apiService.removeAuthToken();
              }
            } catch (txError) {
              console.warn('⚠️ Failed to store transaction ID:', txError);
              // Don't throw - transaction succeeded on-chain
            }
          }
          
          return txId;
        },
        style: 'btn-secondary',
      },
      (bounty.status === 'open' || bounty.status === 'accepted') && (isClient || isVerifier) && {
        label: 'Initiate refund',
        action: 'refund',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error('This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.');
          }

          // Set auth token for API call
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          try {
            // First update backend
            console.log('📤 Calling API to refund bounty with ID:', apiBountyId);
            await apiService.refundBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error:', apiError);
            throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
          } finally {
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
          }
          // Then call contract
          console.log('📤 Calling smart contract to refund bounty with contract ID:', contractBountyId);
          const txId = await refundBounty(contractBountyId);
          console.log('✅ Contract transaction successful:', txId);
          return txId;
        },
        style: 'btn-outline',
      },
    ].filter(Boolean);
  }, [bounty, id, account, isConnected, acceptBounty, submitBounty, approveBounty, rejectBounty, claimBounty, refundBounty]);

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

  const handleAction = async (action) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const selected = actions.find((item) => item.action === action);
    if (!selected) return;

    try {
      setActionLoading(true);
      const txId = await selected.handler();
            // Show success message based on action
            if (action === 'approve') {
              alert(`✅ Work approved and payment sent!\n\n` +
                `Funds have been transferred from escrow to the freelancer's wallet.\n\n` +
                `Transaction ID: ${txId}`);
            } else {
              alert(`Success! Transaction ID: ${txId}`);
            }
            // Reload bounty data after action
            const bountyData = await apiService.getBounty(id);
            // V2 Contract: Creator is also the verifier (no separate verifier)
            const clientAddr = bountyData.clientAddress || bountyData.client_address;
            const verifierAddr = bountyData.verifierAddress || bountyData.verifier_address || clientAddr;
            
            setBounty({
              ...bountyData,
              client: clientAddr,
              freelancer: bountyData.freelancerAddress || bountyData.freelancer_address,
              verifier: verifierAddr, // Use client address if verifier is not set (V2 contract: creator = verifier)
            });
    } catch (error) {
      console.error(`Failed to ${action} bounty:`, error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Unknown error occurred';
      
      // Check for pending transaction error
      if (errorMessage.toLowerCase().includes('pending') && errorMessage.toLowerCase().includes('pera wallet')) {
        errorMessage = 'Another transaction is pending in Pera Wallet.\n\n' +
          'How to fix this:\n' +
          '1. Open your Pera Wallet mobile app (or browser extension)\n' +
          '2. Check for any pending transaction requests\n' +
          '3. Either approve or cancel the pending transaction\n' +
          '4. Wait a few seconds, then try again\n\n' +
          'Tip: Make sure your Pera Wallet is unlocked and connected.';
      } else if (errorMessage.toLowerCase().includes('unavailable account')) {
        errorMessage = 'Smart contract cannot access required account.\n\n' +
          'This may happen if:\n' +
          '1. The bounty has not been accepted yet (for approve/reject actions)\n' +
          '2. The bounty data is corrupted\n\n' +
          'Please refresh the page and try again. If the issue persists, contact support.';
      } else if (errorMessage.toLowerCase().includes('reject') || errorMessage.toLowerCase().includes('cancel')) {
        errorMessage = 'Transaction was cancelled. You can try again when ready.';
      } else if (errorMessage.toLowerCase().includes('insufficient')) {
        errorMessage = 'Insufficient funds to complete this transaction.\n\n' +
          'Make sure you have enough ALGO to cover:\n' +
          '• The transaction amount\n' +
          '• Transaction fees (~0.001 ALGO)\n' +
          '• Minimum balance requirement (0.1 ALGO)';
      }
      
      alert(`Failed to ${action} bounty:\n\n${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    
    if (!isConnected || !account) {
      alert('Please connect your wallet first');
      return;
    }

    // Normalize addresses for comparison (case-insensitive, trimmed)
    const accountNormalized = (account || '').toUpperCase().trim();
    const freelancerNormalized = ((bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address) || '').toUpperCase().trim();
    
    console.log('🔍 Checking freelancer match for submission:', {
      account: accountNormalized,
      freelancer: freelancerNormalized,
      match: accountNormalized === freelancerNormalized,
      bountyFreelancer: bounty.freelancer,
      bountyFreelancerAddress: bounty.freelancerAddress,
      bountyFreelancer_address: bounty.freelancer_address
    });

    if (!freelancerNormalized || accountNormalized !== freelancerNormalized) {
      console.error('❌ Freelancer address mismatch:', {
        account: accountNormalized,
        freelancer: freelancerNormalized
      });
      alert(`Only the freelancer who accepted this bounty can submit work.\n\nYour address: ${account}\nFreelancer address: ${bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address}`);
      return;
    }

    try {
      setSubmittingWork(true);
      
      // Set auth token for API call (wallet address as Bearer token)
      const originalToken = apiService.getAuthToken();
      apiService.setAuthToken(account);
      
      const contractBountyId = bounty.contractId ? parseInt(bounty.contractId) : null;
      const hasValidContractId = contractBountyId !== null && !isNaN(contractBountyId);
      
      if (!hasValidContractId) {
        throw new Error('This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.');
      }

      const linksArray = submissionData.links
        ? submissionData.links.split(',').map(link => link.trim()).filter(link => link)
        : [];

      // First update backend
      let response;
      try {
        response = await apiService.submitWork(bounty.contractId || id, {
          description: submissionData.description,
          links: linksArray
        });
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

      // Then call smart contract
      console.log('📤 Calling smart contract to submit bounty with contract ID:', contractBountyId);
      console.log('⚠️ Pera Wallet should open now for transaction signing');
      
      try {
        const txId = await submitBounty(contractBountyId);
        console.log('✅ Contract transaction successful:', txId);
        
        // Store transaction ID in database
        if (txId) {
          try {
            apiService.setAuthToken(account);
            await apiService.updateBountyTransaction(id, txId, 'submit');
            console.log('✅ Transaction ID stored in database:', txId);
          } catch (txError) {
            console.error('❌ Failed to store transaction ID:', txError);
            // Don't fail the whole submission if transaction ID storage fails
          } finally {
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
          }
        }

        // Show success popup instead of alert
        setShowSubmissionSuccess(true);
        setSubmissionTxId(txId);
        setShowSubmissionForm(false);
        setSubmissionData({ description: '', links: '' });
        
        // Reload bounty data to show submission
        const bountyData = await apiService.getBounty(id);
        // V2 Contract: Creator is also the verifier (no separate verifier)
        const clientAddr = bountyData.clientAddress || bountyData.client_address;
        const verifierAddr = bountyData.verifierAddress || bountyData.verifier_address || clientAddr;
        
        setBounty({
          ...bountyData,
          client: clientAddr,
          freelancer: bountyData.freelancerAddress || bountyData.freelancer_address,
          verifier: verifierAddr, // Use client address if verifier is not set (V2 contract: creator = verifier)
        });
      } catch (contractError) {
        console.error('❌ Smart contract submission failed:', contractError);
        
        // Provide more specific error messages
        let errorMessage = contractError.message || 'Unknown error';
        
        if (errorMessage.includes('box not found')) {
          errorMessage = `Bounty box not found on blockchain.\n\n` +
            `The bounty may exist (contract has ${contractBountyId + 1} bounties), but the box cannot be read.\n\n` +
            `Possible causes:\n` +
            `- Indexer delay (wait a few seconds and try again)\n` +
            `- Network connectivity issues\n` +
            `- The box may not have been created properly during bounty creation\n\n` +
            `Please try refreshing the page and waiting a few seconds before trying again.`;
        } else if (errorMessage.includes('not found')) {
          errorMessage = `Bounty not found on blockchain.\n\n` +
            `Bounty ID: ${contractBountyId}\n` +
            `The bounty may not have been created on-chain yet.\n\n` +
            `Please verify the bounty was successfully created.`;
        } else if (errorMessage.includes('cancelled') || errorMessage.includes('rejected')) {
          errorMessage = `Transaction signing was cancelled.\n\n` +
            `Please try again and make sure to approve the transaction in Pera Wallet.`;
        } else if (errorMessage.includes('ACCEPTED')) {
          errorMessage = `Cannot submit work: Bounty must be in ACCEPTED status.\n\n` +
            `Please ensure you have accepted this bounty before submitting work.`;
        } else if (errorMessage.includes('freelancer')) {
          errorMessage = `Only the freelancer who accepted this bounty can submit work.\n\n` +
            `Please ensure you are using the correct wallet address that accepted the bounty.`;
        }
        
        alert(`Failed to submit work: ${errorMessage}`);
        throw contractError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('❌ Failed to submit work:', error);
      
      // The error message should already be user-friendly from the try-catch above
      // But if it somehow reaches here, show the error
      if (!error.message || (!error.message.includes('box not found') && 
          !error.message.includes('cancelled') && 
          !error.message.includes('rejected'))) {
        alert(`Failed to submit work: ${error.message || 'Unknown error'}\n\n` +
          `Please check the browser console for more details.`);
      }
      // If the error message was already shown in the alert above, don't show it again
    } finally {
      setSubmittingWork(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card mx-auto max-w-4xl p-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-secondary-300"></div>
        <p className="mt-4 text-sm text-white/60">Syncing bounty details from the blockchain…</p>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="glass-card mx-auto max-w-3xl p-12 text-center">
        <h2 className="text-2xl font-semibold text-white">Bounty not found</h2>
        <p className="mt-3 text-sm text-white/60">This bounty may have been closed or the ID is invalid.</p>
      </div>
    );
  }

  const statusStyle = statusStyles[bounty.status] || statusStyles.open;
  
  // Check if contract ID is missing
  const hasValidContractId = bounty.contractId || bounty.contract_id;
  const contractIdMissing = !hasValidContractId;

  return (
    <div className="space-y-10">
      {contractIdWarning && (
        <div className="glass-card rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-200 mb-1">Contract ID Missing</h3>
              <p className="text-sm text-yellow-200/80">{contractIdWarning}</p>
              {bounty && (
                <div className="mt-4 text-xs text-yellow-200/60 space-y-1">
                  <p><strong>Bounty Details:</strong></p>
                  <p>- Client: {bounty.client || bounty.clientAddress || bounty.client_address || 'N/A'}</p>
                  <p>- Amount: {bounty.amount} ALGO ({Math.round(parseFloat(bounty.amount || 0) * 1000000)} microAlgos)</p>
                  <p>- Title: {bounty.title || 'N/A'}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setContractIdWarning(null)}
              className="flex-shrink-0 text-yellow-400 hover:text-yellow-300"
              aria-label="Close warning"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <section className="glass-card glow-border p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="tag">Bounty #{bounty.id || '—'}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${statusStyle.badge}`}>
                {statusStyle.label}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">{bounty.title}</h1>
            <p className="text-sm text-white/60">{bounty.description}</p>
            <div className="glass-panel grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Client</p>
                <p className="mt-2 font-medium text-white">{formatAddress(bounty.client)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Created</p>
                <p className="mt-2 font-medium text-white">{formatDate(bounty.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Deadline</p>
                <p className="mt-2 font-medium text-white">{formatDate(bounty.deadline)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-right">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Reward</p>
              <p className="mt-3 text-4xl font-semibold text-white">{bounty.amount} ALGO</p>
              <p className="text-xs text-white/45">Secured in escrow</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              {actions.length === 0 ? (
                <span className="text-xs text-white/45">No actions available at this stage.</span>
              ) : (
                actions.map(({ action, label, style }) => (
                  <button
                    key={action}
                    type="button"
                    className={`${style} text-sm`}
                    onClick={() => handleAction(action)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing…' : label}
                  </button>
                ))
              )}
            </div>
            <p className="text-xs text-white/40">Viewer wallet: {account ? formatAddress(account) : 'Not connected'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-8">
          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold text-white">Requirements</h2>
            <p className="mt-2 text-sm text-white/60">
              Meet each requirement to ensure approval and instant payout. All checkpoints are recorded on-chain for transparency.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-white/70">
              {bounty.requirements && bounty.requirements.length > 0 ? (
                bounty.requirements.map((requirement, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-secondary-400"></span>
                    <span>{requirement}</span>
                  </li>
                ))
              ) : (
                <li className="text-white/50">No specific requirements listed.</li>
              )}
            </ul>
          </div>

          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold text-white">On-chain timeline</h2>
            <p className="mt-2 text-sm text-white/60">
              Status transitions and relevant wallet signatures are logged automatically. Use them to resolve disputes quickly.
            </p>
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-primary-500"></div>
                <div>
                  <p className="text-sm font-semibold text-white">Bounty created</p>
                  <p className="text-xs text-white/50">{formatDate(bounty.createdAt)}</p>
                </div>
              </div>
              {bounty.status !== 'open' && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-3 w-3 rounded-full bg-secondary-400"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Accepted by contributor</p>
                    <p className="text-xs text-white/50">
                      {bounty.freelancer ? formatAddress(bounty.freelancer) : 'Awaiting signer'}
                    </p>
                  </div>
                </div>
              )}
              {bounty.status === 'approved' && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-3 w-3 rounded-full bg-accent-400"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Work approved</p>
                    <p className="text-xs text-white/50">Payment ready for claim</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-white/30"></div>
                <div>
                  <p className="text-sm font-semibold text-white">Deadline</p>
                  <p className="text-xs text-white/50">{formatDate(bounty.deadline)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold text-white">Role summary</h2>
            <div className="mt-5 space-y-4 text-sm text-white/70">
              <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Client</p>
                <p className="mt-2 text-white">{formatAddress(bounty.client)}</p>
              </div>
              <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Verifier</p>
                <p className="mt-2 text-white">
                  {bounty.verifier ? formatAddress(bounty.verifier) : 'Pending assignment'}
                </p>
              </div>
              <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Freelancer</p>
                <p className="mt-2 text-white">
                  {bounty.freelancer ? formatAddress(bounty.freelancer) : 'Not yet accepted'}
                </p>
              </div>
            </div>
          </div>

          {bounty.status === 'accepted' && (() => {
            const accountNormalized = (account || '').toUpperCase().trim();
            const freelancerNormalized = ((bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address) || '').toUpperCase().trim();
            return accountNormalized === freelancerNormalized;
          })() && (
            <div className="glass-card glow-border p-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Submit Your Work</h3>
              {!showSubmissionForm ? (
                <>
                  <p className="mt-3 text-sm text-white/65">
                    Share your completed work, including GitHub repositories, design files, or documentation links.
                  </p>
                  <button
                    onClick={() => setShowSubmissionForm(true)}
                    className="btn-primary mt-4 text-sm"
                  >
                    Submit Work
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmitWork} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.32em] text-white/40 mb-2">
                      Description
                    </label>
                    <textarea
                      value={submissionData.description}
                      onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                      placeholder="Describe your work, what you've completed, and any important notes..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.32em] text-white/40 mb-2">
                      Links (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={submissionData.links}
                      onChange={(e) => setSubmissionData({ ...submissionData, links: e.target.value })}
                      placeholder="https://github.com/..., https://example.com/..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                    />
                    <p className="mt-1 text-xs text-white/40">Separate multiple links with commas</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingWork}
                      className="btn-primary text-sm flex-1 disabled:opacity-50"
                    >
                      {submittingWork ? 'Submitting...' : 'Submit Work'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubmissionForm(false);
                        setSubmissionData({ description: '', links: '' });
                      }}
                      className="btn-outline text-sm"
                      disabled={submittingWork}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          
          {(bounty.status !== 'accepted' || (() => {
            const accountNormalized = (account || '').toUpperCase().trim();
            const freelancerNormalized = ((bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address) || '').toUpperCase().trim();
            return accountNormalized !== freelancerNormalized;
          })()) && (
            <div className="glass-card glow-border p-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Need to submit?</h3>
              <p className="mt-3 text-sm text-white/65">
                Share GitHub repositories, design files, or documentation links in your submission payload. Keep logs and proof of work for faster verification.
              </p>
              <ul className="mt-6 space-y-3 text-xs text-white/50">
                <li className="flex gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                  Pin large files and share IPFS / Arweave hashes.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                  Include quick Loom or Figma walkthroughs for context.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                  Document anything the verifier must confirm before release.
                </li>
              </ul>
            </div>
          )}
          
          {bounty.submissions && bounty.submissions.length > 0 && (
            <div className="glass-panel p-8">
              <h2 className="text-xl font-semibold text-white">Submissions</h2>
              <div className="mt-4 space-y-4">
                {bounty.submissions.map((submission, index) => (
                  <div key={index} className="glass-card rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.32em] text-white/40 mb-2">
                      Submission #{index + 1}
                    </p>
                    <p className="text-sm text-white/70 mb-3">{submission.description}</p>
                    {submission.links && submission.links.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-white/40 mb-2">Links</p>
                        <ul className="space-y-1">
                          {submission.links.map((link, linkIndex) => (
                            <li key={linkIndex}>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-300 hover:text-primary-200 underline"
                              >
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-white/40 mt-3">
                      Submitted by: {formatAddress(submission.freelancerAddress || bounty.freelancer)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      {/* Submission Success Modal */}
      {showSubmissionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card mx-4 w-full max-w-md p-8">
            <div className="space-y-6">
              {/* Success Icon */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-500 to-accent-500 text-white text-3xl shadow-glow">
                  ✅
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">Work Submitted!</h2>
                <p className="mt-2 text-sm text-white/60">
                  Your submission has been successfully recorded on the blockchain. The client will review your work.
                </p>
              </div>

              {/* Transaction ID */}
              {submissionTxId && (
                <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-white/40">Transaction ID</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 overflow-hidden text-ellipsis text-xs text-white/80">{submissionTxId}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(submissionTxId);
                        alert('Transaction ID copied to clipboard!');
                      }}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                    >
                      Copy
                    </button>
                  </div>
                  <a
                    href={`https://testnet.algoexplorer.io/tx/${submissionTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-xs text-secondary-300 hover:text-secondary-200"
                  >
                    View on AlgoExplorer
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setShowSubmissionSuccess(false);
                  setSubmissionTxId(null);
                }}
                className="btn-primary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BountyDetail;
