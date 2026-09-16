/* ===========================================================================
   مشغّل ويندوز لمختبر الفيزياء الافتراضي — الأستاذ أحمد نعمة العبودي

   ملف تنفيذي واحد يحمل صفحة المحاكي كاملة داخله كمورد (RCDATA). عند التشغيل:
     ١) يكتب الصفحة في  %LOCALAPPDATA%\PhysicsLab_AlAboudi\index.html
        (مسار ثابت حتى يبقى ما يحفظه المحاكي في المتصفّح — كاسم الأستاذ — بين
         التشغيلات، إذ إن تغيّر المسار يعني أصلًا مختلفًا وتخزينًا جديدًا)
     ٢) يفتحها بمتصفّح كروميوم في وضع التطبيق (--app) فتظهر بنافذة خاصّة
        بلا شريط عنوان ولا تبويبات، ومع ملف تعريف مستقلّ لا يخلط جلسة
        المستخدم بجلسة التطبيق
     ٣) وإن لم يجد أي متصفّح كروميوم، يفتحها بالمتصفّح الافتراضي

   البناء: انظر build.sh (تصريف متقاطع بـ mingw-w64، بلا أي اعتماد خارجي)
   =========================================================================== */
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif

#include <windows.h>
#include <shlobj.h>

#define IDR_APPHTML   101
#define APP_DIR       L"PhysicsLab_AlAboudi"
#define APP_TITLE     L"مختبر الفيزياء الافتراضي"

/* ---------- أدوات نصّية آمنة الطول ---------- */

static void StrCopy(wchar_t *dst, size_t cch, const wchar_t *src){
    if (cch == 0) return;
    lstrcpynW(dst, src, (int)cch);
}

static void StrCat(wchar_t *dst, size_t cch, const wchar_t *src){
    size_t n = (size_t)lstrlenW(dst);
    if (n + 1 >= cch) return;
    lstrcpynW(dst + n, src, (int)(cch - n));
}

static void PathJoin(wchar_t *dst, size_t cch, const wchar_t *base, const wchar_t *leaf){
    StrCopy(dst, cch, base);
    size_t n = (size_t)lstrlenW(dst);
    if (n && dst[n-1] != L'\\') StrCat(dst, cch, L"\\");
    StrCat(dst, cch, leaf);
}

/* ---------- استخراج الصفحة المدمجة إلى ملف ---------- */

static BOOL ExtractHtml(const wchar_t *path){
    HRSRC res = FindResourceW(NULL, MAKEINTRESOURCEW(IDR_APPHTML), RT_RCDATA);
    if (!res) return FALSE;
    HGLOBAL h = LoadResource(NULL, res);
    if (!h) return FALSE;
    const void *data = LockResource(h);
    DWORD size = SizeofResource(NULL, res);
    if (!data || !size) return FALSE;

    HANDLE f = CreateFileW(path, GENERIC_WRITE, FILE_SHARE_READ, NULL,
                           CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (f == INVALID_HANDLE_VALUE) return FALSE;

    DWORD written = 0;
    BOOL ok = WriteFile(f, data, size, &written, NULL) && written == size;
    CloseHandle(f);
    return ok;
}

/* ---------- تحويل مسار ويندوز إلى عنوان file:// مرمّز ----------
   ترميز النسبة المئوية ضروري: اسم مستخدم ويندوز قد يحوي مسافات أو حروفًا
   عربية، والمسار الخام حينها لا يصلح عنوانًا.                              */

static void PathToFileUrl(const wchar_t *path, wchar_t *url, size_t cch){
    char utf8[1024];
    int n = WideCharToMultiByte(CP_UTF8, 0, path, -1, utf8, (int)sizeof(utf8), NULL, NULL);
    if (n <= 0){ StrCopy(url, cch, L""); return; }

    StrCopy(url, cch, L"file:///");
    size_t out = (size_t)lstrlenW(url);
    const char *hex = "0123456789ABCDEF";

    for (int i = 0; utf8[i] && out + 4 < cch; i++){
        unsigned char c = (unsigned char)utf8[i];
        if (c == '\\' || c == '/'){
            url[out++] = L'/';
        } else if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ||
                   (c >= '0' && c <= '9') || c == '-' || c == '_' ||
                   c == '.' || c == '~' || c == ':'){
            url[out++] = (wchar_t)c;
        } else {
            url[out++] = L'%';
            url[out++] = (wchar_t)hex[(c >> 4) & 0xF];
            url[out++] = (wchar_t)hex[c & 0xF];
        }
    }
    url[out] = 0;
}

/* ---------- البحث عن متصفّح كروميوم ---------- */

static BOOL FileExists(const wchar_t *p){
    DWORD a = GetFileAttributesW(p);
    return a != INVALID_FILE_ATTRIBUTES && !(a & FILE_ATTRIBUTE_DIRECTORY);
}

/* مفتاح App Paths هو الطريق الرسمي لموضع المتصفّح، ويسبق المسارات المحفوظة */
static BOOL FromAppPaths(const wchar_t *exeName, wchar_t *out, size_t cch){
    wchar_t key[512];
    StrCopy(key, 512, L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\");
    StrCat(key, 512, exeName);

    HKEY roots[2] = { HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE };
    for (int i = 0; i < 2; i++){
        HKEY k;
        if (RegOpenKeyExW(roots[i], key, 0, KEY_QUERY_VALUE, &k) != ERROR_SUCCESS) continue;

        wchar_t raw[1024];
        DWORD type = 0, cb = sizeof(raw) - sizeof(wchar_t);
        LONG rc = RegQueryValueExW(k, NULL, NULL, &type, (LPBYTE)raw, &cb);
        RegCloseKey(k);
        if (rc != ERROR_SUCCESS) continue;
        if (type != REG_SZ && type != REG_EXPAND_SZ) continue;

        raw[cb / sizeof(wchar_t)] = 0;             /* السجلّ لا يضمن النهاية الصفرية */

        wchar_t val[1024];
        if (type == REG_EXPAND_SZ){
            if (!ExpandEnvironmentStringsW(raw, val, 1024)) continue;
        } else {
            StrCopy(val, 1024, raw);
        }

        wchar_t *s = val;                          /* إزالة علامتي الاقتباس إن وُجدتا */
        if (*s == L'"'){
            s++;
            wchar_t *q = s;
            while (*q && *q != L'"') q++;
            *q = 0;
        }
        if (FileExists(s)){ StrCopy(out, cch, s); return TRUE; }
    }
    return FALSE;
}

static BOOL FromEnvPath(const wchar_t *envVar, const wchar_t *tail, wchar_t *out, size_t cch){
    wchar_t base[MAX_PATH];
    if (!GetEnvironmentVariableW(envVar, base, MAX_PATH)) return FALSE;
    PathJoin(out, cch, base, tail);
    return FileExists(out);
}

static BOOL FindBrowser(wchar_t *out, size_t cch){
    if (FromAppPaths(L"msedge.exe", out, cch)) return TRUE;
    if (FromAppPaths(L"chrome.exe", out, cch)) return TRUE;

    static const wchar_t *vars[]  = { L"ProgramFiles", L"ProgramFiles(x86)", L"LocalAppData" };
    static const wchar_t *tails[] = { L"Microsoft\\Edge\\Application\\msedge.exe",
                                      L"Google\\Chrome\\Application\\chrome.exe",
                                      L"BraveSoftware\\Brave-Browser\\Application\\brave.exe" };
    for (int t = 0; t < 3; t++)
        for (int v = 0; v < 3; v++)
            if (FromEnvPath(vars[v], tails[t], out, cch)) return TRUE;
    return FALSE;
}

/* ---------- التشغيل ---------- */

int WINAPI wWinMain(HINSTANCE hInst, HINSTANCE hPrev, PWSTR args, int show){
    (void)hInst; (void)hPrev; (void)args; (void)show;

    wchar_t local[MAX_PATH];
    if (FAILED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, local))){
        MessageBoxW(NULL, L"تعذّر الوصول إلى مجلّد بيانات التطبيق.", APP_TITLE, MB_ICONERROR);
        return 1;
    }

    wchar_t dir[MAX_PATH * 2];
    PathJoin(dir, MAX_PATH * 2, local, APP_DIR);
    CreateDirectoryW(dir, NULL);                   /* موجود سلفًا ← لا ضير */

    wchar_t html[MAX_PATH * 2];
    PathJoin(html, MAX_PATH * 2, dir, L"index.html");
    if (!ExtractHtml(html)){
        MessageBoxW(NULL, L"تعذّر تجهيز ملف المحاكي.", APP_TITLE, MB_ICONERROR);
        return 1;
    }

    wchar_t url[2048];
    PathToFileUrl(html, url, 2048);

    wchar_t browser[1024];
    if (FindBrowser(browser, 1024)){
        wchar_t profile[MAX_PATH * 2];
        PathJoin(profile, MAX_PATH * 2, dir, L"browser-profile");

        wchar_t cmd[4096];
        StrCopy(cmd, 4096, L"\"");
        StrCat (cmd, 4096, browser);
        StrCat (cmd, 4096, L"\" --app=\"");
        StrCat (cmd, 4096, url);
        StrCat (cmd, 4096, L"\" --user-data-dir=\"");
        StrCat (cmd, 4096, profile);
        StrCat (cmd, 4096, L"\" --window-size=1280,900 --no-first-run --no-default-browser-check");

        STARTUPINFOW si; PROCESS_INFORMATION pi;
        ZeroMemory(&si, sizeof(si)); si.cb = sizeof(si);
        ZeroMemory(&pi, sizeof(pi));

        if (CreateProcessW(NULL, cmd, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)){
            CloseHandle(pi.hThread);
            CloseHandle(pi.hProcess);
            return 0;
        }
    }

    /* لا متصفّح كروميوم، أو تعذّر تشغيله ← المتصفّح الافتراضي */
    HINSTANCE r = ShellExecuteW(NULL, L"open", html, NULL, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)r <= 32){
        MessageBoxW(NULL, L"تعذّر فتح المحاكي. افتح الملف يدويًا من:\n"
                          L"%LOCALAPPDATA%\\" APP_DIR L"\\index.html", APP_TITLE, MB_ICONERROR);
        return 1;
    }
    return 0;
}
