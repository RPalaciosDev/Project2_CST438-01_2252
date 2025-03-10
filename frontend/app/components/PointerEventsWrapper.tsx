import React from 'react';
import { View, ViewProps } from 'react-native';

interface PointerEventsWrapperProps extends ViewProps {
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  children: React.ReactNode;
}

/**
 * Wrapper component to handle the deprecated pointerEvents prop
 * Use this component instead of directly applying pointerEvents as a prop
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
        // Apply pointerEvents as a style property instead of a direct prop
        pointerEvents ? { pointerEvents } : undefined,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}; 