class Plotcraft < Formula
  desc "Professional AI-Powered Video Script Creation Platform"
  homepage "https://github.com/Agions/PlotCraft"
  url "https://github.com/Agions/PlotCraft/releases/download/v3.0.0/PlotCraft_3.0.0_aarch64.dmg"
  version "3.0.0"
  sha256 "update_after_build"

  depends_on macos: ">= :catalina"

  def install
    # Extract DMG and move app to /Applications
    system "hdiutil", "attach", "-nobrowse", "-mountpoint", "/Volumes/PlotCraft", cached_download
    system "cp", "-r", "/Volumes/PlotCraft/PlotCraft.app", "/Applications/"
    system "hdiutil", "detach", "/Volumes/PlotCraft"
  end

  post_install
    system "ln", "-sf", "/Applications/PlotCraft.app/Contents/MacOS/PlotCraft", bin/"plotcraft"
  end

  test do
    system "#{bin}/plotcraft", "--version"
  end
end
