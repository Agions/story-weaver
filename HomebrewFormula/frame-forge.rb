class FrameForge < Formula
  desc "FrameForge - AI-Driven Video Creation Studio"
  homepage "https://github.com/Agions/frame-forge"
  url "https://github.com/Agions/frame-forge/releases/download/v2.1.0/frame-forge_2.1.0_aarch64.dmg"
  version "2.1.0"
  sha256 "update_after_build"

  depends_on macos: ">= :catalina"

  def install
    # Extract DMG and move app to /Applications
    system "hdiutil", "attach", "-nobrowse", "-mountpoint", "/Volumes/FrameForge", cached_download
    system "cp", "-r", "/Volumes/FrameForge/FrameForge.app", "/Applications/"
    system "hdiutil", "detach", "/Volumes/FrameForge"
  end

  post_install
    system "ln", "-sf", "/Applications/FrameForge.app/Contents/MacOS/FrameForge", bin/"frame-forge"
  end

  test do
    system "#{bin}/frame-forge", "--version"
  end
end
