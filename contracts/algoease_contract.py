"""
AlgoEase Smart Contract - Decentralized Escrow Platform

This PyTeal contract powers the bounty lifecycle that the frontend expects:
 - Clients create bounties by funding the application address in a grouped payment.
 - Freelancers accept and later claim funds after verifier approval.
 - Clients/verifiers can trigger refunds manually, or anyone can auto-refund after the deadline.

The contract keeps one bounty active at a time, but new bounties can be created
once the previous one is claimed or refunded (amount reset to zero).
"""

from pyteal import *


# -----------------------------------------------------------------------------
# Global keys and constants
# -----------------------------------------------------------------------------
BOUNTY_COUNT = Bytes("bounty_count")
CLIENT_ADDR = Bytes("client_addr")
FREELANCER_ADDR = Bytes("freelancer_addr")
AMOUNT = Bytes("amount")
DEADLINE = Bytes("deadline") 
STATUS = Bytes("status")
TASK_DESCRIPTION = Bytes("task_desc") 
VERIFIER_ADDR = Bytes("verifier_addr")

STATUS_OPEN = Int(0)
STATUS_ACCEPTED = Int(1)
STATUS_APPROVED = Int(2)
STATUS_CLAIMED = Int(3)
STATUS_REFUNDED = Int(4)

ZERO_ADDR = Global.zero_address()
EMPTY_BYTES = Bytes("")


# -----------------------------------------------------------------------------
# Helper routines
# -----------------------------------------------------------------------------
def initialize_global_state():
    """Prepare deterministic defaults so frontend reads never fail."""
    return Seq(
        App.globalPut(BOUNTY_COUNT, Int(0)),
        App.globalPut(CLIENT_ADDR, ZERO_ADDR),
        App.globalPut(FREELANCER_ADDR, ZERO_ADDR),
        App.globalPut(VERIFIER_ADDR, ZERO_ADDR),
        App.globalPut(AMOUNT, Int(0)),
        App.globalPut(DEADLINE, Int(0)),
        App.globalPut(STATUS, STATUS_REFUNDED),
        App.globalPut(TASK_DESCRIPTION, EMPTY_BYTES),
    )


def ensure_no_active_bounty():
    """Only allow a new bounty if funds from the previous one are settled."""
    return Or(
        App.globalGet(AMOUNT) == Int(0),
        App.globalGet(STATUS) == STATUS_CLAIMED,
        App.globalGet(STATUS) == STATUS_REFUNDED,
    )


def reset_bounty_state(new_status: Expr):
    """Clear mutable bounty state while keeping historical addresses for UI."""
    return Seq(
        App.globalPut(STATUS, new_status),
        App.globalPut(AMOUNT, Int(0)),
        App.globalPut(DEADLINE, Int(0)),
        App.globalPut(TASK_DESCRIPTION, EMPTY_BYTES),
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
    return Seq(initialize_global_state(), Return(Int(1)))


def handle_deletion():
    # Safe to delete only when no funds are held by the contract
    return Seq(Assert(App.globalGet(AMOUNT) == Int(0)), Return(Int(1)))


def handle_update():
    # Immutable once deployed
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
    amount = ScratchVar(TealType.uint64)
    deadline = ScratchVar(TealType.uint64)
    verifier = ScratchVar(TealType.bytes)

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
        Assert(ensure_no_active_bounty()),
        App.globalPut(CLIENT_ADDR, Txn.sender()),
        App.globalPut(AMOUNT, amount.load()),
        App.globalPut(DEADLINE, deadline.load()),
        App.globalPut(TASK_DESCRIPTION, Txn.application_args[3]),
        App.globalPut(VERIFIER_ADDR, verifier.load()),
        App.globalPut(FREELANCER_ADDR, ZERO_ADDR),
        App.globalPut(STATUS, STATUS_OPEN),
        App.globalPut(BOUNTY_COUNT, App.globalGet(BOUNTY_COUNT) + Int(1)),
        Return(Int(1)),
    )


def accept_bounty():
    return Seq(
        Assert(Txn.application_args.length() == Int(1)),
        Assert(App.globalGet(STATUS) == STATUS_OPEN),
        Assert(Global.latest_timestamp() < App.globalGet(DEADLINE)),
        App.globalPut(FREELANCER_ADDR, Txn.sender()),
        App.globalPut(STATUS, STATUS_ACCEPTED),
        Return(Int(1)),
    )


def approve_bounty():
    return Seq(
        Assert(Txn.application_args.length() == Int(1)),
        Assert(App.globalGet(STATUS) == STATUS_ACCEPTED),
        Assert(Txn.sender() == App.globalGet(VERIFIER_ADDR)),
        App.globalPut(STATUS, STATUS_APPROVED),
        Return(Int(1)),
    )


def claim_bounty():
    amount = ScratchVar(TealType.uint64)
    return Seq(
        Assert(Txn.application_args.length() == Int(1)),
        Assert(App.globalGet(STATUS) == STATUS_APPROVED),
        Assert(Txn.sender() == App.globalGet(FREELANCER_ADDR)),
        amount.store(App.globalGet(AMOUNT)),
        Assert(amount.load() > Int(0)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.sender: Global.current_application_address(),
                TxnField.receiver: Txn.sender(),
                TxnField.amount: amount.load(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
        reset_bounty_state(STATUS_CLAIMED),
        Return(Int(1)),
    )


def refund_bounty():
    amount = ScratchVar(TealType.uint64)
    caller_is_authorized = Or(
        Txn.sender() == App.globalGet(CLIENT_ADDR),
        Txn.sender() == App.globalGet(VERIFIER_ADDR),
    )
    return Seq(
        Assert(Txn.application_args.length() == Int(1)),
        Assert(App.globalGet(STATUS) != STATUS_CLAIMED),
        Assert(App.globalGet(STATUS) != STATUS_REFUNDED),
        Assert(caller_is_authorized),
        amount.store(App.globalGet(AMOUNT)),
        Assert(amount.load() > Int(0)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.sender: Global.current_application_address(),
                TxnField.receiver: App.globalGet(CLIENT_ADDR),
                TxnField.amount: amount.load(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
        reset_bounty_state(STATUS_REFUNDED),
        Return(Int(1)),
    )


def auto_refund():
    amount = ScratchVar(TealType.uint64)
    return Seq(
        Assert(Txn.application_args.length() == Int(1)),
        Assert(App.globalGet(STATUS) != STATUS_CLAIMED),
        Assert(App.globalGet(STATUS) != STATUS_REFUNDED),
        Assert(Global.latest_timestamp() >= App.globalGet(DEADLINE)),
        amount.store(App.globalGet(AMOUNT)),
        Assert(amount.load() > Int(0)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.sender: Global.current_application_address(),
                TxnField.receiver: App.globalGet(CLIENT_ADDR),
                TxnField.amount: amount.load(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
        reset_bounty_state(STATUS_REFUNDED),
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

    with open("algoease_approval.teal", "w") as f:
        f.write(approval_teal)

    with open("algoease_clear.teal", "w") as f:
        f.write(clear_teal)

    print("Smart contracts compiled successfully!")
    print("Files created:")
    print("- algoease_approval.teal")
    print("- algoease_clear.teal")
