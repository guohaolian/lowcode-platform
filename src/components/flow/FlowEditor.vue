<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useFlowStore } from '../../stores/flowStore.js'

const store = useFlowStore()

const NODE_TYPES = {
  start:    { label: '开始',    w: 90,  h: 40, shape: 'pill' },
  end:      { label: '结束',    w: 90,  h: 40, shape: 'pill' },
  process:  { label: '处理',    w: 130, h: 48, shape: 'rect' },
  approval: { label: '审批',    w: 130, h: 48, shape: 'rect' },
  condition:{ label: '条件判断', w: 120, h: 52, shape: 'rect' },
  notify:   { label: '通知',    w: 130, h: 48, shape: 'rect' },
}
const NODE_COLORS = {
  start:    { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
  end:      { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
  process:  { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
  approval: { bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  condition:{ bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed' },
  notify:   { bg: '#ecfeff', border: '#67e8f9', text: '#0e7490' },
}

const svgRef = ref(null)
const movingNode = ref(null)
const drawingEdge = ref(null)

function nRight(id) {
  const n = store.nodes.find(n => n.id === id); if (!n) return { x: 0, y: 0 }
  const t = NODE_TYPES[n.type]; return { x: n.x + (t?.w || 120), y: n.y + (t?.h || 48) / 2 }
}
function nLeft(id) {
  const n = store.nodes.find(n => n.id === id); if (!n) return { x: 0, y: 0 }
  return { x: n.x, y: n.y + (NODE_TYPES[n.type]?.h || 48) / 2 }
}
function edgePath(edge) {
  const s = nRight(edge.source); const t = nLeft(edge.target)
  const dx = Math.abs(t.x - s.x) * 0.45
  return `M${s.x},${s.y} C${s.x+dx},${s.y} ${t.x-dx},${t.y} ${t.x},${t.y}`
}
function edgeMid(edge) {
  const s = nRight(edge.source); const t = nLeft(edge.target)
  return { x: (s.x+t.x)/2, y: (s.y+t.y)/2 }
}

function startMove(e, node) {
  e.stopPropagation()
  store.selectedNodeId = node.id; store.selectedEdgeId = null
  movingNode.value = { id: node.id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y }
  window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU)
}
function startDrawEdge(e, nodeId) {
  e.stopPropagation()
  const rect = svgRef.value.getBoundingClientRect()
  drawingEdge.value = { sourceId: nodeId, curX: e.clientX - rect.left, curY: e.clientY - rect.top }
  window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU)
}
function onMM(e) {
  if (movingNode.value) store.updateNodePos(movingNode.value.id, movingNode.value.origX + e.clientX - movingNode.value.startX, movingNode.value.origY + e.clientY - movingNode.value.startY)
  if (drawingEdge.value) {
    const rect = svgRef.value.getBoundingClientRect()
    drawingEdge.value.curX = e.clientX - rect.left
    drawingEdge.value.curY = e.clientY - rect.top
  }
}
function onMU(e) {
  if (drawingEdge.value) {
    const rect = svgRef.value.getBoundingClientRect()
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top
    const target = store.nodes.find(n => {
      const t = NODE_TYPES[n.type]
      return mx >= n.x && mx <= n.x + (t?.w || 120) && my >= n.y && my <= n.y + (t?.h || 48)
    })
    if (target && target.id !== drawingEdge.value.sourceId) store.addEdge(drawingEdge.value.sourceId, target.id)
    drawingEdge.value = null
  }
  movingNode.value = null
  window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU)
}

function onKD(e) { if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement === document.body) store.removeSelected() }
onMounted(() => window.addEventListener('keydown', onKD))
onUnmounted(() => window.removeEventListener('keydown', onKD))
</script>

<template>
  <div class="fe-layout">
    <div class="fe-toolbar">
      <div class="flex gap-2 items-center">
        <span class="toolbar-title">Flow</span>
        <span class="sep"></span>
        <span class="field-count">{{ store.nodes.length }} 节点 · {{ store.edges.length }} 连线</span>
      </div>
      <div class="flex gap-2 items-center" style="flex-wrap:wrap">
        <span class="hint-text">添加节点：</span>
        <button v-for="(t, key) in NODE_TYPES" :key="key" class="btn btn-ghost btn-sm node-add-btn"
          :style="{ color: NODE_COLORS[key].text, borderColor: NODE_COLORS[key].border, background: NODE_COLORS[key].bg }"
          @click="store.addNode(key, t.label, 120 + Math.random()*300, 80 + Math.random()*180)">
          {{ t.label }}
        </button>
        <button v-if="store.selectedNodeId || store.selectedEdgeId" class="btn btn-danger btn-sm" @click="store.removeSelected">删除</button>
      </div>
    </div>

    <div class="fe-body">
      <div class="fe-canvas" @click.self="store.selectedNodeId = null; store.selectedEdgeId = null">
        <svg ref="svgRef" class="fe-svg">
          <defs>
            <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#d1d5db" />
            </marker>
            <marker id="arr-sel" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#18181b" />
            </marker>
          </defs>
          <g v-for="edge in store.edges" :key="edge.id" @click.stop="store.selectedEdgeId = edge.id; store.selectedNodeId = null">
            <path :d="edgePath(edge)" fill="none" :stroke="store.selectedEdgeId === edge.id ? '#18181b' : '#d1d5db'" stroke-width="1.5"
              :marker-end="store.selectedEdgeId === edge.id ? 'url(#arr-sel)' : 'url(#arr)'" style="cursor:pointer" />
            <text v-if="edge.label" :x="edgeMid(edge).x" :y="edgeMid(edge).y - 5" text-anchor="middle" fill="#a1a1aa" font-size="10" font-family="Geist, sans-serif">{{ edge.label }}</text>
            <path :d="edgePath(edge)" fill="none" stroke="transparent" stroke-width="12" style="cursor:pointer" />
          </g>
          <line v-if="drawingEdge" :x1="nRight(drawingEdge.sourceId).x" :y1="nRight(drawingEdge.sourceId).y" :x2="drawingEdge.curX" :y2="drawingEdge.curY"
            stroke="#18181b" stroke-width="1.5" stroke-dasharray="5,3" />
        </svg>

        <div v-for="node in store.nodes" :key="node.id" class="flow-node"
          :class="[`shape-${NODE_TYPES[node.type]?.shape}`, { 'node-selected': store.selectedNodeId === node.id }]"
          :style="{
            left: node.x + 'px', top: node.y + 'px',
            width: (NODE_TYPES[node.type]?.w || 120) + 'px',
            height: (NODE_TYPES[node.type]?.h || 48) + 'px',
            background: NODE_COLORS[node.type]?.bg,
            borderColor: store.selectedNodeId === node.id ? '#18181b' : NODE_COLORS[node.type]?.border,
            color: NODE_COLORS[node.type]?.text,
          }"
          @mousedown="startMove($event, node)"
          @click.stop="store.selectedNodeId = node.id; store.selectedEdgeId = null"
        >
          <span class="node-label">{{ node.label }}</span>
          <div class="node-port" @mousedown.stop="startDrawEdge($event, node.id)" title="拖拽连线"></div>
        </div>
      </div>

      <aside class="fe-props">
        <div class="palette-header">属性</div>
        <div v-if="!store.selectedNode && !store.selectedEdge" class="empty-state" style="padding:48px 20px">
          <p>点击节点或连线<br><br>拖拽右侧圆点<br>可连接两个节点</p>
        </div>
        <div v-if="store.selectedNode" class="props-body">
          <div class="prop-group">
            <div class="prop-group-title" :style="{ color: NODE_COLORS[store.selectedNode.type]?.text }">
              {{ NODE_TYPES[store.selectedNode.type]?.label }}
            </div>
            <div class="prop-row"><label>名称</label><input class="input" v-model="store.selectedNode.label" /></div>
            <template v-if="store.selectedNode.type === 'approval'">
              <div class="prop-row"><label>审批人</label><input class="input" v-model="store.selectedNode.props.assignee" placeholder="角色/人员" /></div>
              <div class="prop-row"><label>超时(天)</label><input type="number" class="input" v-model.number="store.selectedNode.props.timeout" min="0" /></div>
            </template>
            <template v-if="store.selectedNode.type === 'process'">
              <div class="prop-row"><label>处理人</label><input class="input" v-model="store.selectedNode.props.assignee" placeholder="角色/人员" /></div>
            </template>
            <template v-if="store.selectedNode.type === 'condition'">
              <div class="prop-row"><label>表达式</label><input class="input mono" v-model="store.selectedNode.props.expr" placeholder="x > 1000" /></div>
            </template>
            <template v-if="store.selectedNode.type === 'notify'">
              <div class="prop-row"><label>消息内容</label><input class="input" v-model="store.selectedNode.props.message" /></div>
            </template>
            <div class="prop-row"><label>ID</label><span class="mono" style="font-size:10px;color:var(--text3)">{{ store.selectedNode.id }}</span></div>
          </div>
          <div style="padding:0 14px 14px"><button class="btn btn-danger btn-sm" style="width:100%" @click="store.removeSelected">删除节点</button></div>
        </div>
        <div v-if="store.selectedEdge" class="props-body">
          <div class="prop-group">
            <div class="prop-group-title">连线</div>
            <div class="prop-row"><label>标签</label><input class="input" v-model="store.selectedEdge.label" placeholder="（可选）" /></div>
            <div class="prop-row"><label>来源</label><span class="tag tag-default">{{ store.nodes.find(n=>n.id===store.selectedEdge.source)?.label }}</span></div>
            <div class="prop-row"><label>目标</label><span class="tag tag-default">{{ store.nodes.find(n=>n.id===store.selectedEdge.target)?.label }}</span></div>
          </div>
          <div style="padding:0 14px 14px"><button class="btn btn-danger btn-sm" style="width:100%" @click="store.removeSelected">删除连线</button></div>
        </div>
      </aside>
    </div>
    <div class="fe-footer">拖拽节点移动 · 拖拽节点右侧圆点连线 · Delete 键删除选中</div>
  </div>
</template>

<style scoped>
.fe-layout { display: flex; flex-direction: column; height: 100%; }
.fe-toolbar { height: 48px; padding: 0 16px; background: var(--bg); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; gap: 12px; flex-wrap: wrap; }
.toolbar-title { font-size: 13px; font-weight: 600; }
.sep { width: 1px; height: 16px; background: var(--border); }
.field-count { font-size: 11px; color: var(--text3); }
.hint-text { font-size: 11px; color: var(--text3); }
.node-add-btn { font-size: 11px; padding: 3px 10px; }
.fe-footer { height: 30px; padding: 0 16px; border-top: 1px solid var(--border); background: var(--bg2); display: flex; align-items: center; font-size: 11px; color: var(--text3); flex-shrink: 0; }
.fe-body { flex: 1; display: flex; overflow: hidden; }
.fe-canvas { flex: 1; position: relative; overflow: auto; background: var(--bg); background-image: radial-gradient(circle, #e4e4e7 1px, transparent 1px); background-size: 18px 18px; min-height: 500px; min-width: 800px; }
.fe-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: all; overflow: visible; }
.flow-node { position: absolute; display: flex; align-items: center; justify-content: center; border: 1.5px solid; border-radius: 6px; cursor: move; user-select: none; font-size: 12px; font-weight: 500; transition: box-shadow .1s; z-index: 10; }
.shape-pill { border-radius: 100px; }
.flow-node:hover { box-shadow: var(--shadow); }
.node-selected { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(24,24,27,.08) !important; }
.node-label { font-size: 12px; letter-spacing: -.01em; }
.node-port { position: absolute; right: -6px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; background: var(--accent); border-radius: 50%; border: 2px solid var(--bg); cursor: crosshair; z-index: 20; transition: transform .1s; }
.node-port:hover { transform: translateY(-50%) scale(1.5); }
.fe-props { width: 220px; flex-shrink: 0; background: var(--bg); border-left: 1px solid var(--border); display: flex; flex-direction: column; }
.palette-header { height: 38px; padding: 0 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .07em; background: var(--bg2); flex-shrink: 0; }
.props-body { flex: 1; overflow-y: auto; }
.prop-group { padding: 12px 14px 8px; border-bottom: 1px solid var(--border); }
.prop-group:last-child { border-bottom: none; }
.prop-group-title { font-size: 10px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; }
.prop-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.prop-row label { font-size: 11px; color: var(--text2); white-space: nowrap; flex-shrink: 0; min-width: 48px; }
.prop-row .input { font-size: 12px; padding: 4px 8px; }
</style>
