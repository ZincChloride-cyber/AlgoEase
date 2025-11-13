"""
AlgoEase Smart Contract V3 - Simplified Redesigned Escrow Platform

This is a cleaner, simpler version that fixes authorization issues.
It supports one active bounty at a time, but allows creating new bounties
after the previous one is completed (claimed or refunded).

Key improvements:
- Clear authorization rules for all operations
- Fixed refund authorization logic
- Simplified state management
- Better error handling
"""

from pyteal import *

# ============================================================================
# Global State Keys
# ============================================================================
BOUNTY_COUNT = Bytes("bounty_count")
CLIENT_ADDR = Bytes("client_addr")
FREELANCER_ADDR = Bytes("freelancer_addr")
AMOUNT = Bytes("amount")
DEADLINE = Bytes("deadline")
STATUS = Bytes("status")
TASK_DESCRIPTION = Bytes("task_desc")
VERIFIER_ADDR = Bytes("verifier_addr")

# ============================================================================
# Status Constants
# ============================================================================
STATUS_OPEN = Int(0)
STATUS_ACCEPTED = Int(1)
STATUS_APPROVED = Int(2)
STATUS_CLAIMED = Int(3)
STATUS_REFUNDED = Int(4)

ZERO_ADDR = Global.zero_address()

# ============================================================================
# Main Approval Program
# ============================================================================

def approval_program():
    """Main approval program"""
    return Cond(
        [Txn.application_id() == Int(0), handle_creation()],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deletion()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],  # Immutable
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop()],
    )

def handle_creation():
    """Initialize contract on creation"""
    return Seq([
        App.globalPut(BOUNTY_COUNT, Int(0)),
        App.globalPut(CLIENT_ADDR, ZERO_ADDR),
        App.globalPut(FREELANCER_ADDR, ZERO_ADDR),
        App.globalPut(VERIFIER_ADDR, ZERO_ADDR),
        App.globalPut(AMOUNT, Int(0)),
        App.globalPut(DEADLINE, Int(0)),
        App.globalPut(STATUS, STATUS_REFUNDED),  # Start with no active bounty
        App.globalPut(TASK_DESCRIPTION, Bytes("")),
        Return(Int(1))
    ])

def handle_deletion():
    """Prevent deletion if there are active funds"""
    return Seq([
        Assert(App.globalGet(AMOUNT) == Int(0)),
        Return(Int(1))
    ])

def handle_noop():
    """Handle application calls"""
    method = Txn.application_args[0]
    return Cond(
        [method == Bytes("create_bounty"), create_bounty()],
        [method == Bytes("accept_bounty"), accept_bounty()],
        [method == Bytes("approve_bounty"), approve_bounty()],
        [method == Bytes("claim"), claim_bounty()],
        [method == Bytes("refund"), refund_bounty()],
        [method == Bytes("auto_refund"), auto_refund()],
    )

# ============================================================================
# Bounty Operations
# ============================================================================

def create_bounty():
    """
    Create a new bounty.
    Requires grouped transaction:
    - Gtxn[0]: Payment from client to contract address
    - Gtxn[1]: Application call with args: [method, amount, deadline, task_desc]
               and accounts: [verifier_addr]
    """
    amount = ScratchVar(TealType.uint64)
    deadline = ScratchVar(TealType.uint64)
    current_status = ScratchVar(TealType.uint64)
    
    return Seq([
        # Validate transaction group
        Assert(Global.group_size() == Int(2)),
        Assert(Txn.group_index() == Int(1)),
        
        # Validate arguments
        Assert(Txn.application_args.length() == Int(4)),
        Assert(Txn.accounts.length() >= Int(1)),  # Verifier address required
        
        # Validate payment transaction
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[0].sender() == Txn.sender()),
        Assert(Gtxn[0].receiver() == Global.current_application_address()),
        
        # Parse arguments
        amount.store(Btoi(Txn.application_args[1])),
        deadline.store(Btoi(Txn.application_args[2])),
        
        # Validate amount
        Assert(amount.load() > Int(0)),
        Assert(Gtxn[0].amount() == amount.load()),
        
        # Validate deadline
        Assert(deadline.load() > Global.latest_timestamp()),
        
        # Check if we can create a new bounty (previous one must be claimed or refunded)
        current_status.store(App.globalGet(STATUS)),
        Assert(Or(
            current_status.load() == STATUS_CLAIMED,
            current_status.load() == STATUS_REFUNDED,
            App.globalGet(AMOUNT) == Int(0)  # Or no active funds
        )),
        
        # Create bounty
        App.globalPut(CLIENT_ADDR, Txn.sender()),
        App.globalPut(AMOUNT, amount.load()),
        App.globalPut(DEADLINE, deadline.load()),
        App.globalPut(TASK_DESCRIPTION, Txn.application_args[3]),
        App.globalPut(VERIFIER_ADDR, Txn.accounts[0]),
        App.globalPut(FREELANCER_ADDR, ZERO_ADDR),
        App.globalPut(STATUS, STATUS_OPEN),
        App.globalPut(BOUNTY_COUNT, App.globalGet(BOUNTY_COUNT) + Int(1)),
        
        Return(Int(1))
    ])

def accept_bounty():
    """
    Accept a bounty (freelancer commits to work).
    Args: [method]
    """
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check status is OPEN
        Assert(App.globalGet(STATUS) == STATUS_OPEN),
        
        # Check deadline hasn't passed
        Assert(Global.latest_timestamp() < App.globalGet(DEADLINE)),
        
        # Check freelancer is not zero address
        Assert(Txn.sender() != ZERO_ADDR),
        
        # Check freelancer is not the client
        Assert(Txn.sender() != App.globalGet(CLIENT_ADDR)),
        
        # Set freelancer and update status
        App.globalPut(FREELANCER_ADDR, Txn.sender()),
        App.globalPut(STATUS, STATUS_ACCEPTED),
        
        Return(Int(1))
    ])

def approve_bounty():
    """
    Approve bounty completion (verifier only).
    Args: [method]
    """
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check status is ACCEPTED
        Assert(App.globalGet(STATUS) == STATUS_ACCEPTED),
        
        # Check caller is verifier
        Assert(Txn.sender() == App.globalGet(VERIFIER_ADDR)),
        
        # Update status to APPROVED
        App.globalPut(STATUS, STATUS_APPROVED),
        
        Return(Int(1))
    ])

def claim_bounty():
    """
    Claim bounty payment (freelancer only, after approval).
    Args: [method]
    """
    amount = ScratchVar(TealType.uint64)
    freelancer = ScratchVar(TealType.bytes)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check status is APPROVED
        Assert(App.globalGet(STATUS) == STATUS_APPROVED),
        
        # Get freelancer and amount
        freelancer.store(App.globalGet(FREELANCER_ADDR)),
        amount.store(App.globalGet(AMOUNT)),
        
        # Check caller is freelancer
        Assert(Txn.sender() == freelancer.load()),
        Assert(amount.load() > Int(0)),
        
        # Send payment to freelancer
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.sender: Global.current_application_address(),
            TxnField.receiver: freelancer.load(),
            TxnField.amount: amount.load(),
            TxnField.fee: Int(0),
        }),
        InnerTxnBuilder.Submit(),
        
        # Update status to CLAIMED and clear amount
        App.globalPut(STATUS, STATUS_CLAIMED),
        App.globalPut(AMOUNT, Int(0)),
        
        Return(Int(1))
    ])

def refund_bounty():
    """
    Manual refund (client or verifier only, BEFORE deadline).
    Args: [method]
    """
    amount = ScratchVar(TealType.uint64)
    client = ScratchVar(TealType.bytes)
    deadline = ScratchVar(TealType.uint64)
    current_status = ScratchVar(TealType.uint64)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check status is not CLAIMED or REFUNDED
        current_status.store(App.globalGet(STATUS)),
        Assert(current_status.load() != STATUS_CLAIMED),
        Assert(current_status.load() != STATUS_REFUNDED),
        
        # Check deadline hasn't passed (manual refund only before deadline)
        deadline.store(App.globalGet(DEADLINE)),
        Assert(Global.latest_timestamp() < deadline.load()),
        
        # Get client
        client.store(App.globalGet(CLIENT_ADDR)),
        
        # Check caller is client OR verifier
        Assert(Or(
            Txn.sender() == client.load(),
            Txn.sender() == App.globalGet(VERIFIER_ADDR)
        )),
        
        # Get amount
        amount.store(App.globalGet(AMOUNT)),
        Assert(amount.load() > Int(0)),
        
        # Send refund to client
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.sender: Global.current_application_address(),
            TxnField.receiver: client.load(),
            TxnField.amount: amount.load(),
            TxnField.fee: Int(0),
        }),
        InnerTxnBuilder.Submit(),
        
        # Update status to REFUNDED and clear amount
        App.globalPut(STATUS, STATUS_REFUNDED),
        App.globalPut(AMOUNT, Int(0)),
        
        Return(Int(1))
    ])

def auto_refund():
    """
    Automatic refund when deadline has passed (ANYONE can call).
    Args: [method]
    """
    amount = ScratchVar(TealType.uint64)
    client = ScratchVar(TealType.bytes)
    deadline = ScratchVar(TealType.uint64)
    current_status = ScratchVar(TealType.uint64)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check status is not CLAIMED or REFUNDED
        current_status.store(App.globalGet(STATUS)),
        Assert(current_status.load() != STATUS_CLAIMED),
        Assert(current_status.load() != STATUS_REFUNDED),
        
        # Check deadline HAS passed
        deadline.store(App.globalGet(DEADLINE)),
        Assert(Global.latest_timestamp() >= deadline.load()),
        
        # Get amount and client
        amount.store(App.globalGet(AMOUNT)),
        client.store(App.globalGet(CLIENT_ADDR)),
        Assert(amount.load() > Int(0)),
        
        # Send refund to client
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.sender: Global.current_application_address(),
            TxnField.receiver: client.load(),
            TxnField.amount: amount.load(),
            TxnField.fee: Int(0),
        }),
        InnerTxnBuilder.Submit(),
        
        # Update status to REFUNDED and clear amount
        App.globalPut(STATUS, STATUS_REFUNDED),
        App.globalPut(AMOUNT, Int(0)),
        
        Return(Int(1))
    ])

# ============================================================================
# Clear State Program
# ============================================================================

def clear_state_program():
    """Clear state program - allow opt-out"""
    return Return(Int(1))

# ============================================================================
# Compilation
# ============================================================================

if __name__ == "__main__":
    approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=8)
    clear_teal = compileTeal(clear_state_program(), mode=Mode.Application, version=8)

    with open("algoease_approval_v3.teal", "w") as f:
        f.write(approval_teal)

    with open("algoease_clear_v3.teal", "w") as f:
        f.write(clear_teal)

    print("Smart contracts compiled successfully!")
    print("Files created:")
    print("  - algoease_approval_v3.teal")
    print("  - algoease_clear_v3.teal")

