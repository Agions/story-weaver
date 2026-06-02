//! Video metadata extracted from ffprobe output.

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoMetadata {
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub codec: String,
    pub bitrate: u32,
}

#[derive(Deserialize, Debug, Clone)]
pub struct VideoSegment {
    pub start: f64,
    pub end: f64,
    #[serde(rename = "type")]
    pub segment_type: Option<String>,
    pub content: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CutVideoParams {
    pub input_path: String,
    pub output_path: String,
    pub segments: Vec<VideoSegment>,
    pub quality: Option<String>,
    pub format: Option<String>,
    pub transition: Option<String>,
    pub transition_duration: Option<f64>,
    pub volume: Option<f64>,
    pub add_subtitles: Option<bool>,
}

#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)]
pub struct PreviewParams {
    pub input_path: String,
    pub segment: VideoSegment,
    pub transition: Option<String>,
    pub transition_duration: Option<f64>,
    pub volume: Option<f64>,
    pub add_subtitles: Option<bool>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CleanFileParams {
    pub path: String,
}
