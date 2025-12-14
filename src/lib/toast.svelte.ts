export type ToastType = 'success' | 'failure' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toasts = $state<Toast[]>([]);

export function getToasts() {
  return toasts;
}

export function addToast(message: string, type: ToastType = 'info') {
  const id = crypto.randomUUID();
  toasts.push({ id, message, type });
}

export function removeToast(id: string) {
  const index = toasts.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
  }
}
