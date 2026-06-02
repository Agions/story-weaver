//! Keyboard shortcut Tauri commands.
//!
//! The actual global-shortcut registration is handled by the
//! `tauri-plugin-global-shortcut` plugin; this module provides a
//! bookkeeping store of which shortcuts the app has registered so the
//! frontend can query and display them.

use std::sync::Mutex;

use log::info;

use crate::models::shortcut::ShortcutInfo;

/// In-process registry of shortcuts the frontend has registered.
static REGISTERED_SHORTCUTS: Mutex<Vec<ShortcutInfo>> = Mutex::new(Vec::new());

/// Register a new shortcut in the bookkeeping store.
#[tauri::command]
pub fn register_shortcut(
    id: String,
    key: String,
    action: String,
    description: String,
) -> Result<(), String> {
    info!("注册快捷键: {} -> {} ({})", key, action, description);

    let mut shortcuts = REGISTERED_SHORTCUTS
        .lock()
        .map_err(|e| e.to_string())?;

    if shortcuts.iter().any(|s| s.id == id) {
        return Err(format!("快捷键 ID {} 已存在", id));
    }

    shortcuts.push(ShortcutInfo {
        id,
        key,
        action,
        description,
    });

    Ok(())
}

/// Remove a shortcut from the bookkeeping store by its ID.
#[tauri::command]
pub fn unregister_shortcut(id: String) -> Result<(), String> {
    info!("注销快捷键: {}", id);

    let mut shortcuts = REGISTERED_SHORTCUTS
        .lock()
        .map_err(|e| e.to_string())?;
    shortcuts.retain(|s| s.id != id);

    Ok(())
}

/// Return a snapshot of all currently registered shortcuts.
#[tauri::command]
pub fn get_registered_shortcuts() -> Result<Vec<ShortcutInfo>, String> {
    let shortcuts = REGISTERED_SHORTCUTS
        .lock()
        .map_err(|e| e.to_string())?;
    Ok(shortcuts.clone())
}
