//! Main entry point for KALDRIX blockchain node

use clap::{Parser, Subcommand};
use kaldrix_core::{KaldrixCore, CoreConfig, CoreResult};
use tracing::{info, error, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::sync::Arc;
use tokio::signal;

/// KALDRIX Blockchain Node
#[derive(Parser, Debug)]
#[command(name = "kaldrix-node")]
#[command(about = "KALDRIX quantum-resistant DAG-based blockchain node")]
#[command(version = "0.1.0")]
struct Args {
    #[command(subcommand)]
    command: Option<Commands>,
    
    /// Configuration file path
    #[arg(short, long, default_value = "config.toml")]
    config: String,
    
    /// Log level
    #[arg(short, long, default_value = "info")]
    log_level: String,
    
    /// Enable verbose output
    #[arg(short, long)]
    verbose: bool,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Start the blockchain node
    Start {
        /// Listen address
        #[arg(short, long, default_value = "0.0.0.0:30333")]
        listen: String,
        
        /// Bootstrap nodes
        #[arg(short, long)]
        bootstrap: Vec<String>,
    },
    
    /// Generate a new key pair
    GenerateKey {
        /// Key type (dilithium, sphincs, falcon, ed25519)
        #[arg(short, long, default_value = "dilithium")]
        key_type: String,
        
        /// Output file
        #[arg(short, long, default_value = "keypair.json")]
        output: String,
    },
    
    /// Validate configuration
    ValidateConfig,
    
    /// Run benchmarks
    Benchmark {
        /// Benchmark type (dag, crypto, consensus)
        #[arg(short, long, default_value = "all")]
        benchmark_type: String,
        
        /// Number of iterations
        #[arg(short, long, default_value = "1000")]
        iterations: u32,
    },
    
    /// Show node status
    Status,
}

#[tokio::main]
async fn main() -> CoreResult<()> {
    let args = Args::parse();
    
    // Initialize logging
    init_logging(&args.log_level, args.verbose)?;
    
    info!("Starting KALDRIX Blockchain Node");
    
    match args.command {
        Some(Commands::Start { listen, bootstrap }) => {
            start_node(&args.config, &listen, bootstrap).await?;
        },
        Some(Commands::GenerateKey { key_type, output }) => {
            generate_key_pair(&key_type, &output).await?;
        },
        Some(Commands::ValidateConfig) => {
            validate_config(&args.config).await?;
        },
        Some(Commands::Benchmark { benchmark_type, iterations }) => {
            run_benchmarks(&benchmark_type, iterations).await?;
        },
        Some(Commands::Status) => {
            show_status().await?;
        },
        None => {
            // Default action: start node
            start_node(&args.config, "0.0.0.0:30333", Vec::new()).await?;
        },
    }
    
    Ok(())
}

/// Initialize logging
fn init_logging(level: &str, verbose: bool) -> CoreResult<()> {
    use tracing_subscriber::{fmt, EnvFilter};
    
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(level));
    
    let fmt_layer = fmt::layer()
        .pretty()
        .with_thread_ids(verbose)
        .with_thread_names(verbose);
    
    tracing_subscriber::registry()
        .with(filter)
        .with(fmt_layer)
        .init();
    
    Ok(())
}

/// Start the blockchain node
async fn start_node(config_path: &str, listen_addr: &str, bootstrap_nodes: Vec<String>) -> CoreResult<()> {
    info!("Loading configuration from: {}", config_path);
    
    // Load configuration (simplified - in real implementation would load from file)
    let config = CoreConfig::default();
    
    info!("Initializing KALDRIX core");
    let metrics = Arc::new(kaldrix_core::metrics::CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await?;
    
    info!("Starting blockchain core");
    core.start().await?;
    
    info!("Node started successfully");
    info!("Listen address: {}", listen_addr);
    info!("Bootstrap nodes: {:?}", bootstrap_nodes);
    
    // Set up graceful shutdown
    let shutdown_signal = tokio::spawn(async {
        tokio::select! {
            _ = signal::ctrl_c() => {
                info!("Received Ctrl+C, shutting down...");
            },
            _ = signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                .expect("Failed to install signal handler") => {
                info!("Received terminate signal, shutting down...");
            },
        }
    });
    
    // Main node loop
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
    
    loop {
        tokio::select! {
            _ = interval.tick() => {
                // Periodic health check
                if let Err(e) = health_check(&core).await {
                    warn!("Health check failed: {}", e);
                }
            },
            _ = shutdown_signal => {
                break;
            },
        }
    }
    
    info!("Shutting down KALDRIX core");
    core.stop().await?;
    
    info!("Node shutdown complete");
    Ok(())
}

/// Generate a new key pair
async fn generate_key_pair(key_type: &str, output_path: &str) -> CoreResult<()> {
    info!("Generating {} key pair", key_type);
    
    let config = CoreConfig::default();
    let metrics = Arc::new(kaldrix_core::metrics::CoreMetrics::new());
    let core = KaldrixCore::new(config).await?;
    
    let keypair = core.generate_key_pair()?;
    
    // Save key pair to file
    let keypair_json = serde_json::to_string_pretty(&keypair)
        .map_err(|e| CoreError::Serialization(format!("Failed to serialize keypair: {}", e)))?;
    
    tokio::fs::write(output_path, keypair_json).await
        .map_err(|e| CoreError::Storage(format!("Failed to write keypair file: {}", e)))?;
    
    info!("Key pair generated and saved to: {}", output_path);
    info!("Public key: {}", hex::encode(&keypair.public_key));
    
    Ok(())
}

/// Validate configuration
async fn validate_config(config_path: &str) -> CoreResult<()> {
    info!("Validating configuration: {}", config_path);
    
    // In real implementation, would load and validate config file
    let config = CoreConfig::default();
    
    // Validate configuration
    if config.consensus.num_validators < config.consensus.min_validators {
        return Err(CoreError::Config(
            "Number of validators cannot be less than minimum validators".to_string()
        ));
    }
    
    if config.dag.max_transactions_per_block == 0 {
        return Err(CoreError::Config(
            "Max transactions per block must be greater than 0".to_string()
        ));
    }
    
    info!("Configuration is valid");
    Ok(())
}

/// Run benchmarks
async fn run_benchmarks(benchmark_type: &str, iterations: u32) -> CoreResult<()> {
    info!("Running benchmarks: {}, iterations: {}", benchmark_type, iterations);
    
    match benchmark_type {
        "dag" | "all" => {
            info!("Running DAG benchmarks");
            // Run DAG benchmarks
            run_dag_benchmarks(iterations).await?;
        },
        "crypto" | "all" => {
            info!("Running crypto benchmarks");
            // Run crypto benchmarks
            run_crypto_benchmarks(iterations).await?;
        },
        "consensus" | "all" => {
            info!("Running consensus benchmarks");
            // Run consensus benchmarks
            run_consensus_benchmarks(iterations).await?;
        },
        _ => {
            return Err(CoreError::Config(format!("Unknown benchmark type: {}", benchmark_type)));
        },
    }
    
    info!("Benchmarks completed");
    Ok(())
}

/// Show node status
async fn show_status() -> CoreResult<()> {
    info!("Node status check");
    
    // In real implementation, would connect to running node and get status
    println!("Node Status: Offline");
    println!("Version: 0.1.0");
    println!("Network: Not connected");
    println!("Block Height: 0");
    println!("Peers: 0");
    
    Ok(())
}

/// Health check
async fn health_check(core: &KaldrixCore) -> CoreResult<()> {
    // Get DAG metrics
    let dag_metrics = core.get_dag_metrics().await?;
    info!("DAG Metrics: {} nodes, {} edges", dag_metrics.node_count, dag_metrics.edge_count);
    
    // Get consensus status
    let consensus_status = core.get_consensus_status().await?;
    info!("Consensus Status: {:?}, Health: {:.1}%", consensus_status.state, consensus_status.health_score);
    
    // Get core metrics
    let metrics_snapshot = core.get_metrics().get_all_metrics();
    info!("Transactions: {} submitted, {} confirmed", 
          metrics_snapshot.transactions.submitted, 
          metrics_snapshot.transactions.confirmed);
    
    Ok(())
}

/// Run DAG benchmarks
async fn run_dag_benchmarks(iterations: u32) -> CoreResult<()> {
    use std::time::Instant;
    
    let config = CoreConfig::default();
    let metrics = Arc::new(kaldrix_core::metrics::CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await?;
    core.start().await?;
    
    let start = Instant::now();
    
    for i in 0..iterations {
        // Create test transaction
        let mut transaction = kaldrix_core::types::Transaction::default();
        transaction.id = [i as u8; 32];
        transaction.amount = i as u128;
        
        // Submit transaction
        core.submit_transaction(transaction).await?;
        
        if i % 100 == 0 {
            info!("Processed {} transactions", i);
        }
    }
    
    let duration = start.elapsed();
    let tps = iterations as f64 / duration.as_secs_f64();
    
    info!("DAG Benchmark Results:");
    info!("  Iterations: {}", iterations);
    info!("  Duration: {:?}", duration);
    info!("  TPS: {:.2}", tps);
    
    Ok(())
}

/// Run crypto benchmarks
async fn run_crypto_benchmarks(iterations: u32) -> CoreResult<()> {
    use std::time::Instant;
    
    let config = CoreConfig::default();
    let metrics = Arc::new(kaldrix_core::metrics::CoreMetrics::new());
    let core = KaldrixCore::new(config).await?;
    
    let start = Instant::now();
    
    for _ in 0..iterations {
        // Generate key pair
        let keypair = core.generate_key_pair()?;
        
        // Sign data
        let data = b"benchmark data";
        let signature = core.sign(data, &keypair.private_key)?;
        
        // Verify signature
        let is_valid = core.verify(data, &signature, &keypair.public_key)?;
        assert!(is_valid);
    }
    
    let duration = start.elapsed();
    let ops_per_sec = iterations as f64 / duration.as_secs_f64();
    
    info!("Crypto Benchmark Results:");
    info!("  Iterations: {}", iterations);
    info!("  Duration: {:?}", duration);
    info!("  Ops/sec: {:.2}", ops_per_sec);
    
    Ok(())
}

/// Run consensus benchmarks
async fn run_consensus_benchmarks(iterations: u32) -> CoreResult<()> {
    use std::time::Instant;
    
    let config = CoreConfig::default();
    let metrics = Arc::new(kaldrix_core::metrics::CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await?;
    core.start().await?;
    
    let start = Instant::now();
    
    for i in 0..iterations {
        // Create test block
        let mut block = kaldrix_core::types::Block::default();
        block.id = [i as u8; 32];
        block.height = i;
        
        // Submit block for consensus
        core.submit_block(block).await?;
        
        if i % 10 == 0 {
            info!("Processed {} blocks", i);
        }
    }
    
    let duration = start.elapsed();
    let blocks_per_sec = iterations as f64 / duration.as_secs_f64();
    
    info!("Consensus Benchmark Results:");
    info!("  Iterations: {}", iterations);
    info!("  Duration: {:?}", duration);
    info!("  Blocks/sec: {:.2}", blocks_per_sec);
    
    Ok(())
}