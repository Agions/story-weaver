//! Tauri command surface, grouped by domain.
//!
//! All commands are pure routing: they validate inputs and delegate to
//! `services::*` for business logic. They never contain business logic
//! themselves.

pub mod app;
pub mod file;
pub mod shortcuts;
pub mod video;
