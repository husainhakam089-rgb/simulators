package iq.albaraka.contracts;

import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
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
import java.io.FileOutputStream;

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

    /** مقاس صفحة A4 بوحدات CSS عند 96 نقطة/إنش — يطابق قالب الطباعة. */
    private static final int A4_CSS_WIDTH = 794;
    private static final float A4_CSS_HEIGHT = 297f * 96f / 25.4f;
    /** مقاس A4 بالنقاط (72 نقطة/إنش) وهو مقاس صفحة PDF. */
    private static final int A4_PT_WIDTH = 595;
    private static final int A4_PT_HEIGHT = 842;
    /** مهلة تحميل الخطوط والصور المضمّنة قبل الرسم. */
    private static final long SETTLE_MS = 700;

    /** يبقى حيّاً ما دامت مهمة الطباعة قائمة؛ إتلافه أثناءها يُفشلها. */
    private WebView printWebView;

    private interface WebViewReady {
        void onReady(WebView webView);
    }

    private interface Failure {
        void onFail(String message);
    }

    private float density() {
        float d = getContext().getResources().getDisplayMetrics().density;
        return d > 0f ? d : 1f;
    }

    /**
     * تحميل مستند الطباعة في WebView خارج الشاشة ثم تنفيذ العمل بعد اكتماله.
     *
     * يُضاف الـ WebView فعلياً إلى شجرة العرض: الرسم على Canvas من WebView
     * غير مُلحق بنافذة يخرج فارغاً — وهو سبب خروج المشاركة والطباعة المباشرة
     * بلا ملف. ويُعطى عرض الصفحة الحقيقي من البداية كي يرصف المتصفح المحتوى
     * على مقاس A4 لا على عرض صفري.
     */
    private void withLoadedWebView(String html, boolean disposeAfter, WebViewReady ready) {
        ViewGroup root = getActivity() == null ? null : getActivity().findViewById(android.R.id.content);
        if (root == null) {
            throw new IllegalStateException("الشاشة غير جاهزة");
        }

        final WebView webView = new WebView(getContext());
        webView.getSettings().setJavaScriptEnabled(false);
        webView.getSettings().setAllowFileAccess(false);
        // الرسم البرمجي على Canvas يحتاج طبقة برمجية لا معجّلة بالعتاد.
        webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        webView.setLayoutParams(new ViewGroup.LayoutParams(Math.round(A4_CSS_WIDTH * density()), 1));
        webView.setTranslationX(-100000f);

        if (disposeAfter) {
            root.addView(webView);
        } else {
            // مهمة نظام الطباعة تقرأ من الـ WebView بعد رجوع هذه الدالة.
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
        final int pageCount = call.getInt("pageCount", 1);

        if (host.isEmpty()) {
            call.reject("عنوان الطابعة غير محفوظ في الإعدادات");
            return;
        }

        onUi(call, () -> withLoadedWebView(html, true, webView -> {
            File pdf = new File(getContext().getCacheDir(), "print-job.pdf");
            if (!renderToPdf(webView, pdf, pageCount, call::reject)) {
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
        }));
    }

    /** تصدير نسخة PDF وفتح قائمة المشاركة (تطبيق الطابعة، واتساب…). */
    @PluginMethod
    public void sharePdf(PluginCall call) {
        final String html = call.getString("html", "");
        final String title = call.getString("title", "مستند");
        final int pageCount = call.getInt("pageCount", 1);
        final String fileName = safeFileName(call.getString("fileName", "مستند.pdf"));

        onUi(call, () -> withLoadedWebView(html, true, webView -> {
            File dir = new File(getContext().getCacheDir(), "shared");
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("تعذّر تهيئة مجلد المشاركة");
                return;
            }
            File pdf = new File(dir, fileName);
            if (!renderToPdf(webView, pdf, pageCount, call::reject)) {
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

    /**
     * رسم صفحات المستند في ملف PDF بمقاس A4 بالضبط.
     * عدد الصفحات يأتي من الواجهة لأنها تعرف عدد النسخ المطلوبة.
     */
    private boolean renderToPdf(WebView webView, File out, int pageCount, Failure onFail) {
        int pages = Math.max(1, pageCount);
        // الـ WebView يقيس بالبكسل الفيزيائي بينما الصفحة تُرصف بوحدات CSS،
        // والنسبة بينهما هي كثافة الشاشة. بدون ضربها في الكثافة تخرج نافذة
        // العرض أضيق من A4 على أي جهاز كثافته أكبر من واحد، فيُقتطع العقد.
        float density = density();
        int viewWidth = Math.round(A4_CSS_WIDTH * density);
        float pageHeightPx = A4_CSS_HEIGHT * density;
        int viewHeight = Math.round(pages * pageHeightPx);

        PdfDocument document = new PdfDocument();
        try {
            webView.measure(
                    View.MeasureSpec.makeMeasureSpec(viewWidth, View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(viewHeight, View.MeasureSpec.EXACTLY));
            webView.layout(0, 0, viewWidth, viewHeight);

            float scale = (float) A4_PT_WIDTH / (float) viewWidth;
            for (int i = 0; i < pages; i++) {
                PdfDocument.PageInfo info =
                        new PdfDocument.PageInfo.Builder(A4_PT_WIDTH, A4_PT_HEIGHT, i + 1).create();
                PdfDocument.Page page = document.startPage(info);
                Canvas canvas = page.getCanvas();
                canvas.scale(scale, scale);
                canvas.translate(0, -i * pageHeightPx);
                webView.draw(canvas);
                document.finishPage(page);
            }
            try (FileOutputStream stream = new FileOutputStream(out)) {
                document.writeTo(stream);
            }
            return out.length() > 0;
        } catch (Exception e) {
            onFail.onFail("تعذّر توليد ملف PDF: " + e.getMessage());
            return false;
        } finally {
            document.close();
        }
    }
}
