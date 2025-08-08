import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  
  // Add state to track individual field values
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const lastValueRef = useRef<string | undefined>(value);

  // Reset or initialize internal selections when value changes (only when it actually changes)
  useEffect(() => {
    if (value === lastValueRef.current) return;

    if (!value) {
      // Parent cleared the value explicitly → reset internal selections
      setSelectedDay(null);
      setSelectedMonth(null);
      setSelectedYear(null);
      lastValueRef.current = value;
      return;
    }

    // Initialize from value if we don't have any selection yet
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      setSelectedDay(parsed.getDate());
      setSelectedMonth(parsed.getMonth() + 1);
      setSelectedYear(parsed.getFullYear());
    }
    lastValueRef.current = value;
  }, [value]);
  
  const days = generateDays();
  const months = generateMonths();
  const years = generateYears();
  
  // Parse current value
  const currentDate = value ? new Date(value) : null;
  const currentDay = currentDate ? currentDate.getDate() : null;
  const currentMonth = currentDate ? currentDate.getMonth() + 1 : null;
  const currentYear = currentDate ? currentDate.getFullYear() : null;
  
  // Initialize selected values from current value or existing selections
  const displayDay = selectedDay !== null ? selectedDay : currentDay;
  const displayMonth = selectedMonth !== null ? selectedMonth : currentMonth;
  const displayYear = selectedYear !== null ? selectedYear : currentYear;
  
  const handleDateChange = (day: number | null, month: number | null, year: number | null) => {
    // Update only the specific field that changed
    if (day !== null) {
      setSelectedDay(day);
    }
    if (month !== null) {
      setSelectedMonth(month);
    }
    if (year !== null) {
      setSelectedYear(year);
    }
    
    // Calculate final values using updated state
    const finalDay = day !== null ? day : selectedDay;
    const finalMonth = month !== null ? month : selectedMonth;
    const finalYear = year !== null ? year : selectedYear;
    
    // If any required field is missing, don't update the date
    if (finalDay === null || finalMonth === null || finalYear === null) {
      return;
    }
    
    // Format YYYY-MM-DD without timezone conversion
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateString = `${finalYear}-${pad(finalMonth)}-${pad(finalDay)}`;
    console.log('Date string to be passed to onChange:', dateString);
    console.log('=== End handleDateChange ===');
    onChange(dateString);
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
        <Text style={[componentStyles.globalLabel]}>
          {label} {required && '*'}
        </Text>
      )}
      
      {Platform.OS === 'web' ? (
        // Web: Use dropdown selects
        <View style={[componentStyles.flexRow, { gap: spacing[2] }]}>
          {/* Day Dropdown */}
          <View style={[
            componentStyles.flex1,
            { borderWidth: 1 },
            { borderColor: error ? colors.error[500] : colors.border },
            { borderRadius: borderRadius.md },
            { backgroundColor: colors.background },
            { position: 'relative' },
            disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
          ]}>
            <select
              value={displayDay || ''}
              onChange={(e) => {
                const day = parseInt(e.target.value);
                handleDateChange(day, null, null);
              }}
              disabled={disabled}
              style={{
                width: '100%',
                padding: `${spacing[3]}px ${spacing[6]}px ${spacing[3]}px ${spacing[4]}px`,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                fontSize: 16,
                color: currentDay ? colors.text.primary : colors.text.secondary,
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderRadius: borderRadius.md,
              }}
            >
              <option value="">Day</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <View pointerEvents="none" style={{ position: 'absolute', right: spacing[3], top: 0, bottom: 0, justifyContent: 'center' }}>
              <Ionicons name="chevron-down" size={16} color={disabled ? colors.neutral[400] : colors.neutral[500]} />
            </View>
          </View>

          {/* Month Dropdown */}
          <View style={[
            componentStyles.flex1,
            { borderWidth: 1 },
            { borderColor: error ? colors.error[500] : colors.border },
            { borderRadius: borderRadius.md },
            { backgroundColor: colors.background },
            { position: 'relative' },
            disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
          ]}>
            <select
              value={displayMonth || ''}
              onChange={(e) => {
                const month = parseInt(e.target.value);
                handleDateChange(null, month, null);
              }}
              disabled={disabled}
              style={{
                width: '100%',
                padding: `${spacing[3]}px ${spacing[6]}px ${spacing[3]}px ${spacing[4]}px`,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                fontSize: 16,
                color: currentMonth ? colors.text.primary : colors.text.secondary,
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderRadius: borderRadius.md,
              }}
            >
              <option value="">Month</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <View pointerEvents="none" style={{ position: 'absolute', right: spacing[3], top: 0, bottom: 0, justifyContent: 'center' }}>
              <Ionicons name="chevron-down" size={16} color={disabled ? colors.neutral[400] : colors.neutral[500]} />
            </View>
          </View>

          {/* Year Dropdown */}
          <View style={[
            componentStyles.flex1,
            { borderWidth: 1 },
            { borderColor: error ? colors.error[500] : colors.border },
            { borderRadius: borderRadius.md },
            { backgroundColor: colors.background },
            { position: 'relative' },
            disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
          ]}>
            <select
              value={displayYear || ''}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                handleDateChange(null, null, year);
              }}
              disabled={disabled}
              style={{
                width: '100%',
                padding: `${spacing[3]}px ${spacing[6]}px ${spacing[3]}px ${spacing[4]}px`,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                fontSize: 16,
                color: currentYear ? colors.text.primary : colors.text.secondary,
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderRadius: borderRadius.md,
              }}
            >
              <option value="">Year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <View pointerEvents="none" style={{ position: 'absolute', right: spacing[3], top: 0, bottom: 0, justifyContent: 'center' }}>
              <Ionicons name="chevron-down" size={16} color={disabled ? colors.neutral[400] : colors.neutral[500]} />
            </View>
          </View>
        </View>
      ) : (
        // Mobile: Use touchable buttons with modals
        <View style={[componentStyles.flexRow, { gap: spacing[2] }]}>
          {/* Day Picker */}
          <TouchableOpacity
            onPress={() => !disabled && setShowDayPicker(true)}
            style={[
              componentStyles.flex1,
              { borderWidth: 1 },
              { borderColor: error ? colors.error[500] : colors.border },
              { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
              { borderRadius: borderRadius.md },
              { justifyContent: 'center' },
              { backgroundColor: colors.background },
              disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
            ]}
          >
            <Text style={[
              componentStyles.text,
              { color: displayDay ? colors.text.primary : colors.text.secondary }
            ]}>
              {displayDay || 'Day'}
            </Text>
          </TouchableOpacity>

          {/* Month Picker */}
          <TouchableOpacity
            onPress={() => !disabled && setShowMonthPicker(true)}
            style={[
              componentStyles.flex1,
              { borderWidth: 1 },
              { borderColor: error ? colors.error[500] : colors.border },
              { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
              { borderRadius: borderRadius.md },
              { justifyContent: 'center' },
              { backgroundColor: colors.background },
              disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
            ]}
          >
            <Text style={[
              componentStyles.text,
              { color: displayMonth ? colors.text.primary : colors.text.secondary }
            ]}>
              {displayMonth ? months.find(m => m.value === displayMonth)?.label : 'Month'}
            </Text>
          </TouchableOpacity>

          {/* Year Picker */}
          <TouchableOpacity
            onPress={() => !disabled && setShowYearPicker(true)}
            style={[
              componentStyles.flex1,
              { borderWidth: 1 },
              { borderColor: error ? colors.error[500] : colors.border },
              { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
              { borderRadius: borderRadius.md },
              { justifyContent: 'center' },
              { backgroundColor: colors.background },
              disabled && { backgroundColor: colors.neutral[100], opacity: 0.6 }
            ]}
          >
            <Text style={[
              componentStyles.text,
              { color: displayYear ? colors.text.primary : colors.text.secondary }
            ]}>
              {displayYear || 'Year'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <Text style={[{ color: colors.error[500], marginTop: spacing[1] }]}>
          {error}
        </Text>
      )}

      {/* Mobile Modals Only */}
      {Platform.OS !== 'web' && (
        <>
          {/* Day Picker Modal */}
          {renderPicker(
            showDayPicker,
            () => setShowDayPicker(false),
            'Select Day',
            days,
            displayDay,
            (day) => handleDateChange(day, null, null)
          )}

          {/* Month Picker Modal */}
          {renderPicker(
            showMonthPicker,
            () => setShowMonthPicker(false),
            'Select Month',
            months,
            displayMonth,
            (month) => handleDateChange(null, month, null)
          )}

          {/* Year Picker Modal */}
          {renderPicker(
            showYearPicker,
            () => setShowYearPicker(false),
            'Select Year',
            years,
            displayYear,
            (year) => handleDateChange(null, null, year)
          )}
        </>
      )}
    </View>
  );
}

 