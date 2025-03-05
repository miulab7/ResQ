import React, { useEffect } from 'react';
import { usePersonalInfo } from '../app/contexts/PersonalInfoContext';

export default function Popup() {
  const { personalInfo, updatePersonalInfo, saveToStorage, loadFromStorage } = usePersonalInfo();

  useEffect(() => {
    loadFromStorage();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveToStorage();
    const message = (!personalInfo.fullName || !personalInfo.affiliation || !personalInfo.email || !personalInfo.language || !personalInfo.role)
      ? 'ユーザー情報が不足しています。'
      : '設定を保存しました！';
    alert(message);
  };

  const handleInputChange = (field: keyof typeof personalInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    updatePersonalInfo({ [field]: e.target.value });
  };

  return (
    <div className="w-[25rem] bg-gray-100 p-6">
      <div className="bg-white p-6 shadow rounded-lg">
        <h1 className="text-2xl font-bold mb-6">ユーザー設定</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              氏名
              <input
                type="text"
                value={personalInfo.fullName}
                onChange={handleInputChange('fullName')}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              メールアドレス
              <input
                type="email"
                value={personalInfo.email}
                onChange={handleInputChange('email')}
                className="mt-1 block w-full rounded-md border-2 bg-gray-50 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              所属
              <input
                type="text"
                value={personalInfo.affiliation}
                onChange={handleInputChange('affiliation')}
                className="mt-1 block w-full rounded-md border-2 bg-gray-50 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              母国語
              <select
                value={personalInfo.language}
                onChange={handleInputChange('language')}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">選択してください</option>
                <option value="Japanese">日本語</option>
                <option value="English">English</option>
                <option value="Chinese">中文</option>
                <option value="Korean">한국어</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              役割
              <select
                value={personalInfo.role}
                onChange={handleInputChange('role')}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">選択してください</option>
                <option value="Student">学生</option>
                <option value="Professor">教授</option>
                <option value="Researcher">研究者</option>
                <option value="Staff">職員</option>
                <option value="Other">その他</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              署名
              <textarea
                value={personalInfo.signature}
                onChange={handleInputChange('signature')}
                rows={4}
                className="mt-1 block w-full rounded-md border-2 bg-gray-50 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="メール署名を入力してください"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              追加情報
              <textarea
                value={personalInfo.otherInfo}
                onChange={handleInputChange('otherInfo')}
                rows={3}
                className="mt-1 block w-full rounded-md border-2 bg-gray-50 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="その他の情報を入力してください"
              />
            </label>
          </div>

          <div className="pt-5">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
