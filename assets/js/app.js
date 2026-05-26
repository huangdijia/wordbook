const state = {
  config: null,
  words: [],
  currentGradeKey: '',
  currentVolumeKey: '',
  currentUnitKey: '',
  currentMode: 'sequence',
  currentWords: [],
  currentIndex: 0,
  isFlipped: false,
  loading: false,
  error: null
}

const elements = {
  title: document.querySelector('#app-title'),
  subtitle: document.querySelector('#app-subtitle'),
  gradeSelect: document.querySelector('#grade-select'),
  volumeSelect: document.querySelector('#volume-select'),
  unitSelect: document.querySelector('#unit-select'),
  modeSelect: document.querySelector('#mode-select'),
  message: document.querySelector('#message'),
  card: document.querySelector('#word-card'),
  cardMain: document.querySelector('#card-main'),
  cardHint: document.querySelector('#card-hint'),
  prevButton: document.querySelector('#prev-button'),
  nextButton: document.querySelector('#next-button'),
  progress: document.querySelector('#progress')
}

async function loadJson(path, errorMessage) {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(errorMessage)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new Error(errorMessage)
  }
}

async function init() {
  state.loading = true
  renderLoading()

  try {
    state.config = await loadJson('data/config.json', '配置文件加载失败，请检查 data/config.json')
    state.words = await loadJson('data/words.json', '词库文件加载失败，请检查 data/words.json')
    state.error = null
    applyInitialState()
    state.loading = false
    renderAll()
  } catch (error) {
    state.error = error.message
    state.loading = false
    renderAll()
  }
}

function applyInitialState() {
  const grades = getGrades()
  const modes = getModes()
  const defaultGrade = state.config?.app?.defaultGrade
  const defaultVolume = state.config?.app?.defaultVolume
  const defaultMode = state.config?.app?.defaultMode

  state.currentGradeKey = grades.some(grade => grade.key === defaultGrade)
    ? defaultGrade
    : grades[0]?.key || ''
  state.currentVolumeKey = getCurrentGrade()?.volumes?.some(volume => volume.key === defaultVolume)
    ? defaultVolume
    : getCurrentGrade()?.volumes?.[0]?.key || ''
  state.currentMode = modes.some(mode => mode.key === defaultMode)
    ? defaultMode
    : modes[0]?.key || 'sequence'
  state.currentUnitKey = getCurrentVolume()?.units?.[0]?.key || ''
  resetPracticeWords()
}

function getGrades() {
  return Array.isArray(state.config?.grades) ? state.config.grades : []
}

function getModes() {
  return Array.isArray(state.config?.modes) ? state.config.modes : []
}

function getCurrentGrade() {
  return getGrades().find(grade => grade.key === state.currentGradeKey)
}

function getCurrentVolume() {
  return getCurrentGrade()?.volumes?.find(volume => volume.key === state.currentVolumeKey)
}

function getCurrentWord() {
  return state.currentWords[state.currentIndex]
}

function isValidWord(word) {
  return word &&
    typeof word.id === 'string' &&
    typeof word.gradeKey === 'string' &&
    typeof word.volumeKey === 'string' &&
    typeof word.unitKey === 'string' &&
    typeof word.chinese === 'string' &&
    typeof word.english === 'string' &&
    typeof word.sort === 'number'
}

function getWordsByGradeVolumeAndUnit(words, gradeKey, volumeKey, unitKey) {
  return words
    .filter(word => {
      const valid = isValidWord(word)
      if (!valid) {
        console.warn('跳过字段缺失的单词：', word)
      }
      return valid &&
        word.gradeKey === gradeKey &&
        word.volumeKey === volumeKey &&
        word.unitKey === unitKey
    })
    .sort((a, b) => a.sort - b.sort)
}

function shuffleWords(words) {
  const nextWords = [...words]

  for (let index = nextWords.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[nextWords[index], nextWords[randomIndex]] = [nextWords[randomIndex], nextWords[index]]
  }

  return nextWords
}

function buildPracticeWords(words, gradeKey, volumeKey, unitKey, mode) {
  const selectedWords = getWordsByGradeVolumeAndUnit(words, gradeKey, volumeKey, unitKey)

  if (mode === 'random') {
    return shuffleWords(selectedWords)
  }

  return selectedWords
}

function resetPracticeWords() {
  state.currentWords = buildPracticeWords(
    state.words,
    state.currentGradeKey,
    state.currentVolumeKey,
    state.currentUnitKey,
    state.currentMode
  )
  goToWord(0)
}

function goToWord(index) {
  state.currentIndex = index
  state.isFlipped = false
}

function renderLoading() {
  elements.cardMain.textContent = '加载中...'
  elements.cardHint.textContent = '请稍候'
  elements.progress.textContent = '0 / 0'
  elements.prevButton.disabled = true
  elements.nextButton.disabled = true
}

function renderAll() {
  renderTitle()
  renderControls()
  renderMessage()
  renderCard()
  renderActions()
}

function renderTitle() {
  elements.title.textContent = state.config?.app?.title || '英文单词本'
  elements.subtitle.textContent = state.config?.app?.subtitle || '每天背一点，英语进步一点'
  document.title = elements.title.textContent
}

function renderControls() {
  renderOptions(elements.gradeSelect, getGrades(), grade => grade.name)
  elements.gradeSelect.value = state.currentGradeKey

  const volumes = getCurrentGrade()?.volumes || []
  renderOptions(elements.volumeSelect, volumes, volume => volume.name)
  elements.volumeSelect.value = state.currentVolumeKey

  const units = getCurrentVolume()?.units || []
  renderOptions(elements.unitSelect, units, unit => `${unit.name} ${unit.title}`.trim())
  elements.unitSelect.value = state.currentUnitKey

  renderOptions(elements.modeSelect, getModes(), mode => mode.name)
  elements.modeSelect.value = state.currentMode

  const disabled = Boolean(state.error)
  elements.gradeSelect.disabled = disabled || getGrades().length === 0
  elements.volumeSelect.disabled = disabled || volumes.length === 0
  elements.unitSelect.disabled = disabled || units.length === 0
  elements.modeSelect.disabled = disabled || getModes().length === 0
}

function renderOptions(select, items, getLabel) {
  select.innerHTML = ''

  items.forEach(item => {
    const option = document.createElement('option')
    option.value = item.key
    option.textContent = getLabel(item)
    select.append(option)
  })
}

function renderMessage() {
  if (state.error) {
    elements.message.textContent = state.error
    elements.message.hidden = false
    return
  }

  if (!state.loading && state.currentWords.length === 0) {
    elements.message.textContent = '当前单元暂无单词，请检查 words.json 配置。'
    elements.message.hidden = false
    return
  }

  elements.message.hidden = true
  elements.message.textContent = ''
}

function renderCard() {
  const currentWord = getCurrentWord()
  const hasWord = Boolean(currentWord) && !state.error

  elements.card.disabled = !hasWord
  elements.card.classList.toggle('is-flipped', state.isFlipped)
  elements.card.setAttribute('aria-pressed', String(state.isFlipped))

  if (state.error) {
    elements.cardMain.textContent = '加载失败'
    elements.cardHint.textContent = '请检查数据文件'
    return
  }

  if (!currentWord) {
    elements.cardMain.textContent = '暂无单词'
    elements.cardHint.textContent = '请选择其他年级或单元'
    return
  }

  elements.cardMain.textContent = state.isFlipped ? currentWord.english : currentWord.chinese
  elements.cardHint.textContent = state.isFlipped ? '点击返回中文' : '点击查看英文'
}

function renderActions() {
  const total = state.currentWords.length
  const hasWord = total > 0 && !state.error
  const currentNumber = hasWord ? state.currentIndex + 1 : 0

  elements.progress.textContent = `${currentNumber} / ${total}`
  elements.prevButton.disabled = !hasWord || state.currentIndex === 0
  elements.nextButton.disabled = !hasWord || state.currentIndex === total - 1
  elements.nextButton.textContent = hasWord && state.currentIndex === total - 1 ? '已完成' : '下一个'
}

function handleGradeChange(event) {
  state.currentGradeKey = event.target.value
  state.currentVolumeKey = getCurrentGrade()?.volumes?.[0]?.key || ''
  state.currentUnitKey = getCurrentVolume()?.units?.[0]?.key || ''
  resetPracticeWords()
  renderAll()
}

function handleVolumeChange(event) {
  state.currentVolumeKey = event.target.value
  state.currentUnitKey = getCurrentVolume()?.units?.[0]?.key || ''
  resetPracticeWords()
  renderAll()
}

function handleUnitChange(event) {
  state.currentUnitKey = event.target.value
  resetPracticeWords()
  renderAll()
}

function handleModeChange(event) {
  state.currentMode = event.target.value
  resetPracticeWords()
  renderAll()
}

function handleCardClick() {
  if (!getCurrentWord()) {
    return
  }

  state.isFlipped = !state.isFlipped
  renderAll()
}

function handlePrevClick() {
  if (state.currentIndex > 0) {
    goToWord(state.currentIndex - 1)
    renderAll()
  }
}

function handleNextClick() {
  if (state.currentIndex < state.currentWords.length - 1) {
    goToWord(state.currentIndex + 1)
    renderAll()
  }
}

elements.gradeSelect.addEventListener('change', handleGradeChange)
elements.volumeSelect.addEventListener('change', handleVolumeChange)
elements.unitSelect.addEventListener('change', handleUnitChange)
elements.modeSelect.addEventListener('change', handleModeChange)
elements.card.addEventListener('click', handleCardClick)
elements.prevButton.addEventListener('click', handlePrevClick)
elements.nextButton.addEventListener('click', handleNextClick)

init()
