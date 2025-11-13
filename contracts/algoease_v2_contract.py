"""
AlgoEase Smart Contract V2 - Multiple Bounties Support with Box Storage
Each bounty is stored in a separate box, allowing unlimited concurrent bounties
"""

from pyteal import *

def approval_program():
    """
    Multi-Bounty Contract - Supports Multiple Concurrent Bounties
    Each bounty gets a unique ID and is stored in box storage
    """
    
    # Operations
    op_create_bounty = Bytes("create_bounty")
    op_accept_bounty = Bytes("accept_bounty")
    op_approve_bounty = Bytes("approve_bounty")
    op_claim_bounty = Bytes("claim")
    op_refund_bounty = Bytes("refund")
    
    # Global state keys
    bounty_counter = Bytes("bounty_counter")
    
    # Box storage format for each bounty:
    # Box key: "bounty_" + bounty_id (as bytes)
    # Box value: client_addr(32) + freelancer_addr(32) + verifier_addr(32) + 
    #            amount(8) + deadline(8) + status(1) + task_desc(variable)
    # Status: 0x00=OPEN, 0x01=ACCEPTED, 0x02=APPROVED, 0x03=CLAIMED, 0x04=REFUNDED
    
    # Fixed offsets in box data
    CLIENT_OFFSET = Int(0)
    FREELANCER_OFFSET = Int(32)
    VERIFIER_OFFSET = Int(64)
    AMOUNT_OFFSET = Int(96)
    DEADLINE_OFFSET = Int(104)
    STATUS_OFFSET = Int(112)
    TASK_OFFSET = Int(113)
    
    @Subroutine(TealType.none)
    def initialize():
        """Initialize contract"""
        return App.globalPut(bounty_counter, Int(0))
    
    @Subroutine(TealType.uint64)
    def handle_creation():
        """Handle contract creation"""
        return Seq(
            initialize(),
            Int(1)
        )
    
    @Subroutine(TealType.bytes)
    def get_box_name(bounty_id: Expr):
        """Get box name for a bounty ID"""
        return Concat(Bytes("bounty_"), Itob(bounty_id))
    
    @Subroutine(TealType.uint64)
    def create_bounty():
        """
        Create new bounty - supports multiple bounties!
        Args: amount, deadline, task_description
        Accounts: verifier (index 1)
        """
        bounty_id = ScratchVar(TealType.uint64)
        box_name = ScratchVar(TealType.bytes)
        amount = ScratchVar(TealType.uint64)
        deadline = ScratchVar(TealType.uint64)
        
        return Seq(
            # Get bounty ID and create box name
            bounty_id.store(App.globalGet(bounty_counter)),
            box_name.store(get_box_name(bounty_id.load())),
            
            # Parse arguments
            amount.store(Btoi(Txn.application_args[1])),
            deadline.store(Btoi(Txn.application_args[2])),
            
            # Verify grouped payment
            Assert(Global.group_size() == Int(2)),
            Assert(Txn.group_index() == Int(1)),
            Assert(Gtxn[0].type_enum() == TxnType.Payment),
            Assert(Gtxn[0].sender() == Txn.sender()),
            Assert(Gtxn[0].receiver() == Global.current_application_address()),
            Assert(Gtxn[0].amount() == amount.load()),
            Assert(amount.load() > Int(0)),
            Assert(deadline.load() > Global.latest_timestamp()),
            Assert(Txn.accounts.length() >= Int(1)),
            
            # Build bounty data
            Pop(App.box_create(
                box_name.load(),
                Int(113) + Len(Txn.application_args[3])  # Fixed size + task length
            )),
            App.box_put(
                box_name.load(),
                Concat(
                    Txn.sender(),                    # client (32 bytes)
                    Global.zero_address(),           # freelancer (32 bytes)
                    Txn.accounts[1],                 # verifier (32 bytes)
                    Itob(amount.load()),             # amount (8 bytes)
                    Itob(deadline.load()),           # deadline (8 bytes)
                    Bytes("base16", "00"),          # status (1 byte) - OPEN
                    Txn.application_args[3]          # task description
                )
            ),
            
            # Increment counter
            App.globalPut(bounty_counter, bounty_id.load() + Int(1)),
            Int(1)
        )
    
    @Subroutine(TealType.uint64)
    def accept_bounty():
        """
        Accept a bounty
        Args: bounty_id
        """
        bounty_id = ScratchVar(TealType.uint64)
        box_name = ScratchVar(TealType.bytes)
        bounty_data = ScratchVar(TealType.bytes)
        status = ScratchVar(TealType.bytes)
        deadline = ScratchVar(TealType.uint64)
        
        return Seq(
            # Get bounty ID and box name
            bounty_id.store(Btoi(Txn.application_args[1])),
            box_name.store(get_box_name(bounty_id.load())),
            
            # Get bounty data - call box_get once and use result
            Assert(Txn.application_args.length() == Int(2)),
            # Store box_get result - will fail if box doesn't exist
            (box_result := App.box_get(box_name.load())),
            Assert(box_result.hasValue()),
            bounty_data.store(box_result.value()),
            
            # Extract status and deadline
            status.store(Extract(bounty_data.load(), STATUS_OFFSET, Int(1))),
            deadline.store(Btoi(Extract(bounty_data.load(), DEADLINE_OFFSET, Int(8)))),
            
            # Verify conditions
            Assert(status.load() == Bytes("base16", "00")),  # Must be OPEN
            Assert(Global.latest_timestamp() < deadline.load()),
            
            # Update box with freelancer address and new status
            App.box_put(
                box_name.load(),
                Concat(
                    Extract(bounty_data.load(), CLIENT_OFFSET, Int(32)),   # client
                    Txn.sender(),                                           # freelancer
                    Extract(bounty_data.load(), VERIFIER_OFFSET, Int(32)), # verifier
                    Extract(bounty_data.load(), AMOUNT_OFFSET, Int(8)),    # amount
                    Extract(bounty_data.load(), DEADLINE_OFFSET, Int(8)),  # deadline
                    Bytes("base16", "01"),                                 # ACCEPTED status
                    Suffix(bounty_data.load(), TASK_OFFSET)                # task description
                )
            ),
            Int(1)
        )
    
    @Subroutine(TealType.uint64)
    def approve_bounty():
        """
        Approve a bounty (only verifier can approve)
        Args: bounty_id
        """
        bounty_id = ScratchVar(TealType.uint64)
        box_name = ScratchVar(TealType.bytes)
        box_result = ScratchVar(TealType.bytes)
        bounty_data = ScratchVar(TealType.bytes)
        status = ScratchVar(TealType.bytes)
        verifier_addr = ScratchVar(TealType.bytes)
        
        return Seq(
            # Get bounty ID and box name
            bounty_id.store(Btoi(Txn.application_args[1])),
            box_name.store(get_box_name(bounty_id.load())),
            
            # Get bounty data - call box_get once and use result
            Assert(Txn.application_args.length() == Int(2)),
            # Store box_get result - will fail if box doesn't exist
            (box_result := App.box_get(box_name.load())),
            Assert(box_result.hasValue()),
            bounty_data.store(box_result.value()),
            
            # Extract status and verifier
            status.store(Extract(bounty_data.load(), STATUS_OFFSET, Int(1))),
            verifier_addr.store(Extract(bounty_data.load(), VERIFIER_OFFSET, Int(32))),
            
            # Verify conditions
            Assert(status.load() == Bytes("base16", "01")),  # Must be ACCEPTED
            Assert(Txn.sender() == verifier_addr.load()),    # Only verifier can approve
            
            # Update status to APPROVED
            App.box_put(
                box_name.load(),
                Concat(
                    Extract(bounty_data.load(), CLIENT_OFFSET, Int(32)),     # client
                    Extract(bounty_data.load(), FREELANCER_OFFSET, Int(32)), # freelancer
                    Extract(bounty_data.load(), VERIFIER_OFFSET, Int(32)),   # verifier
                    Extract(bounty_data.load(), AMOUNT_OFFSET, Int(8)),      # amount
                    Extract(bounty_data.load(), DEADLINE_OFFSET, Int(8)),    # deadline
                    Bytes("base16", "02"),                                   # APPROVED status
                    Suffix(bounty_data.load(), TASK_OFFSET)                  # task description
                )
            ),
            Int(1)
        )
    
    @Subroutine(TealType.uint64)
    def claim_bounty():
        """
        Claim bounty payment (only freelancer can claim after approval)
        Args: bounty_id
        """
        bounty_id = ScratchVar(TealType.uint64)
        box_name = ScratchVar(TealType.bytes)
        box_result = ScratchVar(TealType.bytes)
        bounty_data = ScratchVar(TealType.bytes)
        status = ScratchVar(TealType.bytes)
        freelancer_addr = ScratchVar(TealType.bytes)
        amount = ScratchVar(TealType.uint64)
        
        return Seq(
            # Get bounty ID and box name
            bounty_id.store(Btoi(Txn.application_args[1])),
            box_name.store(get_box_name(bounty_id.load())),
            
            # Get bounty data - call box_get once and use result
            Assert(Txn.application_args.length() == Int(2)),
            # Store box_get result - will fail if box doesn't exist
            (box_result := App.box_get(box_name.load())),
            Assert(box_result.hasValue()),
            bounty_data.store(box_result.value()),
            
            # Extract values
            status.store(Extract(bounty_data.load(), STATUS_OFFSET, Int(1))),
            freelancer_addr.store(Extract(bounty_data.load(), FREELANCER_OFFSET, Int(32))),
            amount.store(Btoi(Extract(bounty_data.load(), AMOUNT_OFFSET, Int(8)))),
            
            # Verify conditions
            Assert(status.load() == Bytes("base16", "02")),      # Must be APPROVED
            Assert(Txn.sender() == freelancer_addr.load()),      # Only freelancer can claim
            Assert(amount.load() > Int(0)),
            
            # Send payment to freelancer
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.sender: Global.current_application_address(),
                TxnField.receiver: freelancer_addr.load(),
                TxnField.amount: amount.load(),
                TxnField.fee: Int(0),
            }),
            InnerTxnBuilder.Submit(),
            
            # Update status to CLAIMED
            App.box_put(
                box_name.load(),
                Concat(
                    Extract(bounty_data.load(), CLIENT_OFFSET, Int(32)),     # client
                    Extract(bounty_data.load(), FREELANCER_OFFSET, Int(32)), # freelancer
                    Extract(bounty_data.load(), VERIFIER_OFFSET, Int(32)),   # verifier
                    Itob(Int(0)),                                            # amount = 0
                    Extract(bounty_data.load(), DEADLINE_OFFSET, Int(8)),    # deadline
                    Bytes("base16", "03"),                                   # CLAIMED status
                    Suffix(bounty_data.load(), TASK_OFFSET)                  # task description
                )
            ),
            Int(1)
        )
    
    @Subroutine(TealType.uint64)
    def refund_bounty():
        """
        Refund bounty to client (client or verifier can refund)
        Args: bounty_id
        """
        bounty_id = ScratchVar(TealType.uint64)
        box_name = ScratchVar(TealType.bytes)
        box_result = ScratchVar(TealType.bytes)
        bounty_data = ScratchVar(TealType.bytes)
        status = ScratchVar(TealType.bytes)
        client_addr = ScratchVar(TealType.bytes)
        verifier_addr = ScratchVar(TealType.bytes)
        amount = ScratchVar(TealType.uint64)
        
        return Seq(
            # Get bounty ID and box name
            bounty_id.store(Btoi(Txn.application_args[1])),
            box_name.store(get_box_name(bounty_id.load())),
            
            # Get bounty data - call box_get once and use result
            Assert(Txn.application_args.length() == Int(2)),
            # Store box_get result - will fail if box doesn't exist
            (box_result := App.box_get(box_name.load())),
            Assert(box_result.hasValue()),
            bounty_data.store(box_result.value()),
            
            # Extract values
            status.store(Extract(bounty_data.load(), STATUS_OFFSET, Int(1))),
            client_addr.store(Extract(bounty_data.load(), CLIENT_OFFSET, Int(32))),
            verifier_addr.store(Extract(bounty_data.load(), VERIFIER_OFFSET, Int(32))),
            amount.store(Btoi(Extract(bounty_data.load(), AMOUNT_OFFSET, Int(8)))),
            
            # Verify conditions
            Assert(status.load() != Bytes("base16", "03")),  # Cannot refund if CLAIMED
            Assert(status.load() != Bytes("base16", "04")),  # Cannot refund if already REFUNDED
            Assert(
                Or(
                    Txn.sender() == client_addr.load(),
                    Txn.sender() == verifier_addr.load()
                )
            ),  # Only client or verifier can refund
            Assert(amount.load() > Int(0)),
            
            # Send refund to client
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.sender: Global.current_application_address(),
                TxnField.receiver: client_addr.load(),
                TxnField.amount: amount.load(),
                TxnField.fee: Int(0),
            }),
            InnerTxnBuilder.Submit(),
            
            # Update status to REFUNDED
            App.box_put(
                box_name.load(),
                Concat(
                    Extract(bounty_data.load(), CLIENT_OFFSET, Int(32)),     # client
                    Extract(bounty_data.load(), FREELANCER_OFFSET, Int(32)), # freelancer
                    Extract(bounty_data.load(), VERIFIER_OFFSET, Int(32)),   # verifier
                    Itob(Int(0)),                                            # amount = 0
                    Extract(bounty_data.load(), DEADLINE_OFFSET, Int(8)),    # deadline
                    Bytes("base16", "04"),                                   # REFUNDED status
                    Suffix(bounty_data.load(), TASK_OFFSET)                  # task description
                )
            ),
            Int(1)
        )
    
    @Subroutine(TealType.uint64)
    def handle_noop():
        """Handle NoOp transactions"""
        return Cond(
            [Txn.application_args[0] == op_create_bounty, create_bounty()],
            [Txn.application_args[0] == op_accept_bounty, accept_bounty()],
            [Txn.application_args[0] == op_approve_bounty, approve_bounty()],
            [Txn.application_args[0] == op_claim_bounty, claim_bounty()],
            [Txn.application_args[0] == op_refund_bounty, refund_bounty()],
        )
    
    # Main router
    return Cond(
        [Txn.application_id() == Int(0), handle_creation()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Int(0)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Int(0)],
        [Txn.on_completion() == OnComplete.CloseOut, Int(1)],
        [Txn.on_completion() == OnComplete.OptIn, Int(1)],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop()],
    )

def clear_state_program():
    return Return(Int(1))

if __name__ == "__main__":
    # Compile the contract
    approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=8)
    clear_teal = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
    
    # Write to files
    with open("algoease_approval.teal", "w") as f:
        f.write(approval_teal)
    
    with open("algoease_clear.teal", "w") as f:
        f.write(clear_teal)
    
    print("=" * 80)
    print("  AlgoEase Smart Contract V2 - Multiple Bounties")
    print("=" * 80)
    print("\n[SUCCESS] Contract compiled successfully!")
    print("   Files created:")
    print("   - algoease_approval.teal")
    print("   - algoease_clear.teal")
    print("\nFeatures:")
    print("   - Multiple concurrent bounties supported")
    print("   - Each bounty stored in separate box")
    print("   - Full lifecycle: create -> accept -> approve -> claim/refund")
    print("\nNext step: Deploy the contract using deploy.py")
    print("=" * 80)
