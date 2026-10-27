// الخلية — مشغّل ويندوز للمحاكي: يحفظ صفحة المحاكي (مضمّنة داخل البرنامج) في مجلد المستخدم
// ويفتحها في نافذة تطبيق مستقلة عبر متصفح Edge (موجود في ويندوز 10 و11) بلا شريط عنوان،
// أو Chrome إن وُجد، وإلا في المتصفح الافتراضي. يعمل بلا إنترنت.
package main

import (
	"bytes"
	_ "embed"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
)

//go:embed index.html
var page []byte

func exists(p string) bool { st, err := os.Stat(p); return err == nil && !st.IsDir() }

func main() {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	dir := filepath.Join(base, "AlKhaliaSimulator")
	_ = os.MkdirAll(dir, 0o755)
	f := filepath.Join(dir, "index.html")
	if old, err := os.ReadFile(f); err != nil || !bytes.Equal(old, page) {
		_ = os.WriteFile(f, page, 0o644)
	}
	u := (&url.URL{Scheme: "file", Path: "/" + filepath.ToSlash(f)}).String()

	pf, pf86, la := os.Getenv("ProgramFiles"), os.Getenv("ProgramFiles(x86)"), os.Getenv("LOCALAPPDATA")
	browsers := []string{
		filepath.Join(pf86, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(la, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pf86, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(la, `Google\Chrome\Application\chrome.exe`),
	}
	for _, b := range browsers {
		if exists(b) {
			if exec.Command(b, "--app="+u, "--start-maximized", "--no-first-run", "--no-default-browser-check").Start() == nil {
				return
			}
		}
	}
	_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", u).Start()
}
