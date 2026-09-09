<template>
  <QfPageShell class="rag-evaluation-page">
    <QfPageHeader :title="t('rag.evaluation.title')" :description="t('rag.evaluation.description')">
      <template #actions>
        <el-button :icon="Refresh" :loading="loading" @click="loadAll">
          {{ t('rag.evaluation.refresh') }}
        </el-button>
        <QfPermissionButton code="rag:evaluation:manage" type="primary" :icon="Plus" @click="openDatasetDialog()">
          {{ t('rag.evaluation.newDataset') }}
        </QfPermissionButton>
      </template>
    </QfPageHeader>

    <div class="rag-evaluation-page__layout">
      <QfTablePanel class="rag-evaluation-page__datasets" :title="t('rag.evaluation.dataset')">
        <div v-if="datasets.length" class="rag-evaluation-page__dataset-list">
          <button
            v-for="dataset in datasets"
            :key="dataset.id"
            class="rag-evaluation-page__dataset-item"
            :class="{ 'rag-evaluation-page__dataset-item--active': dataset.id === selectedDatasetId }"
            type="button"
            @click="selectedDatasetId = dataset.id"
          >
            <span class="rag-evaluation-page__dataset-icon"><el-icon><DataAnalysis /></el-icon></span>
            <span class="rag-evaluation-page__dataset-copy">
              <strong>{{ dataset.name }}</strong>
              <small>{{ dataset.code }} · v{{ dataset.version }}</small>
              <small>{{ dataset.caseCount }} {{ t('rag.evaluation.cases') }}</small>
            </span>
            <el-tag v-if="dataset.lastRunStatus" size="small" :type="statusType(dataset.lastRunStatus)">
              {{ statusLabel(dataset.lastRunStatus) }}
            </el-tag>
          </button>
        </div>
        <el-empty v-else :description="t('rag.evaluation.emptyDataset')">
          <QfPermissionButton code="rag:evaluation:manage" type="primary" :loading="importing" @click="importBuiltin">
            {{ t('rag.evaluation.importBuiltin') }}
          </QfPermissionButton>
        </el-empty>
      </QfTablePanel>

      <div v-if="selectedDataset" class="rag-evaluation-page__content">
        <QfTablePanel :title="selectedDataset.name" :description="`${selectedDataset.code} · v${selectedDataset.version}`">
          <template #actions>
            <QfPermissionButton code="rag:evaluation:manage" text :icon="Edit" @click="openDatasetDialog(selectedDataset)">
              {{ t('rag.evaluation.editDataset') }}
            </QfPermissionButton>
            <QfPermissionButton code="rag:evaluation:manage" text type="danger" :icon="Delete" @click="removeDataset(selectedDataset)">
              {{ t('rag.evaluation.deleteDataset') }}
            </QfPermissionButton>
            <QfPermissionButton code="rag:evaluation:manage" type="primary" :icon="VideoPlay" @click="runDialogVisible = true">
              {{ t('rag.evaluation.run') }}
            </QfPermissionButton>
          </template>

          <el-tabs v-model="activeTab" class="rag-evaluation-page__tabs">
            <el-tab-pane :label="`${t('rag.evaluation.cases')} (${cases.length})`" name="cases">
              <div class="rag-evaluation-page__tab-actions">
                <QfPermissionButton code="rag:evaluation:manage" type="primary" :icon="Plus" @click="openCaseDialog()">
                  {{ t('rag.evaluation.createCase') }}
                </QfPermissionButton>
              </div>
              <el-table v-loading="casesLoading" :data="cases" row-key="id" border stripe>
                <el-table-column prop="caseKey" :label="t('rag.evaluation.columns.key')" width="190" />
                <el-table-column prop="question" :label="t('rag.evaluation.columns.question')" min-width="260" show-overflow-tooltip />
                <el-table-column :label="t('rag.evaluation.columns.expected')" min-width="190">
                  <template #default="{ row }"><span class="source-list">{{ row.expectedSourceIds.join(', ') || '-' }}</span></template>
                </el-table-column>
                <el-table-column :label="t('rag.evaluation.columns.selector')" min-width="190">
                  <template #default="{ row }">
                    <el-tag v-if="row.evidenceSelector" type="success" size="small">{{ t('rag.evaluation.selectorConfigured') }}</el-tag>
                    <span v-else class="source-list">{{ row.actualSourceIds.join(', ') || '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('rag.evaluation.columns.actions')" width="112" fixed="right" align="center">
                  <template #default="{ row }">
                    <div class="rag-evaluation-page__row-actions">
                      <QfPermissionButton code="rag:evaluation:manage" text :icon="Edit" @click="openCaseDialog(row)" />
                      <QfPermissionButton code="rag:evaluation:manage" text type="danger" :icon="Delete" @click="removeCase(row)" />
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane :label="t('rag.evaluation.runs')" name="runs">
              <div class="rag-evaluation-page__comparison-toolbar">
                <div class="rag-evaluation-page__comparison-copy">
                  <strong>{{ t('rag.evaluation.compare.title') }}</strong>
                  <span>{{ t('rag.evaluation.compare.description') }}</span>
                </div>
                <div class="rag-evaluation-page__comparison-controls">
                  <el-select
                    v-model="compareBaselineId"
                    clearable
                    filterable
                    :placeholder="t('rag.evaluation.compare.baseline')"
                    class="rag-evaluation-page__comparison-select"
                  >
                    <el-option
                      v-for="run in comparableRuns"
                      :key="run.id"
                      :label="runLabel(run)"
                      :value="run.id"
                    />
                  </el-select>
                  <span class="rag-evaluation-page__comparison-arrow">→</span>
                  <el-select
                    v-model="compareCurrentId"
                    clearable
                    filterable
                    :placeholder="t('rag.evaluation.compare.current')"
                    class="rag-evaluation-page__comparison-select"
                  >
                    <el-option
                      v-for="run in comparableRuns"
                      :key="run.id"
                      :label="runLabel(run)"
                      :value="run.id"
                    />
                  </el-select>
                </div>
              </div>

              <el-table v-loading="runsLoading" :data="runs" row-key="id" border stripe @row-click="selectRun">
                <el-table-column prop="id" label="#" width="170" />
                <el-table-column prop="mode" :label="t('rag.evaluation.runForm.mode')" width="100" />
                <el-table-column :label="t('rag.evaluation.status.running')" width="150">
                  <template #default="{ row }">
                    <el-progress v-if="row.status === 'RUNNING'" :percentage="progress(row)" :stroke-width="8" />
                    <el-tag v-else :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="t('rag.evaluation.metrics.recall3')" width="120">
                  <template #default="{ row }">{{ formatPercent(row.recallAt3) }}</template>
                </el-table-column>
                <el-table-column :label="t('rag.evaluation.metrics.recall5')" width="120">
                  <template #default="{ row }">{{ formatPercent(row.recallAt5) }}</template>
                </el-table-column>
                <el-table-column :label="t('rag.evaluation.metrics.citation')" width="130">
                  <template #default="{ row }">{{ formatPercent(row.citationHitRate) }}</template>
                </el-table-column>
                <el-table-column :label="t('rag.evaluation.metrics.latency')" width="120">
                  <template #default="{ row }">{{ row.averageLatencyMs == null ? '-' : `${Math.round(row.averageLatencyMs)} ms` }}</template>
                </el-table-column>
              </el-table>

              <div v-if="compareBaselineRun && compareCurrentRun" class="rag-evaluation-page__comparison">
                <div v-loading="comparisonLoading" class="rag-evaluation-page__comparison-content">
                  <div class="rag-evaluation-page__comparison-heading">
                    <div>
                      <strong>{{ runLabel(compareBaselineRun) }} → {{ runLabel(compareCurrentRun) }}</strong>
                      <span>{{ t('rag.evaluation.compare.deltaHint') }}</span>
                    </div>
                    <el-tag v-if="comparisonCases.length" type="info">
                      {{ t('rag.evaluation.compare.caseCount', { count: comparisonCases.length }) }}
                    </el-tag>
                  </div>

                  <div class="rag-evaluation-page__compare-metrics">
                    <div v-for="metric in comparisonMetrics" :key="metric.key" class="rag-evaluation-page__compare-metric">
                      <span>{{ metric.label }}</span>
                      <div class="rag-evaluation-page__compare-values">
                        <strong>{{ metric.baseline }}</strong>
                        <span>→</span>
                        <strong>{{ metric.current }}</strong>
                      </div>
                      <small :class="metric.deltaClass">{{ metric.delta }}</small>
                    </div>
                  </div>

                  <el-empty v-if="!comparisonCases.length" :description="t('rag.evaluation.compare.noCases')" />
                  <el-table v-else :data="comparisonCases" row-key="caseKey" border stripe>
                    <el-table-column type="expand" width="48">
                      <template #default="{ row }">
                        <div class="rag-evaluation-page__comparison-detail">
                          <div>
                            <small>{{ t('rag.evaluation.columns.expected') }}</small>
                            <span class="source-list">{{ row.expectedSourceIds.join(', ') || '-' }}</span>
                          </div>
                          <div>
                            <small>{{ t('rag.evaluation.compare.baselineRetrieved') }}</small>
                            <span class="source-list">{{ row.baselineRetrieved.join(', ') || '-' }}</span>
                          </div>
                          <div>
                            <small>{{ t('rag.evaluation.compare.currentRetrieved') }}</small>
                            <span class="source-list">{{ row.currentRetrieved.join(', ') || '-' }}</span>
                          </div>
                          <div v-if="compareCurrentRun.mode === 'CHAT'">
                            <small>{{ t('rag.evaluation.columns.cited') }}</small>
                            <span class="source-list">{{ row.currentCited.join(', ') || '-' }}</span>
                          </div>
                          <div v-if="row.addedRetrieved.length || row.removedRetrieved.length" class="rag-evaluation-page__source-change">
                            <small>{{ t('rag.evaluation.compare.sourceChange') }}</small>
                            <span v-if="row.addedRetrieved.length" class="rag-evaluation-page__source-added">+ {{ row.addedRetrieved.join(', ') }}</span>
                            <span v-if="row.removedRetrieved.length" class="rag-evaluation-page__source-removed">− {{ row.removedRetrieved.join(', ') }}</span>
                          </div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column prop="caseKey" :label="t('rag.evaluation.columns.key')" width="170" />
                    <el-table-column prop="question" :label="t('rag.evaluation.columns.question')" min-width="260" show-overflow-tooltip />
                    <el-table-column :label="t('rag.evaluation.compare.baselineResult')" width="110">
                      <template #default="{ row }">
                        <el-tag :type="row.baselineRecallHit ? 'success' : 'danger'">
                          {{ row.baselineRecallHit ? t('rag.evaluation.status.hit') : t('rag.evaluation.status.miss') }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column :label="t('rag.evaluation.compare.currentResult')" width="110">
                      <template #default="{ row }">
                        <el-tag :type="row.currentRecallHit ? 'success' : 'danger'">
                          {{ row.currentRecallHit ? t('rag.evaluation.status.hit') : t('rag.evaluation.status.miss') }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column :label="t('rag.evaluation.compare.change')" width="120">
                      <template #default="{ row }">
                        <el-tag :type="row.recallChange === 'improved' ? 'success' : row.recallChange === 'regressed' ? 'danger' : 'info'">
                          {{ t(`rag.evaluation.compare.${row.recallChange}`) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>

              <div v-if="selectedRun" class="rag-evaluation-page__run-detail">
                <div class="rag-evaluation-page__metrics">
                  <div v-for="metric in metricCards" :key="metric.label" class="rag-evaluation-page__metric">
                    <span>{{ metric.label }}</span><strong>{{ metric.value }}</strong>
                  </div>
                </div>
                <el-alert v-if="selectedRun.errorMessage" :title="selectedRun.errorMessage" type="error" :closable="false" />
                <el-table v-loading="runCasesLoading" :data="runCases" row-key="id" border stripe>
                  <el-table-column prop="caseKey" :label="t('rag.evaluation.columns.key')" width="190" />
                  <el-table-column prop="question" :label="t('rag.evaluation.columns.question')" min-width="250" show-overflow-tooltip />
                  <el-table-column :label="t('rag.evaluation.columns.result')" width="110">
                    <template #default="{ row }">
                      <el-tag :type="row.recallHit ? 'success' : 'danger'">{{ row.recallHit ? t('rag.evaluation.status.hit') : t('rag.evaluation.status.miss') }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column :label="t('rag.evaluation.columns.retrieved')" min-width="220">
                    <template #default="{ row }"><span class="source-list">{{ row.retrievedSourceIds.join(', ') || '-' }}</span></template>
                  </el-table-column>
                  <el-table-column :label="t('rag.evaluation.columns.cited')" min-width="180">
                    <template #default="{ row }"><span class="source-list">{{ row.citedSourceIds.join(', ') || '-' }}</span></template>
                  </el-table-column>
                  <el-table-column :label="t('rag.evaluation.columns.latency')" width="100">
                    <template #default="{ row }">{{ row.latencyMs }} ms</template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </QfTablePanel>
      </div>
      <QfTablePanel v-else class="rag-evaluation-page__placeholder">
        <el-empty :description="t('rag.evaluation.noDataset')" />
      </QfTablePanel>
    </div>

    <el-dialog v-model="datasetDialogVisible" :title="editingDataset ? t('rag.evaluation.editDataset') : t('rag.evaluation.newDataset')" width="520px">
      <el-form label-position="top">
        <el-form-item :label="t('rag.evaluation.datasetForm.code')"><el-input v-model="datasetDraft.code" /></el-form-item>
        <el-form-item :label="t('rag.evaluation.datasetForm.name')"><el-input v-model="datasetDraft.name" /></el-form-item>
        <el-form-item :label="t('rag.evaluation.datasetForm.version')"><el-input v-model="datasetDraft.version" /></el-form-item>
        <el-form-item :label="t('rag.evaluation.datasetForm.source')"><el-input v-model="datasetDraft.source" /></el-form-item>
        <el-form-item :label="t('rag.evaluation.datasetForm.description')"><el-input v-model="datasetDraft.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="datasetDialogVisible = false">取消</el-button><el-button type="primary" @click="saveDataset">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="caseDialogVisible" :title="t('rag.evaluation.caseForm.title')" width="860px">
      <el-form label-position="top" class="rag-evaluation-page__case-form">
        <div class="rag-evaluation-page__form-grid">
          <el-form-item :label="t('rag.evaluation.caseForm.key')"><el-input v-model="caseDraft.caseKey" /></el-form-item>
          <el-form-item :label="t('rag.evaluation.caseForm.category')"><el-input v-model="caseDraft.category" /></el-form-item>
          <el-form-item :label="t('rag.evaluation.caseForm.language')"><el-input v-model="caseDraft.language" /></el-form-item>
          <el-form-item :label="t('rag.evaluation.caseForm.difficulty')"><el-input v-model="caseDraft.difficulty" /></el-form-item>
        </div>
        <el-form-item :label="t('rag.evaluation.caseForm.question')"><el-input v-model="caseDraft.question" type="textarea" :rows="3" /></el-form-item>
        <div class="rag-evaluation-page__form-grid">
          <el-form-item :label="t('rag.evaluation.caseForm.expected')"><el-input v-model="caseDraft.expectedSourceIdsText" type="textarea" :rows="4" /></el-form-item>
          <el-form-item :label="t('rag.evaluation.caseForm.selector')">
            <div class="rag-evaluation-page__json-editor">
              <div class="rag-evaluation-page__json-toolbar">
                <span>{{ t('rag.evaluation.caseForm.jsonHint') }}</span>
                <el-button text type="primary" size="small" @click="formatEvidenceSelector">
                  {{ t('rag.evaluation.caseForm.formatJson') }}
                </el-button>
              </div>
              <el-input
                v-model="caseDraft.evidenceSelectorText"
                type="textarea"
                :rows="12"
                spellcheck="false"
                class="rag-evaluation-page__json-input"
              />
            </div>
            <small class="rag-evaluation-page__field-hint">{{ t('rag.evaluation.caseForm.selectorHint') }}</small>
          </el-form-item>
        </div>
        <el-form-item :label="t('rag.evaluation.caseForm.mustMention')"><el-input v-model="caseDraft.mustMentionText" type="textarea" :rows="2" /></el-form-item>
        <div class="rag-evaluation-page__form-inline"><el-checkbox v-model="caseDraft.answerable">{{ t('rag.evaluation.caseForm.answerable') }}</el-checkbox><el-input-number v-model="caseDraft.sortOrder" :min="0" :label="t('rag.evaluation.caseForm.order')" /></div>
      </el-form>
      <template #footer><el-button @click="caseDialogVisible = false">取消</el-button><el-button type="primary" @click="saveCase">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="runDialogVisible" :title="t('rag.evaluation.run')" width="460px">
      <el-form label-position="top">
        <el-form-item :label="t('rag.evaluation.runForm.knowledgeBase')"><el-select v-model="runDraft.knowledgeBaseId" class="rag-evaluation-page__full-width" filterable><el-option v-for="item in knowledgeBases" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item :label="t('rag.evaluation.runForm.mode')"><el-radio-group v-model="runDraft.mode"><el-radio-button label="SEARCH">{{ t('rag.evaluation.runForm.search') }}</el-radio-button><el-radio-button label="CHAT">{{ t('rag.evaluation.runForm.chat') }}</el-radio-button></el-radio-group></el-form-item>
        <el-form-item :label="t('rag.evaluation.runForm.topK')"><el-input-number v-model="runDraft.topK" :min="1" :max="20" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="runDialogVisible = false">取消</el-button><el-button type="primary" :loading="runStarting" @click="startRun">{{ t('rag.evaluation.run') }}</el-button></template>
    </el-dialog>
  </QfPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { DataAnalysis, Delete, Edit, Plus, Refresh, VideoPlay } from '@element-plus/icons-vue';
import { ragApi, type EvaluationCase, type EvaluationDataset, type EvaluationRun, type EvaluationRunCase, type KnowledgeBase, type PlatformId } from '@/api/rag';
import { QfPageHeader, QfPageShell, QfPermissionButton, QfTablePanel } from '@/shared';

defineOptions({ name: 'RagEvaluationView' });
const { t } = useI18n();
const datasets = ref<EvaluationDataset[]>([]);
const cases = ref<EvaluationCase[]>([]);
const runs = ref<EvaluationRun[]>([]);
const runCases = ref<EvaluationRunCase[]>([]);
const knowledgeBases = ref<KnowledgeBase[]>([]);
const selectedDatasetId = ref<PlatformId>();
const selectedRun = ref<EvaluationRun>();
const activeTab = ref('cases');
const loading = ref(false);
const casesLoading = ref(false);
const runsLoading = ref(false);
const runCasesLoading = ref(false);
const comparisonLoading = ref(false);
const datasetDialogVisible = ref(false);
const caseDialogVisible = ref(false);
const runDialogVisible = ref(false);
const runStarting = ref(false);
const importing = ref(false);
const editingDataset = ref<EvaluationDataset>();
const editingCase = ref<EvaluationCase>();
const compareBaselineId = ref<PlatformId>();
const compareCurrentId = ref<PlatformId>();
const compareBaselineCases = ref<EvaluationRunCase[]>([]);
const compareCurrentCases = ref<EvaluationRunCase[]>([]);
let pollTimer: number | undefined;
let comparisonRequestId = 0;

const selectedDataset = computed(() => datasets.value.find((item) => item.id === selectedDatasetId.value));
const comparableRuns = computed(() => runs.value.filter((run) => run.status === 'SUCCESS'));
const compareBaselineRun = computed(() => comparableRuns.value.find((run) => run.id === compareBaselineId.value));
const compareCurrentRun = computed(() => comparableRuns.value.find((run) => run.id === compareCurrentId.value));
const datasetDraft = ref({ code: '', name: '', version: '0.1', source: '', description: '' });
const caseDraft = ref({ caseKey: '', category: 'general', language: 'en', question: '', expectedSourceIdsText: '', evidenceSelectorText: '', mustMentionText: '', answerable: true, difficulty: 'medium', sortOrder: 0 });
const runDraft = ref({ knowledgeBaseId: undefined as PlatformId | undefined, mode: 'SEARCH', topK: 5 });

const metricCards = computed(() => selectedRun.value ? [
  { label: t('rag.evaluation.metrics.recall3'), value: formatPercent(selectedRun.value.recallAt3) },
  { label: t('rag.evaluation.metrics.recall5'), value: formatPercent(selectedRun.value.recallAt5) },
  { label: t('rag.evaluation.metrics.mrr'), value: formatPercent(selectedRun.value.meanReciprocalRank) },
  { label: t('rag.evaluation.metrics.citation'), value: formatPercent(selectedRun.value.citationHitRate) },
  { label: t('rag.evaluation.metrics.refusal'), value: formatPercent(selectedRun.value.noAnswerAccuracy) },
  { label: t('rag.evaluation.metrics.latency'), value: selectedRun.value.averageLatencyMs == null ? '-' : `${Math.round(selectedRun.value.averageLatencyMs)} ms` },
] : []);

const comparisonMetrics = computed(() => {
  const baseline = compareBaselineRun.value;
  const current = compareCurrentRun.value;
  if (!baseline || !current) return [];
  const definitions = [
    { key: 'recallAt3', label: t('rag.evaluation.metrics.recall3'), type: 'ratio' },
    { key: 'recallAt5', label: t('rag.evaluation.metrics.recall5'), type: 'ratio' },
    { key: 'meanReciprocalRank', label: t('rag.evaluation.metrics.mrr'), type: 'ratio' },
    { key: 'citationHitRate', label: t('rag.evaluation.metrics.citation'), type: 'ratio' },
    { key: 'noAnswerAccuracy', label: t('rag.evaluation.metrics.refusal'), type: 'ratio' },
    { key: 'averageLatencyMs', label: t('rag.evaluation.metrics.latency'), type: 'latency' },
  ] as const;
  return definitions.map((definition) => {
    const baselineValue = baseline[definition.key];
    const currentValue = current[definition.key];
    const delta = metricDelta(currentValue, baselineValue, definition.type);
    return {
      ...definition,
      baseline: metricValue(baselineValue, definition.type),
      current: metricValue(currentValue, definition.type),
      delta: delta.text,
      deltaClass: delta.className,
    };
  });
});

const comparisonCases = computed(() => {
  const baselineByKey = new Map(compareBaselineCases.value.map((item) => [item.caseKey, item]));
  const currentByKey = new Map(compareCurrentCases.value.map((item) => [item.caseKey, item]));
  const keys = [...new Set([...baselineByKey.keys(), ...currentByKey.keys()])];
  return keys.map((caseKey) => {
    const baseline = baselineByKey.get(caseKey);
    const current = currentByKey.get(caseKey);
    const baselineRetrieved = baseline?.retrievedSourceIds ?? [];
    const currentRetrieved = current?.retrievedSourceIds ?? [];
    return {
      caseKey,
      question: current?.question ?? baseline?.question ?? '',
      expectedSourceIds: current?.actualSourceIds.length ? current.actualSourceIds : baseline?.actualSourceIds ?? [],
      baselineRetrieved,
      currentRetrieved,
      currentCited: current?.citedSourceIds ?? [],
      baselineRecallHit: baseline?.recallHit ?? false,
      currentRecallHit: current?.recallHit ?? false,
      recallChange: baseline?.recallHit === current?.recallHit ? 'unchanged' : current?.recallHit ? 'improved' : 'regressed',
      addedRetrieved: currentRetrieved.filter((sourceId) => !baselineRetrieved.includes(sourceId)),
      removedRetrieved: baselineRetrieved.filter((sourceId) => !currentRetrieved.includes(sourceId)),
    };
  });
});

watch(selectedDatasetId, () => { void loadDatasetData(); });
watch(activeTab, () => { if (activeTab.value === 'runs') void loadRuns(); });
watch([compareBaselineId, compareCurrentId], () => { void loadComparison(); });

async function loadAll() {
  loading.value = true;
  try {
    [datasets.value, knowledgeBases.value] = await Promise.all([ragApi.evaluationDatasets(), ragApi.knowledgeBases()]);
    if (!datasets.value.some((item) => item.id === selectedDatasetId.value)) selectedDatasetId.value = datasets.value[0]?.id;
    if (!runDraft.value.knowledgeBaseId) runDraft.value.knowledgeBaseId = knowledgeBases.value[0]?.id;
    await loadDatasetData();
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '加载评测中心失败'); } finally { loading.value = false; }
}
async function loadDatasetData() {
  if (!selectedDatasetId.value) {
    cases.value = [];
    runs.value = [];
    selectedRun.value = undefined;
    resetComparison();
    return;
  }
  casesLoading.value = true; runsLoading.value = true;
  try {
    [cases.value, runs.value] = await Promise.all([ragApi.evaluationCases(selectedDatasetId.value), ragApi.evaluationRuns(selectedDatasetId.value)]);
    selectedRun.value = undefined;
    ensureCompareSelection();
  }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '加载评测数据失败'); }
  finally { casesLoading.value = false; runsLoading.value = false; }
}
async function importBuiltin() {
  importing.value = true;
  try {
    const dataset = await ragApi.importIntelEvaluationDataset();
    await loadAll();
    selectedDatasetId.value = dataset.id;
    ElMessage.success(t('rag.evaluation.toast.imported'));
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导入内置评测集失败');
  } finally {
    importing.value = false;
  }
}
async function loadRuns() {
  if (!selectedDatasetId.value) return;
  runsLoading.value = true;
  try {
    runs.value = await ragApi.evaluationRuns(selectedDatasetId.value);
    ensureCompareSelection();
  } finally { runsLoading.value = false; }
}
function openDatasetDialog(dataset?: EvaluationDataset) { editingDataset.value = dataset; datasetDraft.value = dataset ? { code: dataset.code, name: dataset.name, version: dataset.version, source: dataset.source || '', description: dataset.description || '' } : { code: '', name: '', version: '0.1', source: '', description: '' }; datasetDialogVisible.value = true; }
async function saveDataset() { try { const saved = editingDataset.value ? await ragApi.updateEvaluationDataset(editingDataset.value.id, datasetDraft.value) : await ragApi.createEvaluationDataset(datasetDraft.value); datasetDialogVisible.value = false; await loadAll(); selectedDatasetId.value = saved.id; ElMessage.success(t('rag.evaluation.toast.saved')); } catch (error) { ElMessage.error(error instanceof Error ? error.message : '保存失败'); } }
async function removeDataset(item: EvaluationDataset) {
  try {
    await ElMessageBox.confirm(t('rag.evaluation.confirm.deleteDataset', { name: item.name }), t('common.confirm'), { type: 'warning' });
    await ragApi.deleteEvaluationDataset(item.id);
    selectedDatasetId.value = undefined;
    await loadAll();
    ElMessage.success(t('rag.evaluation.toast.deleted'));
  } catch { /* cancelled */ }
}
function formatJsonText(value: string) {
  if (!value.trim()) return '';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
function formatEvidenceSelector() {
  if (!caseDraft.value.evidenceSelectorText.trim()) return;
  try {
    caseDraft.value.evidenceSelectorText = JSON.stringify(JSON.parse(caseDraft.value.evidenceSelectorText), null, 2);
  } catch {
    ElMessage.error(t('rag.evaluation.caseForm.invalidJson'));
  }
}
function openCaseDialog(item?: EvaluationCase) {
  editingCase.value = item;
  caseDraft.value = item
    ? {
        caseKey: item.caseKey,
        category: item.category,
        language: item.language,
        question: item.question,
        expectedSourceIdsText: item.expectedSourceIds.join('\n'),
        evidenceSelectorText: formatJsonText(item.evidenceSelector || ''),
        mustMentionText: item.mustMention.join('\n'),
        answerable: item.answerable,
        difficulty: item.difficulty,
        sortOrder: item.sortOrder,
      }
    : {
        caseKey: '',
        category: 'general',
        language: 'en',
        question: '',
        expectedSourceIdsText: '',
        evidenceSelectorText: '',
        mustMentionText: '',
        answerable: true,
        difficulty: 'medium',
        sortOrder: cases.value.length,
      };
  caseDialogVisible.value = true;
}
function lines(value: string) { return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean); }
async function saveCase() { if (!selectedDatasetId.value) return; const payload = { caseKey: caseDraft.value.caseKey, category: caseDraft.value.category, language: caseDraft.value.language, question: caseDraft.value.question, expectedSourceIds: lines(caseDraft.value.expectedSourceIdsText), actualSourceIds: [], evidenceSelector: caseDraft.value.evidenceSelectorText.trim() || null, mustMention: lines(caseDraft.value.mustMentionText), answerable: caseDraft.value.answerable, difficulty: caseDraft.value.difficulty, sortOrder: caseDraft.value.sortOrder }; try { if (editingCase.value) await ragApi.updateEvaluationCase(editingCase.value.id, payload); else await ragApi.createEvaluationCase(selectedDatasetId.value, payload); caseDialogVisible.value = false; await loadDatasetData(); ElMessage.success(t('rag.evaluation.toast.saved')); } catch (error) { ElMessage.error(error instanceof Error ? error.message : '保存失败'); } }
async function removeCase(item: EvaluationCase) { try { await ElMessageBox.confirm(`确认删除案例“${item.caseKey}”？`, '提示'); await ragApi.deleteEvaluationCase(item.id); await loadDatasetData(); ElMessage.success(t('rag.evaluation.toast.deleted')); } catch { /* cancelled */ } }
async function startRun() {
  if (!selectedDatasetId.value || !runDraft.value.knowledgeBaseId) { ElMessage.warning(t('rag.evaluation.toast.selectDataset')); return; }
  runStarting.value = true;
  try {
    selectedRun.value = await ragApi.startEvaluationRun({ datasetId: selectedDatasetId.value, knowledgeBaseId: runDraft.value.knowledgeBaseId, mode: runDraft.value.mode, topK: runDraft.value.topK });
    runDialogVisible.value = false;
    activeTab.value = 'runs';
    await loadRuns();
    selectRun(selectedRun.value);
    beginPolling();
    ElMessage.success(t('rag.evaluation.toast.started'));
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '启动评测失败'); } finally { runStarting.value = false; }
}
async function selectRun(run: EvaluationRun) {
  selectedRun.value = run;
  if (run.status === 'SUCCESS') {
    compareCurrentId.value = run.id;
    if (compareBaselineId.value === run.id) {
      compareBaselineId.value = comparableRuns.value.find((item) => item.id !== run.id)?.id;
    }
  }
  runCasesLoading.value = true;
  try { runCases.value = await ragApi.evaluationRunCases(run.id); } catch (error) { ElMessage.error(error instanceof Error ? error.message : '加载结果失败'); } finally { runCasesLoading.value = false; }
  if (run.status === 'RUNNING') beginPolling();
}
function beginPolling() { if (pollTimer) window.clearInterval(pollTimer); pollTimer = window.setInterval(async () => { if (!selectedRun.value) return; try { selectedRun.value = await ragApi.evaluationRun(selectedRun.value.id); await loadRuns(); if (selectedRun.value.status !== 'RUNNING') { window.clearInterval(pollTimer); await selectRun(selectedRun.value); } } catch { /* retain last visible state */ } }, 2500); }
function progress(run: EvaluationRun) { return run.caseCount ? Math.min(100, Math.round((run.completedCount / run.caseCount) * 100)) : 0; }
function formatPercent(value: number | null) { return value == null ? '-' : `${(value * 100).toFixed(1)}%`; }
function runLabel(run: EvaluationRun) { return `#${run.id} · ${run.mode} · TopK ${run.topK} · ${formatDate(run.createTime)}`; }
function formatDate(value: string) { return value ? new Date(value).toLocaleString() : '-'; }
function ensureCompareSelection() {
  const successful = comparableRuns.value;
  if (!successful.length) { resetComparison(); return; }
  if (!successful.some((run) => run.id === compareCurrentId.value)) compareCurrentId.value = successful[0].id;
  if (!successful.some((run) => run.id === compareBaselineId.value) || compareBaselineId.value === compareCurrentId.value) {
    compareBaselineId.value = successful[1]?.id;
  }
}
function resetComparison() {
  compareBaselineId.value = undefined;
  compareCurrentId.value = undefined;
  compareBaselineCases.value = [];
  compareCurrentCases.value = [];
}
async function loadComparison() {
  const requestId = ++comparisonRequestId;
  if (!compareBaselineId.value || !compareCurrentId.value || compareBaselineId.value === compareCurrentId.value) {
    compareBaselineCases.value = [];
    compareCurrentCases.value = [];
    return;
  }
  comparisonLoading.value = true;
  try {
    const [baselineCases, currentCases] = await Promise.all([
      ragApi.evaluationRunCases(compareBaselineId.value),
      ragApi.evaluationRunCases(compareCurrentId.value),
    ]);
    if (requestId === comparisonRequestId) {
      compareBaselineCases.value = baselineCases;
      compareCurrentCases.value = currentCases;
    }
  } catch (error) {
    if (requestId === comparisonRequestId) ElMessage.error(error instanceof Error ? error.message : t('rag.evaluation.compare.loadFailed'));
  } finally {
    if (requestId === comparisonRequestId) comparisonLoading.value = false;
  }
}
function metricValue(value: number | null, type: 'ratio' | 'latency') { return value == null ? '-' : type === 'ratio' ? formatPercent(value) : `${Math.round(value)} ms`; }
function metricDelta(current: number | null, baseline: number | null, type: 'ratio' | 'latency') {
  if (current == null || baseline == null) return { text: '-', className: 'rag-evaluation-page__delta--neutral' };
  const delta = current - baseline;
  if (Math.abs(delta) < 0.0001) return { text: t('rag.evaluation.compare.unchanged'), className: 'rag-evaluation-page__delta--neutral' };
  const isImproved = type === 'latency' ? delta < 0 : delta > 0;
  const text = type === 'latency' ? `${delta > 0 ? '+' : ''}${Math.round(delta)} ms` : `${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)} pp`;
  return { text, className: isImproved ? 'rag-evaluation-page__delta--positive' : 'rag-evaluation-page__delta--negative' };
}
function statusType(status: string) { return status === 'SUCCESS' ? 'success' : status === 'FAILED' ? 'danger' : 'warning'; }
function statusLabel(status: string) { return status === 'SUCCESS' ? t('rag.evaluation.status.success') : status === 'FAILED' ? t('rag.evaluation.status.failed') : t('rag.evaluation.status.running'); }
onMounted(() => void loadAll());
onBeforeUnmount(() => { if (pollTimer) window.clearInterval(pollTimer); });
</script>

<style scoped>
.rag-evaluation-page { gap: var(--qf-spacing-lg); }
.rag-evaluation-page__layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: var(--qf-spacing-md); align-items: start; }
.rag-evaluation-page__content, .rag-evaluation-page__placeholder { min-width: 0; }
.rag-evaluation-page__dataset-list { display: grid; gap: var(--qf-spacing-2xs); padding: var(--qf-spacing-sm); }
.rag-evaluation-page__dataset-item { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; gap: var(--qf-spacing-sm); align-items: center; width: 100%; padding: var(--qf-spacing-sm); color: var(--qf-color-text-primary); text-align: left; background: transparent; border: 1px solid transparent; border-radius: var(--qf-border-radius-sm); cursor: pointer; }
.rag-evaluation-page__dataset-item:hover, .rag-evaluation-page__dataset-item--active { background: var(--qf-color-primary-soft); border-color: var(--qf-color-primary-light); }
.rag-evaluation-page__dataset-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; color: var(--qf-color-primary); background: var(--qf-color-bg-surface); border-radius: var(--qf-border-radius-sm); }
.rag-evaluation-page__dataset-copy { display: grid; min-width: 0; gap: 2px; }
.rag-evaluation-page__dataset-copy strong, .rag-evaluation-page__dataset-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rag-evaluation-page__dataset-copy small { color: var(--qf-color-text-secondary); font-size: var(--qf-font-size-xs); }
.rag-evaluation-page__tabs { padding: 0 var(--qf-card-padding) var(--qf-card-padding); }
.rag-evaluation-page__tab-actions { display: flex; justify-content: flex-end; margin-bottom: var(--qf-spacing-sm); }
.rag-evaluation-page__row-actions { display: inline-flex; align-items: center; justify-content: center; gap: var(--qf-spacing-2xs); white-space: nowrap; }
.source-list { display: -webkit-box; overflow: hidden; color: var(--qf-color-text-secondary); font-size: var(--qf-font-size-xs); line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.rag-evaluation-page__field-hint { display: block; margin-top: var(--qf-spacing-2xs); color: var(--qf-color-text-secondary); font-size: var(--qf-font-size-xs); line-height: 1.5; }
.rag-evaluation-page__json-editor { display: grid; gap: var(--qf-spacing-2xs); }
.rag-evaluation-page__json-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--qf-spacing-xs); color: var(--qf-color-text-secondary); font-size: var(--qf-font-size-xs); }
.rag-evaluation-page__json-input :deep(textarea) { min-height: 240px; padding: var(--qf-spacing-sm); font-family: 'Cascadia Code', 'SFMono-Regular', Consolas, monospace; font-size: 12px; line-height: 1.6; tab-size: 2; }
.rag-evaluation-page__comparison-toolbar { display: flex; justify-content: space-between; gap: var(--qf-spacing-md); align-items: center; margin-bottom: var(--qf-spacing-md); padding: var(--qf-spacing-sm) var(--qf-spacing-md); background: var(--qf-color-bg-muted); border: 1px solid var(--qf-color-border-soft); border-radius: var(--qf-border-radius-sm); }
.rag-evaluation-page__comparison-copy { display: grid; gap: var(--qf-spacing-2xs); min-width: 220px; }
.rag-evaluation-page__comparison-copy span, .rag-evaluation-page__comparison-heading span { color: var(--qf-color-text-secondary); font-size: var(--qf-font-size-xs); }
.rag-evaluation-page__comparison-controls { display: flex; align-items: center; gap: var(--qf-spacing-xs); }
.rag-evaluation-page__comparison-select { width: 260px; }
.rag-evaluation-page__comparison-arrow { color: var(--qf-color-text-secondary); font-size: var(--qf-font-size-subtitle); }
.rag-evaluation-page__comparison { display: grid; gap: var(--qf-spacing-md); margin-top: var(--qf-spacing-lg); padding-top: var(--qf-spacing-lg); border-top: 1px solid var(--qf-color-border-soft); }
.rag-evaluation-page__comparison-content { display: grid; gap: var(--qf-spacing-md); min-height: 120px; }
.rag-evaluation-page__comparison-heading { display: flex; justify-content: space-between; gap: var(--qf-spacing-md); align-items: center; }
.rag-evaluation-page__comparison-heading > div { display: grid; gap: var(--qf-spacing-2xs); }
.rag-evaluation-page__compare-metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--qf-spacing-sm); }
.rag-evaluation-page__compare-metric { display: grid; gap: var(--qf-spacing-xs); padding: var(--qf-spacing-sm); background: var(--qf-color-bg-surface); border: 1px solid var(--qf-color-border-soft); border-radius: var(--qf-border-radius-sm); }
.rag-evaluation-page__compare-metric > span { color: var(--qf-color-text-secondary); font-size: var(--qf-font-size-xs); }
.rag-evaluation-page__compare-values { display: flex; align-items: center; gap: var(--qf-spacing-xs); white-space: nowrap; }
.rag-evaluation-page__compare-values strong { color: var(--qf-color-text-primary); font-size: var(--qf-font-size-subtitle); }
.rag-evaluation-page__compare-values span { color: var(--qf-color-text-secondary); }
.rag-evaluation-page__compare-metric small { font-size: var(--qf-font-size-xs); }
.rag-evaluation-page__delta--positive { color: var(--qf-color-success); }
.rag-evaluation-page__delta--negative { color: var(--qf-color-danger); }
.rag-evaluation-page__delta--neutral { color: var(--qf-color-text-secondary); }
.rag-evaluation-page__comparison-detail { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--qf-spacing-sm) var(--qf-spacing-lg); padding: var(--qf-spacing-sm) var(--qf-spacing-lg); }
.rag-evaluation-page__comparison-detail > div { display: grid; gap: var(--qf-spacing-2xs); min-width: 0; }
.rag-evaluation-page__comparison-detail small { color: var(--qf-color-text-secondary); }
.rag-evaluation-page__source-change { grid-column: 1 / -1; }
.rag-evaluation-page__source-added { color: var(--qf-color-success); }
.rag-evaluation-page__source-removed { color: var(--qf-color-danger); }
.rag-evaluation-page__run-detail { display: grid; gap: var(--qf-spacing-md); margin-top: var(--qf-spacing-lg); }
.rag-evaluation-page__metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--qf-spacing-sm); }
.rag-evaluation-page__metric { display: grid; gap: var(--qf-spacing-xs); padding: var(--qf-spacing-sm); background: var(--qf-color-bg-muted); border: 1px solid var(--qf-color-border-soft); border-radius: var(--qf-border-radius-sm); }
.rag-evaluation-page__metric span { color: var(--qf-color-text-secondary); font-size: var(--qf-font-size-xs); }
.rag-evaluation-page__metric strong { color: var(--qf-color-text-primary); font-size: var(--qf-font-size-subtitle); }
.rag-evaluation-page__form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--qf-spacing-md); }
.rag-evaluation-page__full-width { width: 100%; }
.rag-evaluation-page__form-inline { display: flex; gap: var(--qf-spacing-lg); align-items: center; }
@media (width <= 1200px) { .rag-evaluation-page__compare-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (width <= 1000px) { .rag-evaluation-page__layout { grid-template-columns: 1fr; } .rag-evaluation-page__metrics, .rag-evaluation-page__compare-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); } .rag-evaluation-page__comparison-toolbar { align-items: stretch; flex-direction: column; } .rag-evaluation-page__comparison-controls { flex-wrap: wrap; } }
@media (width <= 640px) { .rag-evaluation-page__form-grid, .rag-evaluation-page__metrics, .rag-evaluation-page__compare-metrics { grid-template-columns: 1fr; } .rag-evaluation-page__comparison-controls { display: grid; grid-template-columns: 1fr; } .rag-evaluation-page__comparison-select { width: 100%; } .rag-evaluation-page__comparison-arrow { display: none; } .rag-evaluation-page__comparison-detail { grid-template-columns: 1fr; } .rag-evaluation-page__source-change { grid-column: auto; } }
</style>
