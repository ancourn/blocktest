#!/bin/bash

# Common Test Utilities for KALDRIX Economic Layer Validation
# This script provides shared utilities for all test scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test result functions
test_passed() {
    local test_name="$1"
    log_success "✅ $test_name - PASSED"
}

test_failed() {
    local test_name="$1"
    local error_message="$2"
    log_error "❌ $test_name - FAILED"
    if [ -n "$error_message" ]; then
        echo "   Error: $error_message"
    fi
}

test_skipped() {
    local test_name="$1"
    local reason="$2"
    log_warning "⏭️  $test_name - SKIPPED"
    if [ -n "$reason" ]; then
        echo "   Reason: $reason"
    fi
}

# Performance measurement functions
start_timer() {
    echo "⏱️  Starting timer..."
    SECONDS=0
}

stop_timer() {
    local duration=$SECONDS
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    echo "⏱️  Time elapsed: ${minutes}m ${seconds}s"
    return $duration
}

# Memory usage functions
get_memory_usage() {
    if command -v ps &> /dev/null; then
        local memory_kb=$(ps -o rss= -p $$ | tr -d ' ')
        local memory_mb=$((memory_kb / 1024))
        echo "${memory_mb}MB"
    else
        echo "N/A"
    fi
}

log_memory_usage() {
    local memory_usage=$(get_memory_usage)
    log_info "Memory usage: $memory_usage"
}

# JSON parsing helpers (requires jq)
parse_json_field() {
    local json_string="$1"
    local field="$2"
    
    if command -v jq &> /dev/null; then
        echo "$json_string" | jq -r "$field"
    else
        # Fallback to simple grep (less reliable)
        echo "$json_string" | grep -o "\"$field\":[^,}]*" | cut -d: -f2 | tr -d '"'
    fi
}

# Test environment setup
setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create test directory
    local test_dir="/tmp/kaldrix-test-$$"
    mkdir -p "$test_dir"
    
    # Set environment variables
    export NODE_ENV="test"
    export KALDRIX_TEST_DIR="$test_dir"
    
    log_info "Test environment ready: $test_dir"
    echo "$test_dir"
}

cleanup_test_environment() {
    local test_dir="${KALDRIX_TEST_DIR:-/tmp/kaldrix-test}"
    
    if [ -d "$test_dir" ]; then
        log_info "Cleaning up test environment: $test_dir"
        rm -rf "$test_dir"
    fi
    
    unset KALDRIX_TEST_DIR
    unset NODE_ENV
}

# Database test helpers
wait_for_database() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if node -e "const db = require('../src/lib/db'); console.log('OK');" 2>/dev/null; then
            log_success "Database is ready"
            return 0
        fi
        
        log_info "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "Database not ready after $max_attempts attempts"
    return 1
}

# Network test helpers
wait_for_service() {
    local service_url="$1"
    local service_name="$2"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$service_url" > /dev/null 2>&1; then
            log_success "$service_name is ready"
            return 0
        fi
        
        log_info "Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "$service_name not ready after $max_attempts attempts"
    return 1
}

# File system helpers
create_test_file() {
    local file_path="$1"
    local content="$2"
    
    mkdir -p "$(dirname "$file_path")"
    echo "$content" > "$file_path"
    
    if [ -f "$file_path" ]; then
        log_success "Created test file: $file_path"
        return 0
    else
        log_error "Failed to create test file: $file_path"
        return 1
    fi
}

remove_test_file() {
    local file_path="$1"
    
    if [ -f "$file_path" ]; then
        rm -f "$file_path"
        log_info "Removed test file: $file_path"
    fi
}

# Test data generators
generate_random_address() {
    echo "0x$(openssl rand -hex 20)"
}

generate_random_amount() {
    local min="${1:-1000000000000000000}"  # Default: 1 token
    local max="${2:-100000000000000000000}" # Default: 100 tokens
    
    local range=$((max - min))
    local random=$((RANDOM % range + min))
    echo "$random"
}

generate_test_transactions() {
    local count="$1"
    local output_file="$2"
    
    if [ -z "$count" ] || [ -z "$output_file" ]; then
        log_error "generate_test_transactions requires count and output_file parameters"
        return 1
    fi
    
    log_info "Generating $count test transactions..."
    
    mkdir -p "$(dirname "$output_file")"
    
    {
        echo "["
        for ((i=0; i<count; i++)); do
            local from_addr=$(generate_random_address)
            local to_addr=$(generate_random_address)
            local amount=$(generate_random_amount)
            local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
            
            cat << EOF
    {
        "id": "tx_$i",
        "from": "$from_addr",
        "to": "$to_addr",
        "amount": "$amount",
        "timestamp": "$timestamp",
        "status": "completed"
    }$([ $i -lt $((count - 1)) ] && echo ",")
EOF
        done
        echo "]"
    } > "$output_file"
    
    if [ -f "$output_file" ]; then
        log_success "Generated $count test transactions in $output_file"
        return 0
    else
        log_error "Failed to generate test transactions"
        return 1
    fi
}

# Test assertion helpers
assert_equals() {
    local actual="$1"
    local expected="$2"
    local message="$3"
    
    if [ "$actual" = "$expected" ]; then
        test_passed "${message:-Assertion passed}"
        return 0
    else
        test_failed "${message:-Assertion failed}" "Expected: $expected, Actual: $actual"
        return 1
    fi
}

assert_not_equals() {
    local actual="$1"
    local expected="$2"
    local message="$3"
    
    if [ "$actual" != "$expected" ]; then
        test_passed "${message:-Assertion passed}"
        return 0
    else
        test_failed "${message:-Assertion failed}" "Expected not equal: $expected"
        return 1
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local message="$3"
    
    if echo "$haystack" | grep -q "$needle"; then
        test_passed "${message:-Assertion passed}"
        return 0
    else
        test_failed "${message:-Assertion failed}" "String does not contain: $needle"
        return 1
    fi
}

assert_greater_than() {
    local actual="$1"
    local expected="$2"
    local message="$3"
    
    if [ "$actual" -gt "$expected" ]; then
        test_passed "${message:-Assertion passed}"
        return 0
    else
        test_failed "${message:-Assertion failed}" "Expected greater than: $expected, Actual: $actual"
        return 1
    fi
}

assert_less_than() {
    local actual="$1"
    local expected="$2"
    local message="$3"
    
    if [ "$actual" -lt "$expected" ]; then
        test_passed "${message:-Assertion passed}"
        return 0
    else
        test_failed "${message:-Assertion failed}" "Expected less than: $expected, Actual: $actual"
        return 1
    fi
}

# Test runner helpers
run_test_with_timeout() {
    local test_command="$1"
    local timeout_seconds="${2:-30}"
    local test_name="${3:-Unnamed test}"
    
    log_info "Running test: $test_name (timeout: ${timeout_seconds}s)"
    
    # Run the test with timeout
    if timeout "$timeout_seconds" bash -c "$test_command" >/dev/null 2>&1; then
        test_passed "$test_name"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            test_failed "$test_name" "Test timed out after ${timeout_seconds} seconds"
        else
            test_failed "$test_name" "Test failed with exit code $exit_code"
        fi
        return 1
    fi
}

# Test suite runner
run_test_suite() {
    local suite_name="$1"
    shift
    local test_functions=("$@")
    
    log_info "Running test suite: $suite_name"
    log_info "================================"
    
    local passed=0
    local failed=0
    local total=${#test_functions[@]}
    
    for test_func in "${test_functions[@]}"; do
        if $test_func; then
            ((passed++))
        else
            ((failed++))
        fi
    done
    
    echo ""
    log_info "Test Suite Summary: $suite_name"
    log_info "=============================="
    log_info "Total tests: $total"
    log_success "Passed: $passed"
    if [ $failed -gt 0 ]; then
        log_error "Failed: $failed"
    else
        log_success "Failed: 0"
    fi
    
    local success_rate=$((passed * 100 / total))
    log_info "Success rate: ${success_rate}%"
    
    if [ $failed -eq 0 ]; then
        log_success "🎉 All tests in $suite_name passed!"
        return 0
    else
        log_error "❌ $failed tests in $suite_name failed!"
        return 1
    fi
}

# Export functions for use in other scripts
export -f log_info log_success log_warning log_error
export -f test_passed test_failed test_skipped
export -f start_timer stop_timer get_memory_usage log_memory_usage
export -f parse_json_field
export -f setup_test_environment cleanup_test_environment
export -f wait_for_database wait_for_service
export -f create_test_file remove_test_file
export -f generate_random_address generate_random_amount generate_test_transactions
export -f assert_equals assert_not_equals assert_contains assert_greater_than assert_less_than
export -f run_test_with_timeout run_test_suite

# Initialize test environment if this script is sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    log_info "Common test utilities loaded"
fi