// 生成唯一 ID
let _id = 1
export function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${_id++}`
}

// 深拷贝
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// 防抖
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// 格式化日期
export function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN', { hour12: false })
}
