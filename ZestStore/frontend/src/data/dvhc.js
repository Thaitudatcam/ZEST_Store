// Dữ liệu hành chính VN (tỉnh -> quận/huyện -> xã/phường) nạp từ public/data.
// Dùng khi API GHN chưa cấu hình token (chỉ trả 3 tỉnh mock).
let cache = null

const base = () => `${import.meta.env.BASE_URL || '/'}data/`.replace(/\/+/g, '/')

async function loadJson(name) {
  const res = await fetch(`${base()}${name}`)
  if (!res.ok) throw new Error(`Cannot load ${name}`)
  return res.json()
}

export async function loadDvhc() {
  if (cache) return cache
  const [provinces, districts, wards] = await Promise.all([
    loadJson('tinh_tp.json'),
    loadJson('quan_huyen.json'),
    loadJson('xa_phuong.json'),
  ])
  const districtsByProvince = {}
  Object.entries(districts || {}).forEach(([code, d]) => {
    const parent = String(d.parent_code ?? '')
    const item = { DistrictID: String(code), DistrictName: d.name_with_type || d.name }
    ;(districtsByProvince[parent] = districtsByProvince[parent] || []).push(item)
  })
  const wardsByDistrict = {}
  Object.entries(wards || {}).forEach(([code, w]) => {
    const parent = String(w.parent_code ?? '')
    const item = { WardCode: String(code), WardName: w.name_with_type || w.name }
    ;(wardsByDistrict[parent] = wardsByDistrict[parent] || []).push(item)
  })
  const provinceList = Object.entries(provinces || {}).map(([code, p]) => ({
    ProvinceID: String(code),
    ProvinceName: p.name_with_type || p.name,
  }))
  cache = { provinces: provinceList, districtsByProvince, wardsByDistrict }
  return cache
}

export async function dvhcProvinces() {
  return (await loadDvhc()).provinces
}

export async function dvhcDistricts(provinceCode) {
  const { districtsByProvince } = await loadDvhc()
  return districtsByProvince[String(provinceCode)] || []
}

export async function dvhcWards(districtCode) {
  const { wardsByDistrict } = await loadDvhc()
  return wardsByDistrict[String(districtCode)] || []
}
