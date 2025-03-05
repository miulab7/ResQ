import React, { useEffect } from 'react';

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
  const handleReplyClick = (event: MouseEvent) => {
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

  // 返信ボタンにイベントリスナーを追加する関数
  const addReplyButtonListener = () => {
    const replyButtons = document.querySelectorAll('[role="button"][data-tooltip*="返信"]');
    replyButtons.forEach(button => {
      button.addEventListener('click', handleReplyClick as EventListener);
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

  return null; // このコンポーネントは表示要素を持ちません
};

export default Content;
