import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

/** Saves text to a file and opens the share sheet (native) or downloads it (web). */
export async function shareTextFile(name: string, text: string, mimeType: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available on this device.");
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

/** Lets the user pick a file and returns its text, or null if they cancelled. */
export async function pickTextFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (Platform.OS === 'web') return asset.file ? asset.file.text() : (await fetch(asset.uri)).text();
  return new File(asset.uri).text();
}

const KEEP_AUTO_BACKUPS = 7;

/**
 * Writes today's automatic backup into Documents/Backups (visible in the Files app and included in the
 * phone's iCloud backup) and keeps only the newest few. Native only.
 */
export function writeAutoBackup(text: string, dateKey: string) {
  if (Platform.OS === 'web') return;
  const dir = new Directory(Paths.document, 'Backups');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, `budget-buddy-${dateKey}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  const backups = dir
    .list()
    .filter((entry): entry is File => entry instanceof File && /^budget-buddy-\d{4}-\d{2}-\d{2}\.json$/.test(entry.name))
    .sort((a, b) => b.name.localeCompare(a.name));
  for (const old of backups.slice(KEEP_AUTO_BACKUPS)) old.delete();
}
