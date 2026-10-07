package org.crowncouncil.prometheus;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getBridge().getWebView().postDelayed(this::injectPrometheusAI, 900);\n        getBridge().getWebView().postDelayed(this::injectPrometheusAI, 2200);
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript(
            "(window.__prometheusBack ? window.__prometheusBack() : false)",
            value -> {
                if ("true".equals(value)) {
                    return;
                }
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    MainActivity.super.onBackPressed();
                }
            }
        );
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
            String js = "(function(){try{" + script.toString() + "}catch(e){console.error('PROMETHEUS AI injection failed',e);}})()";
            webView.evaluateJavascript(js, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
