import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface Trade {
  id?: string;
  symbol: string;
  side: "LONG" | "SHORT";
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  fees?: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
  setups: string[];
  mistakes: string[];
  emotions: string[];
  pnl?: number;
  status: "OPEN" | "CLOSED";
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const tradeService = {
  getCollectionPath() {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    return `users/${userId}/trades`;
  },

  subscribeToTrades(callback: (trades: Trade[]) => void, onError: (error: Error) => void) {
    try {
      const path = this.getCollectionPath();
      const q = query(collection(db, path), orderBy('entryDate', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const trades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
        callback(trades);
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (e) {
          onError(e as Error);
        }
      });
    } catch (error) {
      onError(error as Error);
      return () => {};
    }
  },

  async addTrade(trade: Omit<Trade, 'id'>) {
    const path = this.getCollectionPath();
    try {
      const newDocRef = doc(collection(db, path));
      await setDoc(newDocRef, trade);
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateTrade(id: string, trade: Partial<Trade>) {
    const path = `${this.getCollectionPath()}/${id}`;
    try {
      await updateDoc(doc(db, this.getCollectionPath(), id), trade);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteTrade(id: string) {
    const path = `${this.getCollectionPath()}/${id}`;
    try {
      await deleteDoc(doc(db, this.getCollectionPath(), id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async clearAll() {
    const path = this.getCollectionPath();
    try {
      const snapshot = await getDocs(collection(db, path));
      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async seedData() {
    const path = this.getCollectionPath();
    try {
      const batch = writeBatch(db);
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      
      const seedTrades: Omit<Trade, 'id'>[] = [
        {
          symbol: 'AAPL', side: 'LONG',
          entryDate: new Date(now - 7 * day).toISOString(),
          exitDate: new Date(now - 6 * day).toISOString(),
          entryPrice: 170.50, exitPrice: 175.20, quantity: 100, fees: 2.50,
          stopLoss: 168.00, takeProfit: 176.00,
          notes: 'Good breakout setup, held through the chop.',
          setups: ['Breakout'], mistakes: [], emotions: ['Confident'],
          pnl: 467.50, status: 'CLOSED'
        },
        {
          symbol: 'TSLA', side: 'SHORT',
          entryDate: new Date(now - 5 * day).toISOString(),
          exitDate: new Date(now - 4 * day).toISOString(),
          entryPrice: 200.00, exitPrice: 205.00, quantity: 50, fees: 1.50,
          stopLoss: 206.00, takeProfit: 190.00,
          notes: 'Stopped out. Should have waited for confirmation.',
          setups: ['Reversal'], mistakes: ['FOMO', 'Early Entry'], emotions: ['Anxious', 'Frustrated'],
          pnl: -251.50, status: 'CLOSED'
        },
        {
          symbol: 'NVDA', side: 'LONG',
          entryDate: new Date(now - 2 * day).toISOString(),
          exitDate: new Date(now - 1 * day).toISOString(),
          entryPrice: 850.00, exitPrice: 880.00, quantity: 20, fees: 5.00,
          stopLoss: 840.00, takeProfit: 900.00,
          notes: 'Strong trend continuation.',
          setups: ['Pullback'], mistakes: ['Early Exit'], emotions: ['Calm'],
          pnl: 595.00, status: 'CLOSED'
        },
        {
          symbol: 'AMD', side: 'LONG',
          entryDate: new Date(now - 10 * day).toISOString(),
          exitDate: new Date(now - 9 * day).toISOString(),
          entryPrice: 160.00, exitPrice: 165.00, quantity: 100, fees: 2.00,
          stopLoss: 155.00, takeProfit: 170.00,
          notes: 'Nice bounce off support.',
          setups: ['Support Bounce'], mistakes: [], emotions: ['Patient'],
          pnl: 498.00, status: 'CLOSED'
        },
        {
          symbol: 'META', side: 'SHORT',
          entryDate: new Date(now - 12 * day).toISOString(),
          exitDate: new Date(now - 11 * day).toISOString(),
          entryPrice: 500.00, exitPrice: 510.00, quantity: 30, fees: 3.00,
          stopLoss: 515.00, takeProfit: 480.00,
          notes: 'Failed breakdown, got squeezed.',
          setups: ['Breakdown'], mistakes: ['Revenge Trading'], emotions: ['Angry'],
          pnl: -303.00, status: 'CLOSED'
        }
      ];

      for (const trade of seedTrades) {
        const newDocRef = doc(collection(db, path));
        batch.set(newDocRef, trade);
      }
      
      await batch.commit();
    } catch (error) {
      console.error("seedData error:", error);
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
};
