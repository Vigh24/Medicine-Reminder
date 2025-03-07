import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, isToday, parseISO } from 'date-fns';

const MEDICATIONS_STORAGE_KEY = 'medications';
const MEDICATION_HISTORY_KEY = 'medication_history';
const USER_DATA_KEY = 'user_data';

// Medication interface
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'multiple' | 'custom';
  frequencyDescription?: string;
  time?: string;
  times?: string[];
  color?: string;
  notes?: string;
  startDate: string;
  endDate?: string;
  takenToday?: boolean;
  skippedToday?: boolean;
  nextDoseTime?: string;
  reminder: boolean;
}

// Medication history record interface
export interface MedicationHistoryRecord {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  date: string;
  time: string;
  status: 'taken' | 'skipped' | 'missed';
}

// Get all medications
export const getMedications = async (): Promise<Medication[]> => {
  try {
    const data = await AsyncStorage.getItem(MEDICATIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
};

// Get a specific medication by ID
export const getMedicationById = async (id: string): Promise<Medication | null> => {
  try {
    const medications = await getMedications();
    return medications.find(med => med.id === id) || null;
  } catch (error) {
    console.error('Error getting medication by ID:', error);
    return null;
  }
};

// Add a new medication
export const addMedication = async (medication: Omit<Medication, 'id'>): Promise<string> => {
  try {
    const medications = await getMedications();
    const id = 'med_' + Date.now().toString();
    const newMedication = {
      ...medication,
      id,
      nextDoseTime: calculateNextDoseTime(medication),
    };
    
    await AsyncStorage.setItem(
      MEDICATIONS_STORAGE_KEY, 
      JSON.stringify([...medications, newMedication])
    );
    
    return id;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

// Update an existing medication
export const updateMedication = async (id: string, updatedData: Partial<Medication>): Promise<boolean> => {
  try {
    const medications = await getMedications();
    const index = medications.findIndex(med => med.id === id);
    
    if (index === -1) return false;
    
    const updatedMedication = {
      ...medications[index],
      ...updatedData,
      nextDoseTime: calculateNextDoseTime({
        ...medications[index],
        ...updatedData,
      }),
    };
    
    medications[index] = updatedMedication;
    
    await AsyncStorage.setItem(
      MEDICATIONS_STORAGE_KEY,
      JSON.stringify(medications)
    );
    
    return true;
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

// Delete a medication
export const deleteMedication = async (id: string): Promise<boolean> => {
  try {
    const medications = await getMedications();
    const filteredMedications = medications.filter(med => med.id !== id);
    
    await AsyncStorage.setItem(
      MEDICATIONS_STORAGE_KEY,
      JSON.stringify(filteredMedications)
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

// Mark a medication as taken
export const markMedicationAsTaken = async (id: string): Promise<boolean> => {
  try {
    const medications = await getMedications();
    const index = medications.findIndex(med => med.id === id);
    
    if (index === -1) return false;
    
    const medication = medications[index];
    
    // Update medication status
    medication.takenToday = true;
    medication.skippedToday = false;
    medications[index] = medication;
    
    await AsyncStorage.setItem(
      MEDICATIONS_STORAGE_KEY,
      JSON.stringify(medications)
    );
    
    // Add to history
    const historyRecord: MedicationHistoryRecord = {
      id: 'hist_' + Date.now().toString(),
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      status: 'taken',
    };
    
    await addToMedicationHistory(historyRecord);
    
    return true;
  } catch (error) {
    console.error('Error marking medication as taken:', error);
    throw error;
  }
};

// Mark a medication as skipped
export const markMedicationAsSkipped = async (id: string): Promise<boolean> => {
  try {
    const medications = await getMedications();
    const index = medications.findIndex(med => med.id === id);
    
    if (index === -1) return false;
    
    const medication = medications[index];
    
    // Update medication status
    medication.skippedToday = true;
    medication.takenToday = false;
    medications[index] = medication;
    
    await AsyncStorage.setItem(
      MEDICATIONS_STORAGE_KEY,
      JSON.stringify(medications)
    );
    
    // Add to history
    const historyRecord: MedicationHistoryRecord = {
      id: 'hist_' + Date.now().toString(),
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      status: 'skipped',
    };
    
    await addToMedicationHistory(historyRecord);
    
    return true;
  } catch (error) {
    console.error('Error marking medication as skipped:', error);
    throw error;
  }
};

// Reset medication statuses for a new day
export const resetMedicationStatuses = async (): Promise<boolean> => {
  try {
    const medications = await getMedications();
    
    const updatedMedications = medications.map(medication => {
      // Find any missed medications from yesterday
      const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
      const wasActive = !medication.endDate || new Date(medication.endDate) >= new Date(yesterday);
      
      if (wasActive && !medication.takenToday && !medication.skippedToday) {
        // Add missed medication to history
        const historyRecord: MedicationHistoryRecord = {
          id: 'hist_' + Date.now().toString() + '_' + medication.id,
          medicationId: medication.id,
          medicationName: medication.name,
          dosage: medication.dosage,
          date: yesterday,
          time: medication.time || '12:00',
          status: 'missed',
        };
        
        addToMedicationHistory(historyRecord);
      }
      
      // Reset today's status
      return {
        ...medication,
        takenToday: false,
        skippedToday: false,
        nextDoseTime: calculateNextDoseTime(medication),
      };
    });
    
    await AsyncStorage.setItem(
      MEDICATIONS_STORAGE_KEY,
      JSON.stringify(updatedMedications)
    );
    
    return true;
  } catch (error) {
    console.error('Error resetting medication statuses:', error);
    throw error;
  }
};

// Get medications for today
export const getMedicationsForToday = async (): Promise<Medication[]> => {
  try {
    const medications = await getMedications();
    const today = new Date();
    
    return medications.filter(medication => {
      // Check if medication is active today
      const startDate = new Date(medication.startDate);
      const endDate = medication.endDate ? new Date(medication.endDate) : null;
      
      return (
        startDate <= today && 
        (!endDate || endDate >= today)
      );
    });
  } catch (error) {
    console.error('Error getting medications for today:', error);
    return [];
  }
};

// Add record to medication history
export const addToMedicationHistory = async (record: MedicationHistoryRecord): Promise<boolean> => {
  try {
    const history = await getMedicationHistory();
    await AsyncStorage.setItem(
      MEDICATION_HISTORY_KEY,
      JSON.stringify([...history, record])
    );
    return true;
  } catch (error) {
    console.error('Error adding to medication history:', error);
    throw error;
  }
};

// Get medication history
export const getMedicationHistory = async (): Promise<MedicationHistoryRecord[]> => {
  try {
    const data = await AsyncStorage.getItem(MEDICATION_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting medication history:', error);
    return [];
  }
};

// Get medication history for a specific medication
export const getMedicationHistoryById = async (medicationId: string): Promise<MedicationHistoryRecord[]> => {
  try {
    const history = await getMedicationHistory();
    return history.filter(record => record.medicationId === medicationId);
  } catch (error) {
    console.error('Error getting medication history by ID:', error);
    return [];
  }
};

// Get medication history for a specific date range
export const getMedicationHistoryByDateRange = async (
  startDate: string,
  endDate: string
): Promise<MedicationHistoryRecord[]> => {
  try {
    const history = await getMedicationHistory();
    return history.filter(record => {
      const recordDate = record.date;
      return recordDate >= startDate && recordDate <= endDate;
    });
  } catch (error) {
    console.error('Error getting medication history by date range:', error);
    return [];
  }
};

// Helper function to calculate the next dose time
const calculateNextDoseTime = (medication: Partial<Medication>): string => {
  const now = new Date();
  
  if (medication.frequency === 'daily' && medication.time) {
    // For daily medications, set next dose time to today at the specified time
    const [hours, minutes] = medication.time.split(':');
    const nextDose = new Date();
    nextDose.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If the time has already passed today, set for tomorrow
    if (nextDose < now) {
      nextDose.setDate(nextDose.getDate() + 1);
    }
    
    return nextDose.toISOString();
  } else if (medication.frequency === 'multiple' && medication.times && medication.times.length > 0) {
    // For multiple times per day, find the next upcoming time
    const todayTimes = medication.times.map(time => {
      const [hours, minutes] = time.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return timeDate;
    }).sort((a, b) => a.getTime() - b.getTime());
    
    // Find the next time that hasn't passed yet
    const nextTime = todayTimes.find(time => time > now);
    
    // If all times have passed, return the first time tomorrow
    if (!nextTime) {
      const tomorrowFirstTime = new Date(todayTimes[0]);
      tomorrowFirstTime.setDate(tomorrowFirstTime.getDate() + 1);
      return tomorrowFirstTime.toISOString();
    }
    
    return nextTime.toISOString();
  }
  
  // Default to an hour from now for custom schedules
  const defaultNextDose = new Date(now.getTime() + 60 * 60 * 1000);
  return defaultNextDose.toISOString();
};

// Save user data
export const saveUserData = async (data: any): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

// Get user data
export const getUserData = async (): Promise<any> => {
  try {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Initialize the app with sample data for demonstration
export const initializeWithSampleData = async (): Promise<void> => {
  const medications = await getMedications();
  
  // Only add sample data if there are no medications
  if (medications.length === 0) {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    const sampleMedications: Omit<Medication, 'id'>[] = [
      {
        name: 'Ibuprofen',
        dosage: '400mg - 1 tablet',
        frequency: 'daily',
        time: '08:00',
        color: '#5E72E4',
        notes: 'Take with food',
        startDate: today,
        reminder: true,
      },
      {
        name: 'Vitamin D',
        dosage: '1000 IU - 1 capsule',
        frequency: 'daily',
        time: '09:00',
        color: '#FB6340',
        notes: 'Take with breakfast',
        startDate: today,
        reminder: true,
      },
      {
        name: 'Allergy Medicine',
        dosage: '10mg - 1 tablet',
        frequency: 'daily',
        time: '20:00',
        color: '#11CDEF',
        startDate: today,
        reminder: true,
      }
    ];
    
    // Add sample medications
    for (const medication of sampleMedications) {
      await addMedication(medication);
    }
  }
};