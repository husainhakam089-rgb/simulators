package iq.albaraka.contracts;

import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
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
import java.util.Base64;

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
     * يُضاف الـ WebView فعلياً إلى شجرة العرض بمقاس الورقة كاملاً: الصفحة
     * غير المُلحقة بنافذة، أو المُلحقة بمقاس صفري، لا تُرسم فتخرج بيضاء.
     */
    private void withLoadedWebView(String html, int pageCount, boolean disposeAfter, WebViewReady ready) {
        ViewGroup root = getActivity() == null ? null : getActivity().findViewById(android.R.id.content);
        if (root == null) {
            throw new IllegalStateException("الشاشة غير جاهزة");
        }

        final WebView webView = new WebView(getContext());
        webView.getSettings().setJavaScriptEnabled(false);
        webView.getSettings().setAllowFileAccess(false);
        // بمقاس الورقة كاملاً منذ البداية: الـ WebView لا يرسم إلا ما رُصف
        // فعلاً، فلو أُلحق بارتفاع سطر واحد خرجت الصفحة بيضاء.
        float density = density();
        int viewWidth = Math.round(A4_CSS_WIDTH * density);
        int viewHeight = Math.round(Math.max(1, pageCount) * A4_CSS_HEIGHT * density);
        webView.setLayoutParams(new ViewGroup.LayoutParams(viewWidth, viewHeight));
        // الرسم البرمجي على Canvas يحتاج طبقة برمجية لا معجّلة بالعتاد.
        webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        webView.setTranslationX(-((float) viewWidth + 2000f));

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
        final int pageCount = call.getInt("pageCount", 1);
        onUi(call, () -> withLoadedWebView(html, pageCount, false, webView -> {
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

        onUi(call, () -> withLoadedWebView(html, pageCount, true, webView -> {
            File pdf = new File(getContext().getCacheDir(), "print-job.pdf");
            String error = renderToPdf(webView, pdf, pageCount);
            if (error != null) {
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
        }));
    }

    /** تصدير نسخة PDF وفتح قائمة المشاركة (تطبيق الطابعة، واتساب…). */
    @PluginMethod
    public void sharePdf(PluginCall call) {
        final String html = call.getString("html", "");
        final String title = call.getString("title", "مستند");
        final int pageCount = call.getInt("pageCount", 1);
        final String fileName = safeFileName(call.getString("fileName", "مستند.pdf"), ".pdf");

        onUi(call, () -> withLoadedWebView(html, pageCount, true, webView -> {
            File dir = new File(getContext().getCacheDir(), "shared");
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("تعذّر تهيئة مجلد المشاركة");
                return;
            }
            File pdf = new File(dir, fileName);
            String error = renderToPdf(webView, pdf, pageCount);
            if (error != null) {
                call.reject(error);
                return;
            }
            try {
                shareIntent(pdf, "application/pdf", title);
                call.resolve();
            } catch (Exception e) {
                call.reject("تعذّرت المشاركة: " + e.getMessage());
            }
        }));
    }

    /**
     * مشاركة ملف جاهز المحتوى — تُستعمل لتصدير النسخة الاحتياطية.
     * تنزيل الملفات عبر رابط blob لا يعمل داخل WebView أندرويد، فتُمرَّر
     * المحتويات من الواجهة وتُكتب هنا ثم تُفتح قائمة المشاركة.
     */
    @PluginMethod
    public void shareFile(PluginCall call) {
        final String base64 = call.getString("base64", "");
        final String mimeType = call.getString("mimeType", "application/octet-stream");
        final String title = call.getString("title", "ملف");
        final String fileName = safeFileName(call.getString("fileName", "ملف"), "");

        try {
            File dir = new File(getContext().getCacheDir(), "shared");
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("تعذّر تهيئة مجلد المشاركة");
                return;
            }
            File file = new File(dir, fileName);
            try (FileOutputStream stream = new FileOutputStream(file)) {
                stream.write(Base64.getDecoder().decode(base64));
            }
            shareIntent(file, mimeType, title);
            call.resolve();
        } catch (Exception e) {
            call.reject("تعذّرت مشاركة الملف: " + e.getMessage());
        }
    }

    /** فتح قائمة المشاركة لملف داخل مجلد المشاركة. */
    private void shareIntent(File file, String mimeType, String title) {
        Uri uri = FileProvider.getUriForFile(
                getContext(), getContext().getPackageName() + ".fileprovider", file);
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType(mimeType);
        send.putExtra(Intent.EXTRA_STREAM, uri);
        send.putExtra(Intent.EXTRA_SUBJECT, title);
        send.putExtra(Intent.EXTRA_TITLE, title);
        // بعض تطبيقات الطابعات تقرأ الملف من ClipData لا من EXTRA_STREAM،
        // ومنها تأخذ إذن القراءة المؤقّت.
        send.setClipData(ClipData.newRawUri(title, uri));
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        Intent chooser = Intent.createChooser(send, title);
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        getContext().startActivity(chooser);
    }

    /**
     * رسم صفحات المستند في ملف PDF بمقاس A4 بالضبط.
     * @return رسالة الخطأ، أو null عند النجاح.
     */
    private String renderToPdf(WebView webView, File out, int pageCount) {
        int pages = Math.max(1, pageCount);
        // الـ WebView يقيس بالبكسل الفيزيائي بينما الصفحة تُرصف بوحدات CSS،
        // والنسبة بينهما كثافة الشاشة. بدون ضربها تخرج الورقة مقصوصة.
        float density = density();
        int viewWidth = Math.round(A4_CSS_WIDTH * density);
        float pageHeightPx = A4_CSS_HEIGHT * density;
        int viewHeight = Math.round(pages * pageHeightPx);

        webView.measure(
                View.MeasureSpec.makeMeasureSpec(viewWidth, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(viewHeight, View.MeasureSpec.EXACTLY));
        webView.layout(0, 0, viewWidth, viewHeight);

        if (isBlank(webView, viewWidth, pageHeightPx)) {
            return "خرجت الصفحة بيضاء. استعمل زر الطباعة ثم اختر «حفظ كـ PDF».";
        }

        PdfDocument document = new PdfDocument();
        try {
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
            return out.length() > 0 ? null : "خرج ملف PDF فارغاً";
        } catch (Exception e) {
            return "تعذّر توليد ملف PDF: " + e.getMessage();
        } finally {
            document.close();
        }
    }

    /**
     * فحص أن الصفحة الأولى رُسمت فعلاً.
     * بدونه تخرج ورقة بيضاء صامتة إن امتنع الـ WebView عن الرسم، وهو ما
     * يحصل حين لا يكون مُلحقاً بنافذة أو حين يُرصف بمقاس صفري.
     */
    private boolean isBlank(WebView webView, int viewWidth, float pageHeightPx) {
        final int probeWidth = 120;
        int probeHeight = Math.max(1, Math.round(probeWidth * pageHeightPx / viewWidth));
        Bitmap probe = Bitmap.createBitmap(probeWidth, probeHeight, Bitmap.Config.ARGB_8888);
        try {
            Canvas canvas = new Canvas(probe);
            canvas.drawColor(Color.WHITE);
            float scale = (float) probeWidth / (float) viewWidth;
            canvas.scale(scale, scale);
            webView.draw(canvas);

            int[] pixels = new int[probeWidth * probeHeight];
            probe.getPixels(pixels, 0, probeWidth, 0, 0, probeWidth, probeHeight);
            int inked = 0;
            for (int pixel : pixels) {
                int r = Color.red(pixel);
                int g = Color.green(pixel);
                int b = Color.blue(pixel);
                if (r < 235 || g < 235 || b < 235) {
                    inked++;
                    if (inked > 40) {
                        return false;
                    }
                }
            }
            return true;
        } catch (Exception e) {
            return false; // الفحص نفسه ليس سبباً لمنع المحاولة
        } finally {
            probe.recycle();
        }
    }

    /** اسم ملف صالح: بلا فواصل مسار ولا محارف تكسر مزوّد الملفات. */
    private static String safeFileName(String name, String extension) {
        String cleaned = name.replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_").trim();
        if (cleaned.isEmpty()) {
            cleaned = "مستند";
        }
        return extension.isEmpty() || cleaned.endsWith(extension) ? cleaned : cleaned + extension;
    }

}
