//! App settings service: read / write the JSON-backed `AppSettings` file
//! located in the OS app config directory.

use std::fs;

use tauri::Manager;

use crate::models::app_settings::AppSettings;

/// Read the app settings. Returns the default settings if no file exists yet.
pub fn read(app_handle: &tauri::AppHandle) -> Result<AppSettings, String> {
    let config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("无法获取配置目录: {}", e))?;
    let settings_file = config_dir.join("settings.json");

    if settings_file.exists() {
        let content = fs::read_to_string(&settings_file).map_err(|e| e.to_string())?;
        let settings: AppSettings =
            serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(settings)
    } else {
        Ok(AppSettings::default())
    }
}

/// Persist the app settings to disk.
pub fn write(app_handle: &tauri::AppHandle, settings: &AppSettings) -> Result<(), String> {
    use log::info;

    let config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("无法获取配置目录: {}", e))?;
    fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let settings_file = config_dir.join("settings.json");
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&settings_file, content).map_err(|e| e.to_string())?;

    info!("应用设置已保存");
    Ok(())
}
