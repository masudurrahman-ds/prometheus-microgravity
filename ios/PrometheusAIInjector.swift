import WebKit

/// PROMETHEUS iOS native bridge.
/// Add prometheus_ai.js to the iOS target's Copy Bundle Resources.
final class PrometheusAIInjector {
    static func inject(into webView: WKWebView) {
        guard let url = Bundle.main.url(forResource: "prometheus_ai", withExtension: "js"),
              let script = try? String(contentsOf: url, encoding: .utf8) else { return }
        let wrapped = "(function(){try{window.__prometheusAIStatus='injecting';" + script + "}catch(e){window.__prometheusAIStatus='error';window.__prometheusAIInjected=false;console.error('PROMETHEUS AI injection failed',e);}})();"
        webView.evaluateJavaScript(wrapped) { _, error in
            if let error { print("PROMETHEUS AI: \(error.localizedDescription)") }
        }
    }
}
