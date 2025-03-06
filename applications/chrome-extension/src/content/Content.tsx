import React, { useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface MailContent {
  text: string;
  html: string;
}

const Content: React.FC = () => {
  // メールコンテンツを取得する関数
  const getMailContent = (): MailContent => {
    const mailBody = document.querySelector('.a3s.aiL');
    if (!mailBody) return { text: '', html: '' };

    return {
      text: mailBody.textContent || '',
      html: mailBody.innerHTML
    };
  };

  // メールの件名を取得する関数
  const getMailSubject = (): string => {
    const subjectElement = document.querySelector('h2.hP');
    return subjectElement?.textContent || '';
  };

  // 送信者情報を取得する関数
  const getMailSender = (): string => {
    const senderElement = document.querySelector('.gD');
    return senderElement?.getAttribute('email') || '';
  };

  // 受信時刻を取得する関数
  const getReceiveTime = (): string => {
    const timeElement = document.querySelector('.g3');
    return timeElement?.getAttribute('title') || '';
  };

  // 過去のメールのやり取りを取得する関数
  const getPastCorrespondence = (): string => {
    const quotedContent = document.querySelector('.gmail_quote');
    return quotedContent?.innerHTML || '';
  };

  // 返信ボタンクリック時の処理
  const processReplyClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const mailContent = getMailContent();
    const subject = getMailSubject();
    const sender = getMailSender();
    const receiveTime = getReceiveTime();
    const pastCorrespondence = getPastCorrespondence();

    // バックグラウンドスクリプトにメッセージを送信
    chrome.runtime.sendMessage({
      action: 'openEditor',
      originalContent_text: mailContent.text,
      originalContent_html: mailContent.html,
      subject: subject,
      sender: sender,
      receiveTime: receiveTime,
      originalContentPast_html: pastCorrespondence
    });
  };

  const handleReplyClickReact = (event: React.MouseEvent<HTMLDivElement>) => {
    processReplyClick(event.nativeEvent);
  };

  const handleReplyClickNative = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    processReplyClick(mouseEvent);
  };

  // 返信ボタンにイベントリスナーを追加する関数
  const addReplyButtonListener = () => {
    const replyButtons = document.querySelectorAll('[role="button"][data-tooltip*="返信"]');
    replyButtons.forEach(button => {
      button.addEventListener('click', handleReplyClickNative);
    });
  };

  // 返信内容をGmailの返信ボックスに反映する関数
  const insertReplyContent = (content: string): boolean => {
    const replyBox = document.querySelector('[role="textbox"][aria-label*="返信"]');
    if (replyBox) {
      replyBox.innerHTML = content;
      return true;
    }
    return false;
  };

  useEffect(() => {
    // コンテンツタブIDをバックグラウンドに通知
    chrome.runtime.sendMessage({ action: 'storeContentTabId' });

    // メッセージリスナーの設定
    const messageListener = (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      if (request.action === 'reflectReply' && request.contentTabId === request.correspondingReplyTabId) {
        const success = insertReplyContent(request.replyContent);
        sendResponse({ status: success.toString() });
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // MutationObserverを使用してDOMの変更を監視
    const observer = new MutationObserver(() => {
      addReplyButtonListener();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 初回の返信ボタンリスナー設定
    addReplyButtonListener();

    // クリーンアップ
    return () => {
      observer.disconnect();
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);
// AIボタンを作成する関数
const createAIButton = useCallback(() => {
  const buttonContainer = document.createElement('td');
  buttonContainer.className = 'td-aiButton';
  buttonContainer.style.padding = '0 4px';

  // ボタンのルート要素を作成
  const root = createRoot(buttonContainer);

  // Reactボタンコンポーネントをレンダリング
  root.render(
    <div
      className="T-I J-J5-Ji aoO v T-I-atl L3"
      role="button"
      tabIndex={1}
      aria-label="Reply with AI"
      style={{
        userSelect: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        padding: '0 16px',
        minWidth: '56px',
        maxWidth: '500px',
        height: '32px',
        lineHeight: '32px',
        textAlign: 'center',
        borderRadius: '4px',
        backgroundColor: '#0b57d0',
        color: '#fff',
      }}
      onClick={handleReplyClickReact}
    >
      Reply with AI
    </div>
  );

  return buttonContainer;
}, [handleReplyClickReact]);

// AIボタンを追加するMutationObserver
useEffect(() => {
  const observer = new MutationObserver(() => {
    const buttonContainers = document.querySelectorAll('tr.btC');
    buttonContainers.forEach(container => {
      if (container && !container.querySelector('.td-aiButton')) {
        const aiButton = createAIButton();
        // ゴミ箱アイコンの前に挿入
        const trashTd = container.querySelector('.a0z');
        if (trashTd) {
          container.insertBefore(aiButton, trashTd);
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}, [createAIButton]);

return null;
};

export default Content;
