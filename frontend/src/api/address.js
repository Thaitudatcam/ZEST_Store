import { getProvinces as ghnProvinces, getDistricts as ghnDistricts, getWards as ghnWards } from './ghn'
import { loadDvhc, dvhcProvinces, dvhcDistricts, dvhcWards } from '../data/dvhc'

// Tự chọn nguồn địa giới:
// - API GHN có token (trả đầy đủ) -> dùng API để ID khớp khi tính phí thật
// - API mock (<=5 tỉnh) hoặc lỗi -> dùng dataset local đầy đủ 63 tỉnh
let mode = null

async function ensureMode() {
  if (mode) return mode
  try {
    const list = await ghnProvinces()
    mode = Array.isArray(list) && list.length > 5 ? 'api' : 'local'
  } catch {
    mode = 'local'
  }
  if (mode === 'local') {
    try { await loadDvhc() } catch { mode = 'api' }
  }
  return mode
}

export const getProvinces = async () => {
  const m = await ensureMode()
  if (m === 'local') return dvhcProvinces()
  try {
    const list = await ghnProvinces()
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

export const getDistricts = async (provinceId) => {
  const m = await ensureMode()
  if (m === 'local') return dvhcDistricts(provinceId)
  try {
    const list = await ghnDistricts(provinceId)
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

export const getWards = async (districtId) => {
  const m = await ensureMode()
  if (m === 'local') return dvhcWards(districtId)
  try {
    const list = await ghnWards(districtId)
    return Array.isArray(list) ? list : []
  } catch { return [] }
}
