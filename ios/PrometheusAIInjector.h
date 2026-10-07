#import <WebKit/WebKit.h>

NS_ASSUME_NONNULL_BEGIN
@interface PrometheusAIInjector : NSObject
+ (void)injectIntoWebView:(WKWebView *)webView;
@end
NS_ASSUME_NONNULL_END
