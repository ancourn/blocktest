#!/bin/bash

echo "Testing KALDRIX RPC Methods..."
echo "============================="

# Test health check first
echo "1. Testing health check..."
curl -s http://localhost:4000/health | jq .

echo -e "\n2. Testing kaldrix_getConsensusParams..."
curl -s -X POST http://localhost:4000 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"kaldrix_getConsensusParams","params":[],"id":1}' | jq .

echo -e "\n3. Testing kaldrix_getSupply..."
curl -s -X POST http://localhost:4000 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"kaldrix_getSupply","params":[],"id":2}' | jq .

echo -e "\n4. Testing kaldrix_runLoadTest..."
curl -s -X POST http://localhost:4000 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"kaldrix_runLoadTest","params":[100],"id":3}' | jq .

echo -e "\n5. Testing kaldrix_runSecurityTest..."
curl -s -X POST http://localhost:4000 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"kaldrix_runSecurityTest","params":["quorum_attack"],"id":4}' | jq .

echo -e "\n6. Testing kaldrix_generateValidationReport..."
curl -s -X POST http://localhost:4000 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"kaldrix_generateValidationReport","params":[],"id":5}' | jq .

echo -e "\n7. Testing standard Ethereum method (eth_blockNumber)..."
curl -s -X POST http://localhost:4000 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":6}' | jq .

echo -e "\nRPC Method Testing Complete!"