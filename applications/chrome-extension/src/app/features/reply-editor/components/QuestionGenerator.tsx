import React, { useState, useEffect } from 'react';
import { Question, SelectedOptions } from '../../../types';
import { useMail } from '../../../contexts/MailContext';

interface QuestionGeneratorProps {
  onOptionsSelected: (options: SelectedOptions) => void;
}

export function QuestionGenerator({ onOptionsSelected }: QuestionGeneratorProps) {
  const { mailData } = useMail();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [highlightedParts, setHighlightedParts] = useState<Map<string, string>>(new Map());

  const handleOptionClick = (questionId: string, option: string, questionText: string) => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev };
      if (!newOptions[questionId]) {
        newOptions[questionId] = {
          question: questionText,
          choices: []
        };
      }

      const choices = newOptions[questionId].choices;
      const optionIndex = choices.indexOf(option);

      if (optionIndex > -1) {
        choices.splice(optionIndex, 1);
      } else {
        choices.push(option);
      }

      onOptionsSelected(newOptions);
      return newOptions;
    });
  };

  const findMostSimilarSubstring = (text: string, target: string): [number, number] => {
    // 簡易的な類似度計算（実際の実装ではより高度なアルゴリズムを使用）
    let bestMatch: [number, number] = [-1, -1];
    let minDistance = Infinity;

    for (let i = 0; i < text.length - target.length + 1; i++) {
      const substring = text.substr(i, target.length);
      const distance = levenshteinDistance(substring, target);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = [i, i + target.length];
      }
    }

    return bestMatch;
  };

  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
      }
    }

    return matrix[b.length][a.length];
  };

  const highlightCorrespondingPart = (question: Question) => {
    const [start, end] = findMostSimilarSubstring(mailData.html, question.corresponding_part);
    if (start !== -1 && end !== -1) {
      const uniqueId = `highlight-${question.id}`;
      const newHtml = mailData.html.slice(0, start) +
        `<span class="bg-yellow-200" id="${uniqueId}">` +
        mailData.html.slice(start, end) +
        '</span>' +
        mailData.html.slice(end);

      setHighlightedParts(prev => new Map(prev).set(question.id, newHtml));
    }
  };

  useEffect(() => {
    // 質問生成のリクエスト
    chrome.runtime.sendMessage({
      action: 'generate_questions',
      conversationHistory: [
        {
          role: "system",
          content: "###Incoming Mail### " + mailData.html
        }
      ]
    });
  }, [mailData]);

  return (
    <div className="flex flex-col space-y-4 p-4">
      {questions.map(question => (
        <div
          key={question.id}
          className="border rounded p-4 hover:shadow-lg transition-shadow"
          onMouseEnter={() => highlightCorrespondingPart(question)}
        >
          <p className="font-medium mb-2">{question.question}</p>
          <div className="flex flex-wrap gap-2">
            {question.choices.map(choice => (
              <button
                key={choice}
                onClick={() => handleOptionClick(question.id, choice, question.question)}
                className={`px-3 py-1 rounded border ${
                  selectedOptions[question.id]?.choices.includes(choice)
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}