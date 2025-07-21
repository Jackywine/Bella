export async function initI18n() {
  const res = await fetch('translation.json');
  const translations = await res.json();

  i18next.init({
    lng: 'zh',
    fallbackLng: 'en',
    resources: translations
  }, function () {
    applyTranslations();
    createLanguageDropdown();
  });
}

export function applyTranslations() {
  document.querySelector('#sentiment-input').placeholder = i18next.t('input_placeholder');
  document.querySelector('#local-mic-button').innerText = i18next.t('start_local_recognition');
  document.querySelector('#analyze-button').innerText = i18next.t('analyze_sentiment');
  document.querySelector('#favorability-label').innerText = i18next.t('favorability');

  const asrText = document.querySelector('#local-asr-text');
  if (asrText && asrText.childNodes.length > 0) {
    asrText.childNodes[0].textContent = i18next.t('local_result_prefix') + ' ';
  }

  document.querySelector('#menu-pose').innerText = i18next.t('pose');
  document.querySelector('#menu-cheer').innerText = i18next.t('cheer');
  document.querySelector('#menu-dance').innerText = i18next.t('dance');
}

function createLanguageDropdown() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="language-switcher">
      <select id="language-select">
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </div>
  `;
  document.body.appendChild(container);

  const select = container.querySelector('#language-select');
  select.value = i18next.language;

  select.onchange = () => {
    i18next.changeLanguage(select.value, applyTranslations);
  };
}


