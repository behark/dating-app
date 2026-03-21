import { memo } from 'react';
import { Image, Platform } from 'react-native';

export const UniversalImage = memo(({ source, style, resizeMode = 'cover', ...props }) => {
  const imageSource = typeof source === 'string' ? { uri: source } : source;

  // Use cache policy for remote images on native
  const enhancedSource =
    imageSource?.uri && Platform.OS !== 'web'
      ? { ...imageSource, cache: 'force-cache' }
      : imageSource;

  return <Image source={enhancedSource} style={style} resizeMode={resizeMode} {...props} />;
});

UniversalImage.displayName = 'UniversalImage';

export default UniversalImage;
