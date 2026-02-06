#!/bin/bash
# Verification script for implementation

echo "==================================="
echo "Implementation Verification Script"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

checks_passed=0
checks_failed=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $1"
        ((checks_failed++))
    fi
}

echo "1. Checking file structure..."
[ -d "js" ] && [ -d "icons" ]
check "Required directories exist"

[ -f "index.html" ] && [ -f "style.css" ] && [ -f "manifest.json" ] && [ -f "service-worker.js" ]
check "Core files exist"

echo ""
echo "2. Checking JavaScript modules..."
for file in config storage utils audio vibration achievements statistics ui gameManager main; do
    [ -f "js/${file}.js" ]
    check "js/${file}.js exists"
done

echo ""
echo "3. Syntax checking JavaScript..."
cd js
for file in *.js; do
    node --check "$file" 2>/dev/null
    check "$file syntax valid"
done
cd ..

echo ""
echo "4. Checking PWA assets..."
[ -f "manifest.json" ]
check "manifest.json exists"

[ -f "service-worker.js" ]
check "service-worker.js exists"

[ -f "icons/icon-192x192.png" ] && [ -f "icons/icon-512x512.png" ]
check "Required PWA icons exist"

echo ""
echo "5. Checking documentation..."
[ -f "README.md" ]
check "README.md exists"

[ -f "IMPLEMENTATION_SUMMARY.md" ]
check "IMPLEMENTATION_SUMMARY.md exists"

echo ""
echo "==================================="
echo "Results:"
echo -e "${GREEN}Passed: $checks_passed${NC}"
echo -e "${RED}Failed: $checks_failed${NC}"
echo "==================================="

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    exit 1
fi
