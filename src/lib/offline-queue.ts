export interface QueuedOperation {
  queueId: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  recordId?: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

const STORAGE_KEY = 'sls-offline-queue';
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private listeners: Set<() => void> = new Set();

  getQueue(): QueuedOperation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedOperation[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    this.notifyListeners();
  }

  addToQueue(op: {
    table: string;
    operation: 'create' | 'update' | 'delete';
    data: Record<string, any>;
    recordId?: string;
  }): string {
    const queue = this.getQueue();
    const queueId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newOp: QueuedOperation = {
      queueId,
      table: op.table,
      operation: op.operation,
      data: op.data,
      recordId: op.recordId,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    queue.push(newOp);
    this.saveQueue(queue);
    return queueId;
  }

  removeFromQueue(queueId: string) {
    const queue = this.getQueue().filter((op) => op.queueId !== queueId);
    this.saveQueue(queue);
  }

  updateStatus(queueId: string, status: QueuedOperation['status']) {
    const queue = this.getQueue().map((op) => {
      if (op.queueId === queueId) {
        return {
          ...op,
          status,
          retryCount: status === 'failed' ? op.retryCount + 1 : op.retryCount,
        };
      }
      return op;
    });
    this.saveQueue(queue);
  }

  getPendingCount(): number {
    return this.getQueue().filter((op) => op.status === 'pending' || op.status === 'failed').length;
  }

  getFailedOps(): QueuedOperation[] {
    return this.getQueue().filter((op) => op.status === 'failed' && op.retryCount < MAX_RETRIES);
  }

  getRetryableOps(): QueuedOperation[] {
    return this.getQueue().filter(
      (op) => (op.status === 'pending' || (op.status === 'failed' && op.retryCount < MAX_RETRIES))
    );
  }

  clearCompleted() {
    const queue = this.getQueue().filter((op) => op.status !== 'pending');
    this.saveQueue(queue);
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueueManager();
