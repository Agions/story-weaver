//! Story Weaver Tauri backend.
//!
//! This crate is the Rust-side first citizen of the desktop application.
//! It exposes Tauri commands to the JS frontend, and is internally organized
//! as:
//!
//! - `commands::*` — thin Tauri command routing (no business logic)
//! - `services::*` — business logic (FFmpeg, settings, video processing)
//! - `models::*`   — data structures
//! - `utils::*`    — path validation, ID generation, FFmpeg helpers
//! - `constants::*`— allowlists and other compile-time constants
//!
//! `lib.rs` itself contains only the application entry point and the
//! Tauri builder; no business logic lives here.

mod commands;
mod constants;
mod models;
mod services;
mod utils;

use log::info;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();

    info!("Story Weaver 启动中...");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_os::init())
    .setup(|app| {
        info!("应用程序初始化完成");

        #[cfg(target_os = "windows")]
        {
            use std::process::Command;
            match Command::new("reg").args(&[
                "query",
                "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
            ]).output() {
                Ok(output) if output.status.success() => {
                    info!("WebView2 运行时已安装");
                }
                _ => {
                    warn!("未检测到 WebView2 运行时，部分功能可能无法使用。请访问 https://developer.microsoft.com/en-us/microsoft-edge/webview2/ 安装");
                }
            }
        }

        Ok(())
    })
        .invoke_handler(tauri::generate_handler![
            commands::video::analyze_video,
            commands::video::extract_key_frames,
            commands::video::generate_thumbnail,
            commands::video::cut_video,
            commands::video::generate_preview,
            commands::video::clean_temp_file,
            commands::video::check_ffmpeg,
            commands::app::show_main_window,
            commands::app::hide_main_window,
            commands::app::toggle_fullscreen,
            commands::app::get_app_settings,
            commands::app::save_app_settings,
            commands::app::check_runtime_dependencies,
            commands::app::get_app_data_path,
            commands::app::open_file_location,
            commands::file::check_app_data_directory,
            commands::file::save_project_file,
            commands::file::list_app_data_files,
            commands::file::delete_project_file,
            commands::file::remove_file,
            commands::shortcuts::register_shortcut,
            commands::shortcuts::unregister_shortcut,
            commands::shortcuts::get_registered_shortcuts,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Story Weaver 时发生错误");
}
