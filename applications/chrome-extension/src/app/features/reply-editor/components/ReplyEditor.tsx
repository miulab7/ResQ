import React, { useState } from 'react';
import { useMail } from '../../../contexts/MailContext';
import { usePersonalInfo } from '../../../contexts/PersonalInfoContext';
import { CustomizeReply, SelectedOptions } from '../../../types';

interface ReplyEditorProps {
  onGenerateReply: () => void;
  onRegenerateQuestions: () => void;
  onFinalize: () => void;
}

export function ReplyEditor({ onGenerateReply, onRegenerateQuestions, onFinalize }: ReplyEditorProps) {
  const { mailData, contentTabId } = useMail();
  const { personalInfo } = usePersonalInfo();
  const [replyContent, setReplyContent] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [customizeReply, setCustomizeReply] = useState<CustomizeReply>({
    sender: '',
    recipient: '',
    formality: '',
    tone: '',
    urgency: '',
    length: '',
    purpose: '',
    additionalRequest: ''
  });

  const handleGenerateReply = () => {
    const generateReplyPrompt = [
      {
        role: "system",
        content: "###Instruction### Your role is to compose a email reply on behalf of the user. You MUST generate a reply in the same language as the incoming mail"
      },
      {
        role: "system",
        content: `###Incoming Mail### ${mailData.html}`
      },
      {
        role: "system",
        content: `###Past Mail Correspondence### ${mailData.pastHtml}`
      },
      {
        role: "system",
        content: `###Mail Information### sender:${mailData.sender}, title:${mailData.title}, receive time:${mailData.receiveTime}, current time:${mailData.now}`
      },
      {
        role: "system",
        content: `###Audience Information### name:${personalInfo.fullName}, affiliation:${personalInfo.affiliation}, mail:${personalInfo.email}, native language:${personalInfo.language}, role:${personalInfo.role}, otherInfo:${personalInfo.otherInfo}`
      },
      {
        role: "system",
        content: `###Signature### ${personalInfo.signature}`
      }
    ];

    // 選択された質問と回答を追加
    Object.values(selectedOptions).forEach(option => {
      generateReplyPrompt.push({
        role: "assistant",
        content: option.question
      });
      option.choices.forEach(choice => {
        generateReplyPrompt.push({
          role: "user",
          content: choice
        });
      });
    });

    // カスタマイズ設定を追加
    generateReplyPrompt.push({
      role: "system",
      content: `You MUST consider the following conditions when writing the reply message: Role of the sender: ${customizeReply.sender}, Role of the recipient: ${customizeReply.recipient}, Formality of the reply: ${customizeReply.formality}, Tone of the reply: ${customizeReply.tone}, Length of the reply:${customizeReply.length}, Additional requests: ${customizeReply.additionalRequest}`
    });

    chrome.runtime.sendMessage({
      action: 'generateReply',
      prompt: generateReplyPrompt
    });

    onGenerateReply();
  };

  const handleFinalize = () => {
    chrome.runtime.sendMessage({
      action: 'finalizeReply',
      replyContent,
      contentTabId,
      originalMessageContent_html: mailData.html
    });
    onFinalize();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Reply Editor</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleGenerateReply}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate Reply
          </button>
          <button
            onClick={onRegenerateQuestions}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Regenerate Questions
          </button>
          <button
            onClick={handleFinalize}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Finalize
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          className="w-full h-full p-4 border rounded resize-none"
          placeholder="Generated reply will appear here..."
        />
      </div>
    </div>
  );
}