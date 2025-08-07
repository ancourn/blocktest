//! Utility functions for the KALDRIX blockchain core

use std::time::{SystemTime, UNIX_EPOCH};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use blake3::{Hash, Hasher};
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Generate a unique ID
pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

/// Get current timestamp in milliseconds
pub fn current_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Get current timestamp in seconds
pub fn current_timestamp_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Hash data using BLAKE3
pub fn hash_data(data: &[u8]) -> [u8; 32] {
    let mut hasher = Hash::new();
    hasher.update(data);
    hasher.finalize().into()
}

/// Hash multiple pieces of data
pub fn hash_multiple(data: &[&[u8]]) -> [u8; 32] {
    let mut hasher = Hash::new();
    for chunk in data {
        hasher.update(chunk);
    }
    hasher.finalize().into()
}

/// Convert bytes to hex string
pub fn bytes_to_hex(bytes: &[u8]) -> String {
    hex::encode(bytes)
}

/// Convert hex string to bytes
pub fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, hex::FromHexError> {
    hex::decode(hex)
}

/// Convert bytes to base64 string
pub fn bytes_to_base64(bytes: &[u8]) -> String {
    base64::encode(bytes)
}

/// Convert base64 string to bytes
pub fn base64_to_bytes(base64: &str) -> Result<Vec<u8>, base64::DecodeError> {
    base64::decode(base64)
}

/// Calculate merkle root from a list of hashes
pub fn calculate_merkle_root(hashes: &[[u8; 32]]) -> [u8; 32] {
    if hashes.is_empty() {
        return [0u8; 32];
    }
    
    let mut current_level = hashes.to_vec();
    
    while current_level.len() > 1 {
        let mut next_level = Vec::new();
        
        for i in (0..current_level.len()).step_by(2) {
            let left = current_level[i];
            let right = current_level.get(i + 1).unwrap_or(&left);
            
            let mut hasher = Hash::new();
            hasher.update(&left);
            hasher.update(right);
            next_level.push(hasher.finalize().into());
        }
        
        current_level = next_level;
    }
    
    current_level[0]
}

/// Calculate exponential moving average
pub fn ema(current: f64, new_value: f64, alpha: f64) -> f64 {
    current * (1.0 - alpha) + new_value * alpha
}

/// Calculate simple moving average
pub fn sma(values: &[f64], window: usize) -> f64 {
    if values.is_empty() || window == 0 {
        return 0.0;
    }
    
    let start = if values.len() > window {
        values.len() - window
    } else {
        0
    };
    
    let sum: f64 = values[start..].iter().sum();
    sum / (values.len() - start) as f64
}

/// Calculate weighted average
pub fn weighted_average(values: &[(f64, f64)]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    
    let total_weight: f64 = values.iter().map(|(_, weight)| *weight).sum();
    if total_weight == 0.0 {
        return 0.0;
    }
    
    let weighted_sum: f64 = values.iter().map(|(value, weight)| value * weight).sum();
    weighted_sum / total_weight
}

/// Calculate median
pub fn median(values: &mut [f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    
    values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let len = values.len();
    if len % 2 == 0 {
        (values[len / 2 - 1] + values[len / 2]) / 2.0
    } else {
        values[len / 2]
    }
}

/// Calculate percentile
pub fn percentile(values: &mut [f64], p: f64) -> f64 {
    if values.is_empty() || p < 0.0 || p > 100.0 {
        return 0.0;
    }
    
    values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let len = values.len();
    let index = (p / 100.0) * (len - 1) as f64;
    let lower = index.floor() as usize;
    let upper = index.ceil() as usize;
    
    if lower == upper {
        values[lower]
    } else {
        let weight = index - lower as f64;
        values[lower] * (1.0 - weight) + values[upper] * weight
    }
}

/// Calculate standard deviation
pub fn standard_deviation(values: &[f64]) -> f64 {
    if values.len() < 2 {
        return 0.0;
    }
    
    let mean = values.iter().sum::<f64>() / values.len() as f64;
    let variance = values.iter()
        .map(|x| (x - mean).powi(2))
        .sum::<f64>() / (values.len() - 1) as f64;
    
    variance.sqrt()
}

/// Format duration in human-readable format
pub fn format_duration(duration: std::time::Duration) -> String {
    let total_seconds = duration.as_secs();
    
    if total_seconds < 60 {
        return format!("{}s", total_seconds);
    }
    
    let total_minutes = total_seconds / 60;
    if total_minutes < 60 {
        return format!("{}m {}s", total_minutes, total_seconds % 60);
    }
    
    let total_hours = total_minutes / 60;
    if total_hours < 24 {
        return format!("{}h {}m", total_hours, total_minutes % 60);
    }
    
    let total_days = total_hours / 24;
    format!("{}d {}h", total_days, total_hours % 24)
}

/// Format bytes in human-readable format
pub fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB", "PB"];
    
    if bytes == 0 {
        return "0 B".to_string();
    }
    
    let bytes = bytes as f64;
    let base = 1024.0;
    let i = (bytes.ln() / base.ln()).floor() as i32;
    let value = bytes / base.powi(i);
    
    format!("{:.2} {}", value, UNITS[i as usize])
}

/// Format number with commas
pub fn format_number(num: u64) -> String {
    num.to_string()
        .as_bytes()
        .rchunks(3)
        .rev()
        .map(|chunk| std::str::from_utf8(chunk).unwrap())
        .collect::<Vec<_>>()
        .join(",")
}

/// Validate public key format
pub fn validate_public_key(public_key: &[u8]) -> bool {
    public_key.len() == 32
}

/// Validate private key format
pub fn validate_private_key(private_key: &[u8]) -> bool {
    private_key.len() == 64
}

/// Validate signature format
pub fn validate_signature(signature: &[u8]) -> bool {
    // Dilithium signature is 2424 bytes
    signature.len() == 2424
}

/// Parse duration from string
pub fn parse_duration(duration_str: &str) -> Result<std::time::Duration, String> {
    let parts: Vec<&str> = duration_str.split_whitespace().collect();
    if parts.len() != 2 {
        return Err("Invalid duration format".to_string());
    }
    
    let value = parts[0].parse::<u64>()
        .map_err(|_| "Invalid duration value".to_string())?;
    
    let unit = parts[1];
    let duration = match unit {
        "s" | "sec" | "second" | "seconds" => std::time::Duration::from_secs(value),
        "m" | "min" | "minute" | "minutes" => std::time::Duration::from_secs(value * 60),
        "h" | "hour" | "hours" => std::time::Duration::from_secs(value * 3600),
        "d" | "day" | "days" => std::time::Duration::from_secs(value * 86400),
        "ms" | "millisecond" | "milliseconds" => std::time::Duration::from_millis(value),
        "us" | "microsecond" | "microseconds" => std::time::Duration::from_micros(value),
        "ns" | "nanosecond" | "nanoseconds" => std::time::Duration::from_nanos(value),
        _ => return Err("Invalid duration unit".to_string()),
    };
    
    Ok(duration)
}

/// Clamp a value between min and max
pub fn clamp<T: Ord>(value: T, min: T, max: T) -> T {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

/// Retry an operation with exponential backoff
pub async fn retry_with_backoff<F, Fut, T, E>(
    mut operation: F,
    max_retries: usize,
    initial_delay: std::time::Duration,
    max_delay: std::time::Duration,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
{
    let mut delay = initial_delay;
    
    for attempt in 0..max_retries {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                if attempt == max_retries - 1 {
                    return Err(e);
                }
                
                tokio::time::sleep(delay).await;
                delay = std::time::Duration::from_millis(
                    (delay.as_millis() * 2).min(max_delay.as_millis() as u128) as u64
                );
            }
        }
    }
    
    unreachable!()
}

/// Debounce function calls
pub struct Debouncer<T> {
    last_call: std::time::Instant,
    delay: std::time::Duration,
    pending_value: Option<T>,
}

impl<T> Debouncer<T> {
    pub fn new(delay: std::time::Duration) -> Self {
        Self {
            last_call: std::time::Instant::now(),
            delay,
            pending_value: None,
        }
    }
    
    pub fn call(&mut self, value: T) -> Option<T> {
        let now = std::time::Instant::now();
        
        if now.duration_since(self.last_call) >= self.delay {
            self.last_call = now;
            Some(value)
        } else {
            self.pending_value = Some(value);
            None
        }
    }
    
    pub fn flush(&mut self) -> Option<T> {
        self.pending_value.take()
    }
}

/// Rate limiter
pub struct RateLimiter {
    tokens: u32,
    max_tokens: u32,
    refill_rate: u32,
    last_refill: std::time::Instant,
}

impl RateLimiter {
    pub fn new(max_tokens: u32, refill_rate: u32) -> Self {
        Self {
            tokens: max_tokens,
            max_tokens,
            refill_rate,
            last_refill: std::time::Instant::now(),
        }
    }
    
    pub fn try_acquire(&mut self) -> bool {
        self.refill();
        
        if self.tokens > 0 {
            self.tokens -= 1;
            true
        } else {
            false
        }
    }
    
    pub fn acquire(&mut self) -> bool {
        while !self.try_acquire() {
            std::thread::sleep(std::time::Duration::from_millis(1));
        }
        true
    }
    
    fn refill(&mut self) {
        let now = std::time::Instant::now();
        let elapsed = now.duration_since(self.last_refill);
        
        if elapsed >= std::time::Duration::from_secs(1) {
            let tokens_to_add = (elapsed.as_secs() as u32) * self.refill_rate;
            self.tokens = (self.tokens + tokens_to_add).min(self.max_tokens);
            self.last_refill = now;
        }
    }
}

/// Simple cache implementation
pub struct Cache<K, V> {
    data: HashMap<K, (V, std::time::Instant)>,
    ttl: std::time::Duration,
    max_size: usize,
}

impl<K, V> Cache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    pub fn new(ttl: std::time::Duration, max_size: usize) -> Self {
        Self {
            data: HashMap::new(),
            ttl,
            max_size,
        }
    }
    
    pub fn get(&mut self, key: &K) -> Option<V> {
        self.cleanup();
        
        if let Some((value, timestamp)) = self.data.get(key) {
            if timestamp.elapsed() < self.ttl {
                return Some(value.clone());
            } else {
                self.data.remove(key);
            }
        }
        
        None
    }
    
    pub fn put(&mut self, key: K, value: V) {
        self.cleanup();
        
        if self.data.len() >= self.max_size {
            // Remove oldest entry
            if let Some(oldest_key) = self.data.keys().next().cloned() {
                self.data.remove(&oldest_key);
            }
        }
        
        self.data.insert(key, (value, std::time::Instant::now()));
    }
    
    pub fn remove(&mut self, key: &K) {
        self.data.remove(key);
    }
    
    pub fn clear(&mut self) {
        self.data.clear();
    }
    
    pub fn len(&self) -> usize {
        self.data.len()
    }
    
    fn cleanup(&mut self) {
        let now = std::time::Instant::now();
        self.data.retain(|_, (_, timestamp)| now.duration_since(*timestamp) < self.ttl);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_hash_data() {
        let data = b"test data";
        let hash = hash_data(data);
        assert_eq!(hash.len(), 32);
    }
    
    #[test]
    fn test_bytes_to_hex() {
        let bytes = [0x01, 0x02, 0x03, 0x04];
        let hex = bytes_to_hex(&bytes);
        assert_eq!(hex, "01020304");
    }
    
    #[test]
    fn test_hex_to_bytes() {
        let hex = "01020304";
        let bytes = hex_to_bytes(hex).unwrap();
        assert_eq!(bytes, vec![0x01, 0x02, 0x03, 0x04]);
    }
    
    #[test]
    fn test_ema() {
        let current = 10.0;
        let new_value = 20.0;
        let alpha = 0.1;
        let result = ema(current, new_value, alpha);
        assert!(result > current && result < new_value);
    }
    
    #[test]
    fn test_median() {
        let mut values = vec![3.0, 1.0, 4.0, 1.0, 5.0, 9.0, 2.0, 6.0];
        let result = median(&mut values);
        assert_eq!(result, 3.5);
    }
    
    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(1024), "1.00 KB");
        assert_eq!(format_bytes(1048576), "1.00 MB");
        assert_eq!(format_bytes(1073741824), "1.00 GB");
    }
    
    #[test]
    fn test_parse_duration() {
        assert_eq!(parse_duration("5s").unwrap(), std::time::Duration::from_secs(5));
        assert_eq!(parse_duration("2m").unwrap(), std::time::Duration::from_secs(120));
        assert_eq!(parse_duration("1h").unwrap(), std::time::Duration::from_secs(3600));
    }
    
    #[test]
    fn test_clamp() {
        assert_eq!(clamp(5, 1, 10), 5);
        assert_eq!(clamp(0, 1, 10), 1);
        assert_eq!(clamp(15, 1, 10), 10);
    }
    
    #[test]
    fn test_cache() {
        let mut cache = Cache::new(std::time::Duration::from_secs(1), 2);
        
        cache.put("key1".to_string(), "value1".to_string());
        cache.put("key2".to_string(), "value2".to_string());
        
        assert_eq!(cache.get(&"key1".to_string()), Some("value1".to_string()));
        assert_eq!(cache.len(), 2);
        
        // Wait for TTL to expire
        std::thread::sleep(std::time::Duration::from_millis(1100));
        
        assert_eq!(cache.get(&"key1".to_string()), None);
        assert_eq!(cache.len(), 0);
    }
    
    #[test]
    fn test_rate_limiter() {
        let mut limiter = RateLimiter::new(5, 10); // 5 tokens, refill 10 per second
        
        // Should be able to acquire 5 tokens
        for _ in 0..5 {
            assert!(limiter.try_acquire());
        }
        
        // Should not be able to acquire more
        assert!(!limiter.try_acquire());
    }
}