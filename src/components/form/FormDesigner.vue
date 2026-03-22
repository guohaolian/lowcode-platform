<script setup>
import { ref, computed } from 'vue'
import { useFormStore } from '../../stores/formStore.js'
import {
  Edit, Document, Select, CircleCheck, Finished,
  Histogram, Calendar, SwitchButton, StarFilled,
  Minus, Grid
} from '@element-plus/icons-vue'

const store = useFormStore()

const componentRegistry = [
  { type: 'input',    label: '单行文本', group: '输入', icon: Edit,
    defaultProps: { label: '文本框', placeholder: '请输入', required: false, disabled: false, maxlength: '' } },
  { type: 'textarea', label: '多行文本', group: '输入', icon: Document,
    defaultProps: { label: '文本域', placeholder: '请输入', required: false, rows: 3 } },
  { type: 'number',   label: '数字',    group: '输入', icon: Histogram,
    defaultProps: { label: '数字', placeholder: '0', required: false, min: '', max: '' } },
  { type: 'select',   label: '下拉选择', group: '选择', icon: Select,
    defaultProps: { label: '下拉框', placeholder: '请选择', required: false,
      options: [{ label: '选项一', value: '1' }, { label: '选项二', value: '2' }] } },
  { type: 'radio',    label: '单选',    group: '选择', icon: CircleCheck,
    defaultProps: { label: '单选', required: false,
      options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] } },
  { type: 'checkbox', label: '多选',    group: '选择', icon: Finished,
    defaultProps: { label: '多选', required: false,
      options: [{ label: '选项 A', value: 'a' }, { label: '选项 B', value: 'b' }] } },
  { type: 'date',     label: '日期',    group: '选择', icon: Calendar,
    defaultProps: { label: '日期', required: false } },
  { type: 'switch',   label: '开关',    group: '控件', icon: SwitchButton,
    defaultProps: { label: '开关', defaultValue: false } },
  { type: 'rate',     label: '评分',    group: '控件', icon: StarFilled,
    defaultProps: { label: '评分', max: 5 } },
  { type: 'divider',  label: '分割线',  group: '布局', icon: Minus,
    defaultProps: { label: '' } },
  { type: 'title',    label: '标题',    group: '布局', icon: Grid,
    defaultProps: { label: '标题', level: 'h3' } },
]

const groups = computed(() => {
  const map = {}
  componentRegistry.forEach(c => {
    if (!map[c.group]) map[c.group] = []
    map[c.group].push(c)
  })
  return map
})

const draggingFrom = ref(null)
const dragOverIndex = ref(null)

function typeLabel(type) { return componentRegistry.find(c => c.type === type)?.label || type }

function onPaletteDragStart(e, def) { draggingFrom.value = { source: 'palette', def }; e.dataTransfer.effectAllowed = 'copy' }
function onCanvasDragStart(e, fieldId) { draggingFrom.value = { source: 'canvas', id: fieldId }; e.dataTransfer.effectAllowed = 'move' }
function onDrop(e, index) {
  e.preventDefault()
  const d = draggingFrom.value; if (!d) return
  d.source === 'palette' ? store.addField(d.def, index) : store.moveField(d.id, index)
  draggingFrom.value = null; dragOverIndex.value = null
}
function onDragOver(e, index) { e.preventDefault(); dragOverIndex.value = index }
function onDragEnd() { draggingFrom.value = null; dragOverIndex.value = null }
function onCanvasDrop(e) {
  e.preventDefault()
  if (!draggingFrom.value) return
  if (draggingFrom.value.source === 'palette') store.addField(draggingFrom.value.def)
  draggingFrom.value = null; dragOverIndex.value = null
}

function addOption(props) {
  props.options.push({ label: '新选项', value: `opt_${Date.now()}` })
}
function removeOption(props, idx) { props.options.splice(idx, 1) }

function handleSubmit() { alert(JSON.stringify(store.formData, null, 2)) }
function handleClear() {
  if (!store.fields.length || confirm('清空所有字段？')) store.clearAll()
}
</script>

<template>
  <div class="fd-layout">
    <!-- 左侧面板 -->
    <aside class="fd-palette">
      <div class="palette-header">组件</div>
      <div class="palette-body">
        <template v-for="(comps, group) in groups" :key="group">
          <div class="group-label">{{ group }}</div>
          <div
            v-for="comp in comps" :key="comp.type"
            class="palette-item"
            draggable="true"
            @dragstart="onPaletteDragStart($event, comp)"
            @dblclick="store.addField(comp)"
          >
            <el-icon class="palette-icon"><component :is="comp.icon" /></el-icon>
            <span>{{ comp.label }}</span>
          </div>
        </template>
      </div>
    </aside>

    <!-- 画布 -->
    <div class="fd-canvas-wrap">
      <div class="fd-toolbar">
        <div class="flex gap-2 items-center">
          <button class="btn btn-ghost btn-sm" :disabled="!store.canUndo" @click="store.undo">撤销</button>
          <button class="btn btn-ghost btn-sm" :disabled="!store.canRedo" @click="store.redo">重做</button>
          <span class="field-count">{{ store.fields.length }} 个字段</span>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" @click="store.previewMode = !store.previewMode">
            {{ store.previewMode ? '编辑' : '预览' }}
          </button>
          <button class="btn btn-ghost btn-sm" @click="store.exportSchema">导出</button>
          <button class="btn btn-danger btn-sm" @click="handleClear">清空</button>
        </div>
      </div>

      <div class="fd-canvas"
        @dragover.prevent="onDragOver($event, store.fields.length)"
        @drop="onCanvasDrop"
        @click.self="store.selectedId = null"
      >
        <!-- 预览模式 -->
        <template v-if="store.previewMode">
          <div class="preview-form">
            <div class="preview-form-header">表单预览</div>
            <template v-for="field in store.fields" :key="field.id">
              <div v-if="field.type === 'divider'" class="pv-divider"></div>
              <div v-else-if="field.type === 'title'" class="pv-title" :class="`pv-${field.props.level}`">{{ field.props.label }}</div>
              <div v-else class="pv-field">
                <label class="pv-label">
                  <span v-if="field.props.required" class="req">*</span>{{ field.props.label }}
                </label>
                <input v-if="field.type === 'input'" class="input" :placeholder="field.props.placeholder" v-model="store.formData[field.id]" />
                <textarea v-else-if="field.type === 'textarea'" class="input" :placeholder="field.props.placeholder" :rows="field.props.rows" v-model="store.formData[field.id]" style="resize:vertical"></textarea>
                <input v-else-if="field.type === 'number'" type="number" class="input" v-model.number="store.formData[field.id]" />
                <select v-else-if="field.type === 'select'" class="input" v-model="store.formData[field.id]">
                  <option value="">{{ field.props.placeholder }}</option>
                  <option v-for="o in field.props.options" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <div v-else-if="field.type === 'radio'" class="pv-options">
                  <label v-for="o in field.props.options" :key="o.value" class="pv-option">
                    <input type="radio" :name="field.id" :value="o.value" v-model="store.formData[field.id]" /> {{ o.label }}
                  </label>
                </div>
                <div v-else-if="field.type === 'checkbox'" class="pv-options">
                  <label v-for="o in field.props.options" :key="o.value" class="pv-option">
                    <input type="checkbox" :value="o.value" v-model="store.formData[field.id]" /> {{ o.label }}
                  </label>
                </div>
                <input v-else-if="field.type === 'date'" type="date" class="input" v-model="store.formData[field.id]" />
                <label v-else-if="field.type === 'switch'" class="toggle">
                  <input type="checkbox" v-model="store.formData[field.id]" /><span class="toggle-slider"></span>
                </label>
                <div v-else-if="field.type === 'rate'" class="pv-rate">
                  <span v-for="i in field.props.max" :key="i" class="rate-star"
                    :class="{ on: i <= (store.formData[field.id] || 0) }"
                    @click="store.formData[field.id] = i">★</span>
                </div>
              </div>
            </template>
            <div style="padding:16px 24px">
              <button v-if="store.fields.length" class="btn btn-primary" @click="handleSubmit">提交</button>
            </div>
            <div v-if="!store.fields.length" class="empty-state" style="padding:60px 0"><p>暂无字段</p></div>
          </div>
        </template>

        <!-- 编辑模式 -->
        <template v-else>
          <div v-if="!store.fields.length" class="canvas-empty" @dragover.prevent @drop="onCanvasDrop">
            <div class="canvas-empty-box">
              <p style="font-size:13px;color:var(--text2);font-weight:500">从左侧拖拽组件到画布</p>
              <p style="font-size:12px;color:var(--text3);margin-top:4px">或双击组件快速添加</p>
            </div>
          </div>
          <div class="canvas-fields" v-else>
            <template v-for="(field, idx) in store.fields" :key="field.id">
              <div class="drop-line" :class="{ active: dragOverIndex === idx }"
                @dragover.prevent="onDragOver($event, idx)"
                @dragleave="dragOverIndex = null"
                @drop="onDrop($event, idx)"></div>
              <div class="field-card" :class="{ selected: store.selectedId === field.id }"
                draggable="true"
                @dragstart="onCanvasDragStart($event, field.id)"
                @dragend="onDragEnd"
                @click.stop="store.selectedId = field.id"
              >
                <div class="drag-handle">⠿</div>
                <div class="field-card-main">
                  <template v-if="field.type === 'divider'"><div class="inline-divider"></div></template>
                  <template v-else-if="field.type === 'title'">
                    <div class="inline-title" :class="`t-${field.props.level}`">{{ field.props.label }}</div>
                  </template>
                  <template v-else>
                    <span class="field-label-text">{{ field.props.label }}</span>
                    <span v-if="field.props.required" class="req">*</span>
                  </template>
                </div>
                <span class="field-type-tag">{{ typeLabel(field.type) }}</span>
                <button class="remove-btn" @click.stop="store.removeField(field.id)">×</button>
              </div>
            </template>
            <div class="drop-line" :class="{ active: dragOverIndex === store.fields.length }"
              @dragover.prevent="onDragOver($event, store.fields.length)"
              @dragleave="dragOverIndex = null"
              @drop="onDrop($event, store.fields.length)"></div>
          </div>
        </template>
      </div>
    </div>

    <!-- 右侧属性面板 -->
    <aside class="fd-props" v-if="!store.previewMode">
      <div class="palette-header">属性</div>
      <div v-if="!store.selectedField" class="empty-state" style="padding:48px 20px">
        <p>选中字段后<br>在此配置属性</p>
      </div>
      <div v-else class="props-body">
        <div class="prop-group">
          <div class="prop-group-title">基础</div>
          <div class="prop-row">
            <label>标签</label>
            <input class="input" :value="store.selectedField.props.label"
              @input="store.updateProp(store.selectedId, 'label', $event.target.value)" />
          </div>
          <div v-if="'placeholder' in store.selectedField.props" class="prop-row">
            <label>占位</label>
            <input class="input" :value="store.selectedField.props.placeholder"
              @input="store.updateProp(store.selectedId, 'placeholder', $event.target.value)" />
          </div>
          <div v-if="'required' in store.selectedField.props" class="prop-row prop-row-inline">
            <label>必填</label>
            <label class="toggle">
              <input type="checkbox" :checked="store.selectedField.props.required"
                @change="store.updateProp(store.selectedId, 'required', $event.target.checked)" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div v-if="'disabled' in store.selectedField.props" class="prop-row prop-row-inline">
            <label>禁用</label>
            <label class="toggle">
              <input type="checkbox" :checked="store.selectedField.props.disabled"
                @change="store.updateProp(store.selectedId, 'disabled', $event.target.checked)" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div v-if="'maxlength' in store.selectedField.props" class="prop-row">
            <label>最大长度</label>
            <input type="number" class="input" :value="store.selectedField.props.maxlength"
              @input="store.updateProp(store.selectedId, 'maxlength', $event.target.value)" placeholder="不限" />
          </div>
          <div v-if="'rows' in store.selectedField.props" class="prop-row">
            <label>行数</label>
            <input type="number" class="input" :value="store.selectedField.props.rows"
              @input="store.updateProp(store.selectedId, 'rows', Number($event.target.value))" min="2" max="10" />
          </div>
          <div v-if="store.selectedField.type === 'title'" class="prop-row">
            <label>级别</label>
            <select class="input" :value="store.selectedField.props.level"
              @change="store.updateProp(store.selectedId, 'level', $event.target.value)">
              <option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option>
            </select>
          </div>
          <div v-if="store.selectedField.type === 'rate'" class="prop-row">
            <label>最大分</label>
            <input type="number" class="input" :value="store.selectedField.props.max"
              @input="store.updateProp(store.selectedId, 'max', Number($event.target.value))" min="3" max="10" />
          </div>
        </div>

        <div class="prop-group" v-if="store.selectedField.props.options">
          <div class="prop-group-title" style="display:flex;justify-content:space-between;align-items:center">
            <span>选项</span>
            <button class="btn btn-ghost btn-sm" @click="addOption(store.selectedField.props)">+ 添加</button>
          </div>
          <div v-for="(opt, idx) in store.selectedField.props.options" :key="idx" class="option-row">
            <input class="input" v-model="opt.label" placeholder="标签" />
            <input class="input" v-model="opt.value" placeholder="值" />
            <button class="remove-btn" @click="removeOption(store.selectedField.props, idx)">×</button>
          </div>
        </div>

        <div class="prop-group">
          <div class="prop-group-title">信息</div>
          <div class="prop-row">
            <label>类型</label>
            <span class="tag tag-default">{{ store.selectedField.type }}</span>
          </div>
          <div class="prop-row">
            <label>ID</label>
            <span class="mono" style="font-size:10px;color:var(--text3)">{{ store.selectedField.id }}</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.fd-layout { display: flex; height: 100%; overflow: hidden; background: var(--bg2); }
.fd-palette { width: 186px; flex-shrink: 0; background: var(--bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
.palette-header { height: 38px; padding: 0 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .07em; background: var(--bg2); flex-shrink: 0; }
.palette-body { flex: 1; overflow-y: auto; padding: 8px; }
.group-label { font-size: 10px; font-weight: 600; color: var(--text3); letter-spacing: .06em; text-transform: uppercase; padding: 10px 6px 4px; }
.palette-item { display: flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: var(--radius); cursor: grab; font-size: 12px; color: var(--text2); transition: all .1s; margin-bottom: 1px; user-select: none; }
.palette-item:hover { background: var(--bg3); color: var(--text); }
.palette-icon { font-size: 13px; flex-shrink: 0; color: var(--text3); }
.palette-item:hover .palette-icon { color: var(--blue); }

.fd-canvas-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.fd-toolbar { height: 42px; padding: 0 16px; background: var(--bg); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.field-count { font-size: 11px; color: var(--text3); margin-left: 8px; }
.fd-canvas { flex: 1; overflow-y: auto; padding: 32px 24px; }
.canvas-empty { height: 100%; display: flex; align-items: center; justify-content: center; }
.canvas-empty-box { border: 1px dashed var(--border2); border-radius: var(--radius2); padding: 56px 80px; text-align: center; background: var(--bg); }
.canvas-fields { max-width: 600px; margin: 0 auto; }
.drop-line { height: 2px; border-radius: 2px; transition: all .12s; margin: 1px 0; }
.drop-line.active { height: 24px; background: #eff6ff; border: 1px dashed #93c5fd; border-radius: var(--radius); }
.field-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; margin: 2px 0; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; transition: all .1s; }
.field-card:hover { border-color: var(--border2); }
.field-card.selected { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(24,24,27,.06); }
.drag-handle { color: var(--text3); cursor: grab; font-size: 14px; flex-shrink: 0; line-height: 1; }
.field-card-main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 4px; }
.field-label-text { font-size: 13px; font-weight: 500; color: var(--text); }
.req { color: var(--red); font-size: 12px; }
.field-type-tag { font-size: 11px; color: var(--text3); background: var(--bg3); padding: 1px 7px; border-radius: 3px; flex-shrink: 0; border: 1px solid var(--border); }
.remove-btn { width: 20px; height: 20px; border: none; background: transparent; color: var(--text3); cursor: pointer; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; transition: all .1s; line-height: 1; }
.remove-btn:hover { background: #fee2e2; color: var(--red); }
.inline-divider { flex: 1; height: 1px; background: var(--border); }
.inline-title { font-weight: 600; color: var(--text); }
.t-h2 { font-size: 16px; } .t-h3 { font-size: 14px; } .t-h4 { font-size: 13px; }

.fd-props { width: 232px; flex-shrink: 0; background: var(--bg); border-left: 1px solid var(--border); display: flex; flex-direction: column; }
.props-body { flex: 1; overflow-y: auto; }
.prop-group { padding: 14px 14px 6px; border-bottom: 1px solid var(--border); }
.prop-group:last-child { border-bottom: none; }
.prop-group-title { font-size: 10px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; }
.prop-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.prop-row label { font-size: 11px; color: var(--text2); white-space: nowrap; flex-shrink: 0; min-width: 54px; }
.prop-row .input { font-size: 12px; padding: 4px 8px; }
.prop-row-inline { justify-content: space-between; }
.option-row { display: flex; gap: 5px; margin-bottom: 5px; }
.option-row .input { font-size: 11px; padding: 4px 7px; }

.preview-form { max-width: 520px; margin: 0 auto; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius2); overflow: hidden; }
.preview-form-header { padding: 16px 24px; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--text); background: var(--bg2); }
.pv-field { padding: 14px 24px; border-bottom: 1px solid var(--border); }
.pv-label { display: block; font-size: 11px; font-weight: 500; color: var(--text2); margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em; }
.pv-divider { height: 1px; background: var(--border); }
.pv-title { padding: 14px 24px 4px; font-weight: 600; color: var(--text); }
.pv-h2 { font-size: 16px; } .pv-h3 { font-size: 14px; } .pv-h4 { font-size: 13px; }
.pv-options { display: flex; flex-wrap: wrap; gap: 12px; }
.pv-option { display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--text2); cursor: pointer; }
.pv-rate { display: flex; gap: 2px; }
.rate-star { font-size: 20px; color: var(--border2); cursor: pointer; transition: color .1s; }
.rate-star.on { color: var(--orange); }

/* 覆盖 el-icon 默认大小 */
:deep(.el-icon) { display: flex; align-items: center; }
</style>
