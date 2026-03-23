import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Trade {
  id?: string;
  symbol: string;
  market?: string;
  side: 'LONG' | 'SHORT';
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  fees?: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
  screenshotUrl?: string;
  setups: string[];
  mistakes: string[];
  emotions: string[];
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface Tag {
  id?: string;
  name: string;
  type: 'SETUP' | 'MISTAKE' | 'EMOTION';
  createdAt?: string;
}

export interface UserProfile {
  displayName?: string;
  timezone?: string;
  currency?: string;
  weeklyReviewDay?: number; // 0=Sun … 6=Sat
  subscriptionTier?: 'FREE' | 'PRO';
}

export interface WeeklyReview {
  id?: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  createdAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User not authenticated');
  return uid;
}

// ─── Trade Service ────────────────────────────────────────────────────────────

export const tradeService = {
  getCollectionPath() {
    return `users/${requireUid()}/trades`;
  },

  subscribeToTrades(
    callback: (trades: Trade[]) => void,
    onError: (error: Error) => void
  ) {
    try {
      const path = this.getCollectionPath();
      const q = query(collection(db, path), orderBy('entryDate', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Trade))),
        (err) => onError(err)
      );
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  },

  async addTrade(trade: Omit<Trade, 'id'>): Promise<string> {
    const ref = doc(collection(db, this.getCollectionPath()));
    await setDoc(ref, trade);
    return ref.id;
  },

  async updateTrade(id: string, trade: Partial<Trade>): Promise<void> {
    await updateDoc(doc(db, this.getCollectionPath(), id), trade as Record<string, unknown>);
  },

  async deleteTrade(id: string): Promise<void> {
    await deleteDoc(doc(db, this.getCollectionPath(), id));
  },

  async clearAll(): Promise<void> {
    const snapshot = await getDocs(collection(db, this.getCollectionPath()));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  },

  async seedData(): Promise<void> {
    const path = this.getCollectionPath();
    const batch = writeBatch(db);
    const now = Date.now();
    const day = 86_400_000;

    const seeds: Omit<Trade, 'id'>[] = [
      {
        symbol: 'AAPL', market: 'Stocks', side: 'LONG',
        entryDate: new Date(now - 7 * day).toISOString(),
        exitDate: new Date(now - 6 * day).toISOString(),
        entryPrice: 170.50, exitPrice: 175.20, quantity: 100, fees: 2.50,
        stopLoss: 168.00, takeProfit: 176.00,
        notes: 'Good breakout setup, held through the chop.',
        setups: ['Breakout'], mistakes: [], emotions: ['Confident'],
        pnl: 467.50, status: 'CLOSED',
      },
      {
        symbol: 'TSLA', market: 'Stocks', side: 'SHORT',
        entryDate: new Date(now - 5 * day).toISOString(),
        exitDate: new Date(now - 4 * day).toISOString(),
        entryPrice: 200.00, exitPrice: 205.00, quantity: 50, fees: 1.50,
        stopLoss: 206.00, takeProfit: 190.00,
        notes: 'Stopped out. Should have waited for confirmation.',
        setups: ['Reversal'], mistakes: ['Entered Early', 'Ignored Stop Loss'], emotions: ['Fearful'],
        pnl: -251.50, status: 'CLOSED',
      },
      {
        symbol: 'NVDA', market: 'Stocks', side: 'LONG',
        entryDate: new Date(now - 10 * day).toISOString(),
        exitDate: new Date(now - 9 * day).toISOString(),
        entryPrice: 850.00, exitPrice: 880.00, quantity: 20, fees: 5.00,
        stopLoss: 840.00, takeProfit: 900.00,
        notes: 'Strong trend continuation.',
        setups: ['Trend Continuation'], mistakes: ['Exited Early'], emotions: ['Patient'],
        pnl: 595.00, status: 'CLOSED',
      },
      {
        symbol: 'AMD', market: 'Stocks', side: 'LONG',
        entryDate: new Date(now - 14 * day).toISOString(),
        exitDate: new Date(now - 13 * day).toISOString(),
        entryPrice: 160.00, exitPrice: 165.00, quantity: 100, fees: 2.00,
        stopLoss: 155.00, takeProfit: 170.00,
        notes: 'Nice bounce off support.',
        setups: ['Support/Resistance'], mistakes: [], emotions: ['Disciplined'],
        pnl: 498.00, status: 'CLOSED',
      },
      {
        symbol: 'META', market: 'Stocks', side: 'SHORT',
        entryDate: new Date(now - 12 * day).toISOString(),
        exitDate: new Date(now - 11 * day).toISOString(),
        entryPrice: 500.00, exitPrice: 510.00, quantity: 30, fees: 3.00,
        stopLoss: 515.00, takeProfit: 480.00,
        notes: 'Failed breakdown, got squeezed.',
        setups: ['Reversal'], mistakes: ['Revenge Trade', 'Oversized Position'], emotions: ['Impulsive'],
        pnl: -303.00, status: 'CLOSED',
      },
      {
        symbol: 'BTC', market: 'Crypto', side: 'LONG',
        entryDate: new Date(now - 3 * day).toISOString(),
        exitDate: new Date(now - 2 * day).toISOString(),
        entryPrice: 42000, exitPrice: 43800, quantity: 0.5, fees: 12,
        stopLoss: 41000, takeProfit: 45000,
        notes: 'Breakout from consolidation zone.',
        setups: ['Breakout'], mistakes: [], emotions: ['Confident'],
        pnl: 888, status: 'CLOSED',
      },
      {
        symbol: 'SPY', market: 'ETF', side: 'LONG',
        entryDate: new Date(now - 1 * day).toISOString(),
        entryPrice: 480.00, quantity: 50, fees: 0,
        setups: ['Pullback'], mistakes: [], emotions: ['Patient'],
        status: 'OPEN',
      },
    ];

    for (const trade of seeds) {
      batch.set(doc(collection(db, path)), trade);
    }
    await batch.commit();
  },
};

// ─── Tag Service ──────────────────────────────────────────────────────────────

const DEFAULT_TAGS: Omit<Tag, 'id'>[] = [
  // Setups
  { name: 'Breakout', type: 'SETUP' },
  { name: 'Pullback', type: 'SETUP' },
  { name: 'Reversal', type: 'SETUP' },
  { name: 'Trend Continuation', type: 'SETUP' },
  { name: 'Support/Resistance', type: 'SETUP' },
  { name: 'News Trade', type: 'SETUP' },
  // Mistakes
  { name: 'Entered Early', type: 'MISTAKE' },
  { name: 'Exited Early', type: 'MISTAKE' },
  { name: 'Revenge Trade', type: 'MISTAKE' },
  { name: 'Oversized Position', type: 'MISTAKE' },
  { name: 'Ignored Stop Loss', type: 'MISTAKE' },
  { name: 'Broke Plan', type: 'MISTAKE' },
  // Emotions
  { name: 'Confident', type: 'EMOTION' },
  { name: 'Fearful', type: 'EMOTION' },
  { name: 'Impulsive', type: 'EMOTION' },
  { name: 'Patient', type: 'EMOTION' },
  { name: 'Hesitant', type: 'EMOTION' },
  { name: 'Disciplined', type: 'EMOTION' },
];

export const tagService = {
  getCollectionPath() {
    return `users/${requireUid()}/tags`;
  },

  subscribeToTags(
    callback: (tags: Tag[]) => void,
    onError: (error: Error) => void
  ) {
    try {
      const path = this.getCollectionPath();
      const q = query(collection(db, path), orderBy('name'));
      return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Tag))),
        (err) => onError(err)
      );
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  },

  async addTag(tag: Omit<Tag, 'id'>): Promise<string> {
    const ref = doc(collection(db, this.getCollectionPath()));
    await setDoc(ref, { ...tag, createdAt: new Date().toISOString() });
    return ref.id;
  },

  async deleteTag(id: string): Promise<void> {
    await deleteDoc(doc(db, this.getCollectionPath(), id));
  },

  /** Seeds default tags only if the collection is empty. Idempotent. */
  async ensureDefaultTags(): Promise<void> {
    const path = this.getCollectionPath();
    const snapshot = await getDocs(collection(db, path));
    if (!snapshot.empty) return;
    const batch = writeBatch(db);
    for (const tag of DEFAULT_TAGS) {
      batch.set(doc(collection(db, path)), { ...tag, createdAt: new Date().toISOString() });
    }
    await batch.commit();
  },
};

// ─── Weekly Review Service ────────────────────────────────────────────────────

export const reviewService = {
  getCollectionPath() {
    return `users/${requireUid()}/reviews`;
  },

  subscribeToReviews(
    callback: (reviews: WeeklyReview[]) => void,
    onError: (error: Error) => void
  ) {
    try {
      const path = this.getCollectionPath();
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) =>
          callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WeeklyReview))),
        (err) => onError(err)
      );
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  },

  async saveReview(review: Omit<WeeklyReview, 'id'>): Promise<string> {
    const ref = doc(collection(db, this.getCollectionPath()));
    await setDoc(ref, { ...review, createdAt: new Date().toISOString() });
    return ref.id;
  },
};

// ─── User Profile Service ─────────────────────────────────────────────────────

export const userService = {
  getDocPath() {
    return `users/${requireUid()}`;
  },

  async getProfile(): Promise<UserProfile> {
    const snap = await getDoc(doc(db, this.getDocPath()));
    return snap.exists() ? (snap.data() as UserProfile) : {};
  },

  async updateProfile(data: Partial<UserProfile>): Promise<void> {
    await setDoc(doc(db, this.getDocPath()), data, { merge: true });
  },
};
