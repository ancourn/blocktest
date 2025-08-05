#!/bin/bash

# KALDRIX Mini-Testnet Stop Script
# This script stops all running KALDRIX nodes and dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 KALDRIX Mini-Testnet Stop Script${NC}"
echo -e "${BLUE}=================================${NC}"

# Check if PID file exists
if [ ! -f "testnet-pids.txt" ]; then
    echo -e "${YELLOW}⚠️  No PID file found. Searching for running processes...${NC}"
    
    # Try to find running KALDRIX processes
    PIDS=$(pgrep -f "start-node.js" || true)
    
    if [ -z "$PIDS" ]; then
        echo -e "${GREEN}✅ No KALDRIX processes found running.${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}🔍 Found KALDRIX processes: $PIDS${NC}"
else
    # Read PIDs from file
    PIDS=$(cat testnet-pids.txt)
    echo -e "${YELLOW}📋 Reading PIDs from testnet-pids.txt${NC}"
fi

# Stop processes
if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}🛑 Stopping processes...${NC}"
    
    for PID in $PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}📤 Stopping process $PID${NC}"
            kill $PID
            
            # Wait for graceful shutdown
            sleep 2
            
            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                echo -e "${YELLOW}⚠️  Force killing process $PID${NC}"
                kill -9 $PID
            fi
        else
            echo -e "${YELLOW}⚠️  Process $PID is not running${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ All processes stopped${NC}"
else
    echo -e "${GREEN}✅ No processes to stop${NC}"
fi

# Clean up PID file
if [ -f "testnet-pids.txt" ]; then
    rm testnet-pids.txt
    echo -e "${GREEN}🗑️  Cleaned up PID file${NC}"
fi

# Check for any remaining processes
echo -e "${YELLOW}🔍 Checking for remaining processes...${NC}"
REMAINING=$(pgrep -f "start-node.js" || true)

if [ -n "$REMAINING" ]; then
    echo -e "${RED}⚠️  Found remaining processes: $REMAINING${NC}"
    echo -e "${YELLOW}💡 You may need to manually kill these processes${NC}"
else
    echo -e "${GREEN}✅ All KALDRIX processes stopped successfully${NC}"
fi

echo -e "${BLUE}🎉 KALDRIX Mini-Testnet stopped successfully!${NC}"