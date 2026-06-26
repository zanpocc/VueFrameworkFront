import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ElNotification } from 'element-plus';
import { RealtimeClient, type RealtimeEvent } from '@/api/realtime';
import { i18n } from '@/locales';

export interface NoticeRealtimePayload {
  action: 'PUBLISHED' | 'REVOKED' | 'DELETED';
  id: number;
  title: string;
  noticeType: string;
  status: string;
  publisher: string | null;
  publishedAt: string | null;
}

export interface NoticeNotification {
  eventId: string;
  eventType: string;
  title: string;
  action: NoticeRealtimePayload['action'];
  occurredAt: string;
}

export const useNotificationStore = defineStore('notifications', () => {
  const connected = ref(false);
  const unreadCount = ref(0);
  const lastNoticeSequence = ref(0);
  const notices = ref<NoticeNotification[]>([]);
  let client: RealtimeClient | null = null;

  const hasUnread = computed(() => unreadCount.value > 0);

  function connect() {
    if (client) {
      return;
    }
    client = new RealtimeClient({
      onOpen: () => {
        connected.value = true;
      },
      onClose: () => {
        connected.value = false;
      },
      onError: () => {
        connected.value = false;
      },
      onEvent: handleEvent,
    });
    client.start();
  }

  function disconnect() {
    client?.stop();
    client = null;
    connected.value = false;
  }

  function markAllRead() {
    unreadCount.value = 0;
  }

  function handleEvent(event: RealtimeEvent) {
    if (!event.type.startsWith('notice.')) {
      return;
    }
    const payload = event.payload as unknown as NoticeRealtimePayload;
    lastNoticeSequence.value += 1;
    unreadCount.value += 1;
    notices.value = [
      {
        eventId: event.id,
        eventType: event.type,
        title: payload.title,
        action: payload.action,
        occurredAt: event.occurredAt,
      },
      ...notices.value,
    ].slice(0, 10);
    ElNotification.info({
      title: i18n.global.t('layout.notifications.noticeTitle'),
      message: i18n.global.t(`layout.notifications.actions.${payload.action.toLowerCase()}`, {
        title: payload.title,
      }),
      duration: 4000,
    });
  }

  return {
    connected,
    unreadCount,
    hasUnread,
    lastNoticeSequence,
    notices,
    connect,
    disconnect,
    markAllRead,
  };
});
