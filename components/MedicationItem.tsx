import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import { markMedicationAsTaken, markMedicationAsSkipped } from '../utils/storageUtils';
import { showToast } from '../utils/toastUtils';

export default function MedicationItem({ medication, onUpdate }) {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const handleMarkAsTaken = async () => {
    try {
      await markMedicationAsTaken(medication.id);
      showToast(`${medication.name} marked as taken`);
      if (onUpdate) onUpdate();
    } catch (error) {
      showToast('Failed to update medication status');
    }
  };

  const handleSkip = async () => {
    try {
      await markMedicationAsSkipped(medication.id);
      showToast(`${medication.name} skipped`);
      if (onUpdate) onUpdate();
    } catch (error) {
      showToast('Failed to update medication status');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditMedication', { medicationId: medication.id });
  };

  const getStatusLabel = () => {
    if (medication.takenToday) {
      return {
        text: 'Taken',
        color: theme.successColor
      };
    } else if (medication.skippedToday) {
      return {
        text: 'Skipped',
        color: theme.warningColor
      };
    } else {
      const nextDoseTime = new Date(medication.nextDoseTime);
      const now = new Date();
      
      if (nextDoseTime < now) {
        return {
          text: 'Missed',
          color: theme.errorColor
        };
      } else {
        return {
          text: 'Upcoming',
          color: theme.accentColor
        };
      }
    }
  };

  const statusInfo = getStatusLabel();

  return (
    <View style={styles.container}>
      <View style={styles.medicationHeader}>
        <View style={styles.medicationInfo}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor: medication.color || theme.accentColor }]}>
              <Ionicons name="medical" size={20} color="white" />
            </View>
          </View>
          <View style={styles.details}>
            <Text style={styles.name}>{medication.name}</Text>
            <Text style={styles.dosage}>{medication.dosage}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
        </View>
      </View>

      <View style={styles.timeInfoContainer}>
        <Ionicons name="time-outline" size={16} color={theme.textSecondaryColor} />
        <Text style={styles.timeInfo}>
          {medication.frequency === 'daily' 
            ? `Every day at ${format(new Date(medication.time), 'h:mm a')}`
            : medication.frequency === 'multiple' 
              ? `${medication.times?.length || 0} times daily`
              : medication.frequencyDescription || 'Custom schedule'}
        </Text>
      </View>

      {!medication.takenToday && !medication.skippedToday && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.takeButton} onPress={handleMarkAsTaken}>
            <Text style={styles.takeButtonText}>Mark as Taken</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
        <MaterialIcons name="edit" size={18} color={theme.textSecondaryColor} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadow,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  dosage: {
    fontSize: 14,
    color: theme.textSecondaryColor,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  timeInfo: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.textSecondaryColor,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 6,
  },
  skipButton: {
    backgroundColor: theme.backgroundColor,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
    flex: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    color: theme.textSecondaryColor,
    fontWeight: '600',
  },
  takeButton: {
    backgroundColor: theme.accentColor,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  takeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  }
});