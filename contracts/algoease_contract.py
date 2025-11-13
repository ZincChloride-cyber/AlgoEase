"""
AlgoEase Smart Contract - Bounty Escrow Platform

This contract manages bounties with the following features:
- Create bounty: Client deposits funds to escrow
- Accept bounty: Freelancer accepts the bounty
- Approve bounty: Verifier approves completed work
- Reject bounty: Verifier rejects work and refunds to client
- Refund bounty: Manual refund by client or verifier
- Auto refund: Automatic refund when deadline passes

Uses box storage to support multiple concurrent bounties.
"""

from pyteal import *

# ============================================================================
# Global State Keys
# ============================================================================
BOUNTY_COUNT = Bytes("bounty_count")  # Counter for bounty IDs

# ============================================================================
# Status Constants
# ============================================================================
STATUS_OPEN = Int(0)
STATUS_ACCEPTED = Int(1)
STATUS_APPROVED = Int(2)
STATUS_CLAIMED = Int(3)
STATUS_REFUNDED = Int(4)
STATUS_REJECTED = Int(5)  # New status for rejected bounties

# ============================================================================
# Box Storage Layout (per bounty)
# ============================================================================
# Box name: "bounty_" + Itob(bounty_id) (8 bytes prefix + 8 bytes ID = 16 bytes)
# Box data (packed):
#   - client_addr: 32 bytes
#   - freelancer_addr: 32 bytes (zero address if not accepted)
#   - verifier_addr: 32 bytes
#   - amount: 8 bytes (uint64)
#   - deadline: 8 bytes (uint64)
#   - status: 1 byte (uint8)
#   - task_desc: variable length bytes
# Total: 113 bytes + task_desc length

BOX_PREFIX = Bytes("bounty_")
CLIENT_OFFSET = Int(0)
FREELANCER_OFFSET = Int(32)
VERIFIER_OFFSET = Int(64)
AMOUNT_OFFSET = Int(96)
DEADLINE_OFFSET = Int(104)
STATUS_OFFSET = Int(112)
TASK_DESC_OFFSET = Int(113)

ZERO_ADDR = Global.zero_address()

# ============================================================================
# Helper Functions
# ============================================================================

def get_bounty_box_name(bounty_id: Expr) -> Expr:
    """Generate box name: "bounty_" + Itob(bounty_id)"""
    return Concat(BOX_PREFIX, Itob(bounty_id))

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
        Return(Int(1))
    ])

def handle_deletion():
    """Prevent deletion if any bounties exist"""
    return Seq([
        Assert(App.globalGet(BOUNTY_COUNT) == Int(0)),
        Return(Int(1))
    ])

def handle_noop():
    """Handle application calls"""
    method = Txn.application_args[0]
    return Cond(
        [method == Bytes("create_bounty"), create_bounty()],
        [method == Bytes("accept_bounty"), accept_bounty()],
        [method == Bytes("approve_bounty"), approve_bounty()],
        [method == Bytes("reject_bounty"), reject_bounty()],
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
    bounty_id = ScratchVar(TealType.uint64)
    amount = ScratchVar(TealType.uint64)
    deadline = ScratchVar(TealType.uint64)
    box_name = ScratchVar(TealType.bytes)
    
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
        
        # Get new bounty ID
        bounty_id.store(App.globalGet(BOUNTY_COUNT)),
        box_name.store(get_bounty_box_name(bounty_id.load())),
        
        # Create bounty box with packed data
        App.box_put(
            box_name.load(),
            Concat(
                Txn.sender(),                    # client (32 bytes)
                BytesZero(Int(32)),              # freelancer (32 bytes, zero)
                Txn.accounts[0],                 # verifier (32 bytes)
                Itob(amount.load()),             # amount (8 bytes)
                Itob(deadline.load()),           # deadline (8 bytes)
                Itob(STATUS_OPEN),               # status (1 byte)
                Txn.application_args[3]          # task_desc (variable)
            )
        ),
        
        # Increment bounty counter
        App.globalPut(BOUNTY_COUNT, bounty_id.load() + Int(1)),
        
        Return(Int(1))
    ])

def accept_bounty():
    """
    Accept a bounty (freelancer commits to work).
    Args: [method, bounty_id]
    """
    bounty_id = ScratchVar(TealType.uint64)
    box_name = ScratchVar(TealType.bytes)
    box_value = App.box_get(get_bounty_box_name(Btoi(Txn.application_args[1])))
    box_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    deadline = ScratchVar(TealType.uint64)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(2)),
        
        # Parse bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        box_name.store(get_bounty_box_name(bounty_id.load())),
        
        # Read box (check exists and get value)
        Assert(box_value.hasValue()),
        box_data.store(box_value.value()),
        
        # Check status is OPEN
        status.store(Btoi(Extract(box_data.load(), STATUS_OFFSET, Int(1)))),
        Assert(status.load() == STATUS_OPEN),
        
        # Check deadline hasn't passed
        deadline.store(Btoi(Extract(box_data.load(), DEADLINE_OFFSET, Int(8)))),
        Assert(Global.latest_timestamp() < deadline.load()),
        
        # Check freelancer is not zero address
        Assert(Txn.sender() != ZERO_ADDR),
        
        # Check freelancer is not the client
        Assert(Txn.sender() != Extract(box_data.load(), CLIENT_OFFSET, Int(32))),
        
        # Update box with new freelancer and status
        App.box_put(
            box_name.load(),
            Concat(
                Extract(box_data.load(), CLIENT_OFFSET, Int(32)),
                Txn.sender(),  # new freelancer
                Extract(box_data.load(), VERIFIER_OFFSET, Int(32)),
                Extract(box_data.load(), AMOUNT_OFFSET, Int(8)),
                Extract(box_data.load(), DEADLINE_OFFSET, Int(8)),
                Itob(STATUS_ACCEPTED),  # new status
                Extract(box_data.load(), TASK_DESC_OFFSET, Len(box_data.load()) - TASK_DESC_OFFSET)
            )
        ),
        
        Return(Int(1))
    ])

def approve_bounty():
    """
    Approve bounty completion (verifier only).
    Args: [method, bounty_id]
    """
    bounty_id = ScratchVar(TealType.uint64)
    box_name = ScratchVar(TealType.bytes)
    box_value = App.box_get(get_bounty_box_name(Btoi(Txn.application_args[1])))
    box_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(2)),
        
        # Parse bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        box_name.store(get_bounty_box_name(bounty_id.load())),
        
        # Read box
        Assert(box_value.hasValue()),
        box_data.store(box_value.value()),
        
        # Check status is ACCEPTED
        status.store(Btoi(Extract(box_data.load(), STATUS_OFFSET, Int(1)))),
        Assert(status.load() == STATUS_ACCEPTED),
        
        # Check caller is verifier
        Assert(Txn.sender() == Extract(box_data.load(), VERIFIER_OFFSET, Int(32))),
        
        # Update box with new status
        App.box_put(
            box_name.load(),
            Concat(
                Extract(box_data.load(), CLIENT_OFFSET, Int(32)),
                Extract(box_data.load(), FREELANCER_OFFSET, Int(32)),
                Extract(box_data.load(), VERIFIER_OFFSET, Int(32)),
                Extract(box_data.load(), AMOUNT_OFFSET, Int(8)),
                Extract(box_data.load(), DEADLINE_OFFSET, Int(8)),
                Itob(STATUS_APPROVED),  # new status
                Extract(box_data.load(), TASK_DESC_OFFSET, Len(box_data.load()) - TASK_DESC_OFFSET)
            )
        ),
        
        Return(Int(1))
    ])

def reject_bounty():
    """
    Reject bounty completion (verifier only) - refunds to client.
    Args: [method, bounty_id]
    """
    bounty_id = ScratchVar(TealType.uint64)
    box_name = ScratchVar(TealType.bytes)
    box_value = App.box_get(get_bounty_box_name(Btoi(Txn.application_args[1])))
    box_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    amount = ScratchVar(TealType.uint64)
    client = ScratchVar(TealType.bytes)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(2)),
        
        # Parse bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        box_name.store(get_bounty_box_name(bounty_id.load())),
        
        # Read box
        Assert(box_value.hasValue()),
        box_data.store(box_value.value()),
        
        # Check status is ACCEPTED
        status.store(Btoi(Extract(box_data.load(), STATUS_OFFSET, Int(1)))),
        Assert(status.load() == STATUS_ACCEPTED),
        
        # Check caller is verifier
        Assert(Txn.sender() == Extract(box_data.load(), VERIFIER_OFFSET, Int(32))),
        
        # Get client and amount
        client.store(Extract(box_data.load(), CLIENT_OFFSET, Int(32))),
        amount.store(Btoi(Extract(box_data.load(), AMOUNT_OFFSET, Int(8)))),
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
        
        # Update box with new status
        App.box_put(
            box_name.load(),
            Concat(
                client.load(),
                Extract(box_data.load(), FREELANCER_OFFSET, Int(32)),
                Extract(box_data.load(), VERIFIER_OFFSET, Int(32)),
                Extract(box_data.load(), AMOUNT_OFFSET, Int(8)),
                Extract(box_data.load(), DEADLINE_OFFSET, Int(8)),
                Itob(STATUS_REJECTED),  # new status (rejected)
                Extract(box_data.load(), TASK_DESC_OFFSET, Len(box_data.load()) - TASK_DESC_OFFSET)
            )
        ),
        
        Return(Int(1))
    ])

def claim_bounty():
    """
    Claim bounty payment (freelancer only, after approval).
    Args: [method, bounty_id]
    """
    bounty_id = ScratchVar(TealType.uint64)
    box_name = ScratchVar(TealType.bytes)
    box_value = App.box_get(get_bounty_box_name(Btoi(Txn.application_args[1])))
    box_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    amount = ScratchVar(TealType.uint64)
    freelancer = ScratchVar(TealType.bytes)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(2)),
        
        # Parse bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        box_name.store(get_bounty_box_name(bounty_id.load())),
        
        # Read box
        Assert(box_value.hasValue()),
        box_data.store(box_value.value()),
        
        # Check status is APPROVED
        status.store(Btoi(Extract(box_data.load(), STATUS_OFFSET, Int(1)))),
        Assert(status.load() == STATUS_APPROVED),
        
        # Get freelancer and amount
        freelancer.store(Extract(box_data.load(), FREELANCER_OFFSET, Int(32))),
        amount.store(Btoi(Extract(box_data.load(), AMOUNT_OFFSET, Int(8)))),
        
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
        
        # Update box with new status
        App.box_put(
            box_name.load(),
            Concat(
                Extract(box_data.load(), CLIENT_OFFSET, Int(32)),
                freelancer.load(),
                Extract(box_data.load(), VERIFIER_OFFSET, Int(32)),
                Extract(box_data.load(), AMOUNT_OFFSET, Int(8)),
                Extract(box_data.load(), DEADLINE_OFFSET, Int(8)),
                Itob(STATUS_CLAIMED),  # new status
                Extract(box_data.load(), TASK_DESC_OFFSET, Len(box_data.load()) - TASK_DESC_OFFSET)
            )
        ),
        
        Return(Int(1))
    ])

def refund_bounty():
    """
    Manual refund (client or verifier only, before deadline).
    Args: [method, bounty_id]
    """
    bounty_id = ScratchVar(TealType.uint64)
    box_name = ScratchVar(TealType.bytes)
    box_value = App.box_get(get_bounty_box_name(Btoi(Txn.application_args[1])))
    box_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    amount = ScratchVar(TealType.uint64)
    client = ScratchVar(TealType.bytes)
    deadline = ScratchVar(TealType.uint64)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(2)),
        
        # Parse bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        box_name.store(get_bounty_box_name(bounty_id.load())),
        
        # Read box
        Assert(box_value.hasValue()),
        box_data.store(box_value.value()),
        
        # Check status is not CLAIMED, REFUNDED, or REJECTED
        status.store(Btoi(Extract(box_data.load(), STATUS_OFFSET, Int(1)))),
        Assert(status.load() != STATUS_CLAIMED),
        Assert(status.load() != STATUS_REFUNDED),
        Assert(status.load() != STATUS_REJECTED),
        
        # Check deadline hasn't passed (manual refund only before deadline)
        deadline.store(Btoi(Extract(box_data.load(), DEADLINE_OFFSET, Int(8)))),
        Assert(Global.latest_timestamp() < deadline.load()),
        
        # Get client and verifier
        client.store(Extract(box_data.load(), CLIENT_OFFSET, Int(32))),
        
        # Check caller is client or verifier
        Assert(Or(
            Txn.sender() == client.load(),
            Txn.sender() == Extract(box_data.load(), VERIFIER_OFFSET, Int(32))
        )),
        
        # Get amount
        amount.store(Btoi(Extract(box_data.load(), AMOUNT_OFFSET, Int(8)))),
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
        
        # Update box with new status
        App.box_put(
            box_name.load(),
            Concat(
                client.load(),
                Extract(box_data.load(), FREELANCER_OFFSET, Int(32)),
                Extract(box_data.load(), VERIFIER_OFFSET, Int(32)),
                Extract(box_data.load(), AMOUNT_OFFSET, Int(8)),
                Extract(box_data.load(), DEADLINE_OFFSET, Int(8)),
                Itob(STATUS_REFUNDED),  # new status
                Extract(box_data.load(), TASK_DESC_OFFSET, Len(box_data.load()) - TASK_DESC_OFFSET)
            )
        ),
        
        Return(Int(1))
    ])

def auto_refund():
    """
    Automatic refund when deadline has passed (anyone can call).
    Args: [method, bounty_id]
    """
    bounty_id = ScratchVar(TealType.uint64)
    box_name = ScratchVar(TealType.bytes)
    box_value = App.box_get(get_bounty_box_name(Btoi(Txn.application_args[1])))
    box_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    amount = ScratchVar(TealType.uint64)
    client = ScratchVar(TealType.bytes)
    deadline = ScratchVar(TealType.uint64)
    
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(2)),
        
        # Parse bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        box_name.store(get_bounty_box_name(bounty_id.load())),
        
        # Read box
        Assert(box_value.hasValue()),
        box_data.store(box_value.value()),
        
        # Check status is not CLAIMED, REFUNDED, or REJECTED
        status.store(Btoi(Extract(box_data.load(), STATUS_OFFSET, Int(1)))),
        Assert(status.load() != STATUS_CLAIMED),
        Assert(status.load() != STATUS_REFUNDED),
        Assert(status.load() != STATUS_REJECTED),
        
        # Check deadline has passed
        deadline.store(Btoi(Extract(box_data.load(), DEADLINE_OFFSET, Int(8)))),
        Assert(Global.latest_timestamp() >= deadline.load()),
        
        # Get amount and client
        amount.store(Btoi(Extract(box_data.load(), AMOUNT_OFFSET, Int(8)))),
        client.store(Extract(box_data.load(), CLIENT_OFFSET, Int(32))),
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
        
        # Update box with new status
        App.box_put(
            box_name.load(),
            Concat(
                client.load(),
                Extract(box_data.load(), FREELANCER_OFFSET, Int(32)),
                Extract(box_data.load(), VERIFIER_OFFSET, Int(32)),
                Extract(box_data.load(), AMOUNT_OFFSET, Int(8)),
                Extract(box_data.load(), DEADLINE_OFFSET, Int(8)),
                Itob(STATUS_REFUNDED),  # new status
                Extract(box_data.load(), TASK_DESC_OFFSET, Len(box_data.load()) - TASK_DESC_OFFSET)
            )
        ),
        
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
    approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=9)
    clear_teal = compileTeal(clear_state_program(), mode=Mode.Application, version=9)

    with open("algoease_approval.teal", "w") as f:
        f.write(approval_teal)

    with open("algoease_clear.teal", "w") as f:
        f.write(clear_teal)

    print("✅ Smart contracts compiled successfully!")
    print("Files created:")
    print("  - algoease_approval.teal")
    print("  - algoease_clear.teal")
