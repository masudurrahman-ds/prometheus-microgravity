PROMETHEUS iOS native bridge

This folder contains Swift and Objective-C helpers for injecting the local prometheus_ai.js into a WKWebView.

Swift: ios/PrometheusAIInjector.swift defines PrometheusAISwiftInjector. Add prometheus_ai.js to the iOS target's Copy Bundle Resources and call PrometheusAISwiftInjector.inject(into: webView).

Objective-C: ios/PrometheusAIInjector.h/.m exposes PrometheusAIInjector. Call [PrometheusAIInjector injectIntoWebView:webView].

The Swift and Objective-C bridges intentionally use different native class names so they can coexist without a duplicate-class collision. Use WKWebView, not UIWebView.

This directory is an integration bridge, not a complete generated Xcode project.