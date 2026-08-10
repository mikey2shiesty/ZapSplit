/**
 * Config plugin: force modular headers for GoogleUtilities and RecaptchaInterop.
 *
 * Why: GoogleSignIn pulls in the Swift pod `AppCheckCore`, which depends on
 * `GoogleUtilities` and `RecaptchaInterop`. Those two don't define modules, so
 * CocoaPods (on EAS's stricter build image) refuses to integrate AppCheckCore
 * as a static library and `pod install` fails with:
 *   "The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and
 *    `RecaptchaInterop`, which do not define modules."
 * The fix CocoaPods itself recommends is `:modular_headers => true` for those
 * pods. Expo regenerates the Podfile on every build (ios/ is gitignored), so we
 * inject the lines here via a dangerous mod instead of editing the Podfile.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withGoogleModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (!contents.includes(':modular_headers => true')) {
        const inject =
          "  pod 'GoogleUtilities', :modular_headers => true\n" +
          "  pod 'RecaptchaInterop', :modular_headers => true\n";
        // Insert immediately after the main `target '...' do` line.
        contents = contents.replace(/(target\s+'[^']+'\s+do\n)/, `$1${inject}`);
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
};
