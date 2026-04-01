// Module-level reactive singleton — guaranteed shared across all components
import { reactive, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface AppToast {
  id: number
  message: string
  type: ToastType
}

export interface ConfirmOptions {
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

// True singleton state — shared across the entire app
const state = reactive({
  toasts: [] as AppToast[],
  confirmOpen: false,
  confirmMessage: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
})

let _nextId = 0
let _confirmResolve: ((v: boolean) => void) | null = null

export function useAppToast() {
  function show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = _nextId++
    state.toasts.push({ id, message, type })
    setTimeout(() => {
      const idx = state.toasts.findIndex(t => t.id === id)
      if (idx !== -1) state.toasts.splice(idx, 1)
    }, duration)
  }

  const toast = {
    success: (msg: string) => show(msg, 'success'),
    error:   (msg: string) => show(msg, 'error'),
    info:    (msg: string) => show(msg, 'info'),
    warning: (msg: string) => show(msg, 'warning'),
  }

  function confirm(options: ConfirmOptions | string): Promise<boolean> {
    const opts = typeof options === 'string' ? { message: options } : options
    return new Promise(resolve => {
      _confirmResolve = resolve
      state.confirmMessage = opts.message
      state.confirmLabel   = opts.confirmLabel ?? 'Confirm'
      state.cancelLabel    = opts.cancelLabel ?? 'Cancel'
      state.confirmOpen    = true
    })
  }

  function resolveConfirm(value: boolean) {
    state.confirmOpen = false
    _confirmResolve?.(value)
    _confirmResolve = null
  }

  return { state: readonly(state), toast, confirm, resolveConfirm }
}
