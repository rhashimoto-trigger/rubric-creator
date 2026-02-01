import React, { useState } from 'react';
import { Download, Plus, Trash2, RefreshCw, Home } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState({
    subject: '',
    title: '',
    grade: '',
    levels: 5,
    charCount: '50'
  });
  const [criteria, setCriteria] = useState([
    { id: 1, aspect: '', standard: '' }
  ]);
  const [generatedRubric, setGeneratedRubric] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');

  const addCriterion = () => {
    setCriteria([...criteria, { id: Date.now(), aspect: '', standard: '' }]);
  };

  const removeCriterion = (id) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter(c => c.id !== id));
    }
  };

  const updateCriterion = (id, field, value) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const validateCriteria = () => {
    const emptyCriteria = criteria.filter(c => !c.aspect.trim() || !c.standard.trim());
    if (emptyCriteria.length > 0) {
      setErrorMessage('すべての観点名と評価規準を入力してください');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const generateRubric = async () => {
    if (!validateCriteria()) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    try {
      const prompt = `以下の情報をもとに、${basicInfo.levels}段階の詳細なルーブリックを作成してください。

評価項目: ${basicInfo.title}
科目: ${basicInfo.subject}
学年: ${basicInfo.grade}

評価観点と評価規準:
${criteria.map((c, i) => `${i + 1}. 観点「${c.aspect}」- ${c.standard}`).join('\n')}

重要: 上記の評価規準は、評価の中央レベル（${basicInfo.levels}段階の場合、レベル${Math.ceil(basicInfo.levels / 2)}相当）を想定した内容です。

各観点について、レベル${basicInfo.levels}（最高）からレベル1（最低）までの具体的な評価規準を作成してください。
中央レベルの規準を基準として、上位レベルはより高度に、下位レベルはより基礎的な内容にしてください。
各レベルの説明は約${basicInfo.charCount}文字程度で記述してください。
各レベルには、生徒の具体的な行動や成果物の特徴を明確に記述してください。

JSON形式で以下のように出力してください:
{
  "criteria": [
    {
      "aspect": "観点名",
      "levels": [
        { "level": ${basicInfo.levels}, "description": "最高レベルの基準" },
        { "level": ${basicInfo.levels - 1}, "description": "..." },
        ...
      ]
    }
  ]
}`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          maxTokens: 5000
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API呼び出しエラー');
      }
      
      const text = data.content.find(item => item.type === "text")?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const rubricData = JSON.parse(jsonMatch[0]);
        setGeneratedRubric(rubricData);
        setStep(3);
      } else {
        throw new Error('ルーブリックデータの解析に失敗しました');
      }
    } catch (error) {
      console.error('Error generating rubric:', error);
      setErrorMessage(`エラー: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const adjustDifficulty = async (direction) => {
    setIsGenerating(true);
    setErrorMessage('');
    try {
      const prompt = `以下のルーブリックの評価レベルの難易度を調整してください。

現在のルーブリック:
${JSON.stringify(generatedRubric, null, 2)}

評価項目: ${basicInfo.title}
科目: ${basicInfo.subject}
学年: ${basicInfo.grade}

${direction === 'harder' 
  ? '【難しく調整】各評価レベルで求められる達成度を高くしてください。より優れた成果や深い理解を要求する内容にしてください。例えば、元々「複数の視点から考察できる」だった場合は「多様な視点から深く考察し、独自の結論を導ける」のように、求める水準を引き上げてください。用語や表現は平易なまま、達成すべきレベルを上げてください。' 
  : '【易しく調整】各評価レベルで求められる達成度を低くしてください。より基礎的な成果でも評価されるようにしてください。例えば、元々「複数の視点から考察できる」だった場合は「基本的な視点から考察できる」のように、求める水準を引き下げてください。用語や表現は平易なまま、達成しやすい内容にしてください。'}

各レベルの説明は約${basicInfo.charCount}文字程度で記述してください。
同じJSON形式で出力してください。`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          maxTokens: 5000
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API呼び出しエラー');
      }
      
      const text = data.content.find(item => item.type === "text")?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const rubricData = JSON.parse(jsonMatch[0]);
        setGeneratedRubric(rubricData);
      } else {
        throw new Error('ルーブリックデータの解析に失敗しました');
      }
    } catch (error) {
      console.error('Error adjusting difficulty:', error);
      setErrorMessage(`エラー: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyCustomInstruction = async () => {
    if (!customInstruction.trim()) {
      setErrorMessage('修正指示を入力してください');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    try {
      const prompt = `以下のルーブリックを、ユーザーの指示に従って修正してください。

現在のルーブリック:
${JSON.stringify(generatedRubric, null, 2)}

評価項目: ${basicInfo.title}
科目: ${basicInfo.subject}
学年: ${basicInfo.grade}

ユーザーの修正指示:
${customInstruction}

上記の指示に従ってルーブリックを修正してください。
各レベルの説明は約${basicInfo.charCount}文字程度で記述してください。
同じJSON形式で出力してください。`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          maxTokens: 5000
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API呼び出しエラー');
      }
      
      const text = data.content.find(item => item.type === "text")?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const rubricData = JSON.parse(jsonMatch[0]);
        setGeneratedRubric(rubricData);
        setCustomInstruction('');
      } else {
        throw new Error('ルーブリックデータの解析に失敗しました');
      }
    } catch (error) {
      console.error('Error applying custom instruction:', error);
      setErrorMessage(`エラー: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsText = () => {
    let text = `${basicInfo.title}\n`;
    text += `科目: ${basicInfo.subject} | 学年: ${basicInfo.grade}\n`;
    text += `評価段階: ${basicInfo.levels}段階\n\n`;
    
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    generatedRubric.criteria.forEach((item, index) => {
      text += `【${item.aspect}】\n`;
      item.levels.forEach((levelData) => {
        const label = labels[basicInfo.levels - levelData.level];
        text += `${label}: ${levelData.description}\n`;
      });
      text += '\n';
    });
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${basicInfo.subject}_${basicInfo.title}_ルーブリック.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelLabel = (level) => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return labels[basicInfo.levels - level] || level;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ルーブリック作成アプリ</h1>
          <p className="text-gray-600 mt-2">AIを活用した評価規準の作成ツール</p>
        </header>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">基本情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  科目
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: 理科"
                  value={basicInfo.subject}
                  onChange={(e) => setBasicInfo({...basicInfo, subject: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ルーブリック名
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: レポート評価"
                  value={basicInfo.title}
                  onChange={(e) => setBasicInfo({...basicInfo, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学年
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 中学2年"
                    value={basicInfo.grade}
                    onChange={(e) => setBasicInfo({...basicInfo, grade: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    評価段階数
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={basicInfo.levels}
                    onChange={(e) => setBasicInfo({...basicInfo, levels: parseInt(e.target.value)})}
                  >
                    <option value="3">3段階</option>
                    <option value="4">4段階</option>
                    <option value="5">5段階</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  評価規準の文字数目安
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={basicInfo.charCount}
                  onChange={(e) => setBasicInfo({...basicInfo, charCount: e.target.value})}
                >
                  <option value="30">短め（約30文字）</option>
                  <option value="50">標準（約50文字）</option>
                  <option value="80">詳細（約80文字）</option>
                  <option value="120">長め（約120文字）</option>
                </select>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!basicInfo.title || !basicInfo.subject || !basicInfo.grade}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">評価観点と規準</h2>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Home size={18} />
                ホーム
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {criteria.map((criterion, index) => (
                <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">観点 {index + 1}</h3>
                    {criteria.length > 1 && (
                      <button
                        onClick={() => removeCriterion(criterion.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        観点名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例: 思考力・判断力・表現力"
                        value={criterion.aspect}
                        onChange={(e) => updateCriterion(criterion.id, 'aspect', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        評価規準（中央レベル） <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例: 実験結果を論理的に分析できる（中央レベルの規準を記入　※大まかでも構いません）"
                        rows="2"
                        value={criterion.standard}
                        onChange={(e) => updateCriterion(criterion.id, 'standard', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addCriterion}
              className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-3 px-6 rounded-lg font-medium hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2 mb-6"
            >
              <Plus size={20} />
              観点を追加
            </button>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                戻る
              </button>
              <button
                onClick={generateRubric}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {isGenerating ? 'AIで生成中...' : 'ルーブリックを生成'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && generatedRubric && (
          <div className="space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{basicInfo.title}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Home size={18} />
                    ホーム
                  </button>
                  <button
                    onClick={() => adjustDifficulty('easier')}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? '生成中...' : '易しく'}
                  </button>
                  <button
                    onClick={() => adjustDifficulty('harder')}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? '生成中...' : '難しく'}
                  </button>
                  <button
                    onClick={downloadAsText}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
                  >
                    <Download size={18} />
                    ダウンロード
                  </button>
                </div>
              </div>

              <div className="mb-4 text-sm text-gray-600">
                <p>科目: {basicInfo.subject} | 学年: {basicInfo.grade}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                        評価観点
                      </th>
                      {Array.from({ length: basicInfo.levels }, (_, i) => (
                        <th key={i} className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                          {getLevelLabel(basicInfo.levels - i)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedRubric.criteria.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800">
                          {item.aspect}
                        </td>
                        {item.levels.map((levelData, levelIndex) => (
                          <td key={levelIndex} className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                            {levelData.description}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">カスタム修正</h3>
                <p className="text-sm text-gray-600 mb-3">
                  ルーブリックへの修正指示を入力してください（例: 「思考力の評価規準をもっと具体的にしてください」）
                </p>
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: レベルAの規準をより詳しく説明してください"
                    rows="3"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                  />
                  <button
                    onClick={applyCustomInstruction}
                    disabled={isGenerating || !customInstruction.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {isGenerating ? '生成中...' : '修正適用'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ 「編集に戻る」または「新規作成」を押すと、現在のルーブリックは保存されません。必要に応じて「ダウンロード」ボタンで保存してください。
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                編集に戻る
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setGeneratedRubric(null);
                  setCriteria([{ id: 1, aspect: '', standard: '' }]);
                  setBasicInfo({ subject: '', title: '', grade: '', levels: 5, charCount: '50' });
                  setCustomInstruction('');
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                新規作成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
