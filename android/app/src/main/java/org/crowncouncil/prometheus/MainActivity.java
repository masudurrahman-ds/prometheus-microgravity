package org.crowncouncil.prometheus;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MainActivity extends BridgeActivity {
    private UpdateManager updateManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        installBackHandler();
        installWindowInsets();
        updateManager = new UpdateManager(this);
        updateManager.checkIfDue();
        getBridge().getWebView().postDelayed(this::injectPrometheusAI, 1200);
    }

    private void installWindowInsets() {
        WebView webView = getBridge().getWebView();
        if (webView == null) return;
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });
        ViewCompat.requestApplyInsets(webView);
    }

    private void installBackHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge().getWebView();
                if (webView == null) {
                    finish();
                    return;
                }
                webView.evaluateJavascript(
                    "(window.__prometheusBack ? window.__prometheusBack() : false)",
                    value -> {
                        if ("true".equals(value)) return;
                        if (webView.canGoBack()) webView.goBack();
                        else finish();
                    }
                );
            }
        });
    }

    private void injectPrometheusAI() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView == null) return;
            InputStream input = getAssets().open("prometheus_ai.js");
            BufferedReader reader = new BufferedReader(new InputStreamReader(input, "UTF-8"));
            StringBuilder script = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) script.append(line).append(System.lineSeparator());
            reader.close();
            String js = "(function(){try{" + script.toString() + "}catch(e){window.__prometheusAIStatus='error';window.__prometheusAIInjected=false;console.error('PROMETHEUS AI injection failed',e);}})()";
            webView.evaluateJavascript(js, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
