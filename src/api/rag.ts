import { http, unwrap, type ApiResult } from './http';

export interface KnowledgeBase {
  id: number;
  name: string;
  code: string;
  description: string | null;
  collectionName: string;
  embeddingModel: string;
  embeddingDimension: number;
  status: string;
  documentCount: number;
  createTime: string;
  updateTime: string;
}

export interface RagDocument {
  id: number;
  knowledgeBaseId: number;
  fileId: number;
  title: string;
  sourceType: string;
  contentType: string;
  status: 'PENDING' | 'INDEXING' | 'INDEXED' | 'FAILED' | string;
  chunkCount: number;
  errorMessage: string | null;
  indexedAt: string | null;
  createTime: string;
  updateTime: string;
}

export interface SearchHit {
  chunkId: number;
  documentId: number;
  documentTitle: string;
  pageNumber: number;
  chunkIndex: number;
  score: number;
  content: string;
}

export interface SearchResponse {
  query: string;
  hits: SearchHit[];
}

export interface Citation {
  documentId: number;
  documentTitle: string;
  pageNumber: number;
  score: number;
}

export interface ChatResponse {
  sessionId: number;
  answer: string;
  citations: Citation[];
}

export const ragApi = {
  knowledgeBases() {
    return http.get<ApiResult<KnowledgeBase[]>>('/rag/knowledge-bases').then(unwrap);
  },
  createKnowledgeBase(payload: { name: string; code: string; description?: string }) {
    return http.post<ApiResult<KnowledgeBase>>('/rag/knowledge-bases', payload).then(unwrap);
  },
  documents(knowledgeBaseId: number) {
    return http
      .get<ApiResult<RagDocument[]>>(`/rag/knowledge-bases/${knowledgeBaseId}/documents`)
      .then(unwrap);
  },
  document(documentId: number) {
    return http.get<ApiResult<RagDocument>>(`/rag/documents/${documentId}`).then(unwrap);
  },
  uploadDocument(knowledgeBaseId: number, file: File, title?: string) {
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
  indexDocument(documentId: number) {
    return http
      .post<ApiResult<RagDocument>>(`/rag/documents/${documentId}/index`, undefined, {
        timeout: 30000,
      })
      .then(unwrap);
  },
  search(payload: { knowledgeBaseId: number; query: string; topK?: number }) {
    return http.post<ApiResult<SearchResponse>>('/rag/search', payload).then(unwrap);
  },
  chat(payload: { knowledgeBaseId: number; sessionId?: number; question: string; topK?: number }) {
    // Local Ollama may need longer than the 15s default while loading qwen3.5 or generating.
    return http
      .post<ApiResult<ChatResponse>>('/rag/chat', payload, { timeout: 180000 })
      .then(unwrap);
  },
};
