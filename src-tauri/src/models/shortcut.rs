//! Keyboard shortcut information registered with the global shortcut plugin.

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ShortcutInfo {
    pub id: String,
    pub key: String,
    pub action: String,
    pub description: String,
}
