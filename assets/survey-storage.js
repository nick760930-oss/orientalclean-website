/* Public publishable key; table grants and RLS prohibit reading customer responses. */
window.submitOrientalSurvey = async function(params) {
  const community = (params.get('community') || '').trim();
  const period = (document.getElementById('daterange')?.value || '').trim();
  if (!community || !period) throw new Error('請使用管理端提供的案場評價連結，確認案場名稱與施工期間。');
  const answers = {};
  for (const name of ['quality','attitude','schedule','clean','safety','inconvenience','comment','nps','consent','personnel']) answers[name] = params.get(name) || '';
  const response = await fetch('https://qculqsczmhnyfdhnbvpo.supabase.co/rest/v1/website_survey_responses', {
    method: 'POST',
    headers: { apikey: 'sb_publishable_UNPIfvsEdwtHrAzVXeRD0A_ZrSnc42p', 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({community, period, floor: params.get('floor'), unit: params.get('unit'), answers}),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (data.code === '23505') throw new Error('此案場與施工期間的戶號已送出評價，請勿重複提交。');
    throw new Error('評價尚未儲存，請稍後再試；若持續失敗請聯絡東方繩洗。');
  }
};

