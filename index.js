closeAccordionByIds(getClosedAccordionIdsFromStorage());
handleAllClickEvents();
renderBuildTimestamp();
renderWeekday();

/**
 * ====== UTILS ======
 **/

function getClosedAccordionIdsFromPage() {
  /**
   * @type {HTMLDetailsElement[]}
   */
  const accordions = [...document.querySelectorAll("[data-accordion-key]")];
  const ids = accordions
    .filter((element) => !element.open)
    .map((element) => element.getAttribute("data-accordion-key"));
  return [...new Set(ids)];
}

function closeAccordionByIds(ids) {
  ids.forEach((id) => {
    const element = document.querySelector(`[data-accordion-key="${id}"]`);
    if (element) element.open = false;
  });
}

function storeClosedAccordionIds(ids) {
  localStorage.setItem("closedAccordionIds", JSON.stringify(ids));
}

function getClosedAccordionIdsFromStorage() {
  const stateString = localStorage.getItem("closedAccordionIds");
  try {
    const parsed = JSON.parse(stateString);
    if (!parsed?.length) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Add a few event handlers as possible to ensure healthy performance scaling
 */
function handleAllClickEvents() {
  document.addEventListener("click", (event) => {
    // Activate daily title as expanders
    const action = event.target.closest("[data-action]");
    if (action) {
      switch (action.getAttribute("data-action")) {
        case "toggle-accordions":
          handleToggleAccordions(event);
          break;
        case "toggle-native-accordion":
          handleToggleNativeAccordion(event);
          break;
      }
    }
  });
}

/**
 * @param {KeyboardEvent=} event
 */
function handleToggleAccordions(event) {
  // when ctrl is held, toggle every accordion in the document
  const scope = event?.ctrlKey ? document : event.target.closest(".js-toggle-accordions-scope");
  const detailsElements = [...scope.querySelectorAll("details")];
  const isAnyOpen = detailsElements.some((element) => element.open);
  detailsElements.forEach((element) => (element.open = !isAnyOpen));

  storeClosedAccordionIds(getClosedAccordionIdsFromPage());
}

/**
 * @param {KeyboardEvent=} event
 */
function handleToggleNativeAccordion() {
  // wait until event settled
  setTimeout(() => storeClosedAccordionIds(getClosedAccordionIdsFromPage()), 0);
}

/**
 * Convert machine readable timestamp to locale time
 */
function renderBuildTimestamp() {
  const timestamp = document.getElementById("build-timestamp");
  timestamp.innerText = new Date(timestamp.getAttribute("datetime")).toLocaleString();
}

/**
 * Convert the server timestamp to human readable weekday and dates.
 * Note: the server is responsible for shifting the date based on config file.
 * The client should parse the date as if it is in UTC timezone.
 */
function renderWeekday() {
  document.querySelectorAll(".js-offset-weekday").forEach((element) => {
    const weekday = new Date(element.getAttribute("data-offset-date")).toLocaleString(window.navigator.language, {
      weekday: "long",
      timeZone: "UTC",
    });
    element.innerText = weekday;
  });
  document.querySelectorAll(".js-offset-date").forEach((element) => {
    const date = new Date(element.getAttribute("data-offset-date")).toLocaleString(window.navigator.language, {
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    });
    element.innerText = date;
  });
}

// ====== 已读状态管理 ======
function markAsRead() {
  // 点击文章时切换状态
  document.querySelectorAll('.article-summary-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault(); // 阻止默认跳转（如果是链接）
      const isRead = this.getAttribute('data-read') === 'true';
      this.setAttribute('data-read', !isRead);
      
      // 存储状态到 localStorage（可选）
      const articleId = this.closest('[data-accordion-key]').getAttribute('data-accordion-key');
      const readList = JSON.parse(localStorage.getItem('readArticles') || '[]');
      if (isRead) {
        localStorage.setItem('readArticles', JSON.stringify(readList.filter(id => id !== articleId)));
      } else {
        localStorage.setItem('readArticles', JSON.stringify([...readList, articleId]));
      }
    });
  });

  // 页面加载时恢复已读状态
  const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
  readArticles.forEach(id => {
    const article = document.querySelector(`[data-accordion-key="${id}"] .article-summary-link`);
    if (article) article.setAttribute('data-read', 'true');
  });
}

// 初始化
markAsRead();
