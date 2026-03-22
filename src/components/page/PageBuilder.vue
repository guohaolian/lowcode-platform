<script setup>
import { ref } from 'vue'
import { usePageStore } from '../../stores/pageStore.js'
import {
  EditPen, Picture, Coin, Remove, CreditCard,
  Minus, Ticket
} from '@element-plus/icons-vue'

const store = usePageStore()

const widgets = [
  { type: 'text',    label: '文本块',  icon: EditPen,  defaultStyle: { width: 200, height: 48, background: 'transparent', color: '#09090b', fontSize: 14, fontWeight: 'normal', textAlign: 'left', borderRadius: 0, padding: 0, content: '双击编辑文字' } },
  { type: 'button',  label: '按钮',    icon: Ticket,   defaultStyle: { width: 110, height: 36, background: '#18181b', color: '#ffffff', fontSize: 12, fontWeight: '500', textAlign: 'center', borderRadius: 5, content: '按钮' } },
  { type: 'input',   label: '输入框',  icon: CreditCard, defaultStyle: { width: 200, height: 34, background: '#ffffff', borderRadius: 5, placeholder: '请输入' } },
  { type: 'image',   label: '图片',    icon: Picture,  defaultStyle: { width: 200, height: 140, background: '#f4f4f5', borderRadius: 6, src: '' } },
  { type: 'card',    label: '卡片',    icon: Coin,     defaultStyle: { width: 240, height: 140, background: '#ffffff', borderRadius: 8, border: '1px solid #e4e4e7', padding: 16, content: '卡片内容' } },
  { type: 'divider', label: '横线',    icon: Minus,    defaultStyle: { width: 280, height: 16, background: 'transparent', borderColor: '#e4e4e7' } },
  { type: 'badge',   label: '标签',    icon: Remove,   defaultStyle: { width: 72, height: 24, background: '#f4f4f5', color: '#52525b', fontSize: 11, borderRadius: 3, content: '标签' } },
]

const canvasRef = ref(null)
const draggingWidget = ref(null)
const movingNode = ref(null)
const resizingNode = ref(null)
const editingId = ref(null)

function onPaletteDragStart(e, def) { draggingWidget.value = def; e.dataTransfer.effectAllowed = 'copy' }
function onCanvasDrop(e) {
  if (!draggingWidget.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left - (draggingWidget.value.defaultStyle.width || 120) / 2
  const y = e.clientY - rect.top - (draggingWidget.value.defaultStyle.height || 40) / 2
  store.addNode(draggingWidget.value, Math.max(0, x), Math.max(0, y))
  draggingWidget.value = null
}

function startMove(e, node) {
  if (store.previewMode) return
  e.stopPropagation(); store.selectedId = node.id
  movingNode.value = { id: node.id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y }
  window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU)
}
function startResize(e, node) {
  e.stopPropagation()
  resizingNode.value = { id: node.id, startX: e.clientX, startY: e.clientY, origW: node.style.width, origH: node.style.height }
  window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU)
}
function onMM(e) {
  if (movingNode.value) store.updatePosition(movingNode.value.id, movingNode.value.origX + e.clientX - movingNode.value.startX, movingNode.value.origY + e.clientY - movingNode.value.startY)
  if (resizingNode.value) store.updateSize(resizingNode.value.id, resizingNode.value.origW + e.clientX - resizingNode.value.startX, resizingNode.value.origH + e.clientY - resizingNode.value.startY)
}
function onMU() {
  movingNode.value = null; resizingNode.value = null
  window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU)
}
function startEdit(node) { if (['text','button','card','badge'].includes(node.type)) editingId.value = node.id }
function stopEdit() { editingId.value = null }
</script>

<template>
  <div class="pb-layout">
    <aside class="pb-palette">
      <div class="palette-header">组件</div>
      <div class="palette-body">
        <div v-for="w in widgets" :key="w.type" class="palette-item"
          draggable="true"
          @dragstart="onPaletteDragStart($event, w)"
          @dblclick="store.addNode(w)"
        >
          <el-icon class="palette-icon"><component :is="w.icon" /></el-icon>
          <span>{{ w.label }}</span>
        </div>
      </div>
    </aside>

    <div class="pb-canvas-wrap">
      <div class="pb-toolbar">
        <div class="flex gap-2 items-center">
          <span class="field-count">{{ store.nodes.length }} 个组件</span>
          <template v-if="store.selected">
            <button class="btn btn-ghost btn-sm" @click="store.bringForward(store.selected.id)">上移</button>
            <button class="btn btn-ghost btn-sm" @click="store.sendBackward(store.selected.id)">下移</button>
            <button class="btn btn-danger btn-sm" @click="store.removeNode(store.selected.id)">删除</button>
          </template>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" @click="store.previewMode = !store.previewMode">{{ store.previewMode ? '编辑' : '预览' }}</button>
          <button class="btn btn-danger btn-sm" @click="store.clearAll">清空</button>
        </div>
      </div>

      <div ref="canvasRef" class="pb-canvas" :class="{ 'pb-preview': store.previewMode }"
        @dragover.prevent @drop="onCanvasDrop" @click.self="store.selectedId = null">
        <div v-if="!store.nodes.length" class="canvas-empty">
          <div class="canvas-empty-box">
            <p style="font-size:13px;color:var(--text2);font-weight:500">从左侧拖拽组件到画布</p>
            <p style="font-size:12px;color:var(--text3);margin-top:4px">支持自由定位 · 双击编辑文字</p>
          </div>
        </div>

        <div v-for="node in store.nodes" :key="node.id" class="pb-node"
          :class="{ 'pb-node-selected': store.selectedId === node.id && !store.previewMode }"
          :style="{
            left: node.x + 'px', top: node.y + 'px',
            width: (node.style.width || 120) + 'px',
            height: (node.style.height || 40) + 'px',
            background: node.style.background,
            borderRadius: (node.style.borderRadius || 0) + 'px',
            border: node.style.border || 'none',
            padding: node.style.padding ? node.style.padding + 'px' : undefined,
            cursor: store.previewMode ? 'default' : 'move',
            zIndex: store.nodes.indexOf(node) + 1,
          }"
          @mousedown="startMove($event, node)"
          @click.stop="!store.previewMode && (store.selectedId = node.id)"
          @dblclick="startEdit(node)"
        >
          <template v-if="node.type === 'text'">
            <div v-if="editingId !== node.id" :style="{ color: node.style.color, fontSize: node.style.fontSize+'px', fontWeight: node.style.fontWeight, textAlign: node.style.textAlign, lineHeight: 1.5, width:'100%' }">{{ node.style.content }}</div>
            <textarea v-else class="inline-ed" v-model="node.style.content" @blur="stopEdit" autofocus></textarea>
          </template>
          <template v-else-if="node.type === 'button'">
            <div v-if="editingId !== node.id" class="node-center" :style="{ color: node.style.color, fontSize: node.style.fontSize+'px', fontWeight: node.style.fontWeight }">{{ node.style.content }}</div>
            <input v-else class="inline-ed-input" v-model="node.style.content" @blur="stopEdit" autofocus />
          </template>
          <template v-else-if="node.type === 'image'">
            <div v-if="!node.style.src" class="node-placeholder">图片</div>
            <img v-else :src="node.style.src" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />
          </template>
          <template v-else-if="node.type === 'card'">
            <div v-if="editingId !== node.id" style="font-size:12px;color:#52525b;line-height:1.5;width:100%">{{ node.style.content }}</div>
            <textarea v-else class="inline-ed" v-model="node.style.content" @blur="stopEdit" autofocus></textarea>
          </template>
          <template v-else-if="node.type === 'divider'">
            <div style="width:100%;height:1px;background:var(--border);margin-top:50%"></div>
          </template>
          <template v-else-if="node.type === 'input'">
            <div style="width:100%;border:1px solid var(--border);border-radius:4px;padding:5px 9px;font-size:12px;color:var(--text3)">{{ node.style.placeholder }}</div>
          </template>
          <template v-else-if="node.type === 'badge'">
            <div v-if="editingId !== node.id" class="node-center" :style="{ color: node.style.color, fontSize: node.style.fontSize+'px', fontWeight: '500' }">{{ node.style.content }}</div>
            <input v-else class="inline-ed-input" v-model="node.style.content" @blur="stopEdit" autofocus />
          </template>
          <div v-if="store.selectedId === node.id && !store.previewMode" class="resize-handle" @mousedown.stop="startResize($event, node)"></div>
        </div>
      </div>
    </div>

    <aside class="pb-props" v-if="!store.previewMode">
      <div class="palette-header">属性</div>
      <div v-if="!store.selected" class="empty-state" style="padding:48px 20px"><p>选中组件<br>配置属性</p></div>
      <div v-else class="props-body">
        <div class="prop-group">
          <div class="prop-group-title">位置与尺寸</div>
          <div class="prop-row2">
            <div class="ph"><label>X</label><input type="number" class="input" :value="Math.round(store.selected.x)" @input="store.updatePosition(store.selected.id, Number($event.target.value), store.selected.y)" /></div>
            <div class="ph"><label>Y</label><input type="number" class="input" :value="Math.round(store.selected.y)" @input="store.updatePosition(store.selected.id, store.selected.x, Number($event.target.value))" /></div>
          </div>
          <div class="prop-row2">
            <div class="ph"><label>宽</label><input type="number" class="input" :value="store.selected.style.width" @input="store.updateSize(store.selected.id, Number($event.target.value), store.selected.style.height)" /></div>
            <div class="ph"><label>高</label><input type="number" class="input" :value="store.selected.style.height" @input="store.updateSize(store.selected.id, store.selected.style.width, Number($event.target.value))" /></div>
          </div>
        </div>
        <div class="prop-group">
          <div class="prop-group-title">外观</div>
          <div v-if="'background' in store.selected.style" class="prop-row prop-row-inline">
            <label>背景色</label>
            <input type="color" class="color-picker" :value="store.selected.style.background?.startsWith('#') ? store.selected.style.background : '#ffffff'" @input="store.updateStyle(store.selected.id, 'background', $event.target.value)" />
          </div>
          <div v-if="'color' in store.selected.style" class="prop-row prop-row-inline">
            <label>文字色</label>
            <input type="color" class="color-picker" :value="store.selected.style.color || '#09090b'" @input="store.updateStyle(store.selected.id, 'color', $event.target.value)" />
          </div>
          <div v-if="'fontSize' in store.selected.style" class="prop-row">
            <label>字号</label>
            <input type="number" class="input" :value="store.selected.style.fontSize" @input="store.updateStyle(store.selected.id, 'fontSize', Number($event.target.value))" min="10" max="72" />
          </div>
          <div v-if="'fontWeight' in store.selected.style" class="prop-row">
            <label>字重</label>
            <select class="input" :value="store.selected.style.fontWeight" @change="store.updateStyle(store.selected.id, 'fontWeight', $event.target.value)">
              <option value="normal">正常</option><option value="500">中等</option><option value="bold">加粗</option>
            </select>
          </div>
          <div v-if="'textAlign' in store.selected.style" class="prop-row">
            <label>对齐</label>
            <select class="input" :value="store.selected.style.textAlign" @change="store.updateStyle(store.selected.id, 'textAlign', $event.target.value)">
              <option value="left">左对齐</option><option value="center">居中</option><option value="right">右对齐</option>
            </select>
          </div>
          <div class="prop-row">
            <label>圆角</label>
            <input type="number" class="input" :value="store.selected.style.borderRadius || 0" @input="store.updateStyle(store.selected.id, 'borderRadius', Number($event.target.value))" min="0" max="60" />
          </div>
          <div v-if="'padding' in store.selected.style" class="prop-row">
            <label>内边距</label>
            <input type="number" class="input" :value="store.selected.style.padding || 0" @input="store.updateStyle(store.selected.id, 'padding', Number($event.target.value))" min="0" />
          </div>
        </div>
        <div class="prop-group" v-if="store.selected.type === 'image'">
          <div class="prop-group-title">图片</div>
          <div class="prop-row"><label>URL</label><input class="input" :value="store.selected.style.src" @input="store.updateStyle(store.selected.id, 'src', $event.target.value)" placeholder="https://..." /></div>
        </div>
        <div class="prop-group">
          <div style="display:flex;gap:6px;margin-bottom:8px">
            <button class="btn btn-ghost btn-sm" style="flex:1" @click="store.bringForward(store.selected.id)">上移一层</button>
            <button class="btn btn-ghost btn-sm" style="flex:1" @click="store.sendBackward(store.selected.id)">下移一层</button>
          </div>
          <button class="btn btn-danger btn-sm" style="width:100%" @click="store.removeNode(store.selected.id)">删除组件</button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.pb-layout { display: flex; height: 100%; overflow: hidden; background: var(--bg2); }
.pb-palette { width: 168px; flex-shrink: 0; background: var(--bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
.palette-header { height: 38px; padding: 0 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .07em; background: var(--bg2); flex-shrink: 0; }
.palette-body { flex: 1; overflow-y: auto; padding: 8px; }
.palette-item { display: flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: var(--radius); cursor: grab; font-size: 12px; color: var(--text2); transition: all .1s; margin-bottom: 1px; user-select: none; }
.palette-item:hover { background: var(--bg3); color: var(--text); }
.palette-icon { font-size: 13px; flex-shrink: 0; color: var(--text3); }
.palette-item:hover .palette-icon { color: var(--blue); }
.pb-canvas-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.pb-toolbar { height: 42px; padding: 0 16px; background: var(--bg); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.field-count { font-size: 11px; color: var(--text3); }
.pb-canvas { flex: 1; position: relative; overflow: auto; background: var(--bg2); background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px); background-size: 20px 20px; min-height: 600px; min-width: 800px; }
.pb-canvas.pb-preview { background-image: none; background: #f8f8f8; }
.canvas-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.canvas-empty-box { border: 1px dashed var(--border2); border-radius: var(--radius2); padding: 56px 80px; text-align: center; background: var(--bg); }
.pb-node { position: absolute; user-select: none; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.pb-node-selected { outline: 1.5px solid var(--accent); outline-offset: 2px; box-shadow: 0 0 0 4px rgba(24,24,27,.06); }
.node-center { text-align: center; pointer-events: none; width: 100%; }
.node-placeholder { color: var(--text3); font-size: 12px; }
.inline-ed { width: 100%; height: 100%; border: none; background: transparent; color: inherit; font-size: inherit; font-family: inherit; resize: none; outline: none; padding: 0; }
.inline-ed-input { width: 100%; border: none; background: transparent; color: inherit; font-family: inherit; text-align: center; outline: none; font-size: inherit; font-weight: inherit; }
.resize-handle { position: absolute; right: -3px; bottom: -3px; width: 8px; height: 8px; background: var(--accent); border-radius: 2px; cursor: se-resize; z-index: 10; }
.pb-props { width: 220px; flex-shrink: 0; background: var(--bg); border-left: 1px solid var(--border); display: flex; flex-direction: column; }
.props-body { flex: 1; overflow-y: auto; }
.prop-group { padding: 12px 14px 8px; border-bottom: 1px solid var(--border); }
.prop-group:last-child { border-bottom: none; }
.prop-group-title { font-size: 10px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; }
.prop-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.prop-row label { font-size: 11px; color: var(--text2); white-space: nowrap; flex-shrink: 0; min-width: 48px; }
.prop-row .input { font-size: 12px; padding: 4px 8px; }
.prop-row-inline { justify-content: space-between; }
.prop-row2 { display: flex; gap: 8px; margin-bottom: 8px; }
.ph { flex: 1; }
.ph label { display: block; font-size: 10px; color: var(--text3); margin-bottom: 3px; }
.ph .input { font-size: 12px; padding: 4px 8px; }
.color-picker { width: 36px; height: 26px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; padding: 1px; background: none; }
:deep(.el-icon) { display: flex; align-items: center; }
</style>
