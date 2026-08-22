import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Tone = 'good' | 'warning' | 'alert';

type Palette = {
  surface: string;
  divider: string;
  text: string;
  textMuted: string;
  bubble: string;
  bubbleText: string;
  chip: string;
  chipText: string;
  surfaceSoft: string;
  accentSoft: string;
  accentBorder: string;
  accentText: string;
  warningSurface: string;
  warningText: string;
  alertSurface: string;
  alertText: string;
  successSurface: string;
  successText: string;
};

type Props = {
  swipeViewportWidth: number;
  swipeRailWidth: number;
  icon: string;
  title: string;
  dateText: string;
  amountText: string;
  categoryLabel: string;
  subcategoryLabel?: string | null;
  accountLabel?: string | null;
  recurring: boolean;
  tone: Tone;
  toneLabel: string;
  palette: Palette;
  onEdit: () => void;
  onDelete: () => void;
  onQuickLog?: () => void;
};

export const TransactionListItem = memo(function TransactionListItem({
  swipeViewportWidth,
  swipeRailWidth,
  icon,
  title,
  dateText,
  amountText,
  categoryLabel,
  subcategoryLabel,
  accountLabel,
  recurring,
  tone,
  toneLabel,
  palette,
  onEdit,
  onDelete,
  onQuickLog,
}: Props) {
  const toneBackground =
    tone === 'good'
      ? palette.successSurface
      : tone === 'warning'
        ? palette.warningSurface
        : palette.alertSurface;
  const toneText =
    tone === 'good'
      ? palette.successText
      : tone === 'warning'
        ? palette.warningText
        : palette.alertText;

  return (
    <ScrollView
      accessibilityLabel={`${title}, ${amountText}, ${categoryLabel}, ${dateText}`}
      horizontal
      bounces={false}
      showsHorizontalScrollIndicator={false}
      directionalLockEnabled
      snapToOffsets={[0, swipeRailWidth]}
      decelerationRate="fast"
      contentContainerStyle={{ width: swipeViewportWidth + swipeRailWidth }}
      style={styles.swipeRowShell}
    >
      <View
        style={[
          styles.card,
          {
            width: swipeViewportWidth,
            backgroundColor: palette.surface,
            borderColor: palette.divider,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.lead}>
            <View style={[styles.iconWrap, { backgroundColor: palette.bubble }]}>
              <Text style={[styles.iconText, { color: palette.bubbleText }]}>{icon}</Text>
            </View>

            <View style={styles.copy}>
              <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>{dateText}</Text>
            </View>
          </View>

          <Text style={[styles.amount, { color: palette.text }]}>{amountText}</Text>
        </View>

        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: palette.chip }]}>
            <Text style={[styles.tagText, { color: palette.chipText }]}>{categoryLabel}</Text>
          </View>

          {subcategoryLabel ? (
            <View style={[styles.tag, { backgroundColor: palette.surfaceSoft }]}>
              <Text style={[styles.tagText, { color: palette.textMuted }]}>{subcategoryLabel}</Text>
            </View>
          ) : null}

          {accountLabel ? (
            <View style={[styles.tag, { backgroundColor: palette.surfaceSoft }]}>
              <Text style={[styles.tagText, { color: palette.textMuted }]}>{accountLabel}</Text>
            </View>
          ) : null}

          {recurring ? (
            <View style={[styles.tag, { backgroundColor: palette.surfaceSoft }]}>
              <Text style={[styles.tagText, { color: palette.textMuted }]}>Recurring</Text>
            </View>
          ) : null}

          <View style={[styles.tag, { backgroundColor: toneBackground }]}>
            <Text style={[styles.tagText, { color: toneText }]}>{toneLabel}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          {recurring ? (
            <Text style={[styles.cardActionTag, { color: palette.textMuted }]}>Recurring</Text>
          ) : null}
          <Pressable
            style={[styles.cardActionButton, { backgroundColor: palette.accentSoft }]}
            onPress={onEdit}
          >
            <Text style={[styles.cardActionText, { color: palette.accentText }]}>Edit</Text>
          </Pressable>
          <Pressable
            style={[styles.cardActionButton, { backgroundColor: palette.alertSurface }]}
            onPress={onDelete}
          >
            <Text style={[styles.cardActionText, { color: palette.alertText }]}>Delete</Text>
          </Pressable>
        </View>
      </View>

    </ScrollView>
  );
});

const styles = StyleSheet.create({
  swipeRowShell: {
    width: '100%',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    gap: 3,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  lead: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
    lineHeight: 16,
  },
  meta: {
    fontSize: 10,
    lineHeight: 12,
  },
  amount: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 18,
    textAlign: 'right',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 0,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '500',
    lineHeight: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cardActionTag: {
    fontSize: 8,
    fontWeight: '500',
  },
  cardActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  swipeRail: {
    gap: 3,
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 1,
  },
  swipeRailButton: {
    flex: 1,
    minHeight: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  swipeRailButtonIcon: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
});
