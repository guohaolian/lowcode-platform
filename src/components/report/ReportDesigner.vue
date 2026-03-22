<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useReportStore } from '../../stores/reportStore.js'

const store = useReportStore()

const chartTemplates = [
  { type: 'bar',   label: '柱状图', config: { dsId: 'ds_sales', title: '月度销售', xField: 'month', yField: 'sales', color: '#2563eb', gridPos: { x: 0, y: 0, w: 12, h: 8 } } },
  { type: 'line',  label: '折线图', config: { dsId: 'ds_sales', title: '利润趋势', xField: 'month', yField: 'profit', color: '#16a34a', gridPos: { x: 0, y: 0, w: 12, h: 8 } } },
  { type: 'pie',   label: '饼图',   config: { dsId: 'ds_pie', title: '品类占比', nameField: 'name', valueField: 'value', gridPos: { x: 0, y: 0, w: 8, h: 8 } } },
  { type: 'hbar',  label: '条形图', config: { dsId: 'ds_dept', title: '部门业绩', xField: 'dept', yField: 'value', color: '#7c3aed', gridPos: { x: 0, y: 0, w: 10, h: 8 } } },
  { type: 'area',  label: '面积图', config: { dsId: 'ds_sales', title: '销售趋势', xField: 'month', yField: 'sales', color: '#0891b2', gridPos: { x: 0, y: 0, w: 12, h: 8 } } },
  { type: 'kpi',   label: 'KPI',    config: { dsId: 'ds_sales', title: '年度销售', field: 'sales', color: '#2563eb', gridPos: { x: 0, y: 0, w: 4, h: 3 } } },
  { type: 'table', label: '数据表',  config: { dsId: 'ds_dept', title: '部门数据', columns: ['dept','value','target','rate'], gridPos: { x: 0, y: 0, w: 12, h: 8 } } },
]

const chartInstances = ref({})
const chartRefs = ref({})

const base = {
  text: { color: '#52525b', fontFamily: 'Geist, sans-serif', fontSize: 11 },
  grid: { left: 36, right: 16, top: 40, bottom: 28, containLabel: true },
  split: { lineStyle: { color: '#e4e4e7', type: 'dashed' } },
  axis: { lineStyle: { color: '#e4e4e7' }, axisTick: { show: false } },
  title: (t) => ({ text: t, textStyle: { color: '#09090b', fontSize: 12, fontWeight: '600', fontFamily: 'Geist, sans-serif' }, top: 10, left: 12 }),
  tooltip: { backgroundColor: '#fff', borderColor: '#e4e4e7', textStyle: { color: '#09090b', fontSize: 11, fontFamily: 'Geist, sans-serif' }, extraCssText: 'box-shadow:0 4px 12px rgba(0,0,0,.08)' },
}

function buildOption(w) {
  const ds = store.getDs(w.config.dsId); const c = w.config.color || '#2563eb'
  if (w.type === 'bar') return { title: base.title(w.config.title), grid: base.grid, tooltip: { ...base.tooltip, trigger: 'axis' }, xAxis: { type: 'category', data: ds.map(r => r[w.config.xField]), axisLine: base.axis, axisLabel: base.text, axisTick: { show: false } }, yAxis: { type: 'value', splitLine: base.split, axisLabel: base.text }, series: [{ type: 'bar', data: ds.map(r => r[w.config.yField]), itemStyle: { color: c, borderRadius: [3,3,0,0] }, barMaxWidth: 36 }] }
  if (w.type === 'line') return { title: base.title(w.config.title), grid: base.grid, tooltip: { ...base.tooltip, trigger: 'axis' }, xAxis: { type: 'category', data: ds.map(r => r[w.config.xField]), axisLine: base.axis, axisLabel: base.text, axisTick: { show: false } }, yAxis: { type: 'value', splitLine: base.split, axisLabel: base.text }, series: [{ type: 'line', data: ds.map(r => r[w.config.yField]), smooth: true, itemStyle: { color: c }, lineStyle: { color: c, width: 2 }, symbol: 'circle', symbolSize: 4 }] }
  if (w.type === 'area') return { title: base.title(w.config.title), grid: base.grid, tooltip: { ...base.tooltip, trigger: 'axis' }, xAxis: { type: 'category', data: ds.map(r => r[w.config.xField]), axisLine: base.axis, axisLabel: base.text, axisTick: { show: false } }, yAxis: { type: 'value', splitLine: base.split, axisLabel: base.text }, series: [{ type: 'line', data: ds.map(r => r[w.config.yField]), smooth: true, symbol: 'none', lineStyle: { color: c, width: 2 }, areaStyle: { color: { type: 'linear', x:0,y:0,x2:0,y2:1, colorStops: [{ offset: 0, color: c+'33' }, { offset: 1, color: c+'00' }] } } }] }
  if (w.type === 'pie') return { title: base.title(w.config.title), tooltip: { ...base.tooltip, trigger: 'item' }, legend: { bottom: 6, textStyle: base.text, itemWidth: 10, itemHeight: 10 }, color: ['#2563eb','#16a34a','#d97706','#7c3aed','#0891b2','#dc2626'], series: [{ type: 'pie', radius: ['36%','64%'], center: ['50%','46%'], data: ds.map(r => ({ name: r[w.config.nameField], value: r[w.config.valueField] })), label: { show: false }, itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: '#fff' } }] }
  if (w.type === 'hbar') return { title: base.title(w.config.title), grid: { ...base.grid, left: 56 }, tooltip: { ...base.tooltip, trigger: 'axis' }, xAxis: { type: 'value', splitLine: base.split, axisLabel: base.text }, yAxis: { type: 'category', data: ds.map(r => r[w.config.xField]), axisLine: base.axis, axisLabel: base.text, axisTick: { show: false } }, series: [{ type: 'bar', data: ds.map(r => r[w.config.yField]), itemStyle: { color: c, borderRadius: [0,3,3,0] }, barMaxWidth: 24 }] }
  return {}
}

function setChartRef(id, el) { if (el) chartRefs.value[id] = el }
function renderChart(id) {
  const el = chartRefs.value[id]; const w = store.widgets.find(w => w.id === id)
  if (!el || !w || w.type === 'kpi' || w.type === 'table') return
  if (!chartInstances.value[id]) chartInstances.value[id] = echarts.init(el, null, { renderer: 'canvas' })
  chartInstances.value[id].setOption(buildOption(w), true)
}
function renderAll() { nextTick(() => store.widgets.forEach(w => renderChart(w.id))) }

watch(() => store.widgets, () => { setTimeout(renderAll, 50) }, { deep: true })
onMounted(() => { store.initDefaultWidgets(); setTimeout(renderAll, 200) })
onUnmounted(() => { Object.values(chartInstances.value).forEach(i => i.dispose()) })

function handleAddWidget(t) {
  const id = store.addWidget(t)
  nextTick(() => renderChart(id))
}
function handleRemove(id) {
  chartInstances.value[id]?.dispose(); delete chartInstances.value[id]
  store.removeWidget(id)
}
function gridStyle(pos) { return { gridColumn: `${pos.x + 1} / span ${pos.w}`, gridRow: `${pos.y + 1} / span ${pos.h}` } }
</script>

<template>
  <div class="rd-layout">
    <div class="rd-toolbar">
      <div class="flex gap-2 items-center">
        <span class="toolbar-title">Report</span>
        <span class="sep"></span>
        <span class="field-count">{{ store.widgets.length }} 个图表</span>
      </div>
      <div class="flex items-center gap-2" style="flex-wrap:wrap">
        <span class="hint-text">添加：</span>
        <button v-for="t in chartTemplates" :key="t.type" class="btn btn-ghost btn-sm" @click="handleAddWidget(t)">{{ t.label }}</button>
        <button class="btn btn-danger btn-sm" @click="store.clearAll">清空</button>
      </div>
    </div>
    <div class="rd-body">
      <div class="rd-canvas-wrap">
        <div class="rd-canvas">
          <div v-if="!store.widgets.length" class="empty-state" style="height:400px">
            <p style="font-size:13px;font-weight:500;color:var(--text2)">点击顶部按钮添加图表</p>
          </div>
          <div class="rd-grid">
            <div v-for="w in store.widgets" :key="w.id" class="rd-widget"
              :class="{ 'rd-selected': store.selectedId === w.id }"
              :style="gridStyle(w.gridPos)"
              @click.stop="store.selectedId = w.id"
            >
              <div class="widget-hd">
                <span class="widget-title">{{ w.config.title }}</span>
                <button class="widget-rm" @click.stop="handleRemove(w.id)">×</button>
              </div>
              <div class="widget-bd">
                <template v-if="w.type === 'kpi'">
                  <div class="kpi-wrap">
                    <div class="kpi-num" :style="{ color: w.config.color }">{{ store.calcKpi(w.config) }}</div>
                    <div class="kpi-sub">{{ w.config.title }}</div>
                    <div class="kpi-track"><div class="kpi-fill" :style="{ background: w.config.color, width: '62%' }"></div></div>
                  </div>
                </template>
                <template v-else-if="w.type === 'table'">
                  <div class="tbl-wrap">
                    <table class="tbl">
                      <thead><tr><th v-for="col in (w.config.columns||[])" :key="col">{{ col }}</th></tr></thead>
                      <tbody><tr v-for="(row,i) in store.getDs(w.config.dsId)" :key="i"><td v-for="col in (w.config.columns||[])" :key="col">{{ row[col] }}</td></tr></tbody>
                    </table>
                  </div>
                </template>
                <template v-else>
                  <div class="chart-el" :ref="el => setChartRef(w.id, el)"></div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <aside class="rd-props">
        <div class="palette-header">配置</div>
        <div v-if="!store.selected" class="empty-state" style="padding:48px 20px"><p>点击图表<br>配置数据与样式</p></div>
        <div v-else class="props-body">
          <div class="prop-group">
            <div class="prop-group-title">图表</div>
            <div class="prop-row"><label>标题</label><input class="input" v-model="store.selected.config.title" @input="renderChart(store.selected.id)" /></div>
            <div class="prop-row"><label>数据源</label>
              <select class="input" v-model="store.selected.config.dsId" @change="renderChart(store.selected.id)">
                <option v-for="ds in store.dataSources" :key="ds.id" :value="ds.id">{{ ds.name }}</option>
              </select>
            </div>
            <div v-if="'color' in store.selected.config" class="prop-row prop-row-inline">
              <label>主色</label>
              <input type="color" class="color-picker" :value="store.selected.config.color" @input="store.selected.config.color = $event.target.value; renderChart(store.selected.id)" />
            </div>
          </div>
          <div class="prop-group" v-if="!['kpi','pie','table'].includes(store.selected.type)">
            <div class="prop-group-title">字段</div>
            <div class="prop-row"><label>X 轴</label><input class="input" v-model="store.selected.config.xField" @input="renderChart(store.selected.id)" /></div>
            <div class="prop-row"><label>Y 轴</label><input class="input" v-model="store.selected.config.yField" @input="renderChart(store.selected.id)" /></div>
          </div>
          <div class="prop-group" v-if="store.selected.type === 'pie'">
            <div class="prop-group-title">字段</div>
            <div class="prop-row"><label>名称</label><input class="input" v-model="store.selected.config.nameField" @input="renderChart(store.selected.id)" /></div>
            <div class="prop-row"><label>数值</label><input class="input" v-model="store.selected.config.valueField" @input="renderChart(store.selected.id)" /></div>
          </div>
          <div class="prop-group" v-if="store.selected.type === 'kpi'">
            <div class="prop-group-title">KPI</div>
            <div class="prop-row"><label>字段</label><input class="input" v-model="store.selected.config.field" /></div>
            <div class="prop-row"><label>聚合</label>
              <select class="input" v-model="store.selected.config.agg">
                <option value="">求和</option><option value="avg">平均</option><option value="max">最大值</option><option value="count_gt">计数</option>
              </select>
            </div>
          </div>
          <div class="prop-group">
            <div class="prop-group-title">布局</div>
            <div class="prop-row2">
              <div class="ph"><label>列起始</label><input type="number" class="input" v-model.number="store.selected.gridPos.x" min="0" max="11" /></div>
              <div class="ph"><label>行起始</label><input type="number" class="input" v-model.number="store.selected.gridPos.y" min="0" /></div>
            </div>
            <div class="prop-row2">
              <div class="ph"><label>列宽</label><input type="number" class="input" v-model.number="store.selected.gridPos.w" min="1" max="12" @change="nextTick(()=>renderChart(store.selected.id))" /></div>
              <div class="ph"><label>行高</label><input type="number" class="input" v-model.number="store.selected.gridPos.h" min="2" @change="nextTick(()=>renderChart(store.selected.id))" /></div>
            </div>
          </div>
          <div style="padding:0 14px 14px"><button class="btn btn-danger btn-sm" style="width:100%" @click="handleRemove(store.selected.id)">删除图表</button></div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.rd-layout { display: flex; flex-direction: column; height: 100%; }
.rd-toolbar { height: 48px; padding: 0 16px; background: var(--bg); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; flex-wrap: wrap; gap: 8px; }
.toolbar-title { font-size: 13px; font-weight: 600; }
.sep { width: 1px; height: 16px; background: var(--border); }
.field-count { font-size: 11px; color: var(--text3); }
.hint-text { font-size: 11px; color: var(--text3); }
.rd-body { flex: 1; display: flex; overflow: hidden; }
.rd-canvas-wrap { flex: 1; overflow: auto; background: var(--bg2); }
.rd-canvas { padding: 16px; min-width: 800px; }
.rd-grid { display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 56px; gap: 10px; }
.rd-widget { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius2); overflow: hidden; display: flex; flex-direction: column; cursor: pointer; transition: border-color .1s; }
.rd-widget:hover { border-color: var(--border2); }
.rd-selected { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(24,24,27,.06); }
.widget-hd { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--bg2); }
.widget-title { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
.widget-rm { border: none; background: transparent; color: var(--text3); cursor: pointer; font-size: 14px; line-height: 1; padding: 0 2px; border-radius: 3px; transition: all .1s; }
.widget-rm:hover { background: #fee2e2; color: var(--red); }
.widget-bd { flex: 1; overflow: hidden; position: relative; }
.chart-el { width: 100%; height: 100%; }
.kpi-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 12px; }
.kpi-num { font-size: 26px; font-weight: 600; font-family: 'Geist Mono', monospace; letter-spacing: -.03em; }
.kpi-sub { font-size: 11px; color: var(--text3); margin-top: 3px; }
.kpi-track { width: 72%; height: 3px; background: var(--bg3); border-radius: 2px; margin-top: 10px; overflow: hidden; }
.kpi-fill { height: 100%; border-radius: 2px; }
.tbl-wrap { width: 100%; height: 100%; overflow: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
.tbl th { padding: 6px 10px; text-align: left; background: var(--bg2); color: var(--text3); font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; position: sticky; top: 0; border-bottom: 1px solid var(--border); }
.tbl td { padding: 6px 10px; border-top: 1px solid var(--border); color: var(--text2); }
.tbl tr:hover td { background: var(--bg2); }
.rd-props { width: 220px; flex-shrink: 0; background: var(--bg); border-left: 1px solid var(--border); display: flex; flex-direction: column; }
.palette-header { height: 38px; padding: 0 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .07em; background: var(--bg2); flex-shrink: 0; }
.props-body { flex: 1; overflow-y: auto; }
.prop-group { padding: 12px 14px 8px; border-bottom: 1px solid var(--border); }
.prop-group:last-child { border-bottom: none; }
.prop-group-title { font-size: 10px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; }
.prop-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.prop-row label { font-size: 11px; color: var(--text2); white-space: nowrap; flex-shrink: 0; min-width: 40px; }
.prop-row .input { font-size: 12px; padding: 4px 8px; }
.prop-row-inline { justify-content: space-between; }
.prop-row2 { display: flex; gap: 8px; margin-bottom: 8px; }
.ph { flex: 1; }
.ph label { display: block; font-size: 10px; color: var(--text3); margin-bottom: 3px; }
.ph .input { font-size: 12px; padding: 4px 8px; }
.color-picker { width: 36px; height: 26px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; padding: 1px; background: none; }
</style>
