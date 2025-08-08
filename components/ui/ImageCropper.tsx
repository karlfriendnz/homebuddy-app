import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { safeImageManipulate, getSaveFormat } from '../../lib/image-utils';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';

interface ImageCropperProps {
  visible: boolean;
  imageUri: string | null;
  onCropComplete: (croppedImageUri: string) => void;
  onCancel: () => void;
  cropShape: 'circle' | 'square' | 'rectangle';
  cropSize?: number; // For circle/square: side/diameter in pixels
  cropAspect?: number; // For rectangle: width/height ratio
  title?: string;
  modalWidth?: number; // Web only: container width (e.g., 800)
  modalHeight?: number; // Web only: container height (e.g., 800)
  overlayScale?: number; // 0-1 scale of overlay vs container, default 0.9
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  visible,
  imageUri,
  onCropComplete,
  onCancel,
  cropShape = 'circle',
  cropSize = 200,
  cropAspect = 1,
  title = 'Crop Image',
  modalWidth = 800,
  modalHeight = 800,
  overlayScale = 0.9,
}) => {
  const [cropImagePosition, setCropImagePosition] = useState({ x: 0, y: 0 });
  const [cropImageScale, setCropImageScale] = useState(1);
  const [isCropDragging, setIsCropDragging] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });
  const [cropContainerSize, setCropContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [cropImageNaturalSize, setCropImageNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isCropping, setIsCropping] = useState(false);

  // Load natural image dimensions when opening cropper
  useEffect(() => {
    if (!imageUri) return;
    Image.getSize(
      imageUri,
      (width: number, height: number) => {
        setCropImageNaturalSize({ width, height });
      },
      () => {
        setCropImageNaturalSize({ width: 0, height: 0 });
      }
    );
  }, [imageUri]);

  // Add mouse event listeners for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (isCropDragging || visible) {
        document.addEventListener('mousemove', handleCropMouseMove);
        document.addEventListener('mouseup', handleCropMouseUp);
        document.body.style.cursor = isCropDragging ? 'grabbing' : 'grab';
      } else {
        document.removeEventListener('mousemove', handleCropMouseMove);
        document.removeEventListener('mouseup', handleCropMouseUp);
        document.body.style.cursor = 'default';
      }
    }

    return () => {
      if (Platform.OS === 'web') {
        document.removeEventListener('mousemove', handleCropMouseMove);
        document.removeEventListener('mouseup', handleCropMouseUp);
        document.body.style.cursor = 'default';
      }
    };
  }, [isCropDragging, visible]);

  const handleCropConfirm = async () => {
    if (!imageUri) return;
    
    setIsCropping(true);
    try {
      // Compute pixel crop rect relative to natural image
      const containerWidth = cropContainerSize?.width || 0;
      const containerHeight = cropContainerSize?.height || 0;
      const imgW = cropImageNaturalSize.width;
      const imgH = cropImageNaturalSize.height;

      if (!containerWidth || !containerHeight || !imgW || !imgH) {
        // Fallback: use original image
        onCropComplete(imageUri);
        return;
      }

      // Fit image in container with contain mode, then apply user scale and pan
      const fitScale = Math.min(containerWidth / imgW, containerHeight / imgH);
      const displayedWidth = imgW * fitScale * cropImageScale;
      const displayedHeight = imgH * fitScale * cropImageScale;
      const centeredLeft = (containerWidth - displayedWidth) / 2;
      const centeredTop = (containerHeight - displayedHeight) / 2;
      const imgLeft = centeredLeft + cropImagePosition.x;
      const imgTop = centeredTop + cropImagePosition.y;

      // Calculate crop area based on shape
      let overlayLeft, overlayTop, overlayWidth, overlayHeight;
      if (cropShape === 'rectangle') {
        // Rectangle overlay centered with aspect ratio
        const targetAspect = Math.max(0.0001, cropAspect);
        let oW = containerWidth * overlayScale;
        let oH = oW / targetAspect;
        if (oH > containerHeight * overlayScale) {
          oH = containerHeight * overlayScale;
          oW = oH * targetAspect;
        }
        overlayWidth = oW;
        overlayHeight = oH;
        overlayLeft = (containerWidth - overlayWidth) / 2;
        overlayTop = (containerHeight - overlayHeight) / 2;
      } else {
        // Circle or Square: fixed size centered
        overlayWidth = cropSize;
        overlayHeight = cropSize;
        overlayLeft = (containerWidth - overlayWidth) / 2;
        overlayTop = (containerHeight - overlayHeight) / 2;
      }

      // Map overlay->image pixels
      const originXFloat = ((overlayLeft - imgLeft) / displayedWidth) * imgW;
      const originYFloat = ((overlayTop - imgTop) / displayedHeight) * imgH;
      const cropWidthFloat = (overlayWidth / displayedWidth) * imgW;
      const cropHeightFloat = (overlayHeight / displayedHeight) * imgH;

      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      const originX = Math.floor(clamp(originXFloat, 0, Math.max(0, imgW - 1)));
      const originY = Math.floor(clamp(originYFloat, 0, Math.max(0, imgH - 1)));
      const width = Math.floor(clamp(cropWidthFloat, 1, imgW - originX));
      const height = Math.floor(clamp(cropHeightFloat, 1, imgH - originY));

      const result = await safeImageManipulate(
        imageUri,
        [
          {
            crop: { originX, originY, width, height },
          },
        ],
        {
          compress: 0.8,
          format: getSaveFormat().JPEG,
        }
      );
      
      onCropComplete(result.uri);
    } catch (error) {
      console.error('Error cropping image:', error);
      // Fallback: use the original image if cropping fails
      onCropComplete(imageUri);
      Alert.alert('Warning', 'Failed to crop image. Using original image instead.');
    } finally {
      setIsCropping(false);
    }
  };

  const handleCropCancel = () => {
    onCancel();
  };

  const handleCropMouseDown = (event: any) => {
    if (Platform.OS === 'web') {
      setIsCropDragging(true);
      setCropDragStart({
        x: event.clientX - cropImagePosition.x,
        y: event.clientY - cropImagePosition.y,
      });
    }
  };

  const handleCropMouseMove = (event: any) => {
    if (Platform.OS === 'web' && isCropDragging) {
      setCropImagePosition({
        x: event.clientX - cropDragStart.x,
        y: event.clientY - cropDragStart.y,
      });
    }
  };

  const handleCropMouseUp = () => {
    if (Platform.OS === 'web') {
      setIsCropDragging(false);
    }
  };

  const handleCropWheel = (event: any) => {
    if (Platform.OS === 'web') {
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(3, cropImageScale + delta));
      setCropImageScale(newScale);
    }
  };

  const getOverlayStyle = (): any => {
    const baseStyle = {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      width: cropShape === 'rectangle' && cropContainerSize
        ? Math.min(
            (cropContainerSize.width || 0) * overlayScale,
            (cropContainerSize.height || 0) * overlayScale * (cropAspect)
          )
        : cropSize,
      height: cropShape === 'rectangle' && cropContainerSize
        ? ((): number => {
            const contW = cropContainerSize.width || 0;
            const contH = cropContainerSize.height || 0;
            let oW = contW * overlayScale;
            let oH = oW / cropAspect!;
            if (oH > contH * overlayScale) {
              oH = contH * overlayScale;
              oW = oH * cropAspect!;
            }
            return oH;
          })()
        : cropSize,
      marginTop: cropShape === 'rectangle' ? undefined : -cropSize / 2,
      marginLeft: cropShape === 'rectangle' ? undefined : -cropSize / 2,
      borderWidth: 2,
      borderColor: colors.primary[500],
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      pointerEvents: 'none' as const,
    };

    if (cropShape === 'circle') {
      return {
        ...baseStyle,
        borderRadius: cropSize / 2,
      };
    } else if (cropShape === 'square') {
      return baseStyle;
    } else {
      // Rectangle: center absolutely via transforms since margin method used fixed sizes
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: [{ translateX: -((baseStyle as any).width as number) / 2 }, { translateY: -((baseStyle as any).height as number) / 2 }],
        borderRadius: undefined,
      } as any;
    }
  };

  const getInstructions = () => {
    if (cropShape === 'circle') {
      return 'Drag to position • Scroll wheel or +/- buttons to zoom • Use Reset to return to original size';
    } else {
      return 'Drag to position • Scroll wheel or +/- buttons to zoom • Use Reset to return to original size';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCropCancel}
    >
      <View style={[
        componentStyles.flex1, 
        { 
          backgroundColor: colors.background, 
          minHeight: 0,
          ...Platform.select({
            web: {
              maxWidth: modalWidth,
              maxHeight: modalHeight,
              alignSelf: 'center',
              width: '100%',
              height: '100%',
            },
          }),
        }
      ]}>
        {/* Header - Fixed position */}
        <View style={[componentStyles.flexRow, componentStyles.itemsCenter, componentStyles.justifyBetween, { 
          paddingHorizontal: spacing[4], 
          paddingVertical: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
          zIndex: 1000,
          minHeight: 60,
        }]}>
          <TouchableOpacity onPress={handleCropCancel} style={{ minWidth: 60 }}>
            <Text style={[componentStyles.text, { color: colors.primary[500] }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[componentStyles.textLg, componentStyles.fontSemibold, { flex: 1, textAlign: 'center' }]}>{title}</Text>
          <TouchableOpacity onPress={handleCropConfirm} disabled={isCropping} style={{ minWidth: 60, alignItems: 'flex-end' }}>
            <Text style={[componentStyles.text, { color: isCropping ? colors.neutral[400] : colors.primary[500] }]}>
              {isCropping ? 'Cropping...' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Zoom Controls */}
        <View style={[componentStyles.flexRow, componentStyles.itemsCenter, componentStyles.justifyCenter, { 
          paddingHorizontal: spacing[4], 
          paddingVertical: spacing[2],
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.neutral[50],
          flexWrap: 'wrap',
          minHeight: 50,
        }]}>
          <Text style={[componentStyles.textSecondary, { marginRight: spacing[3] }]}>Zoom:</Text>
          <TouchableOpacity 
            onPress={() => setCropImageScale(Math.max(0.5, cropImageScale - 0.2))}
            style={[{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: colors.primary[500],
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing[2]
            }]}
          >
            <Text style={[componentStyles.text, { color: colors.text.inverse, fontSize: 16 }]}>-</Text>
          </TouchableOpacity>
          <Text style={[componentStyles.text, { marginHorizontal: spacing[2] }]}>
            {Math.round(cropImageScale * 100)}%
          </Text>
          <TouchableOpacity 
            onPress={() => setCropImageScale(Math.min(3, cropImageScale + 0.2))}
            style={[{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: colors.primary[500],
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: spacing[2]
            }]}
          >
            <Text style={[componentStyles.text, { color: colors.text.inverse, fontSize: 16 }]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setCropImageScale(1)}
            style={[{ 
              marginLeft: spacing[3],
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[1],
              borderRadius: borderRadius.sm,
              backgroundColor: colors.neutral[200],
            }]}
          >
            <Text style={[componentStyles.text, componentStyles.textSecondary]}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Image Cropping Area */}
        <View style={[componentStyles.flex1, { padding: spacing[4], minHeight: 0 }]}>
          {imageUri && (
            <View style={[componentStyles.flex1, { 
              backgroundColor: colors.neutral[100],
              borderRadius: borderRadius.lg,
              overflow: 'hidden',
              position: 'relative',
              minHeight: 0,
            }]}>
              <View
                style={{
                  width: '100%',
                  height: '100%',
                }}
                {...(Platform.OS === 'web' ? { 
                  onMouseDown: handleCropMouseDown,
                  onWheel: handleCropWheel
                } : {})}
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  setCropContainerSize({ width, height });
                }}
              >
                <Animated.View
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: [
                      { translateX: cropImagePosition.x },
                      { translateY: cropImagePosition.y },
                      { scale: cropImageScale },
                    ],
                  }}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      width: '100%',
                      height: '100%',
                      resizeMode: 'contain',
                    }}
                  />
                </Animated.View>
              </View>
              
              {/* Crop Overlay */}
              <View style={getOverlayStyle()}>
                <View style={{
                  position: 'absolute',
                  top: -1,
                  left: -1,
                  right: -1,
                  bottom: -1,
                  borderRadius: cropShape === 'circle' ? cropSize / 2 : undefined,
                  borderWidth: 1,
                  borderColor: colors.text.inverse,
                  backgroundColor: 'transparent',
                }} />
              </View>

              {/* Instructions */}
              <View style={{
                position: 'absolute',
                bottom: spacing[4],
                left: spacing[4],
                right: spacing[4],
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: borderRadius.md,
                padding: spacing[3],
                pointerEvents: 'none',
                maxWidth: '100%',
              }}>
                <Text style={{
                  color: colors.text.inverse,
                  fontSize: 14,
                  textAlign: 'center',
                  fontWeight: '500',
                }}>
                  {getInstructions()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Fallback Done Button - Always visible at bottom */}
        <View style={{
          position: 'absolute',
          bottom: spacing[4],
          left: spacing[4],
          right: spacing[4],
          zIndex: 1001,
        }}>
          <TouchableOpacity 
            onPress={handleCropConfirm} 
            disabled={isCropping}
            style={{
              backgroundColor: colors.primary[500],
              paddingVertical: spacing[3],
              paddingHorizontal: spacing[4],
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text style={{
              color: colors.text.inverse,
              fontSize: 16,
              fontWeight: '600',
            }}>
              {isCropping ? 'Cropping...' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
