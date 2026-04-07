// Android 15 Edge-to-Edge Compatibility Fix
// This plugin addresses deprecated API warnings for Android 15

const { withAndroidManifest, withGradleProperties } = require('@expo/config-plugins');

const withAndroid15EdgeToEdgeFix = (config) => {
  // Fix AndroidManifest for proper edge-to-edge handling
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    if (androidManifest.manifest && androidManifest.manifest.application) {
      const mainActivity = androidManifest.manifest.application[0].activity?.find(
        activity => activity.$['android:name'] === '.MainActivity'
      );

      if (mainActivity) {
        // Apply proper window flags for edge-to-edge
        mainActivity.$['android:windowSoftInputMode'] = 'adjustResize';
        mainActivity.$['android:windowLayoutInDisplayCutoutMode'] = 'shortEdges';
      }
    }

    return config;
  });

  // Update gradle.properties to handle Android 15 compatibility
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults || [];

    // Add Android 15 compatibility properties
    const android15Props = [
      {
        type: 'property',
        key: 'android.enableJetifier',
        value: 'true'
      },
      {
        type: 'property',
        key: 'android.useAndroidX',
        value: 'true'
      },
      {
        type: 'property',
        key: 'android.enableR8.fullMode',
        value: 'true'
      }
    ];

    // Remove existing properties and add new ones
    config.modResults = config.modResults.filter(prop =>
      !android15Props.some(newProp => newProp.key === prop.key)
    );
    config.modResults.push(...android15Props);

    return config;
  });

  return config;
};

module.exports = withAndroid15EdgeToEdgeFix;
