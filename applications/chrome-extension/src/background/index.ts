import { PersonalInformation } from '../app/types';
import { ChromeMessage, ChromeMessageSender, StorageResult, WindowCreateData } from './types';

interface State {
  contentTabId: number | null;
  replyEditorWindowId: number | null;
  replyEditorTabId: number | null;
  personalInformation: PersonalInformation;
  conversationHistory: Array<{ role: string; content: string }>;
  isListenerAdded: boolean;
}

const state: State = {
  contentTabId: null,
  replyEditorWindowId: null,
  replyEditorTabId: null,
  personalInformation: {
    fullName: "",
    email: "",
    affiliation: "",
    language: "",
    role: "",
    signature: "",
    otherInfo: ""
  },
  conversationHistory: [],
  isListenerAdded: false
};

async function requestAPI(url: string, payload: any): Promise<Response> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

async function generateQuestionStream(conversationHistory: Array<{ role: string; content: string }>) {
  const url = 'https://rgbsqxnbb2eigg7qr2de3phvdq0ieanq.lambda-url.ap-northeast-1.on.aws/api/chrome_generate_questions_stream';
  try {
    const response = await requestAPI(url, {
      conversationhistory: conversationHistory,
      replyEditorTabId: state.replyEditorTabId,
      contentTabId: state.contentTabId
    });

    const reader = response.body!.getReader();
    let question = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (state.replyEditorTabId) {
          chrome.tabs.sendMessage(state.replyEditorTabId, {
            action: 'ReflectQuestion',
            question: question,
            replyEditorTabId: state.replyEditorTabId
          });
          state.conversationHistory.push({ role: "assistant", content: question });
        }
        break;
      }
      question += new TextDecoder().decode(value);
    }
  } catch (error) {
    if (state.replyEditorTabId) {
      chrome.tabs.remove(state.replyEditorTabId);
    }
    if (state.contentTabId) {
      chrome.tabs.sendMessage(state.contentTabId, { action: 'serverError' });
    }
    console.error('Error generating question:', error);
  }
}

async function generateReplyStream(prompt: Array<{ role: string; content: string }>) {
  const url = 'https://rgbsqxnbb2eigg7qr2de3phvdq0ieanq.lambda-url.ap-northeast-1.on.aws/api/chrome_generate_reply_stream';
  try {
    const response = await requestAPI(url, {
      prompt,
      replyEditorTabId: state.replyEditorTabId,
      contentTabId: state.contentTabId
    });

    const reader = response.body!.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (state.replyEditorTabId) {
          chrome.tabs.sendMessage(state.replyEditorTabId, {
            action: 'finish_generate_reply',
            replyEditorTabId: state.replyEditorTabId
          });
        }
        break;
      }
      const messageContent = new TextDecoder().decode(value);
      if (state.replyEditorTabId) {
        chrome.tabs.sendMessage(state.replyEditorTabId, {
          action: 'reflectReply',
          messageContent,
          replyEditorTabId: state.replyEditorTabId
        });
      }
    }
  } catch (error) {
    console.error('Error generating reply:', error);
  }
}

async function checkTabExists(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return !!tab;
  } catch {
    return false;
  }
}

function openReplyEditorWindow(request: ChromeMessage) {
  const windowData: WindowCreateData = {
    url: 'app/features/reply-editor/pages/reply-editor.html',
    type: 'popup',
    state: 'normal',
    width: 1000,
    height: 1200
  };

  chrome.windows.create(windowData, window => {
    if (!window) return;

    chrome.tabs.query({ windowId: window.id }, tabs => {
      if (tabs && tabs.length > 0) {
        state.replyEditorTabId = tabs[0].id ?? null;
        if (state.replyEditorTabId) {
          setTimeout(() => {
            chrome.tabs.sendMessage(state.replyEditorTabId!, {
              action: 'ReflectMessage',
              originalContent_text: request.originalContent_text,
              originalContent_html: request.originalContent_html,
              subject: request.subject,
              sender: request.sender,
              receiveTime: request.receiveTime,
              replyEditorTabId: state.replyEditorTabId,
              contentTabId: state.contentTabId,
              originalContentPast_html: request.originalContentPast_html,
              personalInformation: state.personalInformation
            });
          }, 300);
        }
      }
    });
  });
}

// メッセージリスナーの設定
chrome.runtime.onMessage.addListener((request: ChromeMessage, sender: ChromeMessageSender) => {
  if (request.action === 'openEditor') {
    chrome.storage.local.get(
      ['fullName', 'email', 'affiliation', 'language', 'role', 'signature', 'otherInfo'],
      (result: StorageResult) => {
        Object.assign(state.personalInformation, result);

        if (!state.personalInformation.fullName ||
            !state.personalInformation.affiliation ||
            !state.personalInformation.email ||
            !state.personalInformation.language ||
            !state.personalInformation.role) {
          const settingsWindow: WindowCreateData = {
            type: 'popup',
            url: 'popup/popup.html',
            width: 400,
            height: 600
          };
          chrome.windows.create(settingsWindow);
        } else {
          if (state.replyEditorTabId !== null) {
            chrome.tabs.get(state.replyEditorTabId, tab => {
              if (!tab) {
                state.replyEditorTabId = null;
                openReplyEditorWindow(request);
              } else if (tab.windowId) {
                chrome.windows.update(tab.windowId, { focused: true });
                chrome.tabs.update(state.replyEditorTabId!, { active: true });
              }
            });
          } else {
            state.conversationHistory = [
              {
                role: "system",
                content: "###Incoming Mail### " + request.originalContent_html
              },
              {
                role: "system",
                content: "###Past Mail Correspondence###" + request.originalContentPast_html
              },
              {
                role: "system",
                content: `###Audience Information### name:${state.personalInformation.fullName}, affiliation:${state.personalInformation.affiliation}, mail:${state.personalInformation.email}, native language:${state.personalInformation.language}, role:${state.personalInformation.role}`
              }
            ];
            openReplyEditorWindow(request);
          }
        }
      }
    );
  } else if (request.action === 'generate_questions' && sender.tab?.id === state.replyEditorTabId) {
    generateQuestionStream(request.conversationHistory || []);
  } else if (request.action === 'generateReply' && sender.tab?.id === state.replyEditorTabId) {
    generateReplyStream(request.prompt || []);
  }

  return true;
});

// タブが閉じられたときの処理
chrome.tabs.onRemoved.addListener((tabId: number) => {
  if (tabId === state.replyEditorTabId) {
    state.replyEditorTabId = null;
  }
});
