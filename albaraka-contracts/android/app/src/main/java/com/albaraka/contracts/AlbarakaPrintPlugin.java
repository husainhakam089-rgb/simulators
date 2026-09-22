package com.albaraka.contracts;

import android.content.Context;
import android.graphics.Bitmap;
import android.print.PdfPrint;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * الطباعة على أندرويد:
 * print   → نظام الطباعة المدمج (الطريقة المضمونة).
 * savePdf → يحوّل نفس المستند إلى PDF للمشاركة أو للإرسال المباشر عبر IPP.
 */
@CapacitorPlugin(name = "AlbarakaPrint")
public class AlbarakaPrintPlugin extends Plugin {

    /** يمنع جمع القمامة للـ WebView قبل انتهاء الطباعة. */
    private final Map<String, WebView> pending = new HashMap<>();

    private PrintAttributes a4Attributes() {
        return new PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                .setResolution(new PrintAttributes.Resolution("pdf", "pdf", 300, 300))
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .build();
    }

    private void withRenderedWebView(String html, final OnReady ready) {
        final String token = Long.toString(System.nanoTime());
        WebView webView = new WebView(getContext());
        webView.getSettings().setJavaScriptEnabled(false);
        webView.getSettings().setLoadWithOverviewMode(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                /* مهلة قصيرة حتى تُحمّل الخطوط المدمجة قبل بناء الصفحات */
                view.postDelayed(() -> {
                    try {
                        ready.run(view);
                    } finally {
                        view.postDelayed(() -> pending.remove(token), 60000);
                    }
                }, 350);
            }
        });
        pending.put(token, webView);
        webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
    }

    private interface OnReady {
        void run(WebView view);
    }

    @PluginMethod
    public void print(final PluginCall call) {
        final String html = call.getString("html", "");
        final String jobName = call.getString("jobName", "document");
        getActivity().runOnUiThread(() -> withRenderedWebView(html, view -> {
            try {
                PrintManager manager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(jobName);
                manager.print(jobName, adapter, a4Attributes());
                JSObject out = new JSObject();
                out.put("started", true);
                call.resolve(out);
            } catch (Exception e) {
                call.reject("تعذّر فتح نظام الطباعة: " + e.getMessage(), e);
            }
        }));
    }

    @PluginMethod
    public void savePdf(final PluginCall call) {
        final String html = call.getString("html", "");
        final String fileName = safeName(call.getString("fileName", "document.pdf"));
        final boolean wantBase64 = Boolean.TRUE.equals(call.getBoolean("base64", false));
        getActivity().runOnUiThread(() -> withRenderedWebView(html, view -> {
            try {
                File dir = new File(getContext().getCacheDir(), "documents");
                File out = new File(dir, fileName);
                PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(fileName);
                new PdfPrint(a4Attributes()).print(adapter, out, new PdfPrint.CallbackPrint() {
                    @Override
                    public void onWriteFinished(File file) {
                        try {
                            JSObject res = new JSObject();
                            res.put("path", file.getAbsolutePath());
                            res.put("uri", FileProvider.getUriForFile(getContext(),
                                    getContext().getPackageName() + ".fileprovider", file).toString());
                            res.put("size", file.length());
                            if (wantBase64) res.put("base64", readBase64(file));
                            call.resolve(res);
                        } catch (Exception e) {
                            call.reject("تعذّر تجهيز الملف: " + e.getMessage(), e);
                        }
                    }

                    @Override
                    public void onError(String message) {
                        call.reject(message);
                    }
                });
            } catch (Exception e) {
                call.reject("تعذّر إنشاء PDF: " + e.getMessage(), e);
            }
        }));
    }

    private String safeName(String name) {
        String clean = name.replaceAll("[^A-Za-z0-9._-]", "_");
        return clean.toLowerCase().endsWith(".pdf") ? clean : clean + ".pdf";
    }

    private String readBase64(File file) throws Exception {
        try (FileInputStream in = new FileInputStream(file)) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int read;
            while ((read = in.read(chunk)) != -1) buffer.write(chunk, 0, read);
            return Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP);
        }
    }
}
