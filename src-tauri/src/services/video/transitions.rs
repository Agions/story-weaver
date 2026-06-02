//! Video transition filter generation.

/// Build a filter_complex string for an FFmpeg xfade transition between two segments.
pub fn build_transition_filter(
    transition_type: &str,
    transition_duration: f64,
) -> String {
    match transition_type {
        "fade" => format!(
            "[0:v]format=pix_fmts=yuva420p,fade=t=out:st={}:d={}:alpha=1[fv1];[1:v]format=pix_fmts=yuva420p,fade=t=in:st=0:d={}:alpha=1[fv2];[fv1][fv2]overlay=format=yuv420[outv]",
            transition_duration, transition_duration, transition_duration
        ),
        "dissolve" => format!(
            "[0:v][1:v]xfade=transition=fade:duration={}:offset={}[outv]",
            transition_duration, 5.0
        ),
        "wipe" => format!(
            "[0:v][1:v]xfade=transition=wiperight:duration={}:offset={}[outv]",
            transition_duration, 5.0
        ),
        "slide" => format!(
            "[0:v][1:v]xfade=transition=slideleft:duration={}:offset={}[outv]",
            transition_duration, 5.0
        ),
        _ => "[0:v][1:v]concat=n=2:v=1:a=0[outv]".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fade_produces_overlay() {
        let f = build_transition_filter("fade", 1.0);
        assert!(f.contains("overlay=format=yuv420"));
        assert!(f.contains("[outv]"));
    }

    #[test]
    fn unknown_falls_back_to_concat() {
        let f = build_transition_filter("something-weird", 1.0);
        assert!(f.contains("concat=n=2:v=1:a=0"));
    }

    #[test]
    fn xfade_uses_correct_transition_keyword() {
        let wipe = build_transition_filter("wipe", 0.5);
        assert!(wipe.contains("xfade=transition=wiperight"));
        let slide = build_transition_filter("slide", 0.5);
        assert!(slide.contains("xfade=transition=slideleft"));
    }
}
