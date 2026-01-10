import React from 'react';
import { Image, Platform } from 'react-native';

export const UniversalImage = ({ source, style, resizeMode = 'cover', ...props }) => {
  const imageSource = typeof source === 'string' ? { uri: source } : source;

  return (
    <Image
      source={imageSource}
      style={style}
      resizeMode={resizeMode}
      {...props}
    />
  );
};

export default UniversalImage;
