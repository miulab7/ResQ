import React, { useState } from 'react';
import { ReplyEditor } from '../components/ReplyEditor';
import { QuestionGenerator } from '../components/QuestionGenerator';
import { CustomizeSettings } from '../components/CustomizeSettings';
import { MailProvider } from '../../../contexts/MailContext';
import { PersonalInfoProvider } from '../../../contexts/PersonalInfoContext';
import { CustomizeReply, SelectedOptions } from '../../../types';

export function ReplyEditorPage() {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [customizeReply, setCustomizeReply] = useState<CustomizeReply>({
    sender: '',
    recipient: '',
    formality: 'Semi-formal',
    tone: 'Professional',
    urgency: 'Medium',
    length: 'Standard',
    purpose: '',
    additionalRequest: ''
  });

  const handleGenerateReply = () => {
    // ReplyEditorコンポーネントで実装
  };

  const handleRegenerateQuestions = () => {
    // QuestionGeneratorコンポーネントで実装
  };

  const handleFinalize = () => {
    // ReplyEditorコンポーネントで実装
  };

  const handleOptionsSelected = (options: SelectedOptions) => {
    setSelectedOptions(options);
  };

  const handleCustomizeChange = (changes: Partial<CustomizeReply>) => {
    setCustomizeReply(prev => ({ ...prev, ...changes }));
  };

  return (
    <MailProvider>
      <PersonalInfoProvider>
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-12 gap-6">
              {/* 左サイドバー: 元のメールと質問 */}
              <div className="col-span-4 space-y-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-xl font-semibold mb-4">元のメール</h2>
                  <div id="originalContent" className="prose max-w-none" />
                  <div className="mt-4">
                    <button
                      id="originalMessagePastButton"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      過去のやり取りを表示
                    </button>
                    <div id="originalMessagePast" className="mt-2 hidden" />
                  </div>
                </div>

                <QuestionGenerator onOptionsSelected={handleOptionsSelected} />
              </div>

              {/* メインコンテンツ: 返信エディタ */}
              <div className="col-span-5">
                <ReplyEditor
                  onGenerateReply={handleGenerateReply}
                  onRegenerateQuestions={handleRegenerateQuestions}
                  onFinalize={handleFinalize}
                />
              </div>

              {/* 右サイドバー: カスタマイズ設定 */}
              <div className="col-span-3">
                <CustomizeSettings
                  customizeReply={customizeReply}
                  onCustomizeChange={handleCustomizeChange}
                />
              </div>
            </div>
          </div>
        </div>
      </PersonalInfoProvider>
    </MailProvider>
  );
}