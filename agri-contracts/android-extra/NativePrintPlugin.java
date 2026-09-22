package iq.albaraka.contracts;

import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
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
 * sharePdf    — تصدير PDF ومشاركته (واتساب مثلاً).
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

    private interface WebViewReady {
        void onReady(WebView webView);
    }

    private interface Failure {
        void onFail(String message);
    }

    /** تحميل مستند الطباعة في WebView مخفي ثم تنفيذ العمل عند اكتمال التحميل. */
    private void withLoadedWebView(String html, WebViewReady ready) {
        WebView webView = new WebView(getContext());
        webView.getSettings().setJavaScriptEnabled(false);
        webView.getSettings().setAllowFileAccess(false);
        // الرسم البرمجي على Canvas يحتاج طبقة برمجية لا معجّلة بالعتاد.
        webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                // مهلة قصيرة لتحميل الخطوط والصور المضمّنة قبل الرسم.
                view.postDelayed(() -> ready.onReady(view), 600);
            }
        });
        // الخطوط والصور مضمّنة في المستند نفسه، فالأساس هنا للاحتياط فقط.
        String base = getBridge().getWebView() == null ? null : getBridge().getWebView().getUrl();
        if (base == null || base.isEmpty()) {
            base = "https://localhost/";
        }
        webView.loadDataWithBaseURL(base, html, "text/html", "UTF-8", null);
    }

    /** الطريقة الأولى: تسليم المستند لنظام الطباعة في أندرويد. */
    @PluginMethod
    public void printHtml(PluginCall call) {
        final String html = call.getString("html", "");
        final String jobName = call.getString("jobName", "مستند");
        getActivity().runOnUiThread(() -> withLoadedWebView(html, webView -> {
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

        getActivity().runOnUiThread(() -> withLoadedWebView(html, webView -> {
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

    /** تصدير نسخة PDF ومشاركتها. */
    @PluginMethod
    public void sharePdf(PluginCall call) {
        final String html = call.getString("html", "");
        final String title = call.getString("title", "مستند");
        final int pageCount = call.getInt("pageCount", 1);
        String name = call.getString("fileName", "مستند.pdf");
        final String fileName = name.endsWith(".pdf") ? name : name + ".pdf";

        getActivity().runOnUiThread(() -> withLoadedWebView(html, webView -> {
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
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Intent chooser = Intent.createChooser(send, title);
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(chooser);
                call.resolve();
            } catch (Exception e) {
                call.reject("تعذّرت المشاركة: " + e.getMessage());
            }
        }));
    }

    /**
     * رسم صفحات المستند في ملف PDF بمقاس A4 بالضبط.
     * عدد الصفحات يأتي من الواجهة لأنها تعرف عدد النسخ المطلوبة.
     */
    private boolean renderToPdf(WebView webView, File out, int pageCount, Failure onFail) {
        int pages = Math.max(1, pageCount);
        int totalHeight = Math.round(pages * A4_CSS_HEIGHT);
        PdfDocument document = new PdfDocument();
        try {
            webView.measure(
                    View.MeasureSpec.makeMeasureSpec(A4_CSS_WIDTH, View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(totalHeight, View.MeasureSpec.EXACTLY));
            webView.layout(0, 0, A4_CSS_WIDTH, totalHeight);

            float scale = (float) A4_PT_WIDTH / (float) A4_CSS_WIDTH;
            for (int i = 0; i < pages; i++) {
                PdfDocument.PageInfo info =
                        new PdfDocument.PageInfo.Builder(A4_PT_WIDTH, A4_PT_HEIGHT, i + 1).create();
                PdfDocument.Page page = document.startPage(info);
                Canvas canvas = page.getCanvas();
                canvas.scale(scale, scale);
                canvas.translate(0, -i * A4_CSS_HEIGHT);
                webView.draw(canvas);
                document.finishPage(page);
            }
            try (FileOutputStream stream = new FileOutputStream(out)) {
                document.writeTo(stream);
            }
            return true;
        } catch (Exception e) {
            onFail.onFail("تعذّر توليد ملف PDF: " + e.getMessage());
            return false;
        } finally {
            document.close();
        }
    }
}
