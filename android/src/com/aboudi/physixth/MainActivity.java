package com.aboudi.physixth;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.ValueCallback;
import android.widget.FrameLayout;

/*
 * نافذة التطبيق على أندرويد: WebView واحد يحمّل نفس ملف التطبيق أحادي
 * الملف الموجود في assets. لا يوجد منطق مكرّر هنا — كل شيء في الـ HTML.
 */
public class MainActivity extends Activity {

    private WebView web;
    private FrameLayout root;

    /* ملء الشاشة داخل الصفحة (زر «ملء الشاشة» في التجارب) لا يعمل في
       WebView إلا إذا تولّى التطبيق عرض العنصر بنفسه. */
    private View customView;
    private WebChromeClient.CustomViewCallback customCallback;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        root = new FrameLayout(this);
        root.setBackgroundColor(0xFF0A0F1C);          // خلفية التطبيق، فلا وميض أبيض
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        /* الفصول تُحقن في إطارات عبر srcdoc من صفحة file://، فتحتاج هذا
           السماح كي تُعامل كأصل واحد. المحتوى محلي بالكامل داخل الحزمة. */
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);

        web.setBackgroundColor(0xFF0A0F1C);
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback cb) {
                if (customView != null) { cb.onCustomViewHidden(); return; }
                customView = view;
                customCallback = cb;
                root.addView(view, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                web.setVisibility(View.GONE);
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            }

            @Override
            public void onHideCustomView() {
                hideCustomView();
            }
        });

        web.loadUrl("file:///android_asset/app.html");
    }

    /* زر الرجوع يرجع خطوة واحدة في شاشات التطبيق (تجارب ← فصول ← ترحيب)
       قبل أن يخرج، تماماً كما يفعل Esc على الحاسوب. */
    private static final String STEP_BACK =
        "(function(){" +
        "  if (document.fullscreenElement) { document.exitFullscreen(); return 'fs'; }" +
        "  var v=document.getElementById('viewer'), p=document.getElementById('picker');" +
        "  if (v && v.classList.contains('on')) {" +
        "    var b=document.getElementById('backBtn'); if(b){b.click(); return 'viewer';}" +
        "  }" +
        "  if (p && p.classList.contains('on')) {" +
        "    var h=document.getElementById('toSplashBtn'); if(h){h.click(); return 'picker';}" +
        "  }" +
        "  return 'splash';" +
        "})()";

    private void hideCustomView() {
        if (customView == null) return;
        root.removeView(customView);
        customView = null;
        web.setVisibility(View.VISIBLE);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (customCallback != null) {
            customCallback.onCustomViewHidden();
            customCallback = null;
        }
    }

    @Override
    public boolean onKeyDown(int code, KeyEvent event) {
        if (code != KeyEvent.KEYCODE_BACK) return super.onKeyDown(code, event);

        if (customView != null) {          // أثناء ملء الشاشة: اخرج منه فقط
            hideCustomView();
            return true;
        }
        web.evaluateJavascript(STEP_BACK, new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                // القيمة تعود مقتبسة من JS، لذا نبحث عن النص لا نساويه
                if (value != null && value.indexOf("splash") >= 0) finish();
            }
        });
        return true;
    }
}
