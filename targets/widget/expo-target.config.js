/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'widget',
  displayName: 'parallax',
  // Appends to the app's bundle id -> com.yashgadodia.parallax.widget
  bundleIdentifier: '.widget',
  // iOS 17+ for containerBackground(for: .widget)
  deploymentTarget: '17.0',
  colors: {
    // $accent / $widgetBackground are special asset names the plugin generates.
    // Values mirror src/design/tokens.ts (p2Deep / dawn gradient start).
    $accent: '#7064E6',
    $widgetBackground: '#FCEFF0',
  },
  entitlements: {
    // Share the App Group with the main app (source of truth: app.json ios.entitlements).
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
