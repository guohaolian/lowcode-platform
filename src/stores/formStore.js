import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function genId(prefix = 'f') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const useFormStore = defineStore('form', () => {
  const fields = ref([])
  const selectedId = ref(null)
  const previewMode = ref(false)
  const formData = ref({})

  // 历史
  const history = ref([JSON.stringify([])])
  const histCursor = ref(0)
  let histPaused = false

  function snapshot() {
    if (histPaused) return
    history.value = history.value.slice(0, histCursor.value + 1)
    history.value.push(JSON.stringify(fields.value))
    histCursor.value = history.value.length - 1
    if (history.value.length > 50) { history.value.shift(); histCursor.value-- }
  }
  function undo() {
    if (histCursor.value <= 0) return
    histPaused = true; histCursor.value--
    fields.value = JSON.parse(history.value[histCursor.value])
    histPaused = false
  }
  function redo() {
    if (histCursor.value >= history.value.length - 1) return
    histPaused = true; histCursor.value++
    fields.value = JSON.parse(history.value[histCursor.value])
    histPaused = false
  }
  const canUndo = computed(() => histCursor.value > 0)
  const canRedo = computed(() => histCursor.value < history.value.length - 1)

  const selectedField = computed(() => fields.value.find(f => f.id === selectedId.value))

  function addField(def, atIndex) {
    const field = { id: genId(), type: def.type, props: deepClone(def.defaultProps) }
    if (atIndex !== undefined) fields.value.splice(atIndex, 0, field)
    else fields.value.push(field)
    selectedId.value = field.id
    snapshot()
  }
  function removeField(id) {
    const idx = fields.value.findIndex(f => f.id === id)
    if (idx > -1) fields.value.splice(idx, 1)
    if (selectedId.value === id) selectedId.value = null
    snapshot()
  }
  function moveField(fromId, toIndex) {
    const fromIdx = fields.value.findIndex(f => f.id === fromId)
    if (fromIdx === -1) return
    const [field] = fields.value.splice(fromIdx, 1)
    fields.value.splice(Math.max(0, toIndex > fromIdx ? toIndex - 1 : toIndex), 0, field)
    snapshot()
  }
  function updateProp(id, key, value) {
    const field = fields.value.find(f => f.id === id)
    if (field) { field.props[key] = value; snapshot() }
  }
  function clearAll() {
    fields.value = []; selectedId.value = null; snapshot()
  }
  function exportSchema() {
    const blob = new Blob([JSON.stringify({ fields: fields.value }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'schema.json'; a.click()
  }

  return {
    fields, selectedId, previewMode, formData,
    history, histCursor, canUndo, canRedo,
    selectedField,
    addField, removeField, moveField, updateProp, clearAll, exportSchema,
    undo, redo, snapshot,
  }
})
