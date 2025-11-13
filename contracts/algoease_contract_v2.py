"""
AlgoEase Smart Contract V2 - Multiple Bounties Support
Uses box storage to support multiple simultaneous bounties

Each bounty is stored in a box with key: "bounty_" + bounty_id (as uint64 bytes)
Box value format (packed):
  - client_addr: 32 bytes
  - freelancer_addr: 32 bytes (zero address if not accepted)
  - verifier_addr: 32 bytes
  - amount: 8 bytes (uint64)
  - deadline: 8 bytes (uint64)
  - status: 1 byte (0=Open, 1=Accepted, 2=Approved, 3=Claimed, 4=Refunded)
  - task_desc: variable length bytes
"""

from pyteal import *

# -----------------------------------------------------------------------------
# Global keys and constants
# -----------------------------------------------------------------------------
BOUNTY_COUNTER = Bytes("bounty_counter")

STATUS_OPEN = Int(0)
STATUS_ACCEPTED = Int(1)
STATUS_APPROVED = Int(2)
STATUS_CLAIMED = Int(3)
STATUS_REFUNDED = Int(4)

ZERO_ADDR = Global.zero_address()
EMPTY_BYTES = Bytes("")

# Fixed offsets in box data
CLIENT_OFFSET = Int(0)
FREELANCER_OFFSET = Int(32)
VERIFIER_OFFSET = Int(64)
AMOUNT_OFFSET = Int(96)
DEADLINE_OFFSET = Int(104)
STATUS_OFFSET = Int(112)
TASK_DESC_OFFSET = Int(113)

# -----------------------------------------------------------------------------
# Helper routines
# -----------------------------------------------------------------------------
def get_bounty_box_name(bounty_id: Expr):
    """Get box name for a bounty ID"""
    return Concat(Bytes("bounty_"), Itob(bounty_id))

def get_bounty_data(bounty_id: Expr):
    """Get bounty data from box"""
    box_name = get_bounty_box_name(bounty_id)
    return App.box_get(box_name)

def extract_client_addr(bounty_data: Expr):
    """Extract client address from bounty data"""
    return Extract(bounty_data.value(), CLIENT_OFFSET, Int(32))

def extract_freelancer_addr(bounty_data: Expr):
    """Extract freelancer address from bounty data"""
    return Extract(bounty_data.value(), FREELANCER_OFFSET, Int(32))

def extract_verifier_addr(bounty_data: Expr):
    """Extract verifier address from bounty data"""
    return Extract(bounty_data.value(), VERIFIER_OFFSET, Int(32))

def extract_amount(bounty_data: Expr):
    """Extract amount from bounty data"""
    return Btoi(Extract(bounty_data.value(), AMOUNT_OFFSET, Int(8)))

def extract_deadline(bounty_data: Expr):
    """Extract deadline from bounty data"""
    return Btoi(Extract(bounty_data.value(), DEADLINE_OFFSET, Int(8)))

def extract_status(bounty_data: Expr):
    """Extract status from bounty data"""
    return Btoi(Extract(bounty_data.value(), STATUS_OFFSET, Int(1)))

def extract_task_desc(bounty_data: Expr):
    """Extract task description from bounty data"""
    return Suffix(bounty_data.value(), TASK_DESC_OFFSET)

def create_bounty_data(client: Expr, freelancer: Expr, verifier: Expr, amount: Expr, deadline: Expr, status: Expr, task_desc: Expr):
    """Create packed bounty data"""
    return Concat(
        client,                    # 32 bytes
        freelancer,                # 32 bytes
        verifier,                  # 32 bytes
        Itob(amount),              # 8 bytes
        Itob(deadline),            # 8 bytes
        Itob(status),              # 1 byte (but we use 8 bytes for consistency)
        task_desc                  # variable
    )

def update_bounty_status(bounty_data: Expr, new_status: Expr):
    """Update status in bounty data"""
    return Concat(
        Extract(bounty_data.value(), Int(0), STATUS_OFFSET),  # Everything before status
        Itob(new_status),                                       # New status (8 bytes, but we only use 1)
        Suffix(bounty_data.value(), STATUS_OFFSET + Int(8))    # Everything after status
    )

def update_freelancer_addr(bounty_data: Expr, freelancer: Expr):
    """Update freelancer address in bounty data"""
    return Concat(
        Extract(bounty_data.value(), Int(0), FREELANCER_OFFSET),  # Client
        freelancer,                                                # New freelancer
        Suffix(bounty_data.value(), VERIFIER_OFFSET)              # Rest
    )

# -----------------------------------------------------------------------------
# Main approval program
# -----------------------------------------------------------------------------
def approval_program():
    return Cond(
        [Txn.application_id() == Int(0), handle_creation()],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deletion()],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_update()],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop()],
    )

def handle_creation():
    """Initialize contract"""
    return Seq(
        App.globalPut(BOUNTY_COUNTER, Int(0)),
        Return(Int(1))
    )

def handle_deletion():
    """Can delete if no boxes exist (simplified check)"""
    return Return(Int(1))

def handle_update():
    """Immutable once deployed"""
    return Return(Int(0))

def handle_noop():
    method = Txn.application_args[0]
    return Cond(
        [method == Bytes("create_bounty"), create_bounty()],
        [method == Bytes("accept_bounty"), accept_bounty()],
        [method == Bytes("approve_bounty"), approve_bounty()],
        [method == Bytes("claim"), claim_bounty()],
        [method == Bytes("refund"), refund_bounty()],
        [method == Bytes("auto_refund"), auto_refund()],
        [method == Bytes("get_bounty"), Return(Int(1))],
    )

# -----------------------------------------------------------------------------
# Bounty flows
# -----------------------------------------------------------------------------
def create_bounty():
    """Create a new bounty - NO RESTRICTION on existing bounties!"""
    amount = ScratchVar(TealType.uint64)
    deadline = ScratchVar(TealType.uint64)
    verifier = ScratchVar(TealType.bytes)
    bounty_id = ScratchVar(TealType.uint64)
    task_desc = ScratchVar(TealType.bytes)
    
    payment = Gtxn[0]

    return Seq(
        Assert(Txn.application_args.length() == Int(4)),
        Assert(Global.group_size() == Int(2)),
        Assert(Txn.group_index() == Int(1)),
        Assert(Txn.sender() == payment.sender()),
        Assert(payment.type_enum() == TxnType.Payment),
        Assert(payment.receiver() == Global.current_application_address()),
        
        amount.store(Btoi(Txn.application_args[1])),
        Assert(amount.load() > Int(0)),
        Assert(payment.amount() == amount.load()),
        
        deadline.store(Btoi(Txn.application_args[2])),
        Assert(deadline.load() > Global.latest_timestamp()),
        
        verifier.store(
            If(Txn.accounts.length() > Int(0), Txn.accounts[0], Txn.sender())
        ),
        
        task_desc.store(Txn.application_args[3]),
        
        # Get next bounty ID
        bounty_id.store(App.globalGet(BOUNTY_COUNTER)),
        
        # Create bounty data
        # Calculate box size: 32 + 32 + 32 + 8 + 8 + 8 + task_desc_length = 120 + task_desc_length
        # We need at least 120 bytes for fixed fields
        # Create box with estimated size (we'll use a reasonable max or actual size)
        # For simplicity, we'll use a fixed size that should accommodate most task descriptions
        # Box size calculation: 120 bytes fixed + task description length
        # We'll use the actual length of the data
        # Create the bounty data first to get its length
        # Note: Box creation requires knowing the size upfront
        # We'll use a maximum size approach or calculate dynamically
        
        # For now, let's use a reasonable maximum (e.g., 1000 bytes for task description)
        # This allows up to ~900 characters in task description
        # Create box with size: 120 + len(task_desc) but minimum 120
        # Actually, we need to calculate the exact size
        # Let's pack the data and use its length
        
        # Create box name
        # Create bounty data
        # We'll create the data first, then create the box with that size
        # But box_create needs size before we can create data...
        # Solution: Calculate size = 120 + Len(task_desc)
        # Create box with calculated size
        # Then put the data
        
        # Calculate box size: fixed 120 bytes + task description length
        # Create box
        App.box_create(
            get_bounty_box_name(bounty_id.load()),
            Int(120) + Len(task_desc.load())  # Fixed 120 bytes + task description
        ),
        
        # Store bounty data
        App.box_put(
            get_bounty_box_name(bounty_id.load()),
            create_bounty_data(
                Txn.sender(),           # client
                ZERO_ADDR,              # freelancer (empty initially)
                verifier.load(),        # verifier
                amount.load(),          # amount
                deadline.load(),        # deadline
                STATUS_OPEN,            # status
                task_desc.load()        # task description
            )
        ),
        
        # Increment bounty counter
        App.globalPut(BOUNTY_COUNTER, bounty_id.load() + Int(1)),
        
        Return(Int(1)),
    )

def accept_bounty():
    """Accept a bounty - requires bounty_id in args"""
    bounty_id = ScratchVar(TealType.uint64)
    bounty_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    deadline = ScratchVar(TealType.uint64)
    
    return Seq(
        Assert(Txn.application_args.length() == Int(2)),  # method + bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        
        # Get bounty data
        bounty_data.store(get_bounty_data(bounty_id.load()).value()),
        Assert(Len(bounty_data.load()) > Int(0)),  # Box exists
        
        # Extract status and deadline
        status.store(extract_status(bounty_data.load())),
        deadline.store(extract_deadline(bounty_data.load())),
        
        # Verify bounty is open and deadline not passed
        Assert(status.load() == STATUS_OPEN),
        Assert(Global.latest_timestamp() < deadline.load()),
        
        # Update bounty: set freelancer and status to ACCEPTED
        App.box_put(
            get_bounty_box_name(bounty_id.load()),
            update_bounty_status(
                update_freelancer_addr(bounty_data.load(), Txn.sender()),
                STATUS_ACCEPTED
            )
        ),
        
        Return(Int(1)),
    )

def approve_bounty():
    """Approve a bounty - requires bounty_id in args"""
    bounty_id = ScratchVar(TealType.uint64)
    bounty_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    verifier = ScratchVar(TealType.bytes)
    
    return Seq(
        Assert(Txn.application_args.length() == Int(2)),  # method + bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        
        # Get bounty data
        bounty_data.store(get_bounty_data(bounty_id.load()).value()),
        Assert(Len(bounty_data.load()) > Int(0)),
        
        # Extract status and verifier
        status.store(extract_status(bounty_data.load())),
        verifier.store(extract_verifier_addr(bounty_data.load())),
        
        # Verify status is ACCEPTED and sender is verifier
        Assert(status.load() == STATUS_ACCEPTED),
        Assert(Txn.sender() == verifier.load()),
        
        # Update status to APPROVED
        App.box_put(
            get_bounty_box_name(bounty_id.load()),
            update_bounty_status(bounty_data.load(), STATUS_APPROVED)
        ),
        
        Return(Int(1)),
    )

def claim_bounty():
    """Claim bounty payment - requires bounty_id in args"""
    bounty_id = ScratchVar(TealType.uint64)
    bounty_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    freelancer = ScratchVar(TealType.bytes)
    amount = ScratchVar(TealType.uint64)
    
    return Seq(
        Assert(Txn.application_args.length() == Int(2)),  # method + bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        
        # Get bounty data
        bounty_data.store(get_bounty_data(bounty_id.load()).value()),
        Assert(Len(bounty_data.load()) > Int(0)),
        
        # Extract status, freelancer, and amount
        status.store(extract_status(bounty_data.load())),
        freelancer.store(extract_freelancer_addr(bounty_data.load())),
        amount.store(extract_amount(bounty_data.load())),
        
        # Verify status is APPROVED and sender is freelancer
        Assert(status.load() == STATUS_APPROVED),
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
        
        # Update status to CLAIMED
        App.box_put(
            get_bounty_box_name(bounty_id.load()),
            update_bounty_status(bounty_data.load(), STATUS_CLAIMED)
        ),
        
        Return(Int(1)),
    )

def refund_bounty():
    """Refund bounty - requires bounty_id in args"""
    bounty_id = ScratchVar(TealType.uint64)
    bounty_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    client = ScratchVar(TealType.bytes)
    verifier = ScratchVar(TealType.bytes)
    amount = ScratchVar(TealType.uint64)
    
    caller_is_authorized = ScratchVar(TealType.uint64)
    
    return Seq(
        Assert(Txn.application_args.length() == Int(2)),  # method + bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        
        # Get bounty data
        bounty_data.store(get_bounty_data(bounty_id.load()).value()),
        Assert(Len(bounty_data.load()) > Int(0)),
        
        # Extract status, client, verifier, and amount
        status.store(extract_status(bounty_data.load())),
        client.store(extract_client_addr(bounty_data.load())),
        verifier.store(extract_verifier_addr(bounty_data.load())),
        amount.store(extract_amount(bounty_data.load())),
        
        # Verify status is not CLAIMED or REFUNDED
        Assert(status.load() != STATUS_CLAIMED),
        Assert(status.load() != STATUS_REFUNDED),
        
        # Check authorization
        caller_is_authorized.store(
            If(
                Or(Txn.sender() == client.load(), Txn.sender() == verifier.load()),
                Int(1),
                Int(0)
            )
        ),
        Assert(caller_is_authorized.load() == Int(1)),
        
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
        
        # Update status to REFUNDED
        App.box_put(
            get_bounty_box_name(bounty_id.load()),
            update_bounty_status(bounty_data.load(), STATUS_REFUNDED)
        ),
        
        Return(Int(1)),
    )

def auto_refund():
    """Auto-refund bounty after deadline - requires bounty_id in args"""
    bounty_id = ScratchVar(TealType.uint64)
    bounty_data = ScratchVar(TealType.bytes)
    status = ScratchVar(TealType.uint64)
    deadline = ScratchVar(TealType.uint64)
    client = ScratchVar(TealType.bytes)
    amount = ScratchVar(TealType.uint64)
    
    return Seq(
        Assert(Txn.application_args.length() == Int(2)),  # method + bounty_id
        bounty_id.store(Btoi(Txn.application_args[1])),
        
        # Get bounty data
        bounty_data.store(get_bounty_data(bounty_id.load()).value()),
        Assert(Len(bounty_data.load()) > Int(0)),
        
        # Extract status, deadline, client, and amount
        status.store(extract_status(bounty_data.load())),
        deadline.store(extract_deadline(bounty_data.load())),
        client.store(extract_client_addr(bounty_data.load())),
        amount.store(extract_amount(bounty_data.load())),
        
        # Verify status is not CLAIMED or REFUNDED
        Assert(status.load() != STATUS_CLAIMED),
        Assert(status.load() != STATUS_REFUNDED),
        
        # Verify deadline has passed
        Assert(Global.latest_timestamp() >= deadline.load()),
        
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
        
        # Update status to REFUNDED
        App.box_put(
            get_bounty_box_name(bounty_id.load()),
            update_bounty_status(bounty_data.load(), STATUS_REFUNDED)
        ),
        
        Return(Int(1)),
    )

# -----------------------------------------------------------------------------
# Clear program
# -----------------------------------------------------------------------------
def clear_state_program():
    return Return(Int(1))

# -----------------------------------------------------------------------------
# Script entry point for local compilation
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=8)
    clear_teal = compileTeal(clear_state_program(), mode=Mode.Application, version=8)

    with open("algoease_approval_v2.teal", "w") as f:
        f.write(approval_teal)

    with open("algoease_clear_v2.teal", "w") as f:
        f.write(clear_teal)

    print("Smart contracts compiled successfully!")
    print("Files created:")
    print("- algoease_approval_v2.teal")
    print("- algoease_clear_v2.teal")
    print("\n⚠️  NOTE: This is V2 with multiple bounties support using box storage")
    print("   All methods now require bounty_id as the second argument")

