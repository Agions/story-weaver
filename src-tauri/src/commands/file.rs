//! File / project Tauri commands.

use std::fs;
use std::path::PathBuf;

use log::info;
use regex::Regex;
use tauri::{AppHandle, Manager};

use crate::utils::path_validator::validate_input_path;

/// Validate that a project ID only contains safe characters:
/// ASCII letters, digits, hyphens, and underscores.
/// Prevents path traversal via crafted IDs.
fn validate_project_id(project_id: &str) -> Result<(), String> {
    let re = Regex::new(r"^[A-Za-z0-9_-]+$").map_err(|e| e.to_string())?;
    if !re.is_match(project_id) {
        return Err("无效的项目 ID（仅允许字母、数字、'-'、'_'）".into());
    }
    Ok(())
}

/// Resolve the app data directory, creating it if necessary.
fn ensure_app_data_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
    fs::create_dir_all(&dir).map_err(|e| format!("无法创建应用数据目录: {}", e))?;
    Ok(dir)
}

/// Return the absolute path of the app data directory (and create it if missing).
#[tauri::command]
pub fn check_app_data_directory(app_handle: AppHandle) -> Result<String, String> {
    let dir = ensure_app_data_dir(&app_handle)?;
    Ok(dir.to_string_lossy().to_string())
}

/// Save `content` to a project file keyed by `project_id`.
#[tauri::command]
pub fn save_project_file(
    project_id: String,
    content: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    validate_project_id(&project_id)?;
    let dir = ensure_app_data_dir(&app_handle)?;
    let project_path = dir.join(format!("{}.json", project_id));
    fs::write(&project_path, content).map_err(|e| e.to_string())?;
    info!("项目已保存: {:?}", project_path);
    Ok(())
}

/// List the file names inside a subdirectory of the app data dir.
#[tauri::command]
pub fn list_app_data_files(directory: String, app_handle: AppHandle) -> Result<Vec<String>, String> {
    let dir = ensure_app_data_dir(&app_handle)?;
    let target = dir.join(&directory);

    if !target.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(&target).map_err(|e| e.to_string())?;
    let mut names = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Some(name) = entry.file_name().to_str() {
            names.push(name.to_string());
        }
    }
    Ok(names)
}

/// Delete a project file keyed by `project_id`.
#[tauri::command]
pub fn delete_project_file(project_id: String, app_handle: AppHandle) -> Result<(), String> {
    validate_project_id(&project_id)?;
    let dir = ensure_app_data_dir(&app_handle)?;
    let project_path = dir.join(format!("{}.json", project_id));
    if project_path.exists() {
        let _ = fs::remove_file(&project_path);
    }
    Ok(())
}

/// Remove a file at the given absolute path (after validation).
#[tauri::command]
pub fn remove_file(path: String) -> Result<(), String> {
    validate_input_path(&path)?;
    let _ = fs::remove_file(&path);
    Ok(())
}
