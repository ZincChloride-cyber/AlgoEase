# AlgoEase Smart Contract Documentation

## Overview

The AlgoEase smart contract is a PyTeal-based escrow system that enables trustless payments between clients and freelancers. The contract manages the complete lifecycle of bounties from creation to completion.

## Contract Architecture

### Global State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `bounty_count` | uint64 | Number of bounties created |
| `client_addr` | bytes | Address of the client who created the bounty |
| `freelancer_addr` | bytes | Address of the freelancer who accepted the bounty |
| `amount` | uint64 | Amount of ALGO in microAlgos |
| `deadline` | uint64 | Unix timestamp deadline |
| `status` | uint64 | Current status of the bounty |
| `task_desc` | bytes | Description of the task |
| `verifier_addr` | bytes | Address of the verifier |

### Status Constants

| Status | Value | Description |
|--------|-------|-------------|
| `STATUS_OPEN` | 0 | Bounty is open for acceptance |
| `STATUS_ACCEPTED` | 1 | Freelancer has accepted the bounty |
| `STATUS_APPROVED` | 2 | Work has been approved by verifier |
| `STATUS_CLAIMED` | 3 | Payment has been claimed by freelancer |
| `STATUS_REFUNDED` | 4 | Funds have been refunded to client |

## Contract Methods

### create_bounty()

Creates a new bounty and locks funds in escrow.

**Parameters:**
- `amount` (uint64): Amount in microAlgos
- `deadline` (uint64): Unix timestamp deadline
- `task_description` (bytes): Description of the task
- `verifier_address` (address): Address of the verifier

**Requirements:**
- Caller must be the client
- Contract must not have an active bounty
- Payment transaction must accompany the call

**State Changes:**
- Sets client address, amount, deadline, task description, verifier
- Updates status to `STATUS_OPEN`
- Increments bounty count

### accept_bounty()

Allows a freelancer to accept an open bounty.

**Parameters:** None

**Requirements:**
- Bounty must be in `STATUS_OPEN`
- Deadline must not have passed
- Caller must not be the client

**State Changes:**
- Sets freelancer address
- Updates status to `STATUS_ACCEPTED`

### approve_bounty()

Allows the verifier to approve completed work.

**Parameters:** None

**Requirements:**
- Bounty must be in `STATUS_ACCEPTED`
- Caller must be the verifier

**State Changes:**
- Updates status to `STATUS_APPROVED`

### claim()

Allows the freelancer to claim approved funds.

**Parameters:** None

**Requirements:**
- Bounty must be in `STATUS_APPROVED`
- Caller must be the freelancer

**State Changes:**
- Sends payment to freelancer via inner transaction
- Updates status to `STATUS_CLAIMED`

### refund()

Refunds funds to the client.

**Parameters:** None

**Requirements:**
- Bounty must not be claimed or already refunded
- One of the following conditions must be met:
  - Deadline has passed
  - Caller is the client (manual refund)
  - Caller is the verifier (rejection)

**State Changes:**
- Sends refund to client via inner transaction
- Updates status to `STATUS_REFUNDED`

## Transaction Flow

### 1. Bounty Creation
```
Client → create_bounty() + Payment Transaction
```

### 2. Bounty Acceptance
```
Freelancer → accept_bounty()
```

### 3. Work Approval
```
Verifier → approve_bounty()
```

### 4. Payment Claim
```
Freelancer → claim()
Contract → Inner Payment Transaction → Freelancer
```

### 5. Refund (if needed)
```
Client/Verifier → refund()
Contract → Inner Payment Transaction → Client
```

## Security Considerations

### Access Control
- Only authorized addresses can perform specific actions
- Client can only create and refund bounties
- Freelancer can only accept and claim bounties
- Verifier can only approve or reject bounties

### Deadline Enforcement
- Automatic refunds if deadline passes
- Prevents indefinite fund locking

### State Validation
- Proper state transitions prevent invalid operations
- Status checks ensure operations are performed in correct order

### Inner Transactions
- Secure fund transfers within the contract
- Atomic operations ensure consistency

## Error Handling

The contract includes comprehensive error handling:

- **Invalid State**: Operations fail if bounty is in wrong status
- **Access Denied**: Operations fail if caller is not authorized
- **Deadline Passed**: Operations fail if deadline has passed
- **Invalid Parameters**: Operations fail if parameters are invalid

## Gas Optimization

The contract is optimized for minimal gas usage:

- Efficient state management
- Minimal storage operations
- Optimized inner transactions
- Compact bytecode

## Testing

### Unit Tests
- Test each method individually
- Verify state transitions
- Test error conditions

### Integration Tests
- Test complete workflows
- Test with real transactions
- Test edge cases

### Security Tests
- Test access controls
- Test deadline enforcement
- Test state validation

## Deployment

### Testnet Deployment
```bash
python scripts/deploy.py testnet
```

### Mainnet Deployment
```bash
python scripts/deploy.py mainnet
```

### Verification
After deployment, verify the contract:
1. Check application ID
2. Verify global state
3. Test basic functionality
4. Confirm fund management

## Monitoring

### Key Metrics
- Number of active bounties
- Total volume processed
- Average completion time
- Refund rate

### Alerts
- Failed transactions
- Unusual activity patterns
- Contract balance monitoring

## Upgrades

The contract is designed to be upgradeable:

1. **State Migration**: Preserve existing state
2. **Backward Compatibility**: Maintain existing functionality
3. **Gradual Rollout**: Deploy to testnet first
4. **User Communication**: Notify users of changes

## Best Practices

### For Clients
- Set realistic deadlines
- Provide clear task descriptions
- Choose appropriate verifiers
- Monitor bounty status

### For Freelancers
- Only accept bounties you can complete
- Submit work before deadline
- Provide clear deliverables
- Communicate with clients

### For Verifiers
- Review work thoroughly
- Approve or reject promptly
- Provide constructive feedback
- Maintain impartiality
