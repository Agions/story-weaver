//! ID generation utility.
//!
//! Generates time-based unique IDs suitable for use as file name suffixes.
//! Uses millisecond-precision UNIX timestamp for sufficient uniqueness
//! in single-process desktop contexts.

use std::time::{SystemTime, UNIX_EPOCH};

/// Generate a unique ID based on the current system time in milliseconds.
/// Suitable for use as a file name suffix or in-memory identifier.
pub fn random_id() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{}", now)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn returns_non_empty_string() {
        let id = random_id();
        assert!(!id.is_empty());
        assert!(id.chars().all(|c| c.is_ascii_digit()));
    }

    #[test]
    fn returns_unique_ids() {
        let id1 = random_id();
        std::thread::sleep(std::time::Duration::from_millis(2));
        let id2 = random_id();
        assert_ne!(id1, id2);
    }
}
