import { http, unwrap, type ApiResult } from './http';
import { readAccessToken } from '@/stores/auth-storage';
import { currentLocale } from '@/locales';

/** Snowflake IDs are transported as strings to avoid JavaScript number precision loss. */
export type PlatformId = string;

export interface KnowledgeBase {
  id: PlatformId;
  name: string;
  code: string;
  description: string | null;
  collectionName: string;
  embeddingModel: string;
  embeddingDimension: number;
  runtimeEmbeddingModel: string;
  runtimeEmbeddingDimension: number;
  embeddingConfigMatchesRuntime: boolean;
  status: string;
  documentCount: number;
  createTime: string;
  updateTime: string;
}

export interface RagDocument {
  id: PlatformId;
  knowledgeBaseId: PlatformId;
  fileId: PlatformId;
  sourceId: string | null;
  title: string;
  sourceType: string;
  contentType: string;
  status: 'PENDING' | 'INDEXING' | 'INDEXED' | 'FAILED' | string;
  chunkCount: number;
  charCount: number;
  indexProgress: number;
  indexStage: string | null;
  errorMessage: string | null;
  indexedAt: string | null;
  createTime: string;
  updateTime: string;
}

export interface SearchHit {
  chunkId: PlatformId;
  documentId: PlatformId;
  sourceId: string;
  documentTitle: string;
  pageNumber: number;
  chunkIndex: number;
  sectionNumber: string | null;
  sectionTitle: string | null;
  startOffset: number;
  endOffset: number;
  charCount: number;
  score: number;
  content: string;
}

export interface SearchResponse {
  query: string;
  hits: SearchHit[];
  retrievalMode: 'VECTOR' | 'KEYWORD' | 'HYBRID' | string;
  grounded: boolean;
  topScore: number;
}

export interface Citation {
  documentId: PlatformId;
  sourceId: string;
  documentTitle: string;
  pageNumber: number;
  chunkIndex: number;
  sectionNumber: string | null;
  sectionTitle: string | null;
  startOffset: number;
  endOffset: number;
  score: number;
}

export interface ChatResponse {
  sessionId: PlatformId;
  answer: string;
  citations: Citation[];
  grounded: boolean;
  retrievalCount: number;
}

export interface EvaluationDataset {
  id: PlatformId;
  code: string;
  name: string;
  version: string;
  source: string | null;
  description: string | null;
  caseCount: number;
  lastRunId: PlatformId | null;
  lastRunStatus: string | null;
  createTime: string;
  updateTime: string;
}

export interface EvaluationCase {
  id: PlatformId;
  datasetId: PlatformId;
  caseKey: string;
  category: string;
  language: string;
  question: string;
  expectedSourceIds: string[];
  actualSourceIds: string[];
  evidenceSelector: string | null;
  mustMention: string[];
  answerable: boolean;
  difficulty: string;
  sortOrder: number;
  createTime: string;
  updateTime: string;
}

export interface EvaluationRun {
  id: PlatformId;
  datasetId: PlatformId;
  knowledgeBaseId: PlatformId;
  mode: 'SEARCH' | 'CHAT' | string;
  topK: number;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | string;
  caseCount: number;
  completedCount: number;
  answerableCaseCount: number | null;
  unanswerableCaseCount: number | null;
  recallAt3: number | null;
  recallAt5: number | null;
  meanReciprocalRank: number | null;
  citationHitRate: number | null;
  noAnswerAccuracy: number | null;
  averageLatencyMs: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createTime: string;
}

export interface EvaluationRunCase {
  id: PlatformId;
  runId: PlatformId;
  caseId: PlatformId;
  caseKey: string;
  question: string;
  expectedSourceIds: string[];
  actualSourceIds: string[];
  retrievedSourceIds: string[];
  citedSourceIds: string[];
  answerRefused: boolean;
  recallHit: boolean;
  citationHit: boolean;
  firstRelevantRank: number | null;
  latencyMs: number;
  answerPreview: string | null;
  errorMessage: string | null;
}

export interface ChatStreamHandlers {
  onToken?: (token: string) => void;
}

export const ragApi = {
  knowledgeBases() {
    return http.get<ApiResult<KnowledgeBase[]>>('/rag/knowledge-bases').then(unwrap);
  },
  createKnowledgeBase(payload: { name: string; code: string; description?: string }) {
    return http.post<ApiResult<KnowledgeBase>>('/rag/knowledge-bases', payload).then(unwrap);
  },
  documents(knowledgeBaseId: PlatformId) {
    return http
      .get<ApiResult<RagDocument[]>>(`/rag/knowledge-bases/${knowledgeBaseId}/documents`)
      .then(unwrap);
  },
  document(documentId: PlatformId) {
    return http.get<ApiResult<RagDocument>>(`/rag/documents/${documentId}`).then(unwrap);
  },
  deleteDocument(documentId: PlatformId) {
    return http.delete<ApiResult<void>>(`/rag/documents/${documentId}`).then(unwrap);
  },
  uploadDocument(knowledgeBaseId: PlatformId, file: File, title?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (title?.trim()) {
      formData.append('title', title.trim());
    }
    return http
      .post<ApiResult<RagDocument>>(`/rag/knowledge-bases/${knowledgeBaseId}/documents`, formData, {
        timeout: 120000,
      })
      .then(unwrap);
  },
  indexDocument(documentId: PlatformId) {
    return http
      .post<ApiResult<RagDocument>>(`/rag/documents/${documentId}/index`, undefined, {
        timeout: 30000,
      })
      .then(unwrap);
  },
  cancelIndex(documentId: PlatformId) {
    return http
      .post<ApiResult<RagDocument>>(`/rag/documents/${documentId}/index/cancel`, undefined, {
        timeout: 30000,
      })
      .then(unwrap);
  },
  search(payload: { knowledgeBaseId: PlatformId; query: string; topK?: number }) {
    return http.post<ApiResult<SearchResponse>>('/rag/search', payload).then(unwrap);
  },
  chat(payload: {
    knowledgeBaseId: PlatformId;
    sessionId?: PlatformId;
    question: string;
    topK?: number;
  }) {
    // Local Ollama may need longer than the 15s default while loading qwen3.5 or generating.
    return http
      .post<ApiResult<ChatResponse>>('/rag/chat', payload, { timeout: 180000 })
      .then(unwrap);
  },
  async chatStream(
    payload: {
      knowledgeBaseId: PlatformId;
      sessionId?: PlatformId;
      question: string;
      topK?: number;
    },
    handlers: ChatStreamHandlers = {},
  ): Promise<ChatResponse> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
    const token = readAccessToken();
    const response = await fetch(`${baseUrl}/rag/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Accept-Language': currentLocale(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let message = `问答请求失败（HTTP ${response.status}）`;
      try {
        const error = (await response.json()) as { message?: string };
        message = error.message || message;
      } catch {
        // Keep the HTTP fallback when the server returned a non-JSON error page.
      }
      throw new Error(message);
    }
    if (!response.body) throw new Error('浏览器不支持流式响应');

    let sessionId = '';
    let citations: Citation[] = [];
    let grounded = false;
    let retrievalCount = 0;
    let answer = '';
    let eventName = 'message';
    let dataLines: string[] = [];
    let completed = false;
    const decoder = new TextDecoder();

    const consumeEvent = () => {
      if (dataLines.length === 0) return;
      const data = dataLines.join('\n');
      if (eventName === 'meta') {
        const meta = JSON.parse(data) as { sessionId: PlatformId; citations: Citation[] };
        sessionId = meta.sessionId;
        citations = meta.citations;
      } else if (eventName === 'token') {
        let tokenText = data;
        try {
          tokenText = JSON.parse(data) as string;
        } catch {
          // SseEmitter may serialize a plain String as-is; both forms are supported.
        }
        answer += tokenText;
        handlers.onToken?.(tokenText);
      } else if (eventName === 'done') {
        const done = JSON.parse(data) as {
          grounded: boolean;
          retrievalCount: number;
          answer?: string;
        };
        grounded = done.grounded;
        retrievalCount = done.retrievalCount;
        if (typeof done.answer === 'string') answer = done.answer;
        completed = true;
      } else if (eventName === 'error') {
        throw new Error(data || '问答失败');
      }
      eventName = 'message';
      dataLines = [];
    };

    const consumeLine = (line: string) => {
      if (line === '') consumeEvent();
      else if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    };

    const reader = response.body.getReader();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      lines.forEach(consumeLine);
      if (done) break;
    }
    // A server or proxy may close immediately after the final data line without
    // writing the usual blank line. Flush both the decoder and that last line.
    buffer += decoder.decode();
    if (buffer.length > 0) consumeLine(buffer.replace(/\r$/, ''));
    if (dataLines.length > 0) consumeEvent();
    if (!completed) throw new Error('问答流未正常结束，答案可能不完整，请重试');
    return { sessionId, answer, citations, grounded, retrievalCount };
  },
  evaluationDatasets() {
    return http.get<ApiResult<EvaluationDataset[]>>('/rag/evaluations/datasets').then(unwrap);
  },
  createEvaluationDataset(payload: {
    code: string;
    name: string;
    version: string;
    source?: string;
    description?: string;
  }) {
    return http
      .post<ApiResult<EvaluationDataset>>('/rag/evaluations/datasets', payload)
      .then(unwrap);
  },
  importIntelEvaluationDataset() {
    return http
      .post<ApiResult<EvaluationDataset>>('/rag/evaluations/datasets/import-intel-v0-2')
      .then(unwrap);
  },
  updateEvaluationDataset(
    datasetId: PlatformId,
    payload: { code: string; name: string; version: string; source?: string; description?: string },
  ) {
    return http
      .put<ApiResult<EvaluationDataset>>(`/rag/evaluations/datasets/${datasetId}`, payload)
      .then(unwrap);
  },
  deleteEvaluationDataset(datasetId: PlatformId) {
    return http.delete<ApiResult<void>>(`/rag/evaluations/datasets/${datasetId}`).then(unwrap);
  },
  evaluationCases(datasetId: PlatformId) {
    return http
      .get<ApiResult<EvaluationCase[]>>(`/rag/evaluations/datasets/${datasetId}/cases`)
      .then(unwrap);
  },
  createEvaluationCase(
    datasetId: PlatformId,
    payload: {
      caseKey: string;
      category: string;
      language: string;
      question: string;
      expectedSourceIds: string[];
      actualSourceIds?: string[];
      evidenceSelector?: string | null;
      mustMention: string[];
      answerable: boolean;
      difficulty: string;
      sortOrder: number;
    },
  ) {
    return http
      .post<ApiResult<EvaluationCase>>(`/rag/evaluations/datasets/${datasetId}/cases`, payload)
      .then(unwrap);
  },
  updateEvaluationCase(caseId: PlatformId, payload: Omit<EvaluationCase, 'id' | 'datasetId' | 'createTime' | 'updateTime'>) {
    return http
      .put<ApiResult<EvaluationCase>>(`/rag/evaluations/cases/${caseId}`, payload)
      .then(unwrap);
  },
  deleteEvaluationCase(caseId: PlatformId) {
    return http.delete<ApiResult<void>>(`/rag/evaluations/cases/${caseId}`).then(unwrap);
  },
  evaluationRuns(datasetId: PlatformId) {
    return http.get<ApiResult<EvaluationRun[]>>(`/rag/evaluations/datasets/${datasetId}/runs`).then(unwrap);
  },
  startEvaluationRun(payload: { datasetId: PlatformId; knowledgeBaseId: PlatformId; mode: string; topK: number }) {
    return http
      .post<ApiResult<EvaluationRun>>('/rag/evaluations/runs', payload, { timeout: 30000 })
      .then(unwrap);
  },
  evaluationRun(runId: PlatformId) {
    return http.get<ApiResult<EvaluationRun>>(`/rag/evaluations/runs/${runId}`).then(unwrap);
  },
  evaluationRunCases(runId: PlatformId) {
    return http.get<ApiResult<EvaluationRunCase[]>>(`/rag/evaluations/runs/${runId}/cases`).then(unwrap);
  },
};
