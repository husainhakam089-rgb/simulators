/* ===========================================================================
   مختبر الفيزياء الافتراضي — الأستاذ أحمد نعمة العبودي
   نشاط واحد يعرض المحاكي المرفق في assets داخل WebView بملء الشاشة.
   لا صلاحيات ولا اتصال: الصفحة وصورتها مدمجتان في التطبيق.
   =========================================================================== */
package iq.alaboudi.physicslab;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        web = new WebView(this);
        web.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);          /* المحاكي كلّه جافاسكربت */
        s.setDomStorageEnabled(true);          /* لحفظ تفضيل المظهر والصوت */
        s.setAllowFileAccess(true);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(false);           /* الصفحة تتولّى مقاسها بنفسها */
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);

        /* أي رابط يبقى داخل التطبيق ولا يفتح متصفّحًا */
        web.setWebViewClient(new WebViewClient());
        web.setBackgroundColor(0xFF0D1730);    /* لون خلفية شاشة الترحيب نفسه */
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        setContentView(web);

        if (state == null) {
            web.loadUrl("file:///android_asset/index.html");
        } else {
            web.restoreState(state);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /* زرّ الرجوع ينزل مستوًى واحدًا داخل المحاكي بدل الخروج فورًا:
       من تجارب الفصل ← إلى قائمة الفصول، ومن قائمة الفصول ← خروج.     */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript(
            "(function(){try{var b=document.body;" +
            "if(b.classList.contains('in-chapter')){" +
            "var x=document.getElementById('backBtn');" +
            "if(x){x.click();return 'handled';}}" +
            "}catch(e){}return 'exit';})()",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    if (value == null || value.indexOf("handled") < 0) {
                        finish();
                    }
                }
            });
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
