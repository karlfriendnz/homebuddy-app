import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ViewStyle } from 'react-native';
import { componentStyles, colors, borderRadius as globalRadius } from '../../styles/global';

interface BannerImageProps {
  imageUrl?: string | null;
  height?: number;
  maxWidth?: number;
  radius?: number;
  onPress?: () => void;
  placeholder?: React.ReactNode;
  containerStyle?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Consistent banner image with rounded corners and fixed height.
 * Used for household headers and similar hero images.
 */
export default function BannerImage({
  imageUrl,
  height = 160,
  maxWidth = 800,
  radius = globalRadius.md,
  onPress,
  placeholder,
  containerStyle,
  children,
}: BannerImageProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress as any}
      activeOpacity={onPress ? 0.8 : 1}
      style={[
        {
          width: '100%',
          maxWidth,
          alignSelf: 'center',
          height,
          borderRadius: radius,
          overflow: 'hidden',
        },
        containerStyle,
      ]}
    >
      {imageUrl ? (
        <ImageBackground
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={{ flex: 1 }}
          imageStyle={{ borderRadius: radius }}
        >
          {children}
        </ImageBackground>
      ) : (
        (placeholder as React.ReactElement) || (
          <View style={[componentStyles.itemsCenter, { flex: 1, justifyContent: 'center', backgroundColor: colors.background }] }>
            <Text style={componentStyles.textSecondary}>No image</Text>
          </View>
        )
      )}
    </Wrapper>
  );
}


