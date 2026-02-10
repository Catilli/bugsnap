import toast from 'react-hot-toast';

export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyError(message: string) {
  toast.error(message);
}

export function notifyWarning(message: string) {
  toast(message, { icon: '\u26a0\ufe0f' });
}

export function notifyInfo(message: string) {
  toast(message, { icon: '\u2139\ufe0f' });
}
