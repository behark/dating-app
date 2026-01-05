import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

const SingleSlider = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  label,
  unit = '',
  color = '#667eea',
}) => {
  const trackWidth = 280;
  const thumbSize = 24;

  // Calculate pixel position from value
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (newValue) => {
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>
            {Math.round(value)} {unit}
          </Text>
        </View>
      )}

      <View style={styles.sliderContainer}>
        {/* Track Background */}
        <View style={[styles.track, { backgroundColor: '#e9ecef' }]} />

        {/* Active Range Track */}
        <View
          style={[
            styles.track,
            styles.activeTrack,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
          pointerEvents="box-none"
        >
          <Text style={styles.thumbLabel}>{Math.round(value)}</Text>
        </View>

        {/* Input Area */}
        <View
          style={[
            styles.inputArea,
            {
              left: `${percentage}%`,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderMove={(evt) => {
            const newX = evt.nativeEvent.locationX;
            const percentage = Math.max(0, Math.min(newX / trackWidth, 1));
            const newValue = Math.round((percentage * (max - min) + min) / step) * step;
            handleChange(newValue);
          }}
        />
      </View>

      <View style={styles.labelsContainer}>
        <Text style={styles.minLabel}>
          {min}
          {unit}
        </Text>
        <Text style={styles.maxLabel}>
          {max}
          {unit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  sliderContainer: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'stretch',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    height: 8,
    left: 20,
    right: 20,
    top: 20,
    borderRadius: 4,
  },
  activeTrack: {
    height: 8,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 12,
    marginLeft: -12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  inputArea: {
    position: 'absolute',
    width: 48,
    height: 48,
    top: 0,
    marginLeft: -24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  minLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  maxLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});

export default SingleSlider;
