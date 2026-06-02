//! App-level Tauri commands: window management, settings, paths.

use std::process::Command;

use log::info;
use tauri::{AppHandle, Manager};

use crate::models::app_settings::AppSettings;
use crate::services::config::settings;
use crate::utils::path_validator::validate_input_path;

/// Show the main window and bring it to focus.
#[tauri::command]
pub fn show_main_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        info!("主窗口已显示");
        Ok(())
    } else {
        Err("未找到主窗口".to_string())
    }
}

/// Hide the main window.
#[tauri::command]
pub fn hide_main_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
        info!("主窗口已隐藏");
        Ok(())
    } else {
        Err("未找到主窗口".to_string())
    }
}

/// Toggle the main window's fullscreen state.
#[tauri::command]
pub fn toggle_fullscreen(app_handle: AppHandle) -> Result<bool, String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
        window
            .set_fullscreen(!is_fullscreen)
            .map_err(|e| e.to_string())?;
        info!("全屏状态: {}", !is_fullscreen);
        Ok(!is_fullscreen)
    } else {
        Err("未找到主窗口".to_string())
    }
}

/// Read the current `AppSettings`.
#[tauri::command]
pub fn get_app_settings(app_handle: AppHandle) -> Result<AppSettings, String> {
    settings::read(&app_handle)
}

/// Persist the `AppSettings` to disk.
#[tauri::command]
pub fn save_app_settings(app_handle: AppHandle, settings: AppSettings) -> Result<(), String> {
    settings::write(&app_handle, &settings)
}

/// Return the OS-specific app data directory path.
#[tauri::command]
pub fn get_app_data_path(app_handle: AppHandle) -> Result<String, String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取数据目录: {}", e))?;
    Ok(data_dir.to_string_lossy().to_string())
}

/// Open the file manager at the parent directory of `path`.
#[tauri::command]
pub fn open_file_location(path: String) -> Result<(), String> {
    validate_input_path(&path)?;
    let path = std::path::PathBuf::from(&path);

    if !path.exists() {
        return Err("文件不存在".to_string());
    }

    let parent = if path.is_file() {
        path.parent().map(|p| p.to_path_buf())
    } else {
        Some(path)
    };

    if let Some(dir) = parent {
        #[cfg(target_os = "macos")]
        {
            Command::new("open").arg(dir).spawn().map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "windows")]
        {
            Command::new("explorer")
                .arg(dir)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open")
                .arg(dir)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    } else {
        Err("无法确定父目录".to_string())
    }
}
