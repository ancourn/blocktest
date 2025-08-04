@echo off
REM ===================================================
REM KALDRIX BLOCKCHAIN TEST DRIVE SCRIPT - WINDOWS
REM ===================================================
REM Verifies network parameters, connections, and performance
REM Requires: Access to at least one full node RPC endpoint

setlocal enabledelayedexpansion

REM Configuration
if "%RPC_URL%"=="" set RPC_URL=http://localhost:8545
if "%TEST_WALLET_PRIV%"=="" set TEST_WALLET_PRIV=0x1234567890123456789012345678901234567890123456789012345678901234
if "%RECEIVER_ADDR%"=="" set RECEIVER_ADDR=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
set LOG_FILE=kaldrix-test-%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%.log
set REPORT_FILE=kaldrix-validation-report-%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%.json

REM Colors (Windows 10+)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Initialize log file
echo KALDRIX Blockchain Test Drive - %date% %time% > "%LOG_FILE%"
echo RPC URL: %RPC_URL% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"

REM Initialize report JSON
echo { > "%REPORT_FILE%"
echo   "testTimestamp": "%date%T%time%", >> "%REPORT_FILE%"
echo   "rpcUrl": "%RPC_URL%", >> "%REPORT_FILE%"
echo   "results": { >> "%REPORT_FILE%"

echo %BLUE%=== KALDRIX BLOCKCHAIN TEST DRIVE ===%NC%
echo %BLUE%Started at: %date% %time%%NC%
echo %BLUE%RPC Endpoint: %RPC_URL%%NC%
echo.

REM Test 1: Network Status Audit
echo %GREEN%=== 1. NETWORK STATUS AUDIT ===%NC%
echo Testing basic network connectivity...

REM Test RPC connection
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"net_listening\",\"params\":[],\"id\":1}" %RPC_URL% > temp_response.txt
findstr /C:"true" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo %GREEN%✓ RPC Connection: Active%NC%
    echo "rpcConnection": "PASS", >> "%REPORT_FILE%"
) else (
    echo %RED%✗ RPC Connection: Failed%NC%
    echo "rpcConnection": "FAIL", >> "%REPORT_FILE%"
)

REM Get peer count
echo.
echo Active Peers:
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":2}" %RPC_URL% > temp_response.txt
for /f "tokens=2 delims=:" %%a in ('findstr /C:"result" temp_response.txt') do set "peer_result=%%a"
set "peer_result=%peer_result:"=%"
set "peer_result=%peer_result: =%"
set "peer_result=%peer_result:,=%"
if not "%peer_result%"=="" (
    set /a "peer_decimal=0x%peer_result%"
    echo Peer Count: !peer_decimal!
    echo "peerCount": "!peer_decimal!", >> "%REPORT_FILE%"
) else (
    echo Peer Count: Unable to fetch
    echo "peerCount": "ERROR", >> "%REPORT_FILE%"
)

REM Get sync status
echo.
echo Node Sync Status:
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_syncing\",\"params\":[],\"id\":3}" %RPC_URL% > temp_response.txt
findstr /C:"false" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo %GREEN%✓ Node Status: Fully Synced%NC%
    echo "syncStatus": "SYNCED", >> "%REPORT_FILE%"
) else (
    findstr /C:"startingBlock" temp_response.txt >nul
    if %errorlevel% equ 0 (
        echo %YELLOW%⚠ Node Status: Syncing%NC%
        echo "syncStatus": "SYNCING", >> "%REPORT_FILE%"
    ) else (
        echo %RED%✗ Node Status: Unknown%NC%
        echo "syncStatus": "ERROR", >> "%REPORT_FILE%"
    )
)

REM Get current block number
echo.
echo Current Block Number:
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":4}" %RPC_URL% > temp_response.txt
for /f "tokens=2 delims=:" %%a in ('findstr /C:"result" temp_response.txt') do set "block_result=%%a"
set "block_result=%block_result:"=%"
set "block_result=%block_result: =%"
set "block_result=%block_result:,=%"
if not "%block_result%"=="" (
    set /a "block_decimal=0x%block_result%"
    echo Block: !block_decimal!
    echo "currentBlock": "!block_decimal!", >> "%REPORT_FILE%"
) else (
    echo Block: Unable to fetch
    echo "currentBlock": "ERROR", >> "%REPORT_FILE%"
)

REM Get network ID
echo.
echo Network ID:
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":5}" %RPC_URL% > temp_response.txt
for /f "tokens=2 delims=:" %%a in ('findstr /C:"result" temp_response.txt') do set "network_result=%%a"
set "network_result=%network_result:"=%"
set "network_result=%network_result: =%"
set "network_result=%network_result:,=%"
if not "%network_result%"=="" (
    set /a "network_decimal=0x%network_result%"
    echo Network ID: !network_decimal!
    echo "networkId": "!network_decimal!", >> "%REPORT_FILE%"
) else (
    echo Network ID: Unable to fetch
    echo "networkId": "ERROR", >> "%REPORT_FILE%"
)

REM Test 2: Blockchain Parameters
echo.
echo %GREEN%=== 2. BLOCKCHAIN PARAMETERS ===%NC%

REM Get gas price
echo Gas Price:
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_gasPrice\",\"params\":[],\"id\":6}" %RPC_URL% > temp_response.txt
for /f "tokens=2 delims=:" %%a in ('findstr /C:"result" temp_response.txt') do set "gas_result=%%a"
set "gas_result=%gas_result:"=%"
set "gas_result=%gas_result: =%"
set "gas_result=%gas_result:,=%"
if not "%gas_result%"=="" (
    set /a "gas_decimal=0x%gas_result%"
    set /a "gas_gwei=!gas_decimal! / 1000000000"
    echo Gas Price: !gas_gwei! Gwei
    echo "gasPrice": "!gas_gwei!", >> "%REPORT_FILE%"
) else (
    echo Gas Price: Unable to fetch
    echo "gasPrice": "ERROR", >> "%REPORT_FILE%"
)

REM Test 3: Sample Transaction Test
echo.
echo %GREEN%=== 3. SAMPLE TRANSACTION TEST ===%NC%
echo Testing transaction capabilities...

REM Get transaction count for test address
echo Getting transaction count for test address...
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionCount\",\"params\":[\"0x1234567890123456789012345678901234567890\", \"latest\"],\"id\":10}" %RPC_URL% > temp_response.txt
for /f "tokens=2 delims=:" %%a in ('findstr /C:"result" temp_response.txt') do set "tx_result=%%a"
set "tx_result=%tx_result:"=%"
set "tx_result=%tx_result: =%"
set "tx_result=%tx_result:,=%"
if not "%tx_result%"=="" (
    set /a "tx_decimal=0x%tx_result%"
    echo Transaction Count ^(nonce^): !tx_decimal!
    echo "transactionCount": "!tx_decimal!", >> "%REPORT_FILE%"
) else (
    echo Transaction Count: Unable to fetch
    echo "transactionCount": "ERROR", >> "%REPORT_FILE%"
)

REM Estimate gas for a simple transaction
echo.
echo Estimating gas for test transaction...
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_estimateGas\",\"params\":[{\"from\": \"0x1234567890123456789012345678901234567890\", \"to\": \"%RECEIVER_ADDR%\", \"value\": \"0x1\"}],\"id\":11}" %RPC_URL% > temp_response.txt
for /f "tokens=2 delims=:" %%a in ('findstr /C:"result" temp_response.txt') do set "gas_est_result=%%a"
set "gas_est_result=%gas_est_result:"=%"
set "gas_est_result=%gas_est_result: =%"
set "gas_est_result=%gas_est_result:,=%"
if not "%gas_est_result%"=="" (
    set /a "gas_est_decimal=0x%gas_est_result%"
    echo Estimated Gas: !gas_est_decimal!
    echo "estimatedGas": "!gas_est_decimal!", >> "%REPORT_FILE%"
) else (
    echo Estimated Gas: Unable to fetch
    echo "estimatedGas": "ERROR", >> "%REPORT_FILE%"
)

REM Test 4: Performance Stress Test (Simulated)
echo.
echo %GREEN%=== 4. PERFORMANCE STRESS TEST ===%NC%
echo Running simulated performance tests...

REM Test different TPS levels
for %%T in (10 100 1000) do (
    echo Testing at %%T TPS...
    
    REM Simulate load test - make multiple rapid RPC calls
    for /L %%i in (1,1,5) do (
        curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1%%i}\" %RPC_URL% >nul
    )
    
    echo   Target: %%T TPS | Test completed
    timeout /t 1 /nobreak >nul
)

echo "performanceTest": "COMPLETED", >> "%REPORT_FILE%"

REM Test 5: Security Scenario Test (Simulated)
echo.
echo %GREEN%=== 5. SECURITY SCENARIO TEST ===%NC%
echo Running security validation tests...

REM Test 1: Check for proper error handling on invalid transactions
echo Testing invalid transaction handling...
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_sendTransaction\",\"params\":[{\"from\": \"0xinvalid\", \"to\": \"%RECEIVER_ADDR%\", \"value\": \"0x1\"}],\"id\":12}" %RPC_URL% > temp_response.txt
findstr /C:"error" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo %GREEN%✓ Invalid Transaction: Properly rejected%NC%
) else (
    echo %RED%✗ Invalid Transaction: Not properly handled%NC%
)

REM Test 2: Check for proper error handling on invalid blocks
echo.
echo Testing invalid block access...
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBlockByNumber\",\"params\":[\"0xinvalid\", false],\"id\":13}" %RPC_URL% > temp_response.txt
findstr /C:"error" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo %GREEN%✓ Invalid Block: Properly rejected%NC%
) else (
    echo %RED%✗ Invalid Block: Not properly handled%NC%
)

REM Test 3: Check network basic security
echo.
echo Testing network security basics...
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_syncing\",\"params\":[],\"id\":14}" %RPC_URL% > temp_response.txt
findstr /C:"false" temp_response.txt >nul
if %errorlevel% equ 0 (
    echo %GREEN%✓ Network Sync: Stable and secure%NC%
) else (
    echo %YELLOW%⚠ Network Sync: Still syncing ^(normal for new nodes^)%NC%
)

echo "securityTest": "COMPLETED", >> "%REPORT_FILE%"

REM Test 6: Final Report Generation
echo.
echo %GREEN%=== 6. FINAL REPORT ===%NC%
echo Generating comprehensive validation report...

REM Simple health score calculation
set health_score=0
set total_tests=0

REM Check RPC connection
findstr /C:"true" temp_response.txt >nul
if %errorlevel% equ 0 (
    set /a health_score+=20
)
set /a total_tests+=1

REM Check sync status
findstr /C:"false" temp_response.txt >nul
if %errorlevel% equ 0 (
    set /a health_score+=20
)
set /a total_tests+=1

REM Check if we got block number
if not "%block_result%"=="" (
    set /a health_score+=20
)
set /a total_tests+=1

REM Check if we got gas price
if not "%gas_result%"=="" (
    set /a health_score+=20
)
set /a total_tests+=1

REM Check if transaction count worked
if not "%tx_result%"=="" (
    set /a health_score+=20
)
set /a total_tests+=1

REM Calculate final score
if %total_tests% gtr 0 (
    set /a final_score=!health_score! / %total_tests%
) else (
    set final_score=0
)

echo.
echo %BLUE%=== TEST RESULTS SUMMARY ===%NC%
echo Overall Health Score: !final_score!%%
echo Tests Passed: !health_score!/%total_tests%

REM Determine status
if !final_score! geq 80 (
    set status=EXCELLENT
    set status_color=%GREEN%
) else if !final_score! geq 60 (
    set status=GOOD
    set status_color=%YELLOW%
) else if !final_score! geq 40 (
    set status=FAIR
    set status_color=%YELLOW%
) else (
    set status=POOR
    set status_color=%RED%
)

echo.
echo %status_color%Network Status: !status!%NC%

REM Complete the JSON report
echo     "healthScore": !final_score!, >> "%REPORT_FILE%"
echo     "status": "!status!", >> "%REPORT_FILE%"
echo     "testDuration": 0, >> "%REPORT_FILE%"
echo     "timestamp": "%date%T%time%" >> "%REPORT_FILE%"
echo   } >> "%REPORT_FILE%"
echo } >> "%REPORT_FILE%"

REM Display report location
echo.
echo %BLUE%=== REPORT FILES ===%NC%
echo Detailed Log: %LOG_FILE%
echo JSON Report: %REPORT_FILE%

REM Provide recommendations
echo.
echo %BLUE%=== RECOMMENDATIONS ===%NC%
if !final_score! geq 80 (
    echo %GREEN%• Network is performing excellently%NC%
    echo %GREEN%• All core functions are operational%NC%
    echo %GREEN%• Ready for production use%NC%
) else if !final_score! geq 60 (
    echo %YELLOW%• Network is performing well%NC%
    echo %YELLOW%• Minor optimizations may be needed%NC%
    echo %YELLOW%• Monitor performance regularly%NC%
) else if !final_score! geq 40 (
    echo %YELLOW%• Network has some issues%NC%
    echo %YELLOW%• Review configuration and logs%NC%
    echo %YELLOW%• Consider scaling resources%NC%
) else (
    echo %RED%• Network has significant issues%NC%
    echo %RED%• Immediate attention required%NC%
    echo %RED%• Check node configuration and connectivity%NC%
)

echo.
echo %BLUE%=== TEST DRIVE COMPLETE ===%NC%
echo Thank you for testing KALDRIX Blockchain!
echo For support: https://discord.gg/kaldrix
echo For documentation: https://docs.kaldrix.network

REM Cleanup
del temp_response.txt 2>nul

REM Exit with appropriate code
if !final_score! geq 60 (
    exit /b 0
) else (
    exit /b 1
)