import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export default function DatePicker({ 
  label, 
  value, 
  onChange, 
  placeholder = "Select date", 
  error, 
  disabled = false 
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  
  // Format date for display
  const displayValue = value ? new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  // Handle date change for mobile
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: spacing[4] }}>
        {label && (
          <Text style={[componentStyles.fontMedium, { color: colors.text.secondary, marginBottom: spacing[1] }]}>
            {label}
          </Text>
        )}
        
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: spacing[3],
            borderWidth: 1,
            borderColor: error ? colors.error[500] : colors.border,
            borderRadius: borderRadius.md,
            fontSize: 16,
            backgroundColor: disabled ? colors.neutral[100] : 'white',
            color: colors.text.primary,
          }}
        />
        
        {error && (
          <Text style={[{ color: colors.error[500], marginTop: spacing[1] }]}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  // Mobile implementation
  return (
    <View style={{ marginBottom: spacing[4] }}>
      {label && (
        <Text style={[componentStyles.fontMedium, { color: colors.text.secondary, marginBottom: spacing[1] }]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={() => !disabled && setShowPicker(true)}
        style={[
          { borderWidth: 1 },
          { borderColor: error ? colors.error[500] : colors.border },
          { padding: spacing[3] },
          { borderRadius: borderRadius.md },
          componentStyles.text,
          disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
        ]}
      >
        <Text style={[
          componentStyles.text,
          { color: displayValue ? colors.text.primary : colors.text.secondary }
        ]}>
          {displayValue || placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <View style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: spacing[4]
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[4]
              }}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={[componentStyles.text, { color: colors.text.secondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <Text style={[componentStyles.fontMedium, { color: colors.text.primary }]}>
                  Select Date
                </Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={[componentStyles.text, { color: colors.primary[500] }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          </View>
        </Modal>
      )}

      {error && (
        <Text style={[{ color: colors.error[500], marginTop: spacing[1] }]}>
          {error}
        </Text>
      )}
    </View>
  );
} 