export interface ChromeMessage {
  action: string;
  replyEditorTabId?: number;
  contentTabId?: number;
  originalContent_text?: string;
  originalContent_html?: string;
  subject?: string;
  sender?: string;
  receiveTime?: string;
  originalContentPast_html?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  prompt?: Array<{ role: string; content: string }>;
  data?: any;
}

export interface ChromeMessageSender {
  tab?: chrome.tabs.Tab;
  frameId?: number;
  id?: string;
  url?: string;
}

export interface StorageResult {
  fullName?: string;
  email?: string;
  affiliation?: string;
  language?: string;
  role?: string;
  signature?: string;
  otherInfo?: string;
}

export interface WindowCreateData {
  url?: string | string[];
  type?: chrome.windows.WindowType;
  state?: chrome.windows.WindowState;
  width?: number;
  height?: number;
}