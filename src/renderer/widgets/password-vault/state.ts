export interface VaultEntry {
  id: number;
  name: string;
  username: string;
  encryptedPassword: string;
  url: string;
  notes: string;
}

export interface VaultState {
  entries: VaultEntry[];
  nextEntryId: number;
}
