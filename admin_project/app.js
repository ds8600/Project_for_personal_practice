
let items = [];
let filtered = [];
let currentPage = 1;
const pageSize = 10;


const KST_DATE_TIME = {
  timeZone: 'Asia/Seoul',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
};
const KST_DATE_TIME_NO_SEC = {
  timeZone: 'Asia/Seoul',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
};

const $statusArea = document.getElementById('statusArea');
const $resultTbody = document.getElementById('resultTbody');
const $pagination = document.getElementById('pagination');

const $form = document.getElementById('searchForm');
const $q = document.getElementById('qInput');
const $catBtn = document.getElementById('categoryBtn');
const $catHidden = document.getElementById('categoryValue');
const $cls = document.getElementById('classSelect');
const $min = document.getElementById('priceMin');
const $max = document.getElementById('priceMax');
const $sort = document.getElementById('sortSelect');

const $nowTime = document.getElementById('nowTime');
const $themeToggle = document.getElementById('themeToggle');

const $currentUserName = document.getElementById('currentUserName');
const $openSignupBtn = document.getElementById('openSignupBtn');
const $logoutBtn = document.getElementById('logoutBtn');

const $signupForm = document.getElementById('signupForm');
const $signupErr = document.getElementById('signupErr');

function toNumberOrNull(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function tickNow() {
  if ($nowTime) {
    $nowTime.textContent = new Date().toLocaleString('ko-KR', KST_DATE_TIME);
  }
}

function getPreferredTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light';
}
function applyTheme(mode) {
  document.documentElement.setAttribute('data-bs-theme', mode);
  localStorage.setItem('theme', mode);
  if ($themeToggle) {
    const isDark = mode === 'dark';
    $themeToggle.setAttribute('aria-pressed', String(isDark));
    $themeToggle.textContent = isDark ? '☀️ 라이트모드' : '🌙 다크모드';
    $themeToggle.classList.toggle('btn-outline-light', isDark);
    $themeToggle.classList.toggle('btn-outline-secondary', !isDark);
  }
}

function getUsers(){ try { return JSON.parse(localStorage.getItem('users') || '[]'); } catch { return []; } }
function setUsers(arr){ localStorage.setItem('users', JSON.stringify(arr)); }
function getCurrentUser(){ try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; } }
function setCurrentUser(user){ localStorage.setItem('currentUser', JSON.stringify(user)); }
function clearCurrentUser(){ localStorage.removeItem('currentUser'); }

function renderAuthUI(){
  const cu = getCurrentUser();
  if (cu) {
    $currentUserName.textContent = `안녕하세요, ${cu.name}님`;
    $currentUserName.classList.remove('d-none');
    $logoutBtn.classList.remove('d-none');
    $openSignupBtn.classList.add('d-none');
  } else {
    $currentUserName.classList.add('d-none');
    $logoutBtn.classList.add('d-none');
    $openSignupBtn.classList.remove('d-none');
  }
}

function validateSignup(data) {
  const errs = [];
  if (!data.id || data.id.trim().length < 6) errs.push('아이디는 6자 이상이어야 합니다.');
  if (!data.password || data.password.length < 8 || !/[A-Za-z]/.test(data.password) || !/[0-9]/.test(data.password)) {
    errs.push('비밀번호는 8자 이상이며 문자와 숫자를 포함해야 합니다.');
  }
  if (data.password !== data.password2) errs.push('비밀번호가 일치하지 않습니다.');
  if (!data.name || !data.name.trim()) errs.push('이름을 입력해주세요.');
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) errs.push('올바른 이메일을 입력해주세요.');
  if (data.phone && !/^[0-9\-]{9,13}$/.test(data.phone)) errs.push('전화번호 형식이 올바르지 않습니다.');

  const users = getUsers();
  if (users.some(u => u.id === data.id)) errs.push('이미 사용 중인 아이디입니다.');
  if (users.some(u => u.email === data.email)) errs.push('이미 가입된 이메일입니다.');
  return errs;
}

function onSignupSubmit(e){
  e.preventDefault();
  if (!$signupErr) return;

  const f = e.currentTarget;
  const data = {
    id: f.id.value.trim(),
    password: f.password.value,
    password2: f.password2.value,
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    phone: f.phone.value.trim(),
    gender: f.gender.value
  };

  const errs = validateSignup(data);
  if (errs.length) {
    $signupErr.textContent = errs.join('\n');
    $signupErr.classList.remove('d-none');
    return;
  }

  const users = getUsers();
  users.push({
    id: data.id, name: data.name, email: data.email,
    phone: data.phone, gender: data.gender,
    password: data.password 
  });
  setUsers(users);
  setCurrentUser({ id: data.id, name: data.name, email: data.email });

  alert(
    [
      '회원가입 완료!',
      `아이디: ${data.id}`,
      `이름: ${data.name}`,
      `이메일: ${data.email}`,
      data.phone ? `전화: ${data.phone}` : null,
      `성별: ${data.gender}`
    ].filter(Boolean).join('\n')
  );

  renderAuthUI();
  $signupErr.classList.add('d-none');
  f.reset();

  const modalEl = document.getElementById('signupModal');
  const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  instance.hide();
}

function onLogout(){
  clearCurrentUser();
  renderAuthUI();
}

function showStatus(type, message){

  $statusArea.innerHTML = `<div class="alert alert-${type} mb-0" role="alert">${message}</div>`;
}
function clearStatus(){
  $statusArea.innerHTML = '';
}

function render(list, page = 1){
  currentPage = page;
  const total = list.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageSlice = list.slice(start, end);

  if (pageSlice.length === 0) {
    $resultTbody.innerHTML = '';
    showStatus('warning', '조건에 맞는 결과가 없습니다. 필터를 조정해보세요.');
  } else {
    clearStatus();
    const rows = pageSlice.map(item => {
      const gradeText = item.grade || '-';
      const categoryText = item.category || '-';
      const classText = item.classRestriction || '-';
      const priceText = Number(item.price).toLocaleString() + '원';
      const updatedText = new Date(item.updatedAt).toLocaleString('ko-KR', KST_DATE_TIME_NO_SEC);

      return `
        <tr>
          <td>${item.name}</td>
          <td>${gradeText}</td>
          <td>${categoryText}</td>
          <td>${classText}</td>
          <td class="text-end">${priceText}</td>
          <td>${updatedText}</td>
        </tr>
      `;
    }).join('');
    $resultTbody.innerHTML = rows;
  }

  renderPagination(total, page, pageSize);
}

function renderPagination(total, page, size){
  const totalPages = Math.max(1, Math.ceil(total / size));
  const disabledPrev = page <= 1 ? 'disabled' : '';
  const disabledNext = page >= totalPages ? 'disabled' : '';

  let html = `
    <li class="page-item ${disabledPrev}">
      <button class="page-link" data-page="${page - 1}" ${disabledPrev ? 'tabindex="-1" aria-disabled="true"' : ''}>이전</button>
    </li>`;

  const span = 1;
  const start = Math.max(1, page - span);
  const end = Math.min(totalPages, page + span);
  for (let p = start; p <= end; p++) {
    html += `
      <li class="page-item ${p === page ? 'active' : ''}">
        <button class="page-link" data-page="${p}">${p}</button>
      </li>`;
  }

  html += `
    <li class="page-item ${disabledNext}">
      <button class="page-link" data-page="${page + 1}" ${disabledNext ? 'tabindex="-1" aria-disabled="true"' : ''}>다음</button>
    </li>`;

  $pagination.innerHTML = html;

  $pagination.onclick = (e) => {
    const btn = e.target.closest('button.page-link');
    if (!btn) return;
    const targetPage = Number(btn.dataset.page);
    const totalPages2 = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage > totalPages2 || targetPage === page) return;
    render(filtered, targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

function applyFilters(){
  const q = ($q.value || '').trim().toLowerCase();
  const category = $catHidden.value || '';
  const cls = $cls.value || '';
  const min = toNumberOrNull($min.value);
  const max = toNumberOrNull($max.value);
  const sort = ($sort?.value || 'recent');

  filtered = items.filter(it => {
    if (q && !it.name.toLowerCase().includes(q)) return false;
    if (category && it.category !== category) return false;
    if (cls && it.classRestriction !== cls) return false;
    if (min !== null && it.price < min) return false;
    if (max !== null && it.price > max) return false;
    return true;
  });

  if (sort === 'recent') {
    filtered = filtered.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } else if (sort === 'priceAsc') {
    filtered = filtered.slice().sort((a, b) => a.price - b.price);
  } else if (sort === 'priceDesc') {
    filtered = filtered.slice().sort((a, b) => b.price - a.price);
  }

  render(filtered, 1);
}

async function boot(){
  showStatus('secondary', '데이터를 불러오는 중…');

  try {
    const res = await fetch('./data/mock-items.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    items = await res.json();

    filtered = items.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    clearStatus();
    render(filtered, 1);
  } catch (err) {
    console.error(err);
    showStatus('danger', `데이터 로드 실패: ${String(err.message || err)}`);
    $resultTbody.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getPreferredTheme());
  $themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
  });

  tickNow();
  setInterval(tickNow, 1000);

  renderAuthUI();
  $logoutBtn?.addEventListener('click', onLogout);
  $signupForm?.addEventListener('submit', onSignupSubmit);

  document.querySelectorAll('.category-option').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const value = a.dataset.value || '';
      const label = a.textContent.trim();
      $catHidden.value = value;
      if ($catBtn) $catBtn.textContent = label || '전체';
    });
  });

  boot();

  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
  });

  $sort?.addEventListener('change', () => applyFilters());

  document.getElementById('resetBtn')?.addEventListener('click', () => {
    setTimeout(() => {
      $q.value = '';
      $catHidden.value = '';
      if ($catBtn) $catBtn.textContent = '전체';
      $cls.value = '';
      $min.value = '';
      $max.value = '';
      if ($sort) $sort.value = 'recent';
      filtered = items.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      render(filtered, 1);
    }, 0);
  });
});
