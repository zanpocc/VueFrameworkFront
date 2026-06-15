import { ref, type Ref } from 'vue';
import { http } from '@/api/http';
import { readAccessToken } from '@/stores/auth-storage';

/**
 * Composable for downloading files via blob URL.
 *
 * Handles the common pattern: fetch blob → create object URL → trigger
 * download via hidden anchor → cleanup.
 */
export interface UseDownloadReturn {
  /** Download a file from the given API path. The filename is used for the save-as dialog. */
  download: (apiPath: string, filename: string) => Promise<void>;
  /** Whether a download is in progress. */
  downloading: Ref<boolean>;
}

export function useDownload(): UseDownloadReturn {
  const downloading = ref(false);

  async function download(apiPath: string, filename: string): Promise<void> {
    downloading.value = true;
    try {
      const token = readAccessToken();
      const response = await http.get<Blob>(apiPath, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      downloading.value = false;
    }
  }

  return { download, downloading };
}
