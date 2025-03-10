import React from 'react';
import { View, ViewProps } from 'react-native';

interface PointerEventsWrapperProps extends ViewProps {
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  children: React.ReactNode;
}

/**
 * Wrapper component to handle the deprecated pointerEvents prop
 * !NOTE: Use this component instead of directly applying pointerEvents as a prop so build runs smoothly
 */
export const PointerEventsWrapper: React.FC<PointerEventsWrapperProps> = ({
  pointerEvents,
  style,
  children,
  ...props
}) => {
  return (
    <View
      style={[
        style,
        pointerEvents ? { pointerEvents } : undefined,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}; 