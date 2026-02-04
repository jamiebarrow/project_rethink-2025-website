const yearView = document.getElementById('year-view');
const yearList = document.getElementById('year-list');
const dayView = document.getElementById('day-view');
const dayTitle = document.getElementById('day-title');
const dayBody = document.getElementById('day-body');
const dayBack = document.getElementById('day-back');
const dayPrev = document.getElementById('day-prev');
const dayNext = document.getElementById('day-next');
const dayPrevLabel = document.getElementById('day-prev-label');
const dayNextLabel = document.getElementById('day-next-label');

const monthView = document.getElementById('month-view');
const monthTitle = document.getElementById('month-title');
const monthList = document.getElementById('month-list');
const monthPrev = document.getElementById('month-prev');
const monthNext = document.getElementById('month-next');

const weekView = document.getElementById('week-view');
const weekTitle = document.getElementById('week-title');
const weekList = document.getElementById('week-list');
const weekPrev = document.getElementById('week-prev');
const weekNext = document.getElementById('week-next');

const viewButtons = Array.from(document.querySelectorAll('[data-view]'));

const modal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const modalClose = document.getElementById('modal-close');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');

let currentImages = [];
let currentImageIndex = 0;
let currentCaption = '';
let touchStartX = 0;
let touchStartY = 0;
let activeCalendarView = 'year';
let lastCalendarView = 'year';
let currentMonthIndex = 0;
let currentWeekStartIndex = 0;

const YEAR = 2025;
const months = [
  { name: 'January', days: 31 },
  { name: 'February', days: 28 },
  { name: 'March', days: 31 },
  { name: 'April', days: 30 },
  { name: 'May', days: 31 },
  { name: 'June', days: 30 },
  { name: 'July', days: 31 },
  { name: 'August', days: 31 },
  { name: 'September', days: 30 },
  { name: 'October', days: 31 },
  { name: 'November', days: 30 },
  { name: 'December', days: 31 },
];
const totalDays = months.reduce((sum, month) => sum + month.days, 0);
const monthStartIndices = months.reduce((starts, month, index) => {
  const lastStart = starts[index - 1] ?? 0;
  const lastDays = months[index - 1]?.days ?? 0;
  starts.push(index === 0 ? 0 : lastStart + lastDays);
  return starts;
}, []);

const hideElement = (element) => {
  element.classList.add('is-hidden');
  element.setAttribute('aria-hidden', 'true');
};

const showElement = (element) => {
  element.classList.remove('is-hidden');
  element.setAttribute('aria-hidden', 'false');
};

const viewLabels = {
  year: 'year',
  month: 'month',
  week: 'week',
};

const formatCaption = (image) => {
  if (!image) {
    return '';
  }
  return currentCaption || image.getAttribute('alt') || image.getAttribute('src') || '';
};

const updateModalImage = (index) => {
  if (!currentImages.length) {
    return;
  }
  currentImageIndex = (index + currentImages.length) % currentImages.length;
  const image = currentImages[currentImageIndex];
  modalImage.src = image.getAttribute('src');
  modalImage.alt = image.getAttribute('alt') || '';
  modalCaption.textContent = formatCaption(image);
};

const formatDayId = (month, day) => {
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${YEAR}-${monthText}-${dayText}`;
};

const buildDayPath = (dayId) => `./${dayId}.html`;

const parseDayId = (dayId) => {
  if (!dayId) {
    return null;
  }
  const [yearText, monthText, dayText] = dayId.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || year !== YEAR) {
    return null;
  }
  return { month, day };
};

const getDayIndex = (month, day) => {
  const monthIndex = month - 1;
  if (monthIndex < 0 || monthIndex >= months.length) {
    return null;
  }
  return monthStartIndices[monthIndex] + (day - 1);
};

const getMonthDayFromIndex = (index) => {
  const safeIndex = ((index % totalDays) + totalDays) % totalDays;
  let monthIndex = months.length - 1;
  for (let i = 0; i < months.length; i += 1) {
    const start = monthStartIndices[i];
    const end = start + months[i].days;
    if (safeIndex >= start && safeIndex < end) {
      monthIndex = i;
      break;
    }
  }
  const day = safeIndex - monthStartIndices[monthIndex] + 1;
  return { month: monthIndex + 1, day };
};

const getDayIdFromIndex = (index) => {
  const { month, day } = getMonthDayFromIndex(index);
  return formatDayId(month, day);
};

const shiftDayId = (dayId, delta) => {
  const parsed = parseDayId(dayId);
  if (!parsed) {
    return null;
  }
  const index = getDayIndex(parsed.month, parsed.day);
  if (index === null) {
    return null;
  }
  return getDayIdFromIndex(index + delta);
};

const formatDateLabel = (dayId) => {
  const parsed = parseDayId(dayId);
  if (!parsed) {
    return '';
  }
  const date = new Date(YEAR, parsed.month - 1, parsed.day);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getWeekStartIndex = (dayIndex) => Math.floor(dayIndex / 7) * 7;

const getDayIdFromHash = () => {
  const hash = window.location.hash.replace('#', '').trim();
  return hash || null;
};

const buildYearView = () => {
  if (!yearList) {
    return;
  }
  yearList.innerHTML = '';
  months.forEach((month, index) => {
    const heading = document.createElement('h3');
    heading.className = `font-bold my-4${index % 2 ? ' text-end' : ''}`;
    heading.textContent = month.name;

    const list = document.createElement('ol');
    list.className = `flex flex-wrap gap-x-4 gap-y-4${index % 2 ? ' justify-end' : ''}`;

    for (let day = 1; day <= month.days; day += 1) {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      const dayId = formatDayId(index + 1, day);
      link.href = `#${dayId}`;
      link.dataset.day = dayId;
      link.textContent = String(day);
      listItem.appendChild(link);
      list.appendChild(listItem);
    }

    yearList.appendChild(heading);
    yearList.appendChild(list);
  });
};

const buildMonthView = () => {
  if (!monthList || !monthTitle) {
    return;
  }
  const month = months[currentMonthIndex];
  monthTitle.textContent = `${month.name} ${YEAR}`;
  monthList.innerHTML = '';
  for (let day = 1; day <= month.days; day += 1) {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    const dayId = formatDayId(currentMonthIndex + 1, day);
    link.href = `#${dayId}`;
    link.dataset.day = dayId;
    link.textContent = String(day);
    listItem.appendChild(link);
    monthList.appendChild(listItem);
  }
};

const buildWeekView = () => {
  if (!weekList || !weekTitle) {
    return;
  }
  const startIndex = ((currentWeekStartIndex % totalDays) + totalDays) % totalDays;
  const endIndex = ((startIndex + 6) % totalDays + totalDays) % totalDays;
  const startLabel = formatDateLabel(getDayIdFromIndex(startIndex));
  const endLabel = formatDateLabel(getDayIdFromIndex(endIndex));
  weekTitle.textContent = `${startLabel} – ${endLabel}`;
  weekList.innerHTML = '';
  for (let offset = 0; offset < 7; offset += 1) {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    const dayId = getDayIdFromIndex(startIndex + offset);
    const parsed = parseDayId(dayId);
    link.href = `#${dayId}`;
    link.dataset.day = dayId;
    link.textContent = `${months[parsed.month - 1].name.slice(0, 3)} ${parsed.day}`;
    listItem.appendChild(link);
    weekList.appendChild(listItem);
  }
};

const updateDayNavigation = (dayId) => {
  const previous = shiftDayId(dayId, -1);
  const next = shiftDayId(dayId, 1);
  if (dayPrev && dayPrevLabel && previous) {
    dayPrevLabel.textContent = formatDateLabel(previous);
    dayPrev.dataset.day = previous;
  }
  if (dayNext && dayNextLabel && next) {
    dayNextLabel.textContent = formatDateLabel(next);
    dayNext.dataset.day = next;
  }
};

const setActiveViewButton = (view) => {
  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
};

const hideCalendarViews = () => {
  hideElement(yearView);
  if (monthView) {
    hideElement(monthView);
  }
  if (weekView) {
    hideElement(weekView);
  }
};

const showCalendarView = (view, updateHistory = true) => {
  activeCalendarView = view;
  setActiveViewButton(view);
  hideCalendarViews();
  if (view === 'month') {
    showElement(monthView);
    buildMonthView();
  } else if (view === 'week') {
    showElement(weekView);
    buildWeekView();
  } else {
    showElement(yearView);
  }
  hideElement(dayView);
  if (updateHistory) {
    window.history.pushState({}, '', window.location.pathname);
  }
};

const openModal = (index) => {
  if (!currentImages.length) {
    return;
  }
  updateModalImage(index);
  showElement(modal);
  document.body.classList.add('modal-open');
};

const closeModal = () => {
  hideElement(modal);
  document.body.classList.remove('modal-open');
};

const parseDayContent = (htmlText) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const dayHeading = doc.querySelector('h1');
  const content = doc.querySelector('#post-container');
  return {
    heading: dayHeading ? dayHeading.textContent.trim() : 'Selected day',
    content: content ? content.innerHTML : '<p>No content found.</p>',
  };
};

const prepareImages = () => {
  const images = Array.from(dayBody.querySelectorAll('img'));
  currentImages = images;
  const dayHashtag = dayBody.querySelector('h2');
  currentCaption = dayHashtag ? dayHashtag.textContent.trim() : '';

  images.forEach((image, index) => {
    image.classList.add('day-image');
    image.setAttribute('tabindex', '0');
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', 'Open image');
    if (!image.parentElement.classList.contains('day-image-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('day-image-wrapper');
      image.parentElement.insertBefore(wrapper, image);
      wrapper.appendChild(image);
    }
    image.addEventListener('click', () => openModal(index));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(index);
      }
    });
  });

  const galleries = Array.from(dayBody.querySelectorAll('.grid'));
  galleries.forEach((gallery) => {
    gallery.classList.add('day-gallery');
  });
};

const handleTouchStart = (event) => {
  if (event.touches.length !== 1) {
    return;
  }
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
};

const handleTouchEnd = (event) => {
  if (!event.changedTouches.length) {
    return;
  }
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  const deltaY = event.changedTouches[0].clientY - touchStartY;
  const swipeThreshold = 50;

  if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY)) {
    return;
  }

  if (deltaX > 0) {
    updateModalImage(currentImageIndex - 1);
  } else {
    updateModalImage(currentImageIndex + 1);
  }
};

const showDayView = async (dayId, updateHistory = true) => {
  const href = buildDayPath(dayId);
  try {
    const response = await fetch(href, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load day content.');
    }
    const htmlText = await response.text();
    const parsed = parseDayContent(htmlText);
    dayTitle.textContent = parsed.heading;
    dayBody.innerHTML = parsed.content;
    prepareImages();
    const parsedDay = parseDayId(dayId);
    if (parsedDay) {
      currentMonthIndex = parsedDay.month - 1;
      const dayIndex = getDayIndex(parsedDay.month, parsedDay.day);
      currentWeekStartIndex = getWeekStartIndex(dayIndex ?? 0);
    }
    lastCalendarView = activeCalendarView;
    hideCalendarViews();
    showElement(dayView);
    updateDayNavigation(dayId);
    const backLabel = viewLabels[lastCalendarView] || 'year';
    dayBack.textContent = `← Back to ${backLabel}`;

    if (updateHistory) {
      window.history.pushState({ day: dayId }, '', `#${dayId}`);
    }
  } catch (error) {
    dayTitle.textContent = 'Unable to load day';
    dayBody.innerHTML = '<p>Sorry, something went wrong.</p>';
    hideCalendarViews();
    showElement(dayView);
  }
};

const syncWithHash = () => {
  const dayId = getDayIdFromHash();
  if (dayId) {
    showDayView(dayId, false);
    return;
  }
  showCalendarView(activeCalendarView, false);
};

const handleDayLinkClick = (event) => {
  const link = event.target.closest('a');
  if (!link) {
    return;
  }
  event.preventDefault();
  const dayId = link.dataset.day || link.getAttribute('href').replace('#', '');
  showDayView(dayId);
};

yearView.addEventListener('click', handleDayLinkClick);
monthView.addEventListener('click', handleDayLinkClick);
weekView.addEventListener('click', handleDayLinkClick);

dayBack.addEventListener('click', () => showCalendarView(lastCalendarView));

dayPrev.addEventListener('click', () => {
  const dayId = dayPrev.dataset.day;
  if (dayId) {
    showDayView(dayId);
  }
});

dayNext.addEventListener('click', () => {
  const dayId = dayNext.dataset.day;
  if (dayId) {
    showDayView(dayId);
  }
});

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.view;
    if (view) {
      showCalendarView(view);
    }
  });
});

monthPrev.addEventListener('click', () => {
  currentMonthIndex = (currentMonthIndex - 1 + months.length) % months.length;
  buildMonthView();
});

monthNext.addEventListener('click', () => {
  currentMonthIndex = (currentMonthIndex + 1) % months.length;
  buildMonthView();
});

weekPrev.addEventListener('click', () => {
  currentWeekStartIndex = (currentWeekStartIndex - 7 + totalDays) % totalDays;
  buildWeekView();
});

weekNext.addEventListener('click', () => {
  currentWeekStartIndex = (currentWeekStartIndex + 7) % totalDays;
  buildWeekView();
});

modalClose.addEventListener('click', closeModal);
modalPrev.addEventListener('click', () => updateModalImage(currentImageIndex - 1));
modalNext.addEventListener('click', () => updateModalImage(currentImageIndex + 1));

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

modalImage.addEventListener('touchstart', handleTouchStart, { passive: true });
modalImage.addEventListener('touchend', handleTouchEnd);

window.addEventListener('keydown', (event) => {
  if (modal.classList.contains('is-hidden')) {
    if (dayView.classList.contains('is-hidden')) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      const dayId = getDayIdFromHash();
      const previous = shiftDayId(dayId, -1);
      if (previous) {
        showDayView(previous);
      }
    }
    if (event.key === 'ArrowRight') {
      const dayId = getDayIdFromHash();
      const next = shiftDayId(dayId, 1);
      if (next) {
        showDayView(next);
      }
    }
    return;
  }
  if (event.key === 'Escape') {
    closeModal();
  }
  if (event.key === 'ArrowLeft') {
    updateModalImage(currentImageIndex - 1);
  }
  if (event.key === 'ArrowRight') {
    updateModalImage(currentImageIndex + 1);
  }
});

window.addEventListener('popstate', syncWithHash);
window.addEventListener('hashchange', syncWithHash);

buildYearView();
syncWithHash();
