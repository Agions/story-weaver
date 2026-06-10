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
///
/// 【v3.1 安全强化】`directory` 参数未验证——`../../etc` 可遍历到任意目录。
/// 修复：与 `validate_project_id` 同样的字符白名单（字母数字-下划线），
/// 并禁止 `.`/`..` 路径组件。
#[tauri::command]
pub fn list_app_data_files(directory: String, app_handle: AppHandle) -> Result<Vec<String>, String> {
    // 子目录名白名单校验：只允许字母/数字/-/_
    let re = Regex::new(r"^[A-Za-z0-9_-]+$").map_err(|e| e.to_string())?;
    if !re.is_match(&directory) {
        return Err("无效的子目录名（仅允许字母、数字、'-'、'_'）".into());
    }
    // 禁止空串或纯特殊名
    if directory.is_empty() || directory.starts_with('.') {
        return Err("无效的子目录名".into());
    }

    let dir = ensure_app_data_dir(&app_handle)?;
    let target = dir.join(&directory);

    if !target.exists() {
        return Ok(Vec::new());
    }

    // 二次防御：canonicalize 后必须仍在 app data dir 下
    let canonical_target = target
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let canonical_app_data = dir
        .canonicalize()
        .map_err(|e| e.to_string())?;
    if !canonical_target.starts_with(&canonical_app_data) {
        return Err("子目录解析超出应用数据目录".into());
    }

    let entries = fs::read_dir(&canonical_target).map_err(|e| e.to_string())?;
    let mut names = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Some(name) = entry.file_name().to_str() {
            names.push(name.to_string());
        }
    }
    Ok(names)
}

#[cfg(test)]
mod tests {
    use super::*;

    // 【v3.1 安全测试】验证 list_app_data_files 拒绝路径遍历
    // 注意：以下测试只覆盖纯函数（参数校验部分），不调用 ensure_app_data_dir
    // 因为它需要 AppHandle（仅 Tauri runtime 可构造）

    fn is_valid_subdir_name(name: &str) -> bool {
        if name.is_empty() || name.starts_with('.') {
            return false;
        }
        let re = Regex::new(r"^[A-Za-z0-9_-]+$").unwrap();
        re.is_match(name)
    }

    #[test]
    fn rejects_path_traversal() {
        assert!(!is_valid_subdir_name(".."));
        assert!(!is_valid_subdir_name("../etc"));
        assert!(!is_valid_subdir_name("../../etc/passwd"));
        assert!(!is_valid_subdir_name("foo/bar"));
        assert!(!is_valid_subdir_name("foo\\bar"));
    }

    #[test]
    fn rejects_null_bytes_and_specials() {
        assert!(!is_valid_subdir_name("foo\0bar"));
        assert!(!is_valid_subdir_name(".hidden"));
        assert!(!is_valid_subdir_name(""));
    }

    #[test]
    fn accepts_safe_names() {
        assert!(is_valid_subdir_name("projects"));
        assert!(is_valid_subdir_name("project-2026"));
        assert!(is_valid_subdir_name("my_app_v1"));
        assert!(is_valid_subdir_name("123abc"));
    }
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
