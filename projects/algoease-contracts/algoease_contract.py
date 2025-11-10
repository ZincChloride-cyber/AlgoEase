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
        [Txn.application_args[0] == Bytes("auto_refund"), auto_refund()],
        [Txn.application_args[0] == Bytes("get_bounty"), get_bounty_info()]
    )

def create_bounty():

    """Create a new bounty — requires grouped payment (2-txn group):
       Gtxn[0] = Payment from client -> app address (amount)
       Gtxn[1] = ApplicationCall create_bounty with args
    """
    # Expected arguments: [method, amount, deadline, task_description]
    # and accounts: [verifier_addr]
    return Seq([
        Assert(Txn.application_args.length() == Int(4)),
        Assert(Txn.accounts.length() >= Int(1)),  # Need at least the verifier

        # The app-call must be the second txn in a group (index 1)
        Assert(Global.group_size() == Int(2)),
        Assert(Txn.group_index() == Int(1)),

        # Verify the payment (first txn in group)
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[0].sender() == Txn.sender()),  # payment must be from caller
        Assert(Gtxn[0].receiver() == Global.current_application_address()),
        Assert(Gtxn[0].amount() == Btoi(Txn.application_args[1])),

        # Validate amount is greater than 0
        Assert(Btoi(Txn.application_args[1]) > Int(0)),

        # Validate deadline is in the future
        Assert(Btoi(Txn.application_args[2]) > Global.latest_timestamp()),

        # Now proceed to create bounty (either first bounty or after previous closed)
        If(App.globalGet(BOUNTY_COUNT) == Int(0))
        .Then(
            Seq([
                App.globalPut(CLIENT_ADDR, Txn.sender()),
                App.globalPut(AMOUNT, Btoi(Txn.application_args[1])),
                App.globalPut(DEADLINE, Btoi(Txn.application_args[2])),
                App.globalPut(TASK_DESCRIPTION, Txn.application_args[3]),
                App.globalPut(VERIFIER_ADDR, Txn.accounts[0]),  # First account is verifier
                App.globalPut(STATUS, STATUS_OPEN),
                App.globalPut(BOUNTY_COUNT, Int(1)),
                Return(Int(1))
            ])
        )
        .Else(
            If(Or(App.globalGet(STATUS) == STATUS_CLAIMED,
                  App.globalGet(STATUS) == STATUS_REFUNDED))
            .Then(
                Seq([
                    App.globalPut(CLIENT_ADDR, Txn.sender()),
                    App.globalPut(AMOUNT, Btoi(Txn.application_args[1])),
                    App.globalPut(DEADLINE, Btoi(Txn.application_args[2])),
                    App.globalPut(TASK_DESCRIPTION, Txn.application_args[3]),
                    App.globalPut(VERIFIER_ADDR, Txn.accounts[0]),  # First account is verifier
                    App.globalPut(STATUS, STATUS_OPEN),
                    App.globalPut(BOUNTY_COUNT, App.globalGet(BOUNTY_COUNT) + Int(1)),
                    Return(Int(1))
                ])
            ).Else(Return(Int(0)))
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
    """Refund bounty to client (manual refund by client or verifier)"""
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check bounty is not already claimed or refunded
        Assert(App.globalGet(STATUS) != STATUS_CLAIMED),
        Assert(App.globalGet(STATUS) != STATUS_REFUNDED),
        
        # Allow refund if:
        # 1. Client is calling (manual refund), OR
        # 2. Verifier is calling (rejection)
        Assert(Or(
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

def auto_refund():
    """Automatic refund when deadline has passed (anyone can call)"""
    return Seq([
        # Validate arguments
        Assert(Txn.application_args.length() == Int(1)),
        
        # Check bounty is not already claimed or refunded
        Assert(App.globalGet(STATUS) != STATUS_CLAIMED),
        Assert(App.globalGet(STATUS) != STATUS_REFUNDED),
        
        # Check deadline has passed
        Assert(Global.latest_timestamp() >= App.globalGet(DEADLINE)),
        
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
    with open("algoease_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=8)
        f.write(compiled)
    
    with open("algoease_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
        f.write(compiled)
    
    print("Smart contracts compiled successfully!")
    print("Files created:")
    print("- algoease_approval.teal")
    print("- algoease_clear.teal")
