#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🔒 Running Dependency Audit (Security Hardening)..."

# Run npm audit. 
# --audit-level=high means it will exit with a non-zero code ONLY if there are high or critical vulnerabilities.
# This ensures build pipelines don't fail on low-severity warnings, but block severe stuff.

if npm audit --audit-level=high; then
  echo "✅ No high or critical vulnerabilities found."
else
  echo "❌ CRITICAL SECURITY VULNERABILITIES DETECTED in dependencies."
  echo "Please run 'npm audit fix' or manually resolve the issues."
  exit 1
fi
