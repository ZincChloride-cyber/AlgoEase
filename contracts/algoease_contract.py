"""
AlgoEase Smart Contract - Decentralized Escrow Platform

This PyTeal contract implements a trustless escrow system for freelance payments.
It handles bounty creation, work approval, and automatic payouts/refunds.
"""

from pyteal import *

# Global state keys
BOUNTY_COUNT = Bytes("bounty_count")
CLIENT_ADDR = Bytes("client_addr")
FREELANCER_ADDR = Bytes("freelancer_addr")
AMOUNT = Bytes("amount")
DEADLINE = Bytes("deadline")
STATUS = Bytes("status")
TASK_DESCRIPTION = Bytes("task_desc")
VERIFIER_ADDR = Bytes("verifier_addr")

# Status constants
STATUS_OPEN = Int(0)
STATUS_ACCEPTED = Int(1)
STATUS_APPROVED = Int(2)
STATUS_CLAIMED = Int(3)
STATUS_REFUNDED = Int(4)

def approval_program():
    """Main approval program for the escrow contract"""
    
    # Handle different transaction types
    return Cond(
        [Txn.application_id() == Int(0), handle_creation()],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deletion()],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_update()],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout()],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin()],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop()]
    )

def handle_creation():
    """Handle contract creation"""
    return Seq([
        App.globalPut(BOUNTY_COUNT, Int(0)),
        Return(Int(1))
    ])

def handle_deletion():
    """Handle contract deletion - only allow if no active bounties"""
    return Seq([
        Assert(App.globalGet(BOUNTY_COUNT) == Int(0)),
        Return(Int(1))
    ])

def handle_update():
    """Handle contract update - not allowed for security"""
    return Return(Int(0))

def handle_closeout():
    """Handle account closeout"""
    return Return(Int(1))

def handle_optin():
    """Handle account opt-in"""
    return Return(Int(1))

def handle_noop():
    """Handle application calls"""
    return Cond(
        [Txn.application_args[0] == Bytes("create_bounty"), create_bounty()],
        [Txn.application_args[0] == Bytes("accept_bounty"), accept_bounty()],
        [Txn.application_args[0] == Bytes("approve_bounty"), approve_bounty()],
        [Txn.application_args[0] == Bytes("claim"), claim_bounty()],
        [Txn.application_args[0] == Bytes("refund"), refund_bounty()],
        [Txn.application_args[0] == Bytes("get_bounty"), get_bounty_info()]
    )

def create_bounty():
    """Create a new bounty"""
    # Expected arguments: [method, amount, deadline, task_description, verifier_addr]
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(5)),
        
        # Check if this is the first bounty or if previous bounty is closed
        If(App.globalGet(BOUNTY_COUNT) == Int(0))
        .Then(
            # First bounty - initialize
            Seq([
                App.globalPut(CLIENT_ADDR, Txn.sender()),
                App.globalPut(AMOUNT, Btoi(Txn.application_args[1])),
                App.globalPut(DEADLINE, Btoi(Txn.application_args[2])),
                App.globalPut(TASK_DESCRIPTION, Txn.application_args[3]),
                App.globalPut(VERIFIER_ADDR, Txn.accounts[1]),
                App.globalPut(STATUS, STATUS_OPEN),
                App.globalPut(BOUNTY_COUNT, Int(1)),
                
                # Send payment to contract
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.Payment,
                    TxnField.receiver: Global.current_application_address(),
                    TxnField.amount: Btoi(Txn.application_args[1]),
                    TxnField.sender: Txn.sender(),
                }),
                InnerTxnBuilder.Submit(),
                
                Return(Int(1))
            ])
        )
        .Else(
            # Check if previous bounty is closed
            If(Or(
                App.globalGet(STATUS) == STATUS_CLAIMED,
                App.globalGet(STATUS) == STATUS_REFUNDED
            ))
            .Then(
                # Create new bounty
                Seq([
                    App.globalPut(CLIENT_ADDR, Txn.sender()),
                    App.globalPut(AMOUNT, Btoi(Txn.application_args[1])),
                    App.globalPut(DEADLINE, Btoi(Txn.application_args[2])),
                    App.globalPut(TASK_DESCRIPTION, Txn.application_args[3]),
                    App.globalPut(VERIFIER_ADDR, Txn.accounts[1]),
                    App.globalPut(STATUS, STATUS_OPEN),
                    App.globalPut(BOUNTY_COUNT, App.globalGet(BOUNTY_COUNT) + Int(1)),
                    
                    # Send payment to contract
                    InnerTxnBuilder.Begin(),
                    InnerTxnBuilder.SetFields({
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.receiver: Global.current_application_address(),
                        TxnField.amount: Btoi(Txn.application_args[1]),
                        TxnField.sender: Txn.sender(),
                    }),
                    InnerTxnBuilder.Submit(),
                    
                    Return(Int(1))
                ])
            )
            .Else(Return(Int(0)))  # Previous bounty still active
        )
    ])

def accept_bounty():
    """Accept a bounty (freelancer commits to the task)"""
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check bounty is open
        Assert(App.globalGet(STATUS) == STATUS_OPEN),
        
        # Check deadline hasn't passed
        Assert(Global.latest_timestamp() < App.globalGet(DEADLINE)),
        
        # Set freelancer and update status
        App.globalPut(FREELANCER_ADDR, Txn.sender()),
        App.globalPut(STATUS, STATUS_ACCEPTED),
        
        Return(Int(1))
    ])

def approve_bounty():
    """Approve bounty completion (verifier approves work)"""
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check bounty is accepted
        Assert(App.globalGet(STATUS) == STATUS_ACCEPTED),
        
        # Check caller is the verifier
        Assert(Txn.sender() == App.globalGet(VERIFIER_ADDR)),
        
        # Update status to approved
        App.globalPut(STATUS, STATUS_APPROVED),
        
        Return(Int(1))
    ])

def claim_bounty():
    """Claim bounty payment (freelancer claims approved funds)"""
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check bounty is approved
        Assert(App.globalGet(STATUS) == STATUS_APPROVED),
        
        # Check caller is the freelancer
        Assert(Txn.sender() == App.globalGet(FREELANCER_ADDR)),
        
        # Send payment to freelancer
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(FREELANCER_ADDR),
            TxnField.amount: App.globalGet(AMOUNT),
            TxnField.sender: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),
        
        # Update status to claimed
        App.globalPut(STATUS, STATUS_CLAIMED),
        
        Return(Int(1))
    ])

def refund_bounty():
    """Refund bounty to client (automatic or manual refund)"""
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check bounty is not already claimed or refunded
        Assert(App.globalGet(STATUS) != STATUS_CLAIMED),
        Assert(App.globalGet(STATUS) != STATUS_REFUNDED),
        
        # Allow refund if:
        # 1. Deadline has passed, OR
        # 2. Client is calling (manual refund), OR
        # 3. Verifier is calling (rejection)
        Assert(Or(
            Global.latest_timestamp() >= App.globalGet(DEADLINE),  # Deadline passed
            Txn.sender() == App.globalGet(CLIENT_ADDR),            # Client refund
            Txn.sender() == App.globalGet(VERIFIER_ADDR)           # Verifier rejection
        )),
        
        # Send refund to client
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(CLIENT_ADDR),
            TxnField.amount: App.globalGet(AMOUNT),
            TxnField.sender: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),
        
        # Update status to refunded
        App.globalPut(STATUS, STATUS_REFUNDED),
        
        Return(Int(1))
    ])

def get_bounty_info():
    """Get current bounty information (read-only)"""
    return Seq([
        # This is a read-only operation, no state changes
        Return(Int(1))
    ])

def clear_state_program():
    """Clear state program"""
    return Return(Int(1))

if __name__ == "__main__":
    # Compile the contracts
    with open("contracts/algoease_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=8)
        f.write(compiled)
    
    with open("contracts/algoease_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
        f.write(compiled)
    
    print("Smart contracts compiled successfully!")
    print("Files created:")
    print("- contracts/algoease_approval.teal")
    print("- contracts/algoease_clear.teal")
