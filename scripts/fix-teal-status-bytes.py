#!/usr/bin/env python3
"""
Script to fix status byte size in compiled TEAL files.
Changes 'int X itob' (8 bytes) to 'int X itob extract 7 1' (1 byte) for status fields.
"""

import re
import sys
from pathlib import Path

def fix_status_bytes(teal_content):
    """Fix status bytes in TEAL code"""
    # Pattern to match: int <status>\nitob\nconcat (where status is 0-5)
    # We need to change it to: int <status>\nitob\nextract 7 1\nconcat
    
    # Status values: 0 (OPEN), 1 (ACCEPTED), 2 (APPROVED), 3 (CLAIMED), 4 (REFUNDED), 5 (REJECTED)
    # Replace each status pattern - handle both with and without newline before concat
    for status in [0, 1, 2, 3, 4, 5]:
        # Pattern 1: int X\nitob\nconcat
        old_pattern1 = f'int {status}\nitob\nconcat'
        new_pattern1 = f'int {status}\nitob\nextract 7 1\nconcat'
        teal_content = teal_content.replace(old_pattern1, new_pattern1)
        
        # Pattern 2: int X\nitob\n\nconcat (with blank line)
        old_pattern2 = f'int {status}\nitob\n\nconcat'
        new_pattern2 = f'int {status}\nitob\nextract 7 1\nconcat'
        teal_content = teal_content.replace(old_pattern2, new_pattern2)
    
    return teal_content

def main():
    """Main function"""
    # Get the contracts directory
    contracts_dir = Path(__file__).parent.parent / "contracts"
    
    teal_files = [
        contracts_dir / "algoease_approval.teal",
        contracts_dir / "algoease_clear.teal",
    ]
    
    # Also check root directory
    root_teal_files = [
        Path(__file__).parent.parent / "algoease_approval.teal",
        Path(__file__).parent.parent / "algoease_clear.teal",
    ]
    
    all_files = teal_files + root_teal_files
    
    fixed_count = 0
    for teal_file in all_files:
        if teal_file.exists():
            print(f"Processing {teal_file}...")
            try:
                with open(teal_file, 'r') as f:
                    content = f.read()
                
                fixed_content = fix_status_bytes(content)
                
                if fixed_content != content:
                    # Backup original
                    backup_file = teal_file.with_suffix('.teal.bak')
                    with open(backup_file, 'w') as f:
                        f.write(content)
                    print(f"  Created backup: {backup_file}")
                    
                    # Write fixed content
                    with open(teal_file, 'w') as f:
                        f.write(fixed_content)
                    print(f"  [OK] Fixed {teal_file}")
                    fixed_count += 1
                else:
                    print(f"  No changes needed for {teal_file}")
            except Exception as e:
                print(f"  [ERROR] Error processing {teal_file}: {e}")
    
    if fixed_count > 0:
        print(f"\n[SUCCESS] Fixed {fixed_count} TEAL file(s)")
        print("[NOTE] You may need to recompile the contract from Python source for a permanent fix.")
    else:
        print("\n[WARNING] No files were modified. The status bytes may already be correct, or the pattern may be different.")

if __name__ == "__main__":
    main()

