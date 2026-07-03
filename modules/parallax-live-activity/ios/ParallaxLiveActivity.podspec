Pod::Spec.new do |s|
  s.name           = 'ParallaxLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'ActivityKit bridge for the parallax streak-countdown Live Activity'
  s.description    = 'Local Expo module: start/update/end the streak-at-risk Live Activity from JS.'
  s.author         = 'parallax'
  s.homepage       = 'https://github.com/yash-gadodia/parallax'
  s.license        = 'MIT'
  # Matches the Expo SDK 56 baseline (see expo-haptics et al).
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/yash-gadodia/parallax.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
