import React, { useState } from 'react';
import { Platform, View, StyleSheet, PanResponder, Animated, Text } from 'react-native';
import { Colors } from '../../constants/colors';

const RangeSlider = ({
  min = 0,
  max = 100,
  step = 1,
  minValue,
  maxValue,
  onChangeMin,
  onChangeMax,
  label,
  color = Colors.primary,
}) => {
  const trackWidth = 280;
  const thumbSize = 24;
  const trackHeight = 8;

  // Calculate pixel positions from values
  const minPercentage = ((minValue - min) / (max - min)) * 100;
  const maxPercentage = ((maxValue - min) / (max - min)) * 100;

  const handleMinChange = (newValue) => {
    if (newValue <= maxValue - step) {
      onChangeMin(newValue);
    }
  };

  const handleMaxChange = (newValue) => {
    if (newValue >= minValue + step) {
      onChangeMax(newValue);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.sliderContainer}>
        {/* Track Background */}
        <View style={[styles.track, { backgroundColor: Colors.border.gray }]} />

        {/* Active Range Track */}
        <View
          style={[
            styles.track,
            styles.activeTrack,
            {
              marginLeft: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
              backgroundColor: color,
            },
          ]}
        />

        {/* Min Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${minPercentage}%`,
              backgroundColor: color,
              ...Platform.select({
                web: { pointerEvents: 'box-none' },
              }),
            },
          ]}
          {...Platform.select({
            native: { pointerEvents: 'box-none' },
          })}
        >
          <Text style={styles.thumbLabel}>{Math.round(minValue)}</Text>
        </View>

        {/* Max Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${maxPercentage}%`,
              backgroundColor: color,
              ...Platform.select({
                web: { pointerEvents: 'box-none' },
              }),
            },
          ]}
          {...Platform.select({
            native: { pointerEvents: 'box-none' },
          })}
        >
          <Text style={styles.thumbLabel}>{Math.round(maxValue)}</Text>
        </View>

        {/* Min Input Area */}
        <View
          style={[
            styles.inputArea,
            {
              left: `${minPercentage}%`,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderMove={(evt) => {
            const newX = evt.nativeEvent.locationX;
            const percentage = Math.max(0, Math.min(newX / trackWidth, 1));
            const newValue = Math.round((percentage * (max - min) + min) / step) * step;
            handleMinChange(newValue);
          }}
        />

        {/* Max Input Area */}
        <View
          style={[
            styles.inputArea,
            {
              left: `${maxPercentage}%`,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderMove={(evt) => {
            const newX = evt.nativeEvent.locationX;
            const percentage = Math.max(0, Math.min(newX / trackWidth, 1));
            const newValue = Math.round((percentage * (max - min) + min) / step) * step;
            handleMaxChange(newValue);
          }}
        />
      </View>

      <View style={styles.valuesContainer}>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Min</Text>
          <Text style={styles.value}>{Math.round(minValue)}</Text>
        </View>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Max</Text>
          <Text style={styles.value}>{Math.round(maxValue)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 12,
  },
  sliderContainer: {
    width: '100%',
    height: 70,
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
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.background.white,
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
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  valueBox: {
    flex: 1,
    backgroundColor: Colors.background.lightest,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
});

export default RangeSlider;
