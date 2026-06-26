import { currentLocale } from '@/locales';
import { readAccessToken } from '@/stores/auth-storage';

export interface RealtimeEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  scope: string;
  occurredAt: string;
  payload: T;
}

export interface RealtimeClientOptions {
  onEvent: (event: RealtimeEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: unknown) => void;
  retryDelayMs?: number;
}

interface SseFrame {
  id?: string;
  event?: string;
  data: string;
}

export class RealtimeClient {
  private controller: AbortController | null = null;
  private stopped = true;
  private retryTimer: number | null = null;

  constructor(private readonly options: RealtimeClientOptions) {}

  start() {
    if (!this.stopped) {
      return;
    }
    this.stopped = false;
    void this.connect();
  }

  stop() {
    this.stopped = true;
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.controller?.abort();
    this.controller = null;
    this.options.onClose?.();
  }

  private async connect() {
    const token = readAccessToken();
    if (!token || this.stopped) {
      this.stop();
      return;
    }

    this.controller = new AbortController();
    try {
      const response = await fetch(realtimeUrl('/realtime/events'), {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
          'Accept-Language': currentLocale(),
        },
        signal: this.controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        this.stop();
        return;
      }
      if (!response.ok || !response.body) {
        throw new Error(`Realtime stream failed: ${response.status}`);
      }

      this.options.onOpen?.();
      await parseEventStream(response.body, (frame) => {
        if (!frame.data.trim()) {
          return;
        }
        const parsed = JSON.parse(frame.data) as RealtimeEvent;
        this.options.onEvent({ ...parsed, type: frame.event || parsed.type, id: frame.id || parsed.id });
      });
      if (!this.stopped) {
        this.scheduleReconnect();
      }
    } catch (error) {
      if (!this.stopped && !this.controller?.signal.aborted) {
        this.options.onError?.(error);
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.stopped || this.retryTimer !== null) {
      return;
    }
    const delay = this.options.retryDelayMs ?? 3000;
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      void this.connect();
    }, delay);
  }
}

export async function parseEventStream(
  stream: ReadableStream<Uint8Array>,
  onFrame: (frame: SseFrame) => void,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    buffer = consumeFrames(buffer, onFrame);
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    parseFrame(buffer, onFrame);
  }
}

function consumeFrames(buffer: string, onFrame: (frame: SseFrame) => void) {
  let normalized = buffer.replace(/\r\n/g, '\n');
  let separator = normalized.indexOf('\n\n');
  while (separator >= 0) {
    const frame = normalized.slice(0, separator);
    parseFrame(frame, onFrame);
    normalized = normalized.slice(separator + 2);
    separator = normalized.indexOf('\n\n');
  }
  return normalized;
}

function parseFrame(raw: string, onFrame: (frame: SseFrame) => void) {
  const frame: SseFrame = { data: '' };
  for (const line of raw.split('\n')) {
    if (!line || line.startsWith(':')) {
      continue;
    }
    const index = line.indexOf(':');
    const field = index >= 0 ? line.slice(0, index) : line;
    const value = index >= 0 ? line.slice(index + 1).replace(/^ /, '') : '';
    if (field === 'id') {
      frame.id = value;
    } else if (field === 'event') {
      frame.event = value;
    } else if (field === 'data') {
      frame.data += frame.data ? `\n${value}` : value;
    }
  }
  onFrame(frame);
}

function realtimeUrl(path: string) {
  const base = import.meta.env.VITE_API_BASE_URL ?? '/api';
  return `${base.replace(/\/$/, '')}${path}`;
}
