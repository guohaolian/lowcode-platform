import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function genId(p = 'e') { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }

export const useFlowStore = defineStore('flow', () => {
  const nodes = ref([
    { id: 'start_1',  type: 'start',    label: '开始',    x: 60,   y: 180, props: {} },
    { id: 'proc_1',   type: 'process',  label: '填写申请', x: 220,  y: 168, props: { assignee: '申请人' } },
    { id: 'appr_1',   type: 'approval', label: '部门审批', x: 420,  y: 168, props: { assignee: '部门经理', timeout: 3 } },
    { id: 'cond_1',   type: 'condition',label: '金额判断', x: 620,  y: 164, props: { expr: 'amount > 10000' } },
    { id: 'appr_2',   type: 'approval', label: '总监审批', x: 820,  y: 100, props: { assignee: '总监' } },
    { id: 'notify_1', type: 'notify',   label: '发送通知', x: 820,  y: 250, props: { message: '审批完成' } },
    { id: 'end_1',    type: 'end',      label: '结束',    x: 1020, y: 180, props: {} },
  ])
  const edges = ref([
    { id: genId(), source: 'start_1',  target: 'proc_1',   label: '' },
    { id: genId(), source: 'proc_1',   target: 'appr_1',   label: '' },
    { id: genId(), source: 'appr_1',   target: 'cond_1',   label: '同意' },
    { id: genId(), source: 'cond_1',   target: 'appr_2',   label: '>1万' },
    { id: genId(), source: 'cond_1',   target: 'notify_1', label: '≤1万' },
    { id: genId(), source: 'appr_2',   target: 'end_1',    label: '' },
    { id: genId(), source: 'notify_1', target: 'end_1',    label: '' },
  ])
  const selectedNodeId = ref(null)
  const selectedEdgeId = ref(null)

  const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value))
  const selectedEdge = computed(() => edges.value.find(e => e.id === selectedEdgeId.value))

  function addNode(type, label, x, y) {
    const node = { id: genId(type), type, label, x, y, props: {} }
    nodes.value.push(node)
    selectedNodeId.value = node.id
    selectedEdgeId.value = null
  }
  function updateNodePos(id, x, y) {
    const n = nodes.value.find(n => n.id === id)
    if (n) { n.x = Math.max(0, x); n.y = Math.max(0, y) }
  }
  function addEdge(sourceId, targetId) {
    const exists = edges.value.some(e => e.source === sourceId && e.target === targetId)
    if (!exists) edges.value.push({ id: genId(), source: sourceId, target: targetId, label: '' })
  }
  function removeSelected() {
    if (selectedNodeId.value) {
      const idx = nodes.value.findIndex(n => n.id === selectedNodeId.value)
      if (idx > -1) nodes.value.splice(idx, 1)
      const toRm = edges.value.filter(e => e.source === selectedNodeId.value || e.target === selectedNodeId.value).map(e => e.id)
      toRm.forEach(id => { const i = edges.value.findIndex(e => e.id === id); if (i > -1) edges.value.splice(i, 1) })
      selectedNodeId.value = null
    }
    if (selectedEdgeId.value) {
      const idx = edges.value.findIndex(e => e.id === selectedEdgeId.value)
      if (idx > -1) edges.value.splice(idx, 1)
      selectedEdgeId.value = null
    }
  }

  return {
    nodes, edges, selectedNodeId, selectedEdgeId, selectedNode, selectedEdge,
    addNode, updateNodePos, addEdge, removeSelected,
  }
})
