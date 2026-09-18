/*
 * مشغّل ويندوز صغير لتطبيقات مختبر الفيزياء.
 *
 * التطبيق كله ملف HTML واحد مدمج داخل هذا الملف التنفيذي كمورد. عند
 * التشغيل يُكتب الملف إلى مجلد بيانات المستخدم ثم يُفتح بالمتصفح
 * الافتراضي. الفائدة أن المشغّل لا يحمل محرك عرض معه — يستعمل المتصفح
 * الموجود على الجهاز — فيبقى بحجم التطبيق نفسه تقريباً بدل ٨٥ ميغابايت.
 */

#include <windows.h>
#include <shlobj.h>
#include <strsafe.h>

#define IDR_APP_HTML 101

/* اسم الملف الذي يُكتب ويُفتح؛ يُعرَّف وقت البناء لكل تطبيق */
#ifndef APP_FILENAME
#define APP_FILENAME L"phy-sixth.html"
#endif
#ifndef APP_TITLE
#define APP_TITLE L"مختبر الفيزياء الافتراضي"
#endif

static void fail(const wchar_t *msg)
{
    MessageBoxW(NULL, msg, APP_TITLE, MB_ICONERROR | MB_OK);
}

/* يبني مسار مجلد التطبيق داخل بيانات المستخدم، ويُنشئه إن لم يوجد.
   يرجع 0 عند الفشل فنسقط إلى مجلد Temp. */
static int app_dir(wchar_t *out, size_t cap)
{
    wchar_t base[MAX_PATH];
    if (FAILED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, base)))
        return 0;
    if (FAILED(StringCchPrintfW(out, cap, L"%ls\\PhySixth", base)))
        return 0;
    /* موجود مسبقاً ليس خطأ */
    if (!CreateDirectoryW(out, NULL) && GetLastError() != ERROR_ALREADY_EXISTS)
        return 0;
    return 1;
}

int WINAPI wWinMain(HINSTANCE inst, HINSTANCE prev, PWSTR cmdline, int show)
{
    (void)prev; (void)cmdline; (void)show;

    HRSRC res = FindResourceW(inst, MAKEINTRESOURCEW(IDR_APP_HTML), RT_RCDATA);
    if (!res) { fail(L"تعذّر العثور على محتوى التطبيق داخل الملف."); return 1; }

    DWORD size = SizeofResource(inst, res);
    HGLOBAL handle = LoadResource(inst, res);
    const void *data = handle ? LockResource(handle) : NULL;
    if (!data || size == 0) { fail(L"تعذّرت قراءة محتوى التطبيق."); return 1; }

    wchar_t dir[MAX_PATH];
    if (!app_dir(dir, MAX_PATH) && !GetTempPathW(MAX_PATH, dir)) {
        fail(L"تعذّر تحديد مجلد لحفظ التطبيق."); return 1;
    }

    wchar_t path[MAX_PATH];
    if (FAILED(StringCchPrintfW(path, MAX_PATH, L"%ls\\%ls", dir, APP_FILENAME))) {
        fail(L"مسار الحفظ طويل جداً."); return 1;
    }

    /* نعيد الكتابة في كل تشغيل حتى تصل أي نسخة أحدث من التطبيق.
       إن كان الملف مفتوحاً بالمتصفح وتعذّرت الكتابة، نفتح الموجود. */
    HANDLE fh = CreateFileW(path, GENERIC_WRITE, FILE_SHARE_READ, NULL,
                            CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (fh != INVALID_HANDLE_VALUE) {
        DWORD written = 0;
        BOOL ok = WriteFile(fh, data, size, &written, NULL) && written == size;
        CloseHandle(fh);
        if (!ok) {
            DeleteFileW(path);
            fail(L"تعذّرت كتابة ملف التطبيق. تأكد من وجود مساحة كافية.");
            return 1;
        }
    } else if (GetFileAttributesW(path) == INVALID_FILE_ATTRIBUTES) {
        fail(L"تعذّر إنشاء ملف التطبيق.");
        return 1;
    }

    HINSTANCE rc = ShellExecuteW(NULL, L"open", path, NULL, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)rc <= 32) {
        fail(L"تعذّر فتح المتصفح. افتح الملف يدوياً من:\n"
             L"%LOCALAPPDATA%\\PhySixth");
        return 1;
    }
    return 0;
}
