"""
Test suite for AlgoEase smart contract
"""

import pytest
from algosdk import account, mnemonic
from algosdk.v2client import algod
from pyteal import *
import json

# Import the contract
from algoease_contract import approval_program, clear_state_program

class TestAlgoEaseContract:
    
    def setup_method(self):
        """Setup test environment"""
        # Test accounts
        self.client_private_key, self.client_address = account.generate_account()
        self.freelancer_private_key, self.freelancer_address = account.generate_account()
        self.verifier_private_key, self.verifier_address = account.generate_account()
        
        # Test parameters
        self.bounty_amount = 1000000  # 1 ALGO in microAlgos
        self.deadline = 1000000000    # Future timestamp
        self.task_description = "Test task description"
    
    def test_contract_compilation(self):
        """Test that the contract compiles successfully"""
        approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=8)
        clear_teal = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
        
        assert isinstance(approval_teal, str)
        assert isinstance(clear_teal, str)
        assert len(approval_teal) > 0
        assert len(clear_teal) > 0
    
    def test_create_bounty_validation(self):
        """Test bounty creation validation"""
        # This would test the contract logic in a simulated environment
        # For now, we'll test the compilation and basic structure
        approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=8)
        
        # Check that the contract contains expected operations
        assert "create_bounty" in approval_teal
        assert "accept_bounty" in approval_teal
        assert "approve_bounty" in approval_teal
        assert "claim" in approval_teal
        assert "refund" in approval_teal
    
    def test_bounty_workflow(self):
        """Test the complete bounty workflow"""
        # This would test the full workflow in a simulated environment
        # 1. Create bounty
        # 2. Accept bounty
        # 3. Approve bounty
        # 4. Claim bounty
        
        # For now, we'll verify the contract structure supports this workflow
        approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=8)
        
        # Verify all required methods are present
        required_methods = [
            "create_bounty",
            "accept_bounty", 
            "approve_bounty",
            "claim",
            "refund"
        ]
        
        for method in required_methods:
            assert method in approval_teal, f"Method {method} not found in contract"

if __name__ == "__main__":
    pytest.main([__file__])
