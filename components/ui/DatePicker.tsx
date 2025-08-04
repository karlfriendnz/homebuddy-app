import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';



interface DateOfBirthPickerProps {
  label?: string;
  value?: string;
  onChange: (date: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

// Generate arrays for days, months, and years
const generateDays = () => Array.from({ length: 31 }, (_, i) => i + 1);
const generateMonths = () => [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 100 }, (_, i) => currentYear - i);
};

export function DateOfBirthPicker({ 
  label, 
  value, 
  onChange, 
  error, 
  disabled = false,
  required = false 
}: DateOfBirthPickerProps) {
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const days = generateDays();
  const months = generateMonths();
  const years = generateYears();
  
  // Parse current value
  const currentDate = value ? new Date(value) : null;
  const currentDay = currentDate ? currentDate.getDate() : null;
  const currentMonth = currentDate ? currentDate.getMonth() + 1 : null;
  const currentYear = currentDate ? currentDate.getFullYear() : null;
  
  const handleDateChange = (day: number, month: number, year: number) => {
    const date = new Date(year, month - 1, day);
    onChange(date.toISOString().split('T')[0]);
  };
  
  const renderPicker = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: Array<{ value: number; label?: string } | number>,
    selectedValue: number | null,
    onSelect: (value: number) => void
  ) => (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
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
          padding: spacing[4],
          maxHeight: '50%'
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[4]
          }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[componentStyles.text, { color: colors.text.secondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[componentStyles.fontMedium, { color: colors.text.primary }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[componentStyles.text, { color: colors.primary[500] }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option, index) => {
              const value = typeof option === 'number' ? option : option.value;
              const label = typeof option === 'number' ? option.toString() : (option.label || option.value.toString());
              const isSelected = selectedValue === value;
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    onSelect(value);
                    onClose();
                  }}
                  style={[
                    { padding: spacing[3] },
                    { borderRadius: borderRadius.md },
                    isSelected && { backgroundColor: colors.primary[100] }
                  ]}
                >
                  <Text style={[
                    componentStyles.text,
                    isSelected 
                      ? { color: colors.primary[500], fontWeight: '600' }
                      : { color: colors.text.primary }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {label && (
        <Text style={[componentStyles.fontMedium, { color: colors.text.secondary, marginBottom: spacing[1] }]}>
          {label} {required && '*'}
        </Text>
      )}
      
      <View style={[componentStyles.flexRow, { gap: spacing[2] }]}>
        {/* Day Picker */}
        <TouchableOpacity
          onPress={() => !disabled && setShowDayPicker(true)}
          style={[
            componentStyles.flex1,
            { borderWidth: 1 },
            { borderColor: error ? colors.error[500] : colors.border },
            { padding: spacing[3] },
            { borderRadius: borderRadius.md },
            disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
          ]}
        >
          <Text style={[
            componentStyles.text,
            { color: currentDay ? colors.text.primary : colors.text.secondary }
          ]}>
            {currentDay || 'Day'}
          </Text>
        </TouchableOpacity>

        {/* Month Picker */}
        <TouchableOpacity
          onPress={() => !disabled && setShowMonthPicker(true)}
          style={[
            componentStyles.flex1,
            { borderWidth: 1 },
            { borderColor: error ? colors.error[500] : colors.border },
            { padding: spacing[3] },
            { borderRadius: borderRadius.md },
            disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
          ]}
        >
          <Text style={[
            componentStyles.text,
            { color: currentMonth ? colors.text.primary : colors.text.secondary }
          ]}>
            {currentMonth ? months.find(m => m.value === currentMonth)?.label : 'Month'}
          </Text>
        </TouchableOpacity>

        {/* Year Picker */}
        <TouchableOpacity
          onPress={() => !disabled && setShowYearPicker(true)}
          style={[
            componentStyles.flex1,
            { borderWidth: 1 },
            { borderColor: error ? colors.error[500] : colors.border },
            { padding: spacing[3] },
            { borderRadius: borderRadius.md },
            disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
          ]}
        >
          <Text style={[
            componentStyles.text,
            { color: currentYear ? colors.text.primary : colors.text.secondary }
          ]}>
            {currentYear || 'Year'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={[{ color: colors.error[500], marginTop: spacing[1] }]}>
          {error}
        </Text>
      )}

      {/* Day Picker Modal */}
      {renderPicker(
        showDayPicker,
        () => setShowDayPicker(false),
        'Select Day',
        days,
        currentDay,
        (day) => handleDateChange(day, currentMonth || 1, currentYear || new Date().getFullYear())
      )}

      {/* Month Picker Modal */}
      {renderPicker(
        showMonthPicker,
        () => setShowMonthPicker(false),
        'Select Month',
        months,
        currentMonth,
        (month) => handleDateChange(currentDay || 1, month, currentYear || new Date().getFullYear())
      )}

      {/* Year Picker Modal */}
      {renderPicker(
        showYearPicker,
        () => setShowYearPicker(false),
        'Select Year',
        years,
        currentYear,
        (year) => handleDateChange(currentDay || 1, currentMonth || 1, year)
      )}
    </View>
  );
}

 