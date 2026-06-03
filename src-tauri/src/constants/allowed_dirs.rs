//! Allowlist of directories where the application is permitted to write output files.
//!
//! These constants are used by `utils::path_validator` to enforce the principle
//! of least privilege: output files may only be created inside these directories
//! (typically the OS temp dir + per-app subdirectories).
//!
//! **Naming convention**: Each subdirectory uses the `framefab_*` prefix for
//! brand continuity with the frame-fab product line. The `blazecut_*` and
//! `frameforge` aliases are retained for backwards compatibility with any
//! pre-existing temp data created by prior versions of the application.

use std::path::PathBuf;

/// Directories where FFmpeg output files are allowed to be created.
/// Used by `validate_output_path`.
pub const ALLOWED_OUTPUT_DIRS: &[&str] = &[
    "frameforge",
    "framefab_temp",
    "framefab_keyframes",
    "framefab_thumbnails",
    "framefab_preview",
    "blazecut",
    "blazecut_temp",
    "blazecut_preview",
    "blazecut_keyframes",
    "blazecut_thumbnails",
];

/// Directories where cleanup is allowed (subset of output dirs, no `blazecut_*`).
/// Used by `clean_temp_file` to verify a path is safe to delete.
pub const ALLOWED_TEMP_CLEANUP_DIRS: &[&str] = &[
    "frameforge",
    "framefab_keyframes",
    "framefab_thumbnails",
    "framefab_temp",
    "framefab_preview",
];

/// Build the full OS temp dir + subdirectory path for a given subdir.
pub fn temp_subdir(name: &str) -> PathBuf {
    std::env::temp_dir().join(name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn output_dirs_includes_keyframes() {
        assert!(ALLOWED_OUTPUT_DIRS.contains(&"framefab_keyframes"));
        assert!(ALLOWED_OUTPUT_DIRS.contains(&"framefab_preview"));
    }

    #[test]
    fn cleanup_dirs_is_strict_subset() {
        for d in ALLOWED_TEMP_CLEANUP_DIRS {
            assert!(
                ALLOWED_OUTPUT_DIRS.contains(d),
                "{} should also be in output dirs",
                d
            );
        }
    }

    #[test]
    fn temp_subdir_creates_under_temp() {
        let p = temp_subdir("framefab_keyframes");
        assert!(p.ends_with("framefab_keyframes"));
    }
}
