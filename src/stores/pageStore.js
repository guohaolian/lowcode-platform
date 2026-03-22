import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function genId(p = 'n') { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
function deepClone(o) { return JSON.parse(JSON.stringify(o)) }

export const usePageStore = defineStore('page', () => {
  const nodes = ref([])
  const selectedId = ref(null)
  const previewMode = ref(false)

  const selected = computed(() => nodes.value.find(n => n.id === selectedId.value))

  function addNode(widgetDef, x = 60, y = 60) {
    const node = { id: genId(), type: widgetDef.type, x, y, style: deepClone(widgetDef.defaultStyle) }
    nodes.value.push(node)
    selectedId.value = node.id
    return node
  }
  function removeNode(id) {
    const idx = nodes.value.findIndex(n => n.id === id)
    if (idx > -1) nodes.value.splice(idx, 1)
    if (selectedId.value === id) selectedId.value = null
  }
  function updateStyle(id, key, value) {
    const node = nodes.value.find(n => n.id === id)
    if (node) node.style[key] = value
  }
  function updatePosition(id, x, y) {
    const node = nodes.value.find(n => n.id === id)
    if (node) { node.x = Math.max(0, x); node.y = Math.max(0, y) }
  }
  function updateSize(id, w, h) {
    const node = nodes.value.find(n => n.id === id)
    if (node) { node.style.width = Math.max(60, w); node.style.height = Math.max(20, h) }
  }
  function bringForward(id) {
    const i = nodes.value.findIndex(n => n.id === id)
    if (i < nodes.value.length - 1) { const [n] = nodes.value.splice(i, 1); nodes.value.splice(i + 1, 0, n) }
  }
  function sendBackward(id) {
    const i = nodes.value.findIndex(n => n.id === id)
    if (i > 0) { const [n] = nodes.value.splice(i, 1); nodes.value.splice(i - 1, 0, n) }
  }
  function clearAll() { nodes.value = []; selectedId.value = null }

  return {
    nodes, selectedId, previewMode, selected,
    addNode, removeNode, updateStyle, updatePosition, updateSize,
    bringForward, sendBackward, clearAll,
  }
})
