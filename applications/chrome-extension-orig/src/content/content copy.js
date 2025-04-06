// content.js - Refactored Version
console.log('content.js loaded');

// -------------------------------------------------
// 定数（セレクタなどの共通設定）
// -------------------------------------------------
const SELECTORS = {
    replyBox: 'div.Am.aO9.Al.editable.LW-avf',
    originalContent: 'div.adn.ads > div.gs > div:nth-child(3) > div:nth-child(3) > div',
    aiButtonContainer: 'tr.btC',
    subject: 'h2.hP',
    sender: 'span.gD',
    receiveTime: 'span.g3',
    emailContainer: 'div.Bk'
};



// -------------------------------------------------
// グローバル変数
// -------------------------------------------------
let thisContentTabId = null;
let originalContentHTML = null;
let originalContentPastHTML = null;
let isListenerAdded = false;
let thisReplyBox = null;
let clickedEmail = null;


// -------------------------------------------------
// ユーティリティ関数
// -------------------------------------------------
// HTML フィルタリング関数
// 入力された HTML 文字列から全属性を削除し、特定のタグ（br, div, p, pre, hr）の場合は適宜改行を挿入する
const filterHTML = inputHTML => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(inputHTML, 'text/html');
  const allElements = doc.body.getElementsByTagName('*');
  // すべての属性を削除
  for (let element of allElements) {
      while (element.attributes.length > 0) {
      element.removeAttribute(element.attributes[0].name);
      }
  }
  let result = [];
  const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
      acceptNode: node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();
          if (['br', 'div', 'p', 'pre', 'hr'].includes(tag)) {
              return NodeFilter.FILTER_ACCEPT;
          }
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
          return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
      }
      }
  );
  while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.ELEMENT_NODE) {
      const tag = walker.currentNode.tagName.toLowerCase();
      if (tag === 'br' || tag === 'hr') {
          result.push(`<${tag}>`);
      } else {
          // div, p, pre の場合、前に改行を入れる
          if (result[result.length - 1] !== '<br>') {
          result.push('<br>');
          }
      }
      } else if (walker.currentNode.nodeType === Node.TEXT_NODE) {
      result.push(walker.currentNode.textContent);
      }
  }
  if (result[0] === '<br>') result.shift();
  result.push('<br>');
  return result.join('');
};

// 指定したセレクタ内の全子要素のうち、文字色が白の場合に削除する
const removeWhiteText = selector => {
  const elems = document.querySelectorAll(selector + ' *');
  elems.forEach(el => {
      if (window.getComputedStyle(el).color === 'rgb(255, 255, 255)') {
      el.remove();
      }
  });
};

// プレースホルダー：DOM内から元メールの内容を再取得する処理
async function findOriginalContent() {
// 必要に応じた処理を実装してください。ここでは常に成功とする例です。
return { error: false };
}

// -------------------------------------------------
// AIボタン作成とクリック時処理
// -------------------------------------------------

// AIボタンを生成して返す
function createAIButton() {
  const tdElement = document.createElement('td');
  tdElement.className = 'td-aiButton';

  const buttonDiv = document.createElement('div');
  buttonDiv.className = 'T-I J-J5-Ji aoO v T-I-atl L3';
  buttonDiv.setAttribute('role', 'button');
  buttonDiv.setAttribute('tabindex', '1');
  buttonDiv.setAttribute('aria-label', 'Reply with AI');
  buttonDiv.style.userSelect = 'none';

  const buttonText = document.createElement('span');
  buttonText.className = 'buttonText-aiButton';
  buttonText.textContent = 'Reply with AI';

  buttonDiv.appendChild(buttonText);
  tdElement.appendChild(buttonDiv);

  buttonDiv.addEventListener('click', handleAIButtonClick);
  return tdElement;
}

// クリック時の処理：メール内容を抽出して、バックグラウンドに送信
function handleAIButtonClick() {
  // タブIDの保存を依頼
  try {
    chrome.runtime.sendMessage({ action: 'storeContentTabId' }, (response) => {
      thisContentTabId = response.contentTabId;
    });
  } catch (e) {
    alert("Please reload the page and try again.");
    return;
  }

  try {
    // クリックされたボタンの最も近いメールコンテナを取得
    clickedEmail = this.closest(SELECTORS.emailContainer);
    if (!clickedEmail) throw new Error("Failed to find email container");

    // メール本文部分の要素群を取得
    const originalContentElements = clickedEmail.querySelectorAll(SELECTORS.originalContent);
    thisReplyBox = clickedEmail.querySelector(SELECTORS.replyBox);

    const subjectElement = document.querySelector(SELECTORS.subject);
    const senderElement = clickedEmail.querySelector(SELECTORS.sender);
    const receiveTimeElement = clickedEmail.querySelector(SELECTORS.receiveTime);

    // 複数存在する場合、特定の要素を選ぶ（yj6qoクラスがないもの）
    let contentIndex = 0;
    for (let i = 0; i < originalContentElements.length; i++) {
      if (!originalContentElements[i].classList.contains('yj6qo')) {
        contentIndex = i;
      }
    }

    // 不要な白文字などを削除
    removeWhiteText();

    // 対象の本文要素のクローンを作成
    const originalContentElement = originalContentElements[contentIndex];
    const cloneDiv = originalContentElement.cloneNode(true);

    // 過去のやり取り（例：div.h5 または div.im）の要素を抽出し、削除
    let pastElements = cloneDiv.querySelectorAll('div.h5');
    if (pastElements.length === 0) {
      pastElements = cloneDiv.querySelectorAll('div.im');
    }
    pastElements.forEach(el => el.remove());

    originalContentHTML = filterHTML(cloneDiv.innerHTML).replace(/\s|&nbsp;/g, ' ');
    const originalContentText = cloneDiv.innerText;
    originalContentPastHTML = filterHTML(Array.from(pastElements).map(el => el.outerHTML).join('')).replace(/\s|&nbsp;/g, ' ');

    // バックグラウンドへエディタ起動のためのメッセージ送信
    chrome.runtime.sendMessage({
      action: 'openEditor',
      email_information: {
        html: originalContentHTML,
        text: originalContentText,
        title: subjectElement ? subjectElement.textContent : '',
        sender: senderElement ? senderElement.textContent : '',
        receive_time: receiveTimeElement ? receiveTimeElement.textContent : '',
        current_time: new Date().toLocaleString(),
        past_html: originalContentPastHTML
      },
    });
  } catch (e) {
    console.error(e);
    alert("An error occurred.");
  }
}

// -------------------------------------------------
// MutationObserverでAIボタンを自動追加
// -------------------------------------------------
function addAIButtonObserver() {
  const observer = new MutationObserver(() => {
    const buttonContainers = document.querySelectorAll(SELECTORS.aiButtonContainer);
    buttonContainers.forEach(container => {
      if (container && !container.querySelector('.td-aiButton')) {
        const aiButton = createAIButton();
        container.appendChild(aiButton);
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// -------------------------------------------------
// Chromeランタイムメッセージリスナーの登録
// -------------------------------------------------
function addMessageListener() {
  if (!isListenerAdded) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'reflectReply') {
        findOriginalContent().then(result => {
          if (result.error) {
            sendResponse({ status: 'false' });
          } else if (request.contentTabId === thisContentTabId) {
            thisReplyBox = clickedEmail.querySelector(SELECTORS.replyBox);
            if (thisReplyBox) {
              thisReplyBox.innerHTML = request.replyContent.replace(/\n/g, '<br>');
              sendResponse({ status: 'true' });
            } else {
              sendResponse({ status: 'false' });
            }
          } else {
            sendResponse({ status: 'differentTab' });
          }
        });
      } else if (request.action === 'serverError') {
        alert("An error occurred on the server.");
      }
      return true;
    });
    isListenerAdded = true;
  }
}

// -------------------------------------------------
// 初期化
// -------------------------------------------------
window.addEventListener('load', () => {
  addAIButtonObserver();
  addMessageListener();
});
