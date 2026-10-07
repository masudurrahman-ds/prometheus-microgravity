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
        getBridge().getWebView().postDelayed(this::injectPrometheusAI, 1400);
    }

    private void injectPrometheusAI() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView == null) return;
            InputStream input = getAssets().open("prometheus_ai.js");
            BufferedReader reader = new BufferedReader(new InputStreamReader(input, "UTF-8"));
            StringBuilder script = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) script.append(line).append("\\n");
            reader.close();
            String js = "javascript:(function(){try{" + script.toString() + "}catch(e){console.error('PROMETHEUS AI injection failed',e);}})()";
            webView.evaluateJavascript(js, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
