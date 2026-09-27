#!/usr/bin/env python3
"""
HackNext - Root Acceptance Test Suite Runner
"""
import sys
import os
import subprocess

if __name__ == "__main__":
    script_path = os.path.join(os.path.dirname(__file__), "scripts", "run_acceptance_suite.py")
    if os.path.exists(script_path):
        res = subprocess.run([sys.executable, script_path] + sys.argv[1:])
        sys.exit(res.returncode)
    else:
        print("Could not find scripts/run_acceptance_suite.py")
        sys.exit(1)
