# PROMETHEUS iOS native bridge

This folder contains Swift and Objective-C helpers for injecting the same local `prometheus_ai.js` used by the Android wrapper into a `WKWebView`.

1. Add `android/app/src/main/assets/prometheus_ai.js` to the iOS target as `prometheus_ai.js`.
2. Call `PrometheusAIInjector.inject(into: webView)` from Swift after the web view finishes loading, or `[PrometheusAIInjector injectIntoWebView:webView]` from Objective-C.
3. Use `WKWebView`, not deprecated `UIWebView`.

Apple documents `WKWebView.evaluateJavaScript` as the supported API for executing JavaScript in a web view. 
