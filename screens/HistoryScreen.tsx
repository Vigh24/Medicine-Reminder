import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, eachDayOfInterval, isEqual, startOfDay } from 'date-fns';
import { ThemeContext } from '../context/ThemeContext';
import { getMedicationHistory, getMedicationHistoryByDateRange, getMedications } from '../utils/storageUtils';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  
  const [historyData, setHistoryData] = useState([]);
  const [medications, setMedications] = useState([]);
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [adherenceRate, setAdherenceRate] = useState(0);
  
  useEffect(() => {
    loadData();
  }, [timeframe]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const allMedications = await getMedications();
      setMedications(allMedications);
      
      // Set date range based on selected timeframe
      const today = new Date();
      let startDate, endDate;
      
      if (timeframe === 'week') {
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
        endDate = endOfWeek(today, { weekStartsOn: 1 });
      } else if (timeframe === 'month') {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
      } else { // 'all'
        // Just use a large date range for all history
        startDate = new Date(2020, 0, 1);
        endDate = today;
      }
      
      setDateRange({ start: startDate, end: endDate });
      
      // Format dates for API call
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      // Get history for date range
      const history = await getMedicationHistoryByDateRange(formattedStartDate, formattedEndDate);
      
      // Sort by date (most recent first)
      const sortedHistory = history.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison === 0) {
          return new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime();
        }
        return dateComparison;
      });
      
      setHistoryData(sortedHistory);
      
      // Calculate adherence rate
      calculateAdherenceRate(history, allMedications, startDate, endDate);
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateAdherenceRate = (history, meds, startDate, endDate) => {
    // Count the number of days in the date range
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Count total expected medications
    let totalExpected = 0;
    let totalTaken = 0;
    
    // For each day, count how many medications should have been taken
    daysInRange.forEach(day => {
      const formattedDay = format(day, 'yyyy-MM-dd');
      
      // Filter medications that were active on this day
      const activeMeds = meds.filter(med => {
        const medStartDate = new Date(med.startDate);
        const medEndDate = med.endDate ? new Date(med.endDate) : new Date(2099, 11, 31);
        return medStartDate <= day && medEndDate >= day;
      });
      
      // Count expected medications for this day
      totalExpected += activeMeds.length;
      
      // Count medications taken this day
      const takenToday = history.filter(record => 
        record.date === formattedDay && record.status === 'taken'
      ).length;
      
      totalTaken += takenToday;
    });
    
    // Calculate adherence rate
    const rate = totalExpected > 0 ? (totalTaken / totalExpected) * 100 : 0;
    setAdherenceRate(Math.round(rate));
  };
  
  const renderHistoryItem = ({ item }) => {
    const medication = medications.find(med => med.id === item.medicationId);
    const color = medication?.color || theme.accentColor;
    
    let statusColor;
    let statusIcon;
    
    switch (item.status) {
      case 'taken':
        statusColor = theme.successColor;
        statusIcon = 'checkmark-circle';
        break;
      case 'skipped':
        statusColor = theme.warningColor;
        statusIcon = 'close-circle';
        break;
      case 'missed':
        statusColor = theme.errorColor;
        statusIcon = 'alert-circle';
        break;
      default:
        statusColor = theme.textSecondaryColor;
        statusIcon = 'help-circle';
    }
    
    return (
      <View style={styles.historyItem}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
          <Ionicons name={statusIcon} size={18} color="white" />
        </View>
        
        <View style={styles.historyDetails}>
          <Text style={styles.medicationName}>{item.medicationName}</Text>
          <Text style={styles.dosage}>{item.dosage}</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSecondaryColor} />
            <Text style={styles.date}>{format(new Date(item.date), 'MMM d, yyyy')}</Text>
            <Ionicons name="time-outline" size={14} color={theme.textSecondaryColor} style={styles.timeIcon} />
            <Text style={styles.time}>{format(new Date(`2000-01-01T${item.time}`), 'h:mm a')}</Text>
          </View>
        </View>
        
        <View style={styles.statusLabelContainer}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    );
  };
  
  // Generate calendar days for the weekly view
  const generateCalendarDays = () => {
    if (!dateRange.start || !dateRange.end) return [];
    
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map(day => {
      const formattedDate = format(day, 'yyyy-MM-dd');
      
      // Count medications taken this day
      const takenCount = historyData.filter(item => 
        item.date === formattedDate && item.status === 'taken'
      ).length;
      
      // Count medications missed this day
      const missedCount = historyData.filter(item => 
        item.date === formattedDate && item.status === 'missed'
      ).length;
      
      // Count medications skipped this day
      const skippedCount = historyData.filter(item => 
        item.date === formattedDate && item.status === 'skipped'
      ).length;
      
      // Determine day status color
      let statusColor;
      if (takenCount > 0 && missedCount === 0) {
        statusColor = theme.successColor;
      } else if (missedCount > 0) {
        statusColor = theme.errorColor;
      } else if (skippedCount > 0) {
        statusColor = theme.warningColor;
      } else {
        statusColor = theme.borderColor;
      }
      
      return {
        date: day,
        takenCount,
        missedCount,
        skippedCount,
        statusColor,
      };
    });
  };
  
  const calendarDays = generateCalendarDays();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medication History</Text>
      </View>
      
      <View style={styles.timeframeSelector}>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'week' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('week')}
        >
          <Text style={[styles.timeframeButtonText, timeframe === 'week' && styles.timeframeButtonTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'month' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('month')}
        >
          <Text style={[styles.timeframeButtonText, timeframe === 'month' && styles.timeframeButtonTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'all' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('all')}
        >
          <Text style={[styles.timeframeButtonText, timeframe === 'all' && styles.timeframeButtonTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Adherence stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Adherence Rate</Text>
        <View style={styles.statsContent}>
          <View style={styles.adherenceCircle}>
            <Text style={styles.adherenceRate}>{adherenceRate}%</Text>
          </View>
          <View style={styles.statsDetails}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: theme.successColor }]} />
              <Text style={styles.statLabel}>Taken</Text>
              <Text style={styles.statValue}>
                {historyData.filter(item => item.status === 'taken').length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: theme.errorColor }]} />
              <Text style={styles.statLabel}>Missed</Text>
              <Text style={styles.statValue}>
                {historyData.filter(item => item.status === 'missed').length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: theme.warningColor }]} />
              <Text style={styles.statLabel}>Skipped</Text>
              <Text style={styles.statValue}>
                {historyData.filter(item => item.status === 'skipped').length}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      {timeframe !== 'all' && (
        <View style={styles.calendarView}>
          <Text style={styles.calendarTitle}>
            {timeframe === 'week' 
              ? `Week of ${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
              : format(dateRange.start, 'MMMM yyyy')}
          </Text>
          
          {timeframe === 'week' && (
            <View style={styles.weekCalendar}>
              {calendarDays.map((day, index) => (
                <View key={index} style={styles.calendarDay}>
                  <Text style={styles.dayName}>{format(day.date, 'EEE')}</Text>
                  <View 
                    style={[
                      styles.dayCircle, 
                      { backgroundColor: day.statusColor },
                      isEqual(startOfDay(day.date), startOfDay(new Date())) && styles.todayCircle
                    ]}
                  >
                    <Text style={styles.dayNumber}>{format(day.date, 'd')}</Text>
                  </View>
                  {day.takenCount > 0 && (
                    <View style={styles.dayStatusContainer}>
                      <View style={[styles.dayStatusDot, { backgroundColor: theme.successColor }]} />
                      <Text style={styles.dayStatusText}>{day.takenCount}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          
          {timeframe === 'month' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthCalendar}>
              {calendarDays.map((day, index) => (
                <View key={index} style={styles.monthCalendarDay}>
                  <Text style={styles.monthDayName}>{format(day.date, 'EEE')}</Text>
                  <View 
                    style={[
                      styles.monthDayCircle, 
                      { backgroundColor: day.statusColor },
                      isEqual(startOfDay(day.date), startOfDay(new Date())) && styles.todayCircle
                    ]}
                  >
                    <Text style={styles.monthDayNumber}>{format(day.date, 'd')}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
      
      <View style={styles.historyListHeader}>
        <Text style={styles.historyListTitle}>History</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accentColor} />
        </View>
      ) : (
        <FlatList
          data={historyData}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar" size={50} color={theme.textSecondaryColor} />
              <Text style={styles.emptyStateText}>No history found</Text>
              <Text style={styles.emptyStateSubtext}>
                {timeframe === 'all' 
                  ? 'Start taking your medications to see history'
                  : 'Try selecting a different time period'}
              </Text>
            </View>
          }
        />
      )}
    </View>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.cardBackgroundColor,
    ...theme.shadow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  timeframeSelector: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  timeframeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.backgroundColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  timeframeButtonActive: {
    backgroundColor: theme.accentColor,
    borderColor: theme.accentColor,
  },
  timeframeButtonText: {
    color: theme.textColor,
    fontWeight: '500',
  },
  timeframeButtonTextActive: {
    color: 'white',
  },
  statsCard: {
    margin: 16,
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    padding: 16,
    ...theme.shadow,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
    marginBottom: 16,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adherenceCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: theme.accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adherenceRate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  statsDetails: {
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statLabel: {
    flex: 1,
    color: theme.textSecondaryColor,
  },
  statValue: {
    fontWeight: 'bold',
    color: theme.textColor,
  },
  calendarView: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    padding: 16,
    ...theme.shadow,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
    marginBottom: 16,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    color: theme.textSecondaryColor,
    marginBottom: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: theme.accentColor,
  },
  dayNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  dayStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 2,
  },
  dayStatusText: {
    fontSize: 10,
    color: theme.textSecondaryColor,
  },
  monthCalendar: {
    flexDirection: 'row',
  },
  monthCalendarDay: {
    alignItems: 'center',
    marginRight: 10,
    width: 40,
  },
  monthDayName: {
    fontSize: 12,
    color: theme.textSecondaryColor,
    marginBottom: 4,
  },
  monthDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDayNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  historyListHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  historyListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  historyList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    ...theme.shadow,
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  dosage: {
    fontSize: 14,
    color: theme.textSecondaryColor,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: theme.textSecondaryColor,
    marginLeft: 4,
  },
  timeIcon: {
    marginLeft: 10,
  },
  time: {
    fontSize: 12,
    color: theme.textSecondaryColor,
    marginLeft: 4,
  },
  statusLabelContainer: {
    justifyContent: 'center',
  },
  statusLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    marginTop: 16,
    ...theme.shadow,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondaryColor,
    textAlign: 'center',
    marginTop: 4,
  },
});