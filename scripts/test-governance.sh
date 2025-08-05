#!/bin/bash

# Governance System Validation Tests
# This script runs comprehensive tests for the governance functionality

set -e

echo "🏛️ Testing Governance System"
echo "============================"

# Source common utilities
source "$(dirname "$0")/common-test-utils.sh"

# Test 3.1: Proposal Creation
test_proposal_creation() {
    echo "Testing Proposal Creation..."
    
    local proposal_result=$(node -e "
        const { GovernanceSystem } = require('../src/lib/economic/governance');
        const { KaldNativeCoin } = require('../src/lib/economic/native-coin');
        const db = require('../src/lib/db');
        
        async function test() {
            const kaldCoin = new KaldNativeCoin({
                name: 'KALDRIX Coin',
                symbol: 'KALD',
                decimals: 18,
                totalSupply: 1000000000n * 1000000000000000000n,
                initialSupply: 500000000n * 1000000000000000000n,
                mintingEnabled: true
            }, new db.Database());
            
            const governance = new GovernanceSystem({
                governanceTokenSymbol: 'gKALD',
                governanceTokenName: 'KALDRIX Governance Token',
                minProposalThreshold: 10000000000000000000000n,
                votingPeriod: 20160,
                executionDelay: 2880,
                quorumThreshold: 0.1,
                proposalDeposit: 1000000000000000000n,
                maxProposalLength: 10000,
                votingPowerMultiplier: 1.0
            }, kaldCoin, new db.Database());
            
            try {
                // Test proposal creation
                const proposal = await governance.createProposal(
                    '0x1234567890123456789012345678901234567890',
                    'Test Parameter Change',
                    'This is a test proposal to validate the governance system',
                    'parameter_change',
                    {
                        parameter: 'baseFee',
                        oldValue: '1000000000000000000',
                        newValue: '1200000000000000000'
                    }
                );
                
                console.log(JSON.stringify({ 
                    success: true, 
                    proposalId: proposal.id,
                    title: proposal.title,
                    type: proposal.type,
                    status: proposal.status,
                    proposer: proposal.proposer,
                    startBlock: proposal.startBlock,
                    endBlock: proposal.endBlock
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$proposal_result" | grep -q '"success":true'; then
        echo "✅ Proposal Creation - PASSED"
        return 0
    else
        echo "❌ Proposal Creation - FAILED"
        return 1
    fi
}

# Test 3.2: Voting Mechanism
test_voting_mechanism() {
    echo "Testing Voting Mechanism..."
    
    local voting_result=$(node -e "
        const { GovernanceSystem } = require('../src/lib/economic/governance');
        const { KaldNativeCoin } = require('../src/lib/economic/native-coin');
        const db = require('../src/lib/db');
        
        async function test() {
            const kaldCoin = new KaldNativeCoin({
                name: 'KALDRIX Coin',
                symbol: 'KALD',
                decimals: 18,
                totalSupply: 1000000000n * 1000000000000000000n,
                initialSupply: 500000000n * 1000000000000000000n,
                mintingEnabled: true
            }, new db.Database());
            
            const governance = new GovernanceSystem({
                governanceTokenSymbol: 'gKALD',
                governanceTokenName: 'KALDRIX Governance Token',
                minProposalThreshold: 10000000000000000000000n,
                votingPeriod: 20160,
                executionDelay: 2880,
                quorumThreshold: 0.1,
                proposalDeposit: 1000000000000000000n,
                maxProposalLength: 10000,
                votingPowerMultiplier: 1.0
            }, kaldCoin, new db.Database());
            
            try {
                // Create a test proposal first
                const proposal = await governance.createProposal(
                    '0x1234567890123456789012345678901234567890',
                    'Test Voting Proposal',
                    'This is a test proposal for voting mechanism validation',
                    'governance_change',
                    {
                        parameter: 'votingPeriod',
                        oldValue: '20160',
                        newValue: '25200'
                    }
                );
                
                // Simulate voting
                const votingPower = 50000000000000000000n; // 50 tokens
                const voteTypes = ['for', 'against', 'abstain'];
                const voters = [
                    '0x1111111111111111111111111111111111111111',
                    '0x2222222222222222222222222222222222222222',
                    '0x3333333333333333333333333333333333333333'
                ];
                
                const votes = [];
                for (let i = 0; i < voters.length; i++) {
                    await governance.vote(
                        voters[i],
                        proposal.id,
                        voteTypes[i] as any,
                        \`Test vote reason \${i + 1}\`,
                        \`signature_\${i}\`
                    );
                    votes.push({
                        voter: voters[i],
                        voteType: voteTypes[i],
                        votingPower: votingPower.toString()
                    });
                }
                
                // Get updated proposal
                const updatedProposal = governance.getProposal(proposal.id);
                
                console.log(JSON.stringify({ 
                    success: true, 
                    proposalId: proposal.id,
                    totalVotes: updatedProposal?.totalVotes.toString(),
                    forVotes: updatedProposal?.forVotes.toString(),
                    againstVotes: updatedProposal?.againstVotes.toString(),
                    abstainVotes: updatedProposal?.abstainVotes.toString(),
                    quorumReached: updatedProposal?.quorumReached,
                    votesCast: votes.length,
                    votes: votes
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$voting_result" | grep -q '"success":true'; then
        echo "✅ Voting Mechanism - PASSED"
        return 0
    else
        echo "❌ Voting Mechanism - FAILED"
        return 1
    fi
}

# Test 3.3: Delegation System
test_delegation_system() {
    echo "Testing Delegation System..."
    
    local delegation_result=$(node -e "
        const { GovernanceSystem } = require('../src/lib/economic/governance');
        const { KaldNativeCoin } = require('../src/lib/economic/native-coin');
        const db = require('../src/lib/db');
        
        async function test() {
            const kaldCoin = new KaldNativeCoin({
                name: 'KALDRIX Coin',
                symbol: 'KALD',
                decimals: 18,
                totalSupply: 1000000000n * 1000000000000000000n,
                initialSupply: 500000000n * 1000000000000000000n,
                mintingEnabled: true
            }, new db.Database());
            
            const governance = new GovernanceSystem({
                governanceTokenSymbol: 'gKALD',
                governanceTokenName: 'KALDRIX Governance Token',
                minProposalThreshold: 10000000000000000000000n,
                votingPeriod: 20160,
                executionDelay: 2880,
                quorumThreshold: 0.1,
                proposalDeposit: 1000000000000000000n,
                maxProposalLength: 10000,
                votingPowerMultiplier: 1.0
            }, kaldCoin, new db.Database());
            
            try {
                // Test vote delegation
                const delegators = [
                    '0x1111111111111111111111111111111111111111',
                    '0x2222222222222222222222222222222222222222',
                    '0x3333333333333333333333333333333333333333'
                ];
                
                const delegatee = '0x9999999999999999999999999999999999999999';
                const votingPower = 10000000000000000000n; // 10 tokens each
                
                const delegations = [];
                for (const delegator of delegators) {
                    await governance.delegateVote(delegator, delegatee, \`sig_\${delegator}\`);
                    delegations.push({
                        delegator,
                        delegatee,
                        votingPower: votingPower.toString()
                    });
                }
                
                // Check delegatee's total voting power
                const delegateeVotingPower = governance.getVotingPower(delegatee);
                
                console.log(JSON.stringify({ 
                    success: true, 
                    delegatee,
                    delegateeVotingPower: delegateeVotingPower.toString(),
                    delegationsCount: delegations.length,
                    delegations: delegations,
                    expectedTotalPower: (votingPower * BigInt(delegators.length)).toString()
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$delegation_result" | grep -q '"success":true'; then
        echo "✅ Delegation System - PASSED"
        return 0
    else
        echo "❌ Delegation System - FAILED"
        return 1
    fi
}

# Test 3.4: Proposal Execution
test_proposal_execution() {
    echo "Testing Proposal Execution..."
    
    local execution_result=$(node -e "
        const { GovernanceSystem } = require('../src/lib/economic/governance');
        const { KaldNativeCoin } = require('../src/lib/economic/native-coin');
        const db = require('../src/lib/db');
        
        async function test() {
            const kaldCoin = new KaldNativeCoin({
                name: 'KALDRIX Coin',
                symbol: 'KALD',
                decimals: 18,
                totalSupply: 1000000000n * 1000000000000000000n,
                initialSupply: 500000000n * 1000000000000000000n,
                mintingEnabled: true
            }, new db.Database());
            
            const governance = new GovernanceSystem({
                governanceTokenSymbol: 'gKALD',
                governanceTokenName: 'KALDRIX Governance Token',
                minProposalThreshold: 10000000000000000000000n,
                votingPeriod: 20160,
                executionDelay: 2880,
                quorumThreshold: 0.1,
                proposalDeposit: 1000000000000000000n,
                maxProposalLength: 10000,
                votingPowerMultiplier: 1.0
            }, kaldCoin, new db.Database());
            
            try {
                // Create a test proposal
                const proposal = await governance.createProposal(
                    '0x1234567890123456789012345678901234567890',
                    'Test Execution Proposal',
                    'This is a test proposal for execution validation',
                    'parameter_change',
                    {
                        parameter: 'testParameter',
                        oldValue: 'oldValue',
                        newValue: 'newValue'
                    }
                );
                
                // Simulate voting to pass the proposal
                const voters = [
                    '0x1111111111111111111111111111111111111111',
                    '0x2222222222222222222222222222222222222222'
                ];
                
                for (const voter of voters) {
                    await governance.vote(voter, proposal.id, 'for', 'Supporting the proposal', \`sig_\${voter}\`);
                }
                
                // Simulate proposal lifecycle (for testing, we'll manually set status)
                const updatedProposal = governance.getProposal(proposal.id);
                if (updatedProposal) {
                    updatedProposal.status = 'pending';
                    updatedProposal.forVotes = 100000000000000000000n;
                    updatedProposal.againstVotes = 10000000000000000000n;
                    updatedProposal.quorumReached = true;
                }
                
                // Test proposal execution
                await governance.executeProposal(proposal.id);
                
                const executedProposal = governance.getProposal(proposal.id);
                
                console.log(JSON.stringify({ 
                    success: true, 
                    proposalId: proposal.id,
                    initialStatus: 'active',
                    finalStatus: executedProposal?.status,
                    wasExecuted: executedProposal?.status === 'executed',
                    forVotes: executedProposal?.forVotes.toString(),
                    againstVotes: executedProposal?.againstVotes.toString(),
                    quorumReached: executedProposal?.quorumReached
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$execution_result" | grep -q '"success":true'; then
        echo "✅ Proposal Execution - PASSED"
        return 0
    else
        echo "❌ Proposal Execution - FAILED"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo "Running all governance tests..."
    
    local failed_tests=0
    
    test_proposal_creation || ((failed_tests++))
    test_voting_mechanism || ((failed_tests++))
    test_delegation_system || ((failed_tests++))
    test_proposal_execution || ((failed_tests++))
    
    echo ""
    echo "Governance Tests Summary:"
    echo "========================="
    echo "Failed tests: $failed_tests"
    
    if [ "$failed_tests" -eq 0 ]; then
        echo "🎉 All governance tests passed!"
        return 0
    else
        echo "❌ $failed_tests governance tests failed!"
        return 1
    fi
}

# Main execution
case "${1:-all}" in
    "proposals")
        test_proposal_creation
        ;;
    "voting")
        test_voting_mechanism
        ;;
    "delegation")
        test_delegation_system
        ;;
    "execution")
        test_proposal_execution
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {proposals|voting|delegation|execution|all}"
        exit 1
        ;;
esac