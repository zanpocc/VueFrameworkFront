<template>
  <QfPageShell class="agent-workbench">
    <QfPageHeader
      :title="t('agent.workbench.title')"
      :description="t('agent.workbench.description')"
    >
      <template #actions>
        <el-tag type="success" effect="light">{{ t('agent.workbench.springAi') }}</el-tag>
      </template>
    </QfPageHeader>

    <section class="agent-workbench__architecture">
      <div class="agent-workbench__node agent-workbench__node--browser">
        <span class="agent-workbench__node-label">{{ t('agent.workbench.browser') }}</span>
        <strong>Vue</strong>
      </div>
      <span class="agent-workbench__arrow">→</span>
      <div class="agent-workbench__node agent-workbench__node--java">
        <span class="agent-workbench__node-label">{{ t('agent.workbench.gateway') }}</span>
        <strong>Java Agent</strong>
      </div>
      <span class="agent-workbench__arrow">→</span>
      <div class="agent-workbench__node agent-workbench__node--tool">
        <span class="agent-workbench__node-label">{{ t('agent.workbench.tool') }}</span>
        <strong>Java RAG</strong>
      </div>
      <span class="agent-workbench__arrow">→</span>
      <div class="agent-workbench__node agent-workbench__node--spring-ai">
        <span class="agent-workbench__node-label">{{ t('agent.workbench.orchestrator') }}</span>
        <strong>Spring AI</strong>
      </div>
    </section>

    <section class="agent-workbench__layout">
      <QfTablePanel
        :title="t('agent.workbench.requestTitle')"
        :description="t('agent.workbench.requestDescription')"
      >
        <div class="agent-workbench__form">
          <el-form label-position="top">
            <el-form-item :label="t('agent.workbench.knowledgeBase')">
              <el-select
                v-model="selectedKnowledgeBaseId"
                class="agent-workbench__control"
                filterable
                :loading="loading"
                :placeholder="t('agent.workbench.selectKnowledgeBase')"
              >
                <el-option
                  v-for="item in knowledgeBases"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('agent.workbench.question')">
              <el-input
                v-model="question"
                type="textarea"
                :rows="5"
                maxlength="4000"
                show-word-limit
                :placeholder="t('agent.workbench.questionPlaceholder')"
              />
            </el-form-item>
            <el-form-item :label="t('agent.workbench.topK')">
              <el-input-number v-model="topK" :min="1" :max="20" />
            </el-form-item>
            <div class="agent-workbench__actions">
              <el-button type="primary" :loading="running" :disabled="!canSearch" @click="runAgent">
                {{ t('agent.workbench.runAgent') }}
              </el-button>
            </div>
          </el-form>
        </div>
      </QfTablePanel>

      <QfTablePanel
        :title="t('agent.workbench.resultTitle')"
        :description="t('agent.workbench.resultDescription')"
      >
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" />
        <el-alert
          v-if="lastResult"
          class="agent-workbench__trace"
          :title="`${t('agent.workbench.runId')}: ${lastResult.runId}`"
          :description="`${lastResult.orchestrator} · ${lastResult.model} · ${lastResult.phase} · ${lastResult.intent}`"
          :type="lastResult.grounded ? 'success' : 'warning'"
          :closable="false"
        />
        <div v-if="lastResult" class="agent-workbench__answer">
          <div class="agent-workbench__result-summary">
            <strong>{{ t('agent.workbench.answer') }}</strong>
            <span
              >{{ t('agent.workbench.hitCount', { count: lastResult.retrievalCount }) }} ·
              {{
                t('agent.workbench.evidenceCount', { count: lastResult.evidenceIndexes.length })
              }}</span
            >
          </div>
          <div class="agent-workbench__answer-content">{{ lastResult.answer }}</div>
          <div v-if="lastResult.citations.length" class="agent-workbench__citations">
            <strong>{{ t('agent.workbench.citations') }}</strong>
            <div
              v-for="(citation, index) in lastResult.citations"
              :key="`${citation.sourceId}-${index}`"
              class="agent-workbench__citation"
            >
              <span>[{{ index + 1 }}]</span>
              <span
                >{{ citation.documentTitle }} · p.{{ citation.pageNumber }} · #{{
                  citation.chunkIndex + 1
                }}</span
              >
            </div>
          </div>
          <div v-if="lastResult.toolCalls.length" class="agent-workbench__tool-calls">
            <el-tag
              v-for="(call, index) in lastResult.toolCalls"
              :key="`${call.name}-${index}`"
              size="small"
              type="info"
            >
              {{ call.name }} · {{ call.status }}{{ call.summary ? ` · ${call.summary}` : '' }}
            </el-tag>
          </div>
        </div>
        <el-empty v-else :description="t('agent.workbench.emptyResult')" />
      </QfTablePanel>
    </section>

    <QfTablePanel
      :title="t('agent.workbench.toolsTitle')"
      :description="t('agent.workbench.toolsDescription')"
    >
      <el-table :data="toolCatalog" size="small">
        <el-table-column prop="name" :label="t('agent.workbench.toolName')" width="180" />
        <el-table-column
          prop="description"
          :label="t('agent.workbench.toolDescription')"
          min-width="360"
        />
      </el-table>
    </QfTablePanel>
  </QfPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { agentApi, type AgentChatResponse, type AgentToolDefinition } from '@/api/agent';
import { ragApi, type KnowledgeBase, type PlatformId } from '@/api/rag';
import { QfPageHeader, QfPageShell, QfTablePanel } from '@/shared';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'AgentWorkbenchView' });

const { t } = useI18n();
const knowledgeBases = ref<KnowledgeBase[]>([]);
const selectedKnowledgeBaseId = ref<PlatformId>();
const question = ref('');
const topK = ref(5);
const toolCatalog = ref<AgentToolDefinition[]>([]);
const lastResult = ref<AgentChatResponse>();
const loading = ref(false);
const running = ref(false);
const errorMessage = ref('');

const canSearch = computed(() => Boolean(selectedKnowledgeBaseId.value && question.value.trim()));

async function loadPage() {
  loading.value = true;
  try {
    const [bases, tools] = await Promise.all([ragApi.knowledgeBases(), agentApi.tools()]);
    knowledgeBases.value = bases;
    toolCatalog.value = tools;
    if (!selectedKnowledgeBaseId.value) selectedKnowledgeBaseId.value = bases[0]?.id;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('agent.workbench.loadFailed'));
  } finally {
    loading.value = false;
  }
}

async function runAgent() {
  if (!canSearch.value || !selectedKnowledgeBaseId.value) return;
  running.value = true;
  errorMessage.value = '';
  try {
    lastResult.value = await agentApi.chat({
      knowledgeBaseId: selectedKnowledgeBaseId.value,
      question: question.value.trim(),
      topK: topK.value,
    });
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('agent.workbench.runFailed');
  } finally {
    running.value = false;
  }
}

onMounted(() => void loadPage());
</script>

<style scoped>
.agent-workbench {
  display: grid;
  gap: var(--qf-spacing-lg);
}
.agent-workbench__architecture {
  display: flex;
  gap: var(--qf-spacing-sm);
  align-items: stretch;
  justify-content: center;
  padding: var(--qf-spacing-md);
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius);
  box-shadow: var(--qf-shadow-panel);
}
.agent-workbench__node {
  display: grid;
  gap: var(--qf-spacing-2xs);
  min-width: 130px;
  padding: var(--qf-spacing-sm) var(--qf-spacing-md);
  background: var(--qf-color-bg-muted);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius-sm);
  text-align: center;
}
.agent-workbench__node--java {
  border-color: var(--qf-color-primary-light);
}
.agent-workbench__node--tool {
  border-color: var(--qf-color-success-light);
}
.agent-workbench__node--spring-ai {
  border-color: var(--qf-color-brand-highlight);
}
.agent-workbench__node-label {
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-xs);
}
.agent-workbench__arrow {
  align-self: center;
  color: var(--qf-color-text-placeholder);
  font-size: 20px;
}
.agent-workbench__layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.4fr);
  gap: var(--qf-spacing-md);
  align-items: start;
}
.agent-workbench__form {
  padding: var(--qf-card-padding);
}
.agent-workbench__control {
  width: 100%;
}
.agent-workbench__actions {
  display: flex;
  gap: var(--qf-spacing-sm);
}
.agent-workbench__trace {
  margin-bottom: var(--qf-spacing-md);
}
.agent-workbench__result-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--qf-spacing-sm);
}
.agent-workbench__result-summary span {
  color: var(--qf-color-text-secondary);
}
.agent-workbench__answer-content {
  max-height: 420px;
  overflow: auto;
  padding: var(--qf-spacing-md);
  background: var(--qf-color-bg-muted);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius-sm);
  line-height: 1.8;
  white-space: pre-wrap;
}
.agent-workbench__citations {
  display: grid;
  gap: var(--qf-spacing-xs);
  margin-top: var(--qf-spacing-md);
}
.agent-workbench__citation {
  display: flex;
  gap: var(--qf-spacing-xs);
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-sm);
}
.agent-workbench__tool-calls {
  display: flex;
  gap: var(--qf-spacing-xs);
  margin-top: var(--qf-spacing-md);
}
@media (width <= 900px) {
  .agent-workbench__architecture {
    flex-wrap: wrap;
  }
  .agent-workbench__arrow {
    transform: rotate(90deg);
  }
  .agent-workbench__layout {
    grid-template-columns: 1fr;
  }
}
</style>
