import React from 'react';
import { CustomizeReply } from '../../../types';

interface CustomizeSettingsProps {
  customizeReply: CustomizeReply;
  onCustomizeChange: (changes: Partial<CustomizeReply>) => void;
}

export function CustomizeSettings({ customizeReply, onCustomizeChange }: CustomizeSettingsProps) {
  const handleInputChange = (field: keyof CustomizeReply, value: string) => {
    onCustomizeChange({ [field]: value });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">返信設定のカスタマイズ</h2>

      <div className="space-y-4">
        {/* 送信者と受信者の役割 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              送信者の役割
            </label>
            <input
              type="text"
              value={customizeReply.sender}
              onChange={(e) => handleInputChange('sender', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="例: 学生"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              受信者の役割
            </label>
            <input
              type="text"
              value={customizeReply.recipient}
              onChange={(e) => handleInputChange('recipient', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="例: 教授"
            />
          </div>
        </div>

        {/* フォーマリティ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            フォーマリティ
          </label>
          <div className="flex space-x-4">
            {['Formal', 'Semi-formal', 'Casual'].map((level) => (
              <label key={level} className="inline-flex items-center">
                <input
                  type="radio"
                  name="formality"
                  value={level}
                  checked={customizeReply.formality === level}
                  onChange={(e) => handleInputChange('formality', e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* トーン */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            トーン
          </label>
          <div className="flex space-x-4">
            {['Professional', 'Friendly', 'Neutral'].map((tone) => (
              <label key={tone} className="inline-flex items-center">
                <input
                  type="radio"
                  name="tone"
                  value={tone}
                  checked={customizeReply.tone === tone}
                  onChange={(e) => handleInputChange('tone', e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2">{tone}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 緊急度 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            緊急度
          </label>
          <div className="flex space-x-4">
            {['High', 'Medium', 'Low'].map((urgency) => (
              <label key={urgency} className="inline-flex items-center">
                <input
                  type="radio"
                  name="urgency"
                  value={urgency}
                  checked={customizeReply.urgency === urgency}
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2">{urgency}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 長さ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            返信の長さ
          </label>
          <div className="flex space-x-4">
            {['Concise', 'Standard', 'Detailed'].map((length) => (
              <label key={length} className="inline-flex items-center">
                <input
                  type="radio"
                  name="length"
                  value={length}
                  checked={customizeReply.length === length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2">{length}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 目的 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            返信の目的
          </label>
          <input
            type="text"
            value={customizeReply.purpose}
            onChange={(e) => handleInputChange('purpose', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="例: 会議の日程調整"
          />
        </div>

        {/* 追加リクエスト */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            追加リクエスト
          </label>
          <textarea
            value={customizeReply.additionalRequest}
            onChange={(e) => handleInputChange('additionalRequest', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="例: できるだけ丁寧な言葉遣いでお願いします"
          />
        </div>
      </div>
    </div>
  );
}