/** Taiwan UI/copy fixes after OpenCC (Help Center product voice). */
export const ZH_HANT_TERM_REPLACEMENTS = [
  [/登录/g, '登入'],
  [/登錄/g, '登入'],
  [/账户/g, '帳戶'],
  [/賬戶/g, '帳戶'],
  [/设置/g, '設定'],
  [/設置/g, '設定'],
  [/链接/g, '連結'],
  [/鏈接/g, '連結'],
  [/软件/g, '軟體'],
  [/軟件/g, '軟體'],
  [/程序/g, '程式'],
  [/视频/g, '影片'],
  [/視頻/g, '影片'],
  [/信息/g, '資訊'],
  [/鼠标/g, '滑鼠'],
  [/鼠標/g, '滑鼠'],
  [/网络/g, '網路'],
  [/網絡/g, '網路'],
  [/默认/g, '預設'],
  [/默認/g, '預設'],
  [/屏幕/g, '螢幕'],
  [/屏顯/g, '螢幕'],
  [/用户/g, '使用者'],
  [/用戶/g, '使用者'],
  [/社区/g, '社群'],
  [/社區/g, '社群'],
  [/博客/g, '部落格'],
  [/博覽/g, '部落格'],
]

export function applyZhHantTerms(text) {
  let out = text
  for (const [re, rep] of ZH_HANT_TERM_REPLACEMENTS) {
    out = out.replace(re, rep)
  }
  return out
}
