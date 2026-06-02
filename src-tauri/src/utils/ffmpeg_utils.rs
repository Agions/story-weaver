//! FFmpeg utility functions for argument parsing and FPS calculation.

/// Parse an FFmpeg frame rate string (e.g. "30/1", "30000/1001") into a float.
/// Returns 0.0 on parse failure or invalid input.
pub fn parse_fps(fps_str: &str) -> f64 {
    let parts: Vec<&str> = fps_str.split('/').collect();
    if parts.len() == 2 {
        let numerator = parts[0].parse::<f64>().unwrap_or(0.0);
        let denominator = parts[1].parse::<f64>().unwrap_or(1.0);
        if denominator > 0.0 {
            return numerator / denominator;
        }
    }
    0.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_simple_fps() {
        assert_eq!(parse_fps("30/1"), 30.0);
        assert_eq!(parse_fps("60/1"), 60.0);
    }

    #[test]
    fn parses_ntsc_fps() {
        assert!((parse_fps("30000/1001") - 29.97).abs() < 0.01);
    }

    #[test]
    fn handles_invalid_input() {
        assert_eq!(parse_fps("0/1"), 0.0);
        assert_eq!(parse_fps("garbage"), 0.0);
        assert_eq!(parse_fps("30/0"), 0.0);
    }
}
