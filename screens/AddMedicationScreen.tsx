import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ThemeContext } from '../context/ThemeContext';
import {
  addMedication,
  getMedicationById,
  updateMedication,
  deleteMedication
} from '../utils/storageUtils';
import { scheduleMedicationReminder, showToast } from '../utils/toastUtils';

export default function AddMedicationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const medicationId = route.params?.medicationId;
  const isEditing = !!medicationId;

  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState(new Date());
  const [times, setTimes] = useState([new Date()]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#5E72E4');
  const [reminder, setReminder] = useState(true);
  
  // UI state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  // Available colors
  const colors = [
    '#5E72E4', // Blue
    '#11CDEF', // Cyan
    '#2DCE89', // Green
    '#FB6340', // Orange
    '#F5365C', // Red
    '#8965E0', // Purple
    '#FFD600', // Yellow
  ];

  // Load medication data if editing
  useEffect(() => {
    if (isEditing) {
      loadMedicationData();
    }
  }, [isEditing, medicationId]);

  const loadMedicationData = async () => {
    try {
      const medication = await getMedicationById(medicationId);
      if (medication) {
        setName(medication.name);
        setDosage(medication.dosage);
        setFrequency(medication.frequency || 'daily');
        
        if (medication.time) {
          const [hours, minutes] = medication.time.split(':').map(Number);
          const timeDate = new Date();
          timeDate.setHours(hours, minutes, 0, 0);
          setTime(timeDate);
        }
        
        if (medication.times && medication.times.length > 0) {
          const timeObjects = medication.times.map(timeStr => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const timeDate = new Date();
            timeDate.setHours(hours, minutes, 0, 0);
            return timeDate;
          });
          setTimes(timeObjects);
        }
        
        setStartDate(new Date(medication.startDate));
        
        if (medication.endDate) {
          setEndDate(new Date(medication.endDate));
        }
        
        setNotes(medication.notes || '');
        setColor(medication.color || '#5E72E4');
        setReminder(medication.reminder !== undefined ? medication.reminder : true);
      }
    } catch (error) {
      console.error('Error loading medication data:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Medication name is required';
    }
    
    if (!dosage.trim()) {
      newErrors.dosage = 'Dosage is required';
    }
    
    if (frequency === 'multiple' && times.length === 0) {
      newErrors.times = 'At least one time must be added';
    }
    
    if (endDate && startDate > endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      const medicationData = {
        name,
        dosage,
        frequency,
        time: format(time, 'HH:mm'),
        times: times.map(t => format(t, 'HH:mm')),
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        notes,
        color,
        reminder,
      };
      
      if (isEditing) {
        await updateMedication(medicationId, medicationData);
        showToast('Medication updated successfully');
      } else {
        const newMedicationId = await addMedication(medicationData);
        
        // Schedule reminder notification if enabled
        if (reminder) {
          if (frequency === 'daily') {
            await scheduleMedicationReminder(
              newMedicationId,
              name,
              dosage,
              time,
              true
            );
          } else if (frequency === 'multiple') {
            for (const t of times) {
              await scheduleMedicationReminder(
                newMedicationId,
                name,
                dosage,
                t,
                true
              );
            }
          }
        }
        
        showToast('Medication added successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving medication:', error);
      showToast('Failed to save medication');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMedication(medicationId);
      showToast('Medication deleted');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting medication:', error);
      showToast('Failed to delete medication');
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      if (frequency === 'daily') {
        setTime(selectedTime);
      } else if (frequency === 'multiple') {
        const newTimes = [...times];
        newTimes[currentTimeIndex] = selectedTime;
        setTimes(newTimes);
      }
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const addTime = () => {
    const newTime = new Date();
    newTime.setHours(12, 0, 0, 0);
    setTimes([...times, newTime]);
  };

  const removeTime = (index) => {
    const newTimes = times.filter((_, i) => i !== index);
    setTimes(newTimes);
  };

  const clearEndDate = () => {
    setEndDate(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Medication' : 'Add Medication'}
          </Text>
          {isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Ionicons name="trash-outline" size={24} color={theme.errorColor} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Medication Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Medication Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Enter medication name"
                placeholderTextColor={theme.textSecondaryColor}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Dosage</Text>
              <TextInput
                style={[styles.input, errors.dosage && styles.inputError]}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g., 50mg - 1 tablet"
                placeholderTextColor={theme.textSecondaryColor}
              />
              {errors.dosage && <Text style={styles.errorText}>{errors.dosage}</Text>}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Color</Text>
              <TouchableOpacity
                style={[styles.colorButton, { backgroundColor: color }]}
                onPress={() => setShowColorPicker(true)}
              >
                <Text style={styles.colorButtonText}>Select Color</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.frequencyContainer}>
                <TouchableOpacity
                  style={[
                    styles.frequencyOption,
                    frequency === 'daily' && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setFrequency('daily')}
                >
                  <Text
                    style={[
                      styles.frequencyOptionText,
                      frequency === 'daily' && styles.frequencyOptionTextSelected,
                    ]}
                  >
                    Daily
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.frequencyOption,
                    frequency === 'multiple' && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setFrequency('multiple')}
                >
                  <Text
                    style={[
                      styles.frequencyOptionText,
                      frequency === 'multiple' && styles.frequencyOptionTextSelected,
                    ]}
                  >
                    Multiple Times
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.frequencyOption,
                    frequency === 'custom' && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setFrequency('custom')}
                >
                  <Text
                    style={[
                      styles.frequencyOptionText,
                      frequency === 'custom' && styles.frequencyOptionTextSelected,
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {frequency === 'daily' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.textSecondaryColor} />
                  <Text style={styles.timeButtonText}>
                    {format(time, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {frequency === 'multiple' && (
              <View style={styles.inputContainer}>
                <View style={styles.timesHeaderContainer}>
                  <Text style={styles.inputLabel}>Times</Text>
                  <TouchableOpacity
                    style={styles.addTimeButton}
                    onPress={addTime}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={theme.accentColor} />
                    <Text style={styles.addTimeText}>Add Time</Text>
                  </TouchableOpacity>
                </View>
                
                {errors.times && <Text style={styles.errorText}>{errors.times}</Text>}
                
                {times.map((t, index) => (
                  <View key={index} style={styles.timeItem}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        setCurrentTimeIndex(index);
                        setShowTimePicker(true);
                      }}
                    >
                      <Ionicons name="time-outline" size={20} color={theme.textSecondaryColor} />
                      <Text style={styles.timeButtonText}>
                        {format(t, 'h:mm a')}
                      </Text>
                    </TouchableOpacity>
                    
                    {times.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeTimeButton}
                        onPress={() => removeTime(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={theme.errorColor} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
            
            {frequency === 'custom' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Custom Schedule Description</Text>
                <TextInput
                  style={styles.input}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g., Every Monday and Thursday, As needed"
                  placeholderTextColor={theme.textSecondaryColor}
                  multiline
                />
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondaryColor} />
                <Text style={styles.dateButtonText}>
                  {format(startDate, 'MMMM d, yyyy')}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={styles.endDateHeader}>
                <Text style={styles.inputLabel}>End Date (Optional)</Text>
                {endDate && (
                  <TouchableOpacity onPress={clearEndDate}>
                    <Text style={styles.clearEndDateText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondaryColor} />
                <Text style={styles.dateButtonText}>
                  {endDate ? format(endDate, 'MMMM d, yyyy') : 'No end date'}
                </Text>
              </TouchableOpacity>
              {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Enable Reminders</Text>
              <Switch
                value={reminder}
                onValueChange={setReminder}
                trackColor={{ false: theme.borderColor, true: theme.accentColor + '70' }}
                thumbColor={reminder ? theme.accentColor : theme.textSecondaryColor}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes"
              placeholderTextColor={theme.textSecondaryColor}
              multiline
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Medication' : 'Add Medication'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Time Picker Modal */}
        {showTimePicker && (
          <DateTimePicker
            value={frequency === 'daily' ? time : times[currentTimeIndex]}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* Start Date Picker Modal */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* End Date Picker Modal */}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            minimumDate={startDate}
          />
        )}

        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowColorPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowColorPicker(false)}
          >
            <View style={styles.colorPickerContainer}>
              <Text style={styles.colorPickerTitle}>Select a Color</Text>
              
              <View style={styles.colorGrid}>
                {colors.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      color === c && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      setColor(c);
                      setShowColorPicker(false);
                    }}
                  >
                    {color === c && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowColorPicker(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDeleteConfirm(false)}
          >
            <View style={styles.confirmationContainer}>
              <Text style={styles.confirmationTitle}>Delete Medication?</Text>
              <Text style={styles.confirmationText}>
                Are you sure you want to delete this medication? This action cannot be undone.
              </Text>
              
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteConfirmButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.cardBackgroundColor,
    ...theme.shadow,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  deleteButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    padding: 16,
    ...theme.shadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textColor,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textColor,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.backgroundColor,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    padding: 12,
    color: theme.textColor,
    fontSize: 16,
  },
  inputError: {
    borderColor: theme.errorColor,
  },
  errorText: {
    color: theme.errorColor,
    fontSize: 12,
    marginTop: 4,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  frequencyOptionSelected: {
    backgroundColor: theme.accentColor,
    borderColor: theme.accentColor,
  },
  frequencyOptionText: {
    color: theme.textColor,
    fontWeight: '500',
  },
  frequencyOptionTextSelected: {
    color: 'white',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    padding: 12,
  },
  timeButtonText: {
    marginLeft: 8,
    color: theme.textColor,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    padding: 12,
  },
  dateButtonText: {
    marginLeft: 8,
    color: theme.textColor,
    fontSize: 16,
  },
  timesHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTimeText: {
    marginLeft: 4,
    color: theme.accentColor,
    fontWeight: '500',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeTimeButton: {
    marginLeft: 8,
    padding: 4,
  },
  endDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearEndDateText: {
    color: theme.accentColor,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.textColor,
  },
  saveButton: {
    backgroundColor: theme.accentColor,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    ...theme.shadow,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textColor,
    marginBottom: 16,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: theme.backgroundColor,
  },
  closeButton: {
    backgroundColor: theme.backgroundColor,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.textColor,
    fontWeight: '600',
  },
  colorButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  colorButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  confirmationContainer: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    ...theme.shadow,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textColor,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationText: {
    color: theme.textSecondaryColor,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: theme.backgroundColor,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.textColor,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: theme.errorColor,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});