//! Application user settings, persisted to a JSON file in the OS app config dir.

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub auto_save: bool,
    pub auto_save_interval: u32,
    pub default_quality: String,
    pub default_format: String,
    pub notification_enabled: bool,
    pub minimize_to_tray: bool,
    pub start_minimized: bool,
    pub check_update_on_start: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            theme: "light".to_string(),
            language: "zh-CN".to_string(),
            auto_save: true,
            auto_save_interval: 300,
            default_quality: "medium".to_string(),
            default_format: "mp4".to_string(),
            notification_enabled: true,
            minimize_to_tray: true,
            start_minimized: false,
            check_update_on_start: true,
        }
    }
}
