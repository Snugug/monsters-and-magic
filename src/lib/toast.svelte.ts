/* istanbul ignore file */
export type ToastType = 'success' | 'failure' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

class ToastManager {
  toasts = $state<Toast[]>([]);
}
const manager = new ToastManager();

export function getToasts() {
  return manager.toasts;
}

export function addToast(message: string, type: ToastType = 'info') {
  const id = crypto.randomUUID();
  manager.toasts.push({ id, message, type });
}

export function removeToast(id: string) {
  const index = manager.toasts.findIndex((t) => t.id === id);
  if (index !== -1) {
    manager.toasts.splice(index, 1);
  }
}
