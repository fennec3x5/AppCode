// src/components/BonusActionModal.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

export default function BonusActionModal({ bonus, visible, onClose, onEdit, onDelete }) {
  if (!bonus) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <SafeAreaView style={styles.centeredView}>
          <TouchableOpacity activeOpacity={1} style={styles.modalView}>
            
            <Text style={styles.title}>Manage "{bonus.categoryName}" Bonus</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.editButton]} onPress={onEdit}>
                <Icon name="edit" size={20} color={colors.primary} />
                <Text style={[styles.buttonText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={onDelete}>
                <Icon name="delete-outline" size={20} color={colors.error} />
                <Text style={[styles.buttonText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
            
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  title: {
    ...typography.h4,
    marginBottom: spacing.xl, // Increased margin to compensate for removed subtitle
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    // 1. Increased height to prevent text from being cut off
    height: 52, 
  },
  editButton: {
    backgroundColor: colors.primaryBackground,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
  },
  buttonText: {
    ...typography.button,
    marginLeft: spacing.sm,
  },
});