<template>
  <QfPageShell class="model-config-page">
    <QfPageHeader :title="t('modelConfig.title')" :description="t('modelConfig.description')">
      <template #actions>
        <el-button :loading="loading" @click="loadConfig">{{ t('modelConfig.reload') }}</el-button>
        <QfPermissionButton
          code="system:config:update"
          type="primary"
          :loading="saving"
          @click="saveConfig"
        >
          {{ t('modelConfig.save') }}
        </QfPermissionButton>
      </template>
    </QfPageHeader>

    <el-alert
      class="model-config-page__notice"
      :title="t('modelConfig.restartNotice')"
      type="warning"
      :closable="false"
      show-icon
    />

    <div class="model-config-page__grid">
      <QfTablePanel
        :title="t('modelConfig.chat.title')"
        :description="t('modelConfig.chat.description')"
      >
        <template #actions>
          <QfPermissionButton
            code="system:config:update"
            size="small"
            :loading="testing === 'CHAT'"
            @click="testConnection('CHAT')"
          >
            {{ t('modelConfig.testConnection') }}
          </QfPermissionButton>
        </template>
        <el-form label-position="top" class="model-config-page__form">
          <el-form-item :label="t('modelConfig.chat.enabled')">
            <el-switch v-model="form.chatEnabled" />
          </el-form-item>
          <el-form-item :label="t('modelConfig.chat.protocol')">
            <el-select v-model="form.chatProtocol" class="model-config-page__control">
              <el-option value="OLLAMA" :label="t('modelConfig.chat.ollama')" />
              <el-option value="OPENAI" :label="t('modelConfig.chat.openai')" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('modelConfig.chat.baseUrl')">
            <el-input
              v-model="form.chatBaseUrl"
              :placeholder="t('modelConfig.chat.baseUrlPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('modelConfig.chat.apiKey')">
            <el-input
              v-model="form.chatApiKey"
              type="password"
              show-password
              :placeholder="t('modelConfig.chat.apiKeyPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('modelConfig.chat.model')">
            <el-input
              v-model="form.chatModel"
              :placeholder="t('modelConfig.chat.modelPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('modelConfig.chat.timeout')">
            <el-input
              v-model="form.chatTimeout"
              :placeholder="t('modelConfig.chat.timeoutPlaceholder')"
            />
          </el-form-item>
          <el-form-item
            v-if="form.chatProtocol === 'OLLAMA'"
            :label="t('modelConfig.chat.disableThinking')"
          >
            <el-switch v-model="form.chatDisableThinking" />
          </el-form-item>
        </el-form>
        <div v-if="testResults.CHAT" class="model-config-page__probe-result">
          <el-tag :type="testResults.CHAT.success ? 'success' : 'danger'" size="small">
            {{
              testResults.CHAT.success ? t('modelConfig.testSuccess') : t('modelConfig.testFailed')
            }}
          </el-tag>
          <span>{{ testResults.CHAT.message }}</span>
          <span v-if="testResults.CHAT.model">{{ testResults.CHAT.model }}</span>
          <span v-if="testResults.CHAT.latencyMs">{{ testResults.CHAT.latencyMs }} ms</span>
        </div>
      </QfTablePanel>

      <QfTablePanel
        :title="t('modelConfig.embedding.title')"
        :description="t('modelConfig.embedding.description')"
      >
        <template #actions>
          <QfPermissionButton
            code="system:config:update"
            size="small"
            :loading="testing === 'EMBEDDING'"
            @click="testConnection('EMBEDDING')"
          >
            {{ t('modelConfig.testConnection') }}
          </QfPermissionButton>
        </template>
        <el-form label-position="top" class="model-config-page__form">
          <el-form-item :label="t('modelConfig.embedding.enabled')">
            <el-switch v-model="form.embeddingEnabled" />
          </el-form-item>
          <el-form-item :label="t('modelConfig.embedding.baseUrl')">
            <el-input
              v-model="form.embeddingBaseUrl"
              :placeholder="t('modelConfig.embedding.baseUrlPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('modelConfig.embedding.apiKey')">
            <el-input
              v-model="form.embeddingApiKey"
              type="password"
              show-password
              :placeholder="t('modelConfig.embedding.apiKeyPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('modelConfig.embedding.model')">
            <el-input
              v-model="form.embeddingModel"
              :placeholder="t('modelConfig.embedding.modelPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('modelConfig.embedding.dimensions')">
            <el-input-number v-model="form.embeddingDimensions" :min="1" :max="8192" />
          </el-form-item>
          <el-form-item :label="t('modelConfig.embedding.timeout')">
            <el-input
              v-model="form.embeddingTimeout"
              :placeholder="t('modelConfig.embedding.timeoutPlaceholder')"
            />
          </el-form-item>
        </el-form>
        <div v-if="testResults.EMBEDDING" class="model-config-page__probe-result">
          <el-tag :type="testResults.EMBEDDING.success ? 'success' : 'danger'" size="small">
            {{
              testResults.EMBEDDING.success
                ? t('modelConfig.testSuccess')
                : t('modelConfig.testFailed')
            }}
          </el-tag>
          <span>{{ testResults.EMBEDDING.message }}</span>
          <span v-if="testResults.EMBEDDING.model">{{ testResults.EMBEDDING.model }}</span>
          <span v-if="testResults.EMBEDDING.dimensions">
            {{ testResults.EMBEDDING.dimensions }}D
          </span>
          <span v-if="testResults.EMBEDDING.latencyMs">
            {{ testResults.EMBEDDING.latencyMs }} ms
          </span>
        </div>
      </QfTablePanel>
    </div>

    <QfTablePanel
      :title="t('modelConfig.runtime.title')"
      :description="t('modelConfig.runtime.description')"
    >
      <el-descriptions v-if="runtimeConfig" :column="2" border>
        <el-descriptions-item :label="t('modelConfig.runtime.chatModel')">
          {{ runtimeConfig.chat.model || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('modelConfig.runtime.chatProtocol')">
          {{ runtimeConfig.chat.protocol || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('modelConfig.runtime.chatBaseUrl')">
          {{ runtimeConfig.chat.baseUrl || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('modelConfig.runtime.embeddingModel')">
          {{ runtimeConfig.embedding.model || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('modelConfig.runtime.embeddingDimensions')">
          {{ runtimeConfig.embedding.dimensions || '-' }}D
        </el-descriptions-item>
        <el-descriptions-item :label="t('modelConfig.runtime.embeddingBaseUrl')">
          {{ runtimeConfig.embedding.baseUrl || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('modelConfig.runtime.qdrantCollection')">
          {{ runtimeConfig.qdrantCollectionName || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else :description="t('modelConfig.runtime.unavailable')" />
    </QfTablePanel>

    <QfTablePanel
      :title="t('modelConfig.consistency.title')"
      :description="t('modelConfig.consistency.description')"
    >
      <el-alert
        v-if="hasEmbeddingMismatch"
        class="model-config-page__consistency-alert"
        :title="t('modelConfig.consistency.warning')"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-table v-if="knowledgeBases.length" :data="knowledgeBases" border stripe>
        <el-table-column
          prop="name"
          :label="t('modelConfig.consistency.knowledgeBase')"
          min-width="180"
        />
        <el-table-column :label="t('modelConfig.consistency.savedConfig')" min-width="210">
          <template #default="{ row }">
            {{ row.embeddingModel || '-' }} · {{ row.embeddingDimension || '-' }}D
          </template>
        </el-table-column>
        <el-table-column :label="t('modelConfig.consistency.runtimeConfig')" min-width="210">
          <template #default="{ row }">
            {{ row.runtimeEmbeddingModel || '-' }} · {{ row.runtimeEmbeddingDimension || '-' }}D
          </template>
        </el-table-column>
        <el-table-column :label="t('modelConfig.consistency.status')" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.embeddingConfigMatchesRuntime ? 'success' : 'danger'" size="small">
              {{
                row.embeddingConfigMatchesRuntime
                  ? t('modelConfig.consistency.match')
                  : t('modelConfig.consistency.mismatch')
              }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else :description="t('modelConfig.consistency.empty')" />
    </QfTablePanel>
  </QfPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { systemApi, type ConfigCommand, type SysConfig } from '@/api/system';
import {
  ragApi,
  type KnowledgeBase,
  type ModelConnectionTestResult,
  type ModelRuntimeConfig,
} from '@/api/rag';
import { QfPageHeader, QfPageShell, QfPermissionButton, QfTablePanel } from '@/shared';

defineOptions({ name: 'AiModelConfig' });

const { t } = useI18n();
const loading = ref(false);
const saving = ref(false);
const configs = ref<SysConfig[]>([]);
const runtimeConfig = ref<ModelRuntimeConfig>();
const knowledgeBases = ref<KnowledgeBase[]>([]);
const testing = ref<'CHAT' | 'EMBEDDING' | null>(null);
const testResults = reactive<Partial<Record<'CHAT' | 'EMBEDDING', ModelConnectionTestResult>>>({});
const form = reactive({
  chatEnabled: true,
  chatProtocol: 'OLLAMA',
  chatBaseUrl: 'http://127.0.0.1:11434',
  chatApiKey: '',
  chatModel: 'qwen3.5:4b',
  chatTimeout: '180s',
  chatDisableThinking: true,
  embeddingEnabled: true,
  embeddingBaseUrl: 'http://127.0.0.1:11434/v1',
  embeddingApiKey: '',
  embeddingModel: 'nomic-embed-text',
  embeddingDimensions: 768,
  embeddingTimeout: '30s',
});

const configMap = computed(() => new Map(configs.value.map((item) => [item.configKey, item])));

function textValue(key: string, fallback: string) {
  const value = configMap.value.get(key)?.configValue;
  return value && value !== '******' ? value : fallback;
}

function boolValue(key: string, fallback: boolean) {
  return textValue(key, String(fallback)).toLowerCase() === 'true';
}

function numberValue(key: string, fallback: number) {
  const value = Number.parseInt(textValue(key, String(fallback)), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function applyConfigValues() {
  Object.assign(form, {
    chatEnabled: boolValue('quickframework.ai.chat.enabled', true),
    chatProtocol: textValue('quickframework.ai.chat.protocol', 'OLLAMA').toUpperCase(),
    chatBaseUrl: textValue('quickframework.ai.chat.base-url', 'http://127.0.0.1:11434'),
    chatApiKey: '',
    chatModel: textValue('quickframework.ai.chat.model', 'qwen3.5:4b'),
    chatTimeout: textValue('quickframework.ai.chat.timeout', '180s'),
    chatDisableThinking: boolValue('quickframework.ai.chat.disable-thinking', true),
    embeddingEnabled: boolValue('quickframework.ai.embedding.enabled', true),
    embeddingBaseUrl: textValue(
      'quickframework.ai.embedding.base-url',
      'http://127.0.0.1:11434/v1',
    ),
    embeddingApiKey: '',
    embeddingModel: textValue('quickframework.ai.embedding.model', 'nomic-embed-text'),
    embeddingDimensions: numberValue('quickframework.ai.embedding.dimensions', 768),
    embeddingTimeout: textValue('quickframework.ai.embedding.timeout', '30s'),
  });
}

async function loadConfig() {
  loading.value = true;
  try {
    const [configRows, runtime, bases] = await Promise.all([
      systemApi.configs('quickframework.ai'),
      ragApi.modelConfigStatus(),
      ragApi.knowledgeBases(),
    ]);
    configs.value = configRows;
    runtimeConfig.value = runtime;
    knowledgeBases.value = bases;
    applyConfigValues();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('modelConfig.loadFailed'));
  } finally {
    loading.value = false;
  }
}

const hasEmbeddingMismatch = computed(() =>
  knowledgeBases.value.some((item) => !item.embeddingConfigMatchesRuntime),
);

async function testConnection(type: 'CHAT' | 'EMBEDDING') {
  testing.value = type;
  try {
    testResults[type] = await ragApi.testModelConnection(type);
  } catch (error) {
    testResults[type] = {
      type,
      success: false,
      model: null,
      dimensions: null,
      latencyMs: 0,
      message: error instanceof Error ? error.message : t('modelConfig.testFailed'),
    };
  } finally {
    testing.value = null;
  }
}

const configItems: Array<{
  formKey: keyof typeof form;
  configKey: string;
  configGroup: string;
  valueType: string;
  sensitive: boolean;
  remark: string;
}> = [
  {
    formKey: 'chatEnabled',
    configKey: 'quickframework.ai.chat.enabled',
    configGroup: 'ai.chat',
    valueType: 'BOOLEAN',
    sensitive: false,
    remark: 'Chat 服务开关',
  },
  {
    formKey: 'chatProtocol',
    configKey: 'quickframework.ai.chat.protocol',
    configGroup: 'ai.chat',
    valueType: 'STRING',
    sensitive: false,
    remark: 'Chat 协议',
  },
  {
    formKey: 'chatBaseUrl',
    configKey: 'quickframework.ai.chat.base-url',
    configGroup: 'ai.chat',
    valueType: 'STRING',
    sensitive: false,
    remark: 'Chat 服务地址',
  },
  {
    formKey: 'chatApiKey',
    configKey: 'quickframework.ai.chat.api-key',
    configGroup: 'ai.chat',
    valueType: 'STRING',
    sensitive: true,
    remark: 'Chat API Key',
  },
  {
    formKey: 'chatModel',
    configKey: 'quickframework.ai.chat.model',
    configGroup: 'ai.chat',
    valueType: 'STRING',
    sensitive: false,
    remark: 'Chat 模型名称',
  },
  {
    formKey: 'chatTimeout',
    configKey: 'quickframework.ai.chat.timeout',
    configGroup: 'ai.chat',
    valueType: 'STRING',
    sensitive: false,
    remark: 'Chat 请求超时',
  },
  {
    formKey: 'chatDisableThinking',
    configKey: 'quickframework.ai.chat.disable-thinking',
    configGroup: 'ai.chat',
    valueType: 'BOOLEAN',
    sensitive: false,
    remark: 'Ollama 是否关闭思考输出',
  },
  {
    formKey: 'embeddingEnabled',
    configKey: 'quickframework.ai.embedding.enabled',
    configGroup: 'ai.embedding',
    valueType: 'BOOLEAN',
    sensitive: false,
    remark: 'Embedding 服务开关',
  },
  {
    formKey: 'embeddingBaseUrl',
    configKey: 'quickframework.ai.embedding.base-url',
    configGroup: 'ai.embedding',
    valueType: 'STRING',
    sensitive: false,
    remark: 'Embedding 服务地址',
  },
  {
    formKey: 'embeddingApiKey',
    configKey: 'quickframework.ai.embedding.api-key',
    configGroup: 'ai.embedding',
    valueType: 'STRING',
    sensitive: true,
    remark: 'Embedding API Key',
  },
  {
    formKey: 'embeddingModel',
    configKey: 'quickframework.ai.embedding.model',
    configGroup: 'ai.embedding',
    valueType: 'STRING',
    sensitive: false,
    remark: 'Embedding 模型名称',
  },
  {
    formKey: 'embeddingDimensions',
    configKey: 'quickframework.ai.embedding.dimensions',
    configGroup: 'ai.embedding',
    valueType: 'NUMBER',
    sensitive: false,
    remark: 'Embedding 向量维度',
  },
  {
    formKey: 'embeddingTimeout',
    configKey: 'quickframework.ai.embedding.timeout',
    configGroup: 'ai.embedding',
    valueType: 'STRING',
    sensitive: false,
    remark: 'Embedding 请求超时',
  },
];

function commandFor(item: (typeof configItems)[number]): ConfigCommand {
  const current = configMap.value.get(item.configKey);
  return {
    configGroup: current?.configGroup ?? item.configGroup,
    configKey: item.configKey,
    configValue: String(form[item.formKey]),
    valueType: current?.valueType ?? item.valueType,
    sensitive: current?.sensitive ?? item.sensitive,
    editable: current?.editable ?? true,
    remark: current?.remark ?? item.remark,
  };
}

async function saveConfig() {
  saving.value = true;
  try {
    const requests = configItems
      .filter((item) => !(item.sensitive && !String(form[item.formKey]).trim()))
      .map(async (item) => {
        const current = configMap.value.get(item.configKey);
        const command = commandFor(item);
        return current
          ? systemApi.updateConfig(current.id, command)
          : systemApi.createConfig(command);
      });
    await Promise.all(requests);
    await loadConfig();
    ElMessage.success(t('modelConfig.saved'));
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('modelConfig.saveFailed'));
  } finally {
    saving.value = false;
  }
}

onMounted(() => void loadConfig());
</script>

<style scoped>
.model-config-page {
  display: grid;
  gap: var(--qf-spacing-lg);
}

.model-config-page__notice {
  margin-top: calc(var(--qf-spacing-sm) * -1);
}

.model-config-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--qf-spacing-lg);
  align-items: start;
}

.model-config-page__form {
  padding: var(--qf-card-padding);
}

.model-config-page__probe-result {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--qf-spacing-xs);
  margin: 0 var(--qf-card-padding) var(--qf-card-padding);
  padding: var(--qf-spacing-sm);
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-xs);
  background: var(--qf-color-bg-muted);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius-sm);
}

.model-config-page__consistency-alert {
  margin-bottom: var(--qf-spacing-md);
}

.model-config-page__control {
  width: 100%;
}

@media (width <= 900px) {
  .model-config-page__grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 640px) {
  .model-config-page :deep(.el-descriptions__body) {
    overflow-x: auto;
  }

  .model-config-page :deep(.el-descriptions__table) {
    min-width: 620px;
  }
}
</style>
