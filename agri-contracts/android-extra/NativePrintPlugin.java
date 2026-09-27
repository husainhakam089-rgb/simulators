package iq.albaraka.contracts;

import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.print.PdfWriter;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

/**
 * جسر الطباعة إلى أندرويد.
 *
 * printHtml   — نظام الطباعة المدمج (الطريقة الأولى المضمونة): نافذة أندرويد
 *               الصغيرة فوق التطبيق، والطابعة مختارة مسبقاً.
 * printDirect — الطباعة المباشرة عبر IPP (الطريقة الثانية): تحويل داخلي إلى
 *               PDF ثم إرساله للطابعة بلا أي نافذة.
 * sharePdf    — تصدير PDF وفتح قائمة المشاركة (تطبيق الطابعة، واتساب…).
 *
 * التحويل إلى PDF داخلي في الحالتين الأخيرتين، لأن الـ PDF يثبّت شكل العقد:
 * الخط العربي ومكان كل حقل والهوامش ومقاس الورقة.
 */
@CapacitorPlugin(name = "NativePrint")
public class NativePrintPlugin extends Plugin {

    /** عرض صفحة A4 بوحدات CSS عند 96 نقطة/إنش — يطابق قالب الطباعة. */
    private static final int A4_CSS_WIDTH = 794;
    /** مهلة تحميل الخطوط والصور المضمّنة قبل التحويل. */
    private static final long SETTLE_MS = 700;

    /** يبقى حيّاً ما دامت مهمة الطباعة قائمة؛ إتلافه أثناءها يُفشلها. */
    private WebView printWebView;

    private interface WebViewReady {
        void onReady(WebView webView);
    }

    private float density() {
        float d = getContext().getResources().getDisplayMetrics().density;
        return d > 0f ? d : 1f;
    }

    /**
     * تحميل مستند الطباعة في WebView خارج الشاشة ثم تنفيذ العمل بعد اكتماله.
     *
     * يُضاف الـ WebView فعلياً إلى شجرة العرض بعرض الصفحة الحقيقي: الصفحة
     * غير المُلحقة بنافذة لا تحمّل خطوطها وصورها كاملةً، فتخرج ناقصة.
     * أما تحويل الصفحة إلى PDF فيتولّاه PdfWriter عبر مسار الطباعة نفسه.
     */
    private void withLoadedWebView(String html, boolean disposeAfter, WebViewReady ready) {
        ViewGroup root = getActivity() == null ? null : getActivity().findViewById(android.R.id.content);
        if (root == null) {
            throw new IllegalStateException("الشاشة غير جاهزة");
        }

        final WebView webView = new WebView(getContext());
        webView.getSettings().setJavaScriptEnabled(false);
        webView.getSettings().setAllowFileAccess(false);
        webView.setLayoutParams(new ViewGroup.LayoutParams(Math.round(A4_CSS_WIDTH * density()), 1));
        webView.setTranslationX(-100000f);

        if (disposeAfter) {
            root.addView(webView);
        } else {
            // الطباعة والتحويل إلى PDF كلاهما يقرأ من الـ WebView بعد رجوع
            // هذه الدالة، فلا يجوز إتلافه هنا.
            if (printWebView != null) {
                ViewGroup old = (ViewGroup) printWebView.getParent();
                if (old != null) {
                    old.removeView(printWebView);
                }
                printWebView.destroy();
            }
            printWebView = webView;
            root.addView(webView);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.postDelayed(() -> {
                    try {
                        ready.onReady(view);
                    } finally {
                        if (disposeAfter) {
                            view.post(() -> {
                                ViewGroup parent = (ViewGroup) view.getParent();
                                if (parent != null) {
                                    parent.removeView(view);
                                }
                                view.destroy();
                            });
                        }
                    }
                }, SETTLE_MS);
            }
        });

        // الخطوط والصور مضمّنة في المستند نفسه، فالأساس هنا للاحتياط فقط.
        String base = getBridge().getWebView() == null ? null : getBridge().getWebView().getUrl();
        if (base == null || base.isEmpty()) {
            base = "https://localhost/";
        }
        webView.loadDataWithBaseURL(base, html, "text/html", "UTF-8", null);
    }

    /** تشغيل العمل على خيط الواجهة مع تحويل أي خطأ إلى رفض للنداء. */
    private void onUi(PluginCall call, Runnable work) {
        getActivity().runOnUiThread(() -> {
            try {
                work.run();
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "تعذّرت العملية" : e.getMessage());
            }
        });
    }

    /** الطريقة الأولى: تسليم المستند لنظام الطباعة في أندرويد. */
    @PluginMethod
    public void printHtml(PluginCall call) {
        final String html = call.getString("html", "");
        final String jobName = call.getString("jobName", "مستند");
        onUi(call, () -> withLoadedWebView(html, false, webView -> {
            try {
                PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
                PrintAttributes attributes = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build();
                printManager.print(jobName, adapter, attributes);
                call.resolve();
            } catch (Exception e) {
                call.reject("تعذّر فتح نظام الطباعة: " + e.getMessage());
            }
        }));
    }

    /** الطريقة الثانية: تحويل إلى PDF ثم إرسال مباشر للطابعة عبر IPP. */
    @PluginMethod
    public void printDirect(PluginCall call) {
        final String html = call.getString("html", "");
        final String jobName = call.getString("jobName", "مستند");
        final String host = call.getString("host", "");
        final int port = call.getInt("port", 631);
        final String queue = call.getString("queue", "ipp/print");

        if (host.isEmpty()) {
            call.reject("عنوان الطابعة غير محفوظ في الإعدادات");
            return;
        }

        onUi(call, () -> withLoadedWebView(html, false, webView -> {
            File pdf = new File(getContext().getCacheDir(), "print-job.pdf");
            PdfWriter.write(webView.createPrintDocumentAdapter(jobName), pdf, (ok, error) -> {
                if (!ok) {
                    call.reject(error);
                    return;
                }
                // الشبكة خارج خيط الواجهة.
                new Thread(() -> {
                    try {
                        IppClient.Result result = IppClient.printPdf(host, port, queue, pdf, jobName, "albaraka");
                        if (result.ok) {
                            JSObject ret = new JSObject();
                            ret.put("status", result.statusCode);
                            call.resolve(ret);
                        } else {
                            call.reject(result.message);
                        }
                    } catch (Exception e) {
                        call.reject("تعذّر الاتصال بالطابعة: " + e.getMessage());
                    }
                }).start();
            });
        }));
    }

    /** تصدير نسخة PDF وفتح قائمة المشاركة (تطبيق الطابعة، واتساب…). */
    @PluginMethod
    public void sharePdf(PluginCall call) {
        final String html = call.getString("html", "");
        final String title = call.getString("title", "مستند");
        final String fileName = safeFileName(call.getString("fileName", "مستند.pdf"));

        onUi(call, () -> withLoadedWebView(html, false, webView -> {
            File dir = new File(getContext().getCacheDir(), "shared");
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("تعذّر تهيئة مجلد المشاركة");
                return;
            }
            File pdf = new File(dir, fileName);
            PdfWriter.write(webView.createPrintDocumentAdapter(title), pdf, (ok, error) -> {
                if (!ok) {
                    call.reject(error);
                    return;
                }
                try {
                    Uri uri = FileProvider.getUriForFile(
                            getContext(), getContext().getPackageName() + ".fileprovider", pdf);
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType("application/pdf");
                    send.putExtra(Intent.EXTRA_STREAM, uri);
                    send.putExtra(Intent.EXTRA_SUBJECT, title);
                    send.putExtra(Intent.EXTRA_TITLE, title);
                    // بعض تطبيقات الطابعات تقرأ الملف من ClipData لا من EXTRA_STREAM،
                    // ومنها تأخذ إذن القراءة المؤقّت.
                    send.setClipData(ClipData.newRawUri(title, uri));
                    send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    Intent chooser = Intent.createChooser(send, "طباعة أو مشاركة");
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    getContext().startActivity(chooser);
                    call.resolve();
                } catch (Exception e) {
                    call.reject("تعذّرت المشاركة: " + e.getMessage());
                }
            });
        }));
    }

    /** اسم ملف صالح: بلا فواصل مسار ولا محارف تكسر مزوّد الملفات. */
    private static String safeFileName(String name) {
        String cleaned = name.replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_").trim();
        if (cleaned.isEmpty()) {
            cleaned = "مستند";
        }
        return cleaned.endsWith(".pdf") ? cleaned : cleaned + ".pdf";
    }

}
