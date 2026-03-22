import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function genId(p = 'w') { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }

const RAW_DATA_SOURCES = [
  {
    id: 'ds_sales', name: '月度销售',
    data: [
      { month: '1月', sales: 3200, cost: 1800, profit: 1400 },
      { month: '2月', sales: 4100, cost: 2100, profit: 2000 },
      { month: '3月', sales: 3800, cost: 1900, profit: 1900 },
      { month: '4月', sales: 5200, cost: 2600, profit: 2600 },
      { month: '5月', sales: 4800, cost: 2400, profit: 2400 },
      { month: '6月', sales: 6100, cost: 3000, profit: 3100 },
      { month: '7月', sales: 5700, cost: 2800, profit: 2900 },
      { month: '8月', sales: 6800, cost: 3300, profit: 3500 },
      { month: '9月', sales: 7200, cost: 3500, profit: 3700 },
      { month: '10月', sales: 8100, cost: 3900, profit: 4200 },
      { month: '11月', sales: 9500, cost: 4600, profit: 4900 },
      { month: '12月', sales: 11200, cost: 5400, profit: 5800 },
    ]
  },
  {
    id: 'ds_dept', name: '部门业绩',
    data: [
      { dept: '销售部', value: 4200, target: 4000, rate: 105 },
      { dept: '市场部', value: 3100, target: 3500, rate: 89 },
      { dept: '研发部', value: 2800, target: 2500, rate: 112 },
      { dept: '运营部', value: 1900, target: 2000, rate: 95 },
      { dept: '客服部', value: 1500, target: 1600, rate: 94 },
    ]
  },
  {
    id: 'ds_pie', name: '品类占比',
    data: [
      { name: '电子产品', value: 35 },
      { name: '服装配饰', value: 28 },
      { name: '食品饮料', value: 18 },
      { name: '家居用品', value: 12 },
      { name: '其他',     value: 7 },
    ]
  },
]

export const useReportStore = defineStore('report', () => {
  const dataSources = ref(RAW_DATA_SOURCES)
  const widgets = ref([])
  const selectedId = ref(null)

  const selected = computed(() => widgets.value.find(w => w.id === selectedId.value))

  function getDs(dsId) { return dataSources.value.find(d => d.id === dsId)?.data || [] }
  function calcKpi(config) {
    const vals = getDs(config.dsId).map(r => Number(r[config.field] || 0))
    if (config.agg === 'avg') return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length).toLocaleString()
    if (config.agg === 'max') return Math.max(...vals).toLocaleString()
    if (config.agg === 'count_gt') return vals.filter(v => v > (config.threshold || 0)).length
    return vals.reduce((a, b) => a + b, 0).toLocaleString()
  }

  function addWidget(template) {
    const w = { id: genId(), type: template.type, config: { ...template.config }, gridPos: { ...template.config.gridPos } }
    widgets.value.push(w)
    selectedId.value = w.id
    return w.id
  }
  function removeWidget(id) {
    const idx = widgets.value.findIndex(w => w.id === id)
    if (idx > -1) widgets.value.splice(idx, 1)
    if (selectedId.value === id) selectedId.value = null
  }
  function clearAll() { widgets.value = []; selectedId.value = null }

  function initDefaultWidgets() {
    if (widgets.value.length) return
    widgets.value = [
      { id: genId(), type: 'kpi',  config: { dsId: 'ds_sales', title: '年度销售额', field: 'sales',  color: '#2563eb' },                         gridPos: { x: 0, y: 0, w: 3, h: 3 } },
      { id: genId(), type: 'kpi',  config: { dsId: 'ds_sales', title: '年度利润',   field: 'profit', color: '#16a34a' },                         gridPos: { x: 3, y: 0, w: 3, h: 3 } },
      { id: genId(), type: 'kpi',  config: { dsId: 'ds_dept',  title: '超标部门数', field: 'rate',   color: '#7c3aed', agg: 'count_gt', threshold: 100 }, gridPos: { x: 6, y: 0, w: 3, h: 3 } },
      { id: genId(), type: 'kpi',  config: { dsId: 'ds_sales', title: '最高月销售', field: 'sales',  color: '#d97706', agg: 'max' },              gridPos: { x: 9, y: 0, w: 3, h: 3 } },
      { id: genId(), type: 'bar',  config: { dsId: 'ds_sales', title: '月度销售额', xField: 'month', yField: 'sales',  color: '#2563eb' },        gridPos: { x: 0, y: 3, w: 8, h: 7 } },
      { id: genId(), type: 'pie',  config: { dsId: 'ds_pie',   title: '品类占比',   nameField: 'name', valueField: 'value' },                     gridPos: { x: 8, y: 3, w: 4, h: 7 } },
      { id: genId(), type: 'area', config: { dsId: 'ds_sales', title: '利润趋势',   xField: 'month', yField: 'profit', color: '#16a34a' },        gridPos: { x: 0, y: 10, w: 6, h: 6 } },
      { id: genId(), type: 'hbar', config: { dsId: 'ds_dept',  title: '部门业绩对比', xField: 'dept', yField: 'value', color: '#7c3aed' },        gridPos: { x: 6, y: 10, w: 6, h: 6 } },
    ]
  }

  return {
    dataSources, widgets, selectedId, selected,
    getDs, calcKpi,
    addWidget, removeWidget, clearAll, initDefaultWidgets,
  }
})
