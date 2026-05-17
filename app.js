  // 1e8tS3eYtyHw6dfqKlpdqm-_CDLf4DbgyNmnwM8tTlDQ/edit
/* ═══════════════════════════════════════════════════════════════════
   ⚙️  設定區 —— 你只需要改這一整區，其他程式碼都不用動
   ───────────────────────────────────────────────────────────────────
   完整步驟請看同資料夾的《Google表單串接教學.md》。簡述：
   1. 在 Google 表單建立 31 個「簡答／段落」題目（照《欄位對照清單》）
   2. 表單右上角 ⋮ →「取得預先填入連結」→ 隨意填完每一題後按「取得連結」
   3. 複製到的網址長這樣：
      https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url
        &entry.123456=xxx&entry.234567=xxx ...
   4. 把網址裡的 FORM_ID 填到下面 ① GOOGLE_FORM_ACTION
   5. 把每個 entry.XXXXXX 依題目順序填到下面 ② ENTRY 裡
   ═══════════════════════════════════════════════════════════════════ */

// ① 你的 Google 表單送出網址（✅ 已填入 FORM_ID）
//    若日後換成別份表單，改這裡的 FORM_ID 即可，結尾務必保持 /formResponse
const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSeML7svaVIbTuZK7RKiWGq8aQ2-DI8miK0RNHtBvWiOTcW1UQ/formResponse";

// ② 每個欄位對應的 entry ID（✅ 已從預先填入連結代入 29 個）
//    左邊的名稱（company、contact…）請勿更動，那是程式對應用的 key
const ENTRY = {
  company:        "entry.1344787084",
  contact:        "entry.1561612842",
  email:          "entry.733196700",
  phone:          "entry.1582656472",
  lineid:         "entry.1069883860",
  deadline:       "entry.302150550",
  budget:         "entry.17567112",
  existing:       "entry.877101182",
  decision:       "entry.163998197",
  problem:        "entry.1788462260",
  audience:       "entry.579868411",
  style_ref:      "entry.430132898",
  pages:          "entry.1448134377",
  features:       "entry.675703595",
  features_other: "entry.186964273",
  copy:           "entry.312657582",
  media:          "entry.2068434646",
  brand:          "entry.437698343",
  asset_date:     "entry.428162282",
  domain:         "entry.479582444",
  hosting:        "entry.1904821037",
  tech:           "entry.763182856",
  tech_other:     "entry.449437974",
  payment:        "entry.155361965",
  copyright:      "entry.1728077496",
  revisions:      "entry.732457045",
  warranty:       "entry.89689814",
  maintain:       "entry.190782492",
  contract:       "entry.538452541",
  future:         "entry.750623275",
  remarks:        "entry.2100925518",
};

// ── Step metadata ────────────────────────────────────────────────────
const steps = [
  { label: "基本資訊" },
  { label: "專案目標" },
  { label: "功能需求" },
  { label: "內容素材" },
  { label: "技術規格" },
  { label: "合約授權" },
  { label: "維護送出" },
];
const total = steps.length;
let current = 0;

// ── Build tabs ───────────────────────────────────────────────────────
const tabsEl = document.getElementById('step-tabs');
steps.forEach((s, i) => {
  const btn = document.createElement('div');
  btn.className = `tab s${i}` + (i === 0 ? ' active' : '');
  btn.id = `tab-${i}`;
  btn.innerHTML = `<span class="tab-num">${i+1}</span>${s.label}`;
  tabsEl.appendChild(btn);
});

// ── Other input reveal helpers ─────────────────────────────────────────
function toggleOther(input, wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  if (input.checked) {
    wrap.classList.add('show');
    wrap.querySelector('input[type="text"]')?.focus();
  } else {
    wrap.classList.remove('show');
  }
}
function hideOther(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (wrap) wrap.classList.remove('show');
}

// ── Radio / checkbox interactivity ───────────────────────────────────
document.querySelectorAll('.radio-opt input').forEach(input => {
  input.addEventListener('change', () => {
    const name = input.name;
    document.querySelectorAll(`.radio-opt input[name="${name}"]`).forEach(r => {
      r.closest('.radio-opt').classList.toggle('selected', r.checked);
    });
  });
});
document.querySelectorAll('.check-opt input').forEach(input => {
  input.addEventListener('change', () => {
    input.closest('.check-opt').classList.toggle('selected', input.checked);
  });
});

// ── Required-field validation ─────────────────────────────────────────
// 每一步的必填欄位：val = 一般輸入框 / email = 信箱格式 / group = 單選或多選群組
const REQUIRED = {
  0: [['val','f_company'], ['val','f_contact'], ['email','f_email'], ['val','f_phone'], ['val','f_deadline'], ['val','f_budget']],
  1: [['val','f_problem'], ['val','f_audience']],
  2: [['group','pages']],
  3: [['group','copy'], ['group','media'], ['group','brand']],
  4: [['group','domain'], ['group','hosting']],
  5: [['group','payment'], ['group','copyright'], ['val','f_revisions']],
  6: [],
};

function clearErrors(card) {
  card.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  card.querySelector('.step-warning')?.remove();
}

function validateStep(step) {
  const card = document.getElementById('card-' + step);
  clearErrors(card);
  let firstBad = null;

  (REQUIRED[step] || []).forEach(([type, key]) => {
    if (type === 'group') {
      const checked = card.querySelector(`input[name="${key}"]:checked`);
      if (!checked) {
        const grp = card.querySelector(`input[name="${key}"]`).closest('.checkbox-group, .radio-group');
        grp.classList.add('invalid');
        if (!firstBad) firstBad = grp;
      }
    } else {
      const el = document.getElementById(key);
      const val = el.value.trim();
      const emailOk = type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) : true;
      if (!val || !emailOk) {
        el.classList.add('invalid');
        if (!firstBad) firstBad = el;
      }
    }
  });

  if (firstBad) {
    const warn = document.createElement('div');
    warn.className = 'step-warning';
    warn.textContent = '⚠ 請完成標示的必填欄位後再繼續';
    card.querySelector('.nav').before(warn);
    firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof firstBad.focus === 'function') firstBad.focus({ preventScroll: true });
    return false;
  }
  return true;
}

// 使用者一互動就把該欄位的紅框 / 警告框拿掉
document.querySelectorAll('.card input, .card select, .card textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('invalid'));
  el.addEventListener('change', () => {
    el.classList.remove('invalid');
    el.closest('.checkbox-group, .radio-group')?.classList.remove('invalid');
  });
});

// ── Navigation helpers ────────────────────────────────────────────────
function updateUI() {
  document.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('active', i === current));
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.remove('active', 'done');
    if (i === current) t.classList.add('active');
    else if (i < current) { t.classList.add('done'); t.querySelector('.tab-num').textContent = ''; }
    else t.querySelector('.tab-num').textContent = i + 1;
  });
  const pct = Math.round((current + 1) / total * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('step-label').textContent = `第 ${current + 1} 步，共 ${total} 步`;
  document.getElementById('step-pct').textContent = pct + '%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goNext(step) {
  // if (!validateStep(step)) return;        // 必填還沒填完，先擋下來
  if (current < total - 1) { current++; updateUI(); }
}
function goBack(step) { if (current > 0) { current--; updateUI(); } }

// ── Collect data ──────────────────────────────────────────────────────
function getChecked(name) {
  const vals = Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
  // Append "其他" free-text if present
  if (name === 'pages') {
    const other = document.getElementById('f_pages_other')?.value.trim();
    if (other && vals.includes('其他')) {
      const idx = vals.indexOf('其他');
      vals[idx] = '其他：' + other;
    }
  }
  return vals.join('、');
}
function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  if (!el) return '';
  let val = el.value;
  if (name === 'hosting' && val === '指定廠商') {
    const other = document.getElementById('f_hosting_other')?.value.trim();
    if (other) val = '指定廠商：' + other;
  }
  if (name === 'payment' && val === '其他方式') {
    const other = document.getElementById('f_payment_other')?.value.trim();
    if (other) val = '其他方式：' + other;
  }
  return val;
}

// ── Submit to Google Form ─────────────────────────────────────────────
let submitting = false;

function submitForm() {
  // 防呆 1：還沒設定 Google 表單就按送出
  if (GOOGLE_FORM_ACTION.includes('YOUR_FORM_ID_HERE')) {
    alert('⚠ 尚未設定 Google 表單\n\n請先打開這個 HTML 檔最下方的「設定區」，\n填入你的 FORM_ID 與各欄位的 entry ID。\n（完整步驟請看《Google表單串接教學.md》）');
    return;
  }
  // 防呆 2：避免重複連點造成重複送出
  if (submitting) return;

  // 防呆 3：送出前把 7 個步驟的必填欄位再全部檢查一次
  for (let s = 0; s < total; s++) {
    if (!validateStep(s)) { current = s; updateUI(); return; }
  }
  submitting = true;

  const data = {
    [ENTRY.company]:        document.getElementById('f_company').value,
    [ENTRY.contact]:        document.getElementById('f_contact').value,
    [ENTRY.email]:          document.getElementById('f_email').value,
    [ENTRY.phone]:          document.getElementById('f_phone').value,
    [ENTRY.lineid]:         document.getElementById('f_lineid').value,
    [ENTRY.deadline]:       document.getElementById('f_deadline').value,
    [ENTRY.budget]:         document.getElementById('f_budget').value,
    [ENTRY.existing]:       document.getElementById('f_existing').value,
    [ENTRY.decision]:       document.getElementById('f_decision').value,
    [ENTRY.problem]:        document.getElementById('f_problem').value,
    [ENTRY.audience]:       document.getElementById('f_audience').value,
    [ENTRY.style_ref]:      document.getElementById('f_style_ref').value,
    [ENTRY.pages]:          getChecked('pages'),
    [ENTRY.features]:       getChecked('features'),
    [ENTRY.features_other]: document.getElementById('f_features_other').value,
    [ENTRY.copy]:           getRadio('copy'),
    [ENTRY.media]:          getRadio('media'),
    [ENTRY.brand]:          getRadio('brand'),
    [ENTRY.asset_date]:     document.getElementById('f_asset_date').value,
    [ENTRY.domain]:         getRadio('domain'),
    [ENTRY.hosting]:        getRadio('hosting'),
    [ENTRY.tech]:           getChecked('tech'),
    [ENTRY.tech_other]:     document.getElementById('f_tech_other').value,
    [ENTRY.payment]:        getRadio('payment'),
    [ENTRY.copyright]:      getRadio('copyright'),
    [ENTRY.revisions]:      document.getElementById('f_revisions').value,
    [ENTRY.warranty]:       document.getElementById('f_warranty').value,
    [ENTRY.maintain]:       getRadio('maintain'),
    [ENTRY.contract]:       getRadio('contract'),
    [ENTRY.future]:         document.getElementById('f_future').value,
    [ENTRY.remarks]:        document.getElementById('f_remarks').value,
  };

  const params = new URLSearchParams(data);
  const submitUrl = GOOGLE_FORM_ACTION + '?' + params.toString();

  // Submit via hidden iframe (no-CORS workaround)
  let iframe = document.getElementById('gform-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'gform-iframe';
    iframe.name = 'gform-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = GOOGLE_FORM_ACTION;
  form.target = 'gform-iframe';
  Object.entries(data).forEach(([k, v]) => {
    const inp = document.createElement('input');
    inp.type = 'hidden'; inp.name = k; inp.value = v;
    form.appendChild(inp);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  // Show success
  document.querySelectorAll('.card').forEach(c => c.style.display = 'none');
  document.getElementById('step-tabs').style.display = 'none';
  document.querySelector('.progress-wrap').style.display = 'none';
  document.getElementById('success').classList.add('show');
}

// init
updateUI();
