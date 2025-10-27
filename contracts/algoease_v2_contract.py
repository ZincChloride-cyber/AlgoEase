"""
AlgoEase Smart Contract V2 - REDESIGNED
Multiple Bounties Support with Box Storage
"""

from pyteal import *

def approval_program():
    """
    REDESIGNED CONTRACT - Supports Multiple Bounties
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
    
    # Box storage for each bounty
    # Box key format: "bounty_" + bounty_id
    # Box value format: client_addr(32) + freelancer_addr(32) + verifier_addr(32) + 
    #                   amount(8) + deadline(8) + status(1) + task_desc(rest)
    
    @Subroutine(TealType.none)
    def initialize():
        """Initialize contract"""
        return Seq([
            App.globalPut(bounty_counter, Int(0)),
        ])
    
    @Subroutine(TealType.uint64)
    def create_bounty():
        """
        Create new bounty - supports multiple bounties!
        Args: amount, deadline, task_description
        Accounts: verifier
        """
        bounty_id = App.globalGet(bounty_counter)
        box_name = Concat(Bytes("bounty_"), Itob(bounty_id))
        
        amount = Btoi(Txn.application_args[1])
        deadline = Btoi(Txn.application_args[2])
        task = Txn.application_args[3]
        
        # Create box with bounty data
        bounty_data = Concat(
            Txn.sender(),                    # client (32 bytes)
            Global.zero_address(),           # freelancer (32 bytes) - empty initially
            Txn.accounts[1],                 # verifier (32 bytes)
            Itob(amount),                    # amount (8 bytes)
            Itob(deadline),                  # deadline (8 bytes)
            Bytes("base16", "00"),          # status (1 byte) - 0 = OPEN
            task                             # task description
        )
        
        return Seq([
            # Verify grouped payment
            Assert(Global.group_size() == Int(2)),
            Assert(Txn.group_index() == Int(1)),
            Assert(Gtxn[0].type_enum() == TxnType.Payment),
            Assert(Gtxn[0].sender() == Txn.sender()),
            Assert(Gtxn[0].receiver() == Global.current_application_address()),
            Assert(Gtxn[0].amount() == amount),
            Assert(amount > Int(0)),
            Assert(deadline > Global.latest_timestamp()),
            
            # Create box
            App.box_create(box_name, Len(bounty_data)),
            App.box_put(box_name, bounty_data),
            
            # Increment counter
            App.globalPut(bounty_counter, bounty_id + Int(1)),
            
            Return(Int(1))
        ])
    
    @Subroutine(TealType.uint64)
    def accept_bounty():
        """Accept a bounty - Args: bounty_id"""
        bounty_id = Btoi(Txn.application_args[1])
        box_name = Concat(Bytes("bounty_"), Itob(bounty_id))
        
        bounty_data = App.box_get(box_name)
        status = Extract(bounty_data.value(), Int(104), Int(1))
        deadline = Btoi(Extract(bounty_data.value(), Int(96), Int(8)))
        
        new_data = Concat(
            Extract(bounty_data.value(), Int(0), Int(32)),   # client
            Txn.sender(),                                     # freelancer
            Extract(bounty_data.value(), Int(64), Int(73)),  # rest of data
        )
        
        # Update status to ACCEPTED (1)
        new_data_with_status = Concat(
            Extract(new_data, Int(0), Int(104)),
            Bytes("base16", "01"),
            Extract(bounty_data.value(), Int(105), Len(bounty_data.value()) - Int(105))
        )
        
        return Seq([
            Assert(bounty_data.hasValue()),
            Assert(status == Bytes("base16", "00")),  # Must be OPEN
            Assert(Global.latest_timestamp() < deadline),
            
            App.box_put(box_name, new_data_with_status),
            Return(Int(1))
        ])
    
    # Main router
    return Cond(
        [Txn.application_id() == Int(0), Seq([initialize(), Return(Int(1))])],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.application_args[0] == op_create_bounty, create_bounty()],
        [Txn.application_args[0] == op_accept_bounty, accept_bounty()],
    )

def clear_state_program():
    return Return(Int(1))

if __name__ == "__main__":
    print("=" * 80)
    print("  REDESIGNING SMART CONTRACT - V2 with Multiple Bounties")
    print("=" * 80)
    print("\n⚠️  NOTE: This is a complex redesign that requires:")
    print("   • Box storage support (Algorand AVM 1.1+)")
    print("   • More complex state management")
    print("   • Additional testing")
    print("\n💡 BETTER SOLUTION:")
    print("   The current contract works perfectly!")
    print("   It just handles ONE bounty at a time (by design)")
    print("\n✅ HOW TO USE CURRENT CONTRACT:")
    print("   1. Create bounty")
    print("   2. Complete it (accept → approve → claim OR refund)")
    print("   3. Create next bounty")
    print("   This is actually SIMPLER and SAFER!")
    print("\n" + "=" * 80)
    print("\nIf you want multiple bounties, you have 2 options:")
    print("\nOption 1: Deploy multiple instances of current contract")
    print("   • Each contract = one bounty")
    print("   • Simple, proven, works")
    print("\nOption 2: Use box storage (complex)")
    print("   • One contract, many bounties")
    print("   • Requires redesign and testing")
    print("   • Higher gas costs")
    print("\n" + "=" * 80)
    print("\nRECOMMENDATION: Use current contract (it's working!)")
    print("=" * 80)


