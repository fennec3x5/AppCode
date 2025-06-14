// src/components/FinderInstructions.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const InstructionStep = ({ num, title, description }) => (
  <View style={styles.instructionStep}>
    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{num}</Text></View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

export const FinderInstructions = () => (
  <View style={styles.container}>
    <View style={styles.contentWrapper}>
      <View style={styles.titleContainer}>
        <Icon name="info-outline" size={24} color={colors.textSecondary} />
        <Text style={styles.mainTitle}>How It Works</Text>
      </View>
      
      <View style={styles.instructionCard}>
        <InstructionStep num="1" title="Choose a category" description="Select from your favorites or browse all." />
        <InstructionStep num="2" title="Click Find" description="We'll find your highest earning cards instantly." />
        <InstructionStep num="3" title="Maximize rewards" description="Use the best card for every purchase." />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.md,
    },
    contentWrapper: {
        width: '100%',
        maxWidth: 500,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    mainTitle: {
        ...typography.h4,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    instructionCard: { 
        backgroundColor: colors.surface, 
        padding: spacing.xl, 
        borderRadius: borderRadius.xl, 
        ...shadows.sm 
    },
    instructionStep: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
    },
    stepNumber: { 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        backgroundColor: colors.primaryBackground, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: spacing.md 
    },
    stepNumberText: { 
        ...typography.body1, 
        color: colors.primary, 
        fontWeight: '700' 
    },
    stepContent: { 
        flex: 1 
    },
    stepTitle: { 
        ...typography.body1, 
        color: colors.text, 
        fontWeight: '600', 
        marginBottom: spacing.xs 
    },
    stepDescription: { 
        ...typography.body2, 
        color: colors.textSecondary, 
        lineHeight: 20 
    },
});