import { Question, Subject } from '@/lib/types';

// Basic question set covering seven study subjects
export const dummyQuestions: Question[] = [
  // 企業と不動産
  {
    id: 'q1',
    subject: '企業と不動産',
    unit: '基礎',
    question:
      '企業が所有不動産を売却し、引き続き同じ物件を賃借する手法を何と呼ぶか。',
    choices: [
      'セール・リースバック',
      'エクイティファイナンス',
      'リースオプション',
      'ストラクチャードファイナンス',
    ],
    answer: 0,
    explanation:
      'セール・リースバックは資産を売却後にリースする取引で、資金調達と資産の使用継続を両立させる。',
  },
  {
    id: 'q2',
    subject: '企業と不動産',
    unit: '基礎',
    question:
      'コーポレートリアルエステートの主な目的として「事業戦略との整合」「コスト最適化」ともう一つは何か。',
    choices: ['売上拡大', 'リスク管理', '人材育成', '市場調査'],
    answer: 1,
    explanation:
      'コーポレートリアルエステートではリスク管理も重要な目的で、企業活動への影響を最小限に抑える。',
  },

  // 不動産証券化の概要
  {
    id: 'q3',
    subject: '不動産証券化の概要',
    unit: '基礎',
    question: '不動産証券化で得られる主なメリットとして正しいものを1つ選べ。',
    choices: [
      '不動産価格の固定化',
      '流動性の向上',
      '税負担の増大',
      '情報開示の削減',
    ],
    answer: 1,
    explanation: '証券化により小口化されることで、投資商品の流動性が向上する。',
  },
  {
    id: 'q4',
    subject: '不動産証券化の概要',
    unit: '基礎',
    question: 'SPV（Special Purpose Vehicle）の一般的な役割は次のうちどれか。',
    choices: [
      '投資家へ配当金を支払う法的主体',
      '不動産管理業務を委託する企業',
      '銀行のリスク管理部門',
      '不動産の取引価格を決定する機関',
    ],
    answer: 0,
    explanation:
      'SPVは証券化のために設立される特別目的会社で、投資家への配当支払いなどを担う。',
  },

  // 不動産投資の基礎
  {
    id: 'q5',
    subject: '不動産投資の基礎',
    unit: '基礎',
    question: 'キャップレートの計算式として正しいものを選べ。',
    choices: [
      '資産価値 ÷ NOI',
      'NOI ÷ 資産価値',
      'NOI × 資産価値',
      'NOI + 資産価値',
    ],
    answer: 1,
    explanation: 'キャップレートは純収益(NO I)を資産価値で割った指標で収益性を示す。',
  },
  {
    id: 'q6',
    subject: '不動産投資の基礎',
    unit: '基礎',
    question:
      'DCF法（Discounted Cash Flow）で考慮する主な要素に該当しないものはどれか。',
    choices: ['将来キャッシュフロー', '割引率', 'インフレ率', '土地登記費用'],
    answer: 3,
    explanation:
      'DCF法は将来キャッシュフローを割引率で現在価値に換算する手法で、土地登記費用は考慮しない。',
  },

  // 不動産証券化の法務
  {
    id: 'q7',
    subject: '不動産証券化の法務',
    unit: '基礎',
    question: 'J-REITを運用するために必要なライセンスは次のうちどれか。',
    choices: ['不動産仲介業', '投資運用業', '不動産鑑定士', '建設業'],
    answer: 1,
    explanation: 'J-REITの運用には金融商品取引業である投資運用業の登録が必要。',
  },
  {
    id: 'q8',
    subject: '不動産証券化の法務',
    unit: '基礎',
    question: '不動産特定共同事業法における主な規制内容は何か。',
    choices: [
      '公募増資の際の情報開示',
      '不動産取引の媒介に関するルール',
      '特定物件への出資募集や管理方法',
      '税金の特例措置',
    ],
    answer: 2,
    explanation:
      '不動産特定共同事業法は特定物件に出資を募り運用する事業の規制について定める。',
  },

  // 不動産証券化の会計・税務
  {
    id: 'q9',
    subject: '不動産証券化の会計・税務',
    unit: '基礎',
    question:
      '不動産証券化でSPVをオフバランス化するための条件の一つは何か。',
    choices: [
      '企業の親会社と連結財務諸表を作成しないこと',
      'SPVが法人税を支払わないこと',
      'SPVに独立性があり、取引の実質的なリスクを分離できること',
      'SPVが金融庁へ登録されること',
    ],
    answer: 2,
    explanation:
      'SPVが独立しリスクが分離されていると判断されることでオフバランス化が認められる。',
  },
  {
    id: 'q10',
    subject: '不動産証券化の会計・税務',
    unit: '基礎',
    question:
      'J-REITの配当金が「不動産所得」ではなく「配当所得」として課税される理由は何か。',
    choices: [
      '法人税法で特例が定められているため',
      '投資家の居住地を問わないため',
      '複数の不動産を一括管理するため',
      '元本保証があるため',
    ],
    answer: 0,
    explanation:
      'J-REITは法人税法上の特例により配当所得として扱われ投資家に課税される。',
  },

  // 不動産ファイナンスの基礎
  {
    id: 'q11',
    subject: '不動産ファイナンスの基礎',
    unit: '基礎',
    question: 'LTV（Loan to Value）比率は何を示す指標か。',
    choices: [
      '物件の収益性',
      '借入額の物件価格に対する割合',
      '借入利率の計算方法',
      '土地評価額の変動率',
    ],
    answer: 1,
    explanation:
      'LTVはローン残高を担保価値で割った値で、融資の安全性を判断する指標。',
  },
  {
    id: 'q12',
    subject: '不動産ファイナンスの基礎',
    unit: '基礎',
    question: 'メザニンローンの主な特徴として正しいものを選べ。',
    choices: [
      '銀行が提供する最も低利のローン',
      'エクイティよりも上位、シニアローンよりも下位の優先順位を持つ資金',
      '元本保証がある',
      '一般的に担保を必要としない',
    ],
    answer: 1,
    explanation:
      'メザニンローンはシニアローンとエクイティの中間に位置する高リスク・高リターンの資金。',
  },

  // 不動産証券化と倫理行動
  {
    id: 'q13',
    subject: '不動産証券化と倫理行動',
    unit: '基礎',
    question: '利益相反を避けるために重要な行動は次のうちどれか。',
    choices: [
      '競合他社との情報共有',
      '個人の利益を優先する',
      '透明性の確保と適切な情報開示',
      '市場の動向を無視する',
    ],
    answer: 2,
    explanation:
      '透明性の確保と適切な情報開示は利益相反の回避に欠かせない。',
  },
  {
    id: 'q14',
    subject: '不動産証券化と倫理行動',
    unit: '基礎',
    question: '内部統制の重要な役割に当てはまらないものはどれか。',
    choices: ['法令遵守の促進', 'リスク管理', '組織の活性化', '不正行為の抑制'],
    answer: 2,
    explanation:
      '内部統制は法令遵守やリスク管理、不正抑制を目的としており、組織の活性化は直接の目的ではない。',
  },
];

// Subjects built from the above question set
export const subjects: Subject[] = [
  {
    id: 'corporate-real-estate',
    name: '企業と不動産',
    description: '企業と不動産に関する基礎的な知識を学習',
    units: [
      {
        id: 'corporate-real-estate-unit',
        name: '基礎',
        description: '企業と不動産の基礎',
        subjectId: 'corporate-real-estate',
        questions: dummyQuestions.filter((q) => q.subject === '企業と不動産'),
        dueCards: 0,
        newCards: 2,
      },
    ],
    totalQuestions: 2,
    completedQuestions: 0,
  },
  {
    id: 'securitization-overview',
    name: '不動産証券化の概要',
    description: '不動産証券化の仕組みとメリットを学習',
    units: [
      {
        id: 'securitization-overview-unit',
        name: '基礎',
        description: '不動産証券化の概要',
        subjectId: 'securitization-overview',
        questions: dummyQuestions.filter(
          (q) => q.subject === '不動産証券化の概要',
        ),
        dueCards: 0,
        newCards: 2,
      },
    ],
    totalQuestions: 2,
    completedQuestions: 0,
  },
  {
    id: 'real-estate-basics',
    name: '不動産投資の基礎',
    description: '不動産投資の基本的な考え方を学習',
    units: [
      {
        id: 'real-estate-basics-unit',
        name: '基礎',
        description: '不動産投資の基礎',
        subjectId: 'real-estate-basics',
        questions: dummyQuestions.filter((q) => q.subject === '不動産投資の基礎'),
        dueCards: 0,
        newCards: 2,
      },
    ],
    totalQuestions: 2,
    completedQuestions: 0,
  },
  {
    id: 'securitization-law',
    name: '不動産証券化の法務',
    description: '不動産証券化における法的枠組みを学習',
    units: [
      {
        id: 'securitization-law-unit',
        name: '基礎',
        description: '不動産証券化の法務',
        subjectId: 'securitization-law',
        questions: dummyQuestions.filter(
          (q) => q.subject === '不動産証券化の法務',
        ),
        dueCards: 0,
        newCards: 2,
      },
    ],
    totalQuestions: 2,
    completedQuestions: 0,
  },
  {
    id: 'securitization-tax',
    name: '不動産証券化の会計・税務',
    description: '不動産証券化の会計・税務処理を学習',
    units: [
      {
        id: 'securitization-tax-unit',
        name: '基礎',
        description: '不動産証券化の会計・税務',
        subjectId: 'securitization-tax',
        questions: dummyQuestions.filter(
          (q) => q.subject === '不動産証券化の会計・税務',
        ),
        dueCards: 0,
        newCards: 2,
      },
    ],
    totalQuestions: 2,
    completedQuestions: 0,
  },
  {
    id: 'real-estate-finance-basics',
    name: '不動産ファイナンスの基礎',
    description: '不動産ファイナンスの基礎的概念を学習',
    units: [
      {
        id: 'real-estate-finance-basics-unit',
        name: '基礎',
        description: '不動産ファイナンスの基礎',
        subjectId: 'real-estate-finance-basics',
        questions: dummyQuestions.filter(
          (q) => q.subject === '不動産ファイナンスの基礎',
        ),
        dueCards: 0,
        newCards: 2,
      },
    ],
    totalQuestions: 2,
    completedQuestions: 0,
  },
  {
    id: 'securitization-ethics',
    name: '不動産証券化と倫理行動',
    description: '不動産証券化における倫理と行動規範を学習',
    units: [
      {
        id: 'securitization-ethics-unit',
        name: '基礎',
        description: '不動産証券化と倫理行動',
        subjectId: 'securitization-ethics',
        questions: dummyQuestions.filter(
          (q) => q.subject === '不動産証券化と倫理行動',
        ),
        dueCards: 0,
        newCards: 2,
      },
    ],
    totalQuestions: 2,
    completedQuestions: 0,
  },
];

