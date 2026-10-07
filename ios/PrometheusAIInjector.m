#import "PrometheusAIInjector.h"

@implementation PrometheusAIInjector
+ (void)injectIntoWebView:(WKWebView *)webView {
    NSURL *url = [[NSBundle mainBundle] URLForResource:@"prometheus_ai" withExtension:@"js"];
    if (!url) return;
    NSError *readError = nil;
    NSString *script = [NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:&readError];
    if (!script) return;
    NSString *wrapped = [NSString stringWithFormat:@"(function(){try{window.__prometheusAIStatus='injecting';%@}catch(e){window.__prometheusAIStatus='error';window.__prometheusAIInjected=false;console.error('PROMETHEUS AI injection failed',e);}})();", script];
    [webView evaluateJavaScript:wrapped completionHandler:^(id result, NSError *error) {
        if (error) NSLog(@"PROMETHEUS AI: %@", error.localizedDescription);
    }];
}
@end
