import { Question, Subject } from '@/lib/types';

export const dummyQuestions: Question[] = [
  // 不動産投資の基礎
  {
    id: "q1",
    subject: "不動産投資の基礎",
    unit: "金融商品取引法",
    question: "株式は金融商品取引法で定める有価証券である。",
    choices: ["正しい", "誤り"],
    answer: 0,
    explanation: "株式は有価証券の一種であり、金融商品取引法で規定されている。",
    difficulty: "easy"
  },
  {
    id: "q2",
    subject: "不動産投資の基礎",
    unit: "金融商品取引法",
    question: "不動産投資信託（REIT）の投資口は有価証券に該当しない。",
    choices: ["正しい", "誤り"],
    answer: 1,
    explanation: "REITの投資口は金融商品取引法上の有価証券として扱われます。",
    difficulty: "medium"
  },
  {
    id: "q3",
    subject: "不動産投資の基礎",
    unit: "信託の仕組み",
    question: "不動産信託において、委託者が信託受益権を第三者に譲渡することは可能か？",
    choices: ["可能である", "不可能である", "受託者の同意が必要", "法的制限がある"],
    answer: 0,
    explanation: "信託受益権は原則として自由に譲渡可能です。ただし、信託契約で制限される場合があります。",
    difficulty: "medium"
  },
  {
    id: "q4",
    subject: "不動産投資の基礎",
    unit: "信託の仕組み",
    question: "信託財産は委託者の固有財産と分別管理される。",
    choices: ["正しい", "誤り"],
    answer: 0,
    explanation: "信託財産は委託者・受託者の固有財産とは分別して管理されることが信託法で定められています。",
    difficulty: "easy"
  },
  {
    id: "q5",
    subject: "不動産投資の基礎",
    unit: "TMK（特定目的会社）",
    question: "TMKが発行できる証券の種類として正しいものは？",
    choices: ["特定社債のみ", "優先出資証券のみ", "特定社債と優先出資証券", "普通株式"],
    answer: 2,
    explanation: "TMKは特定社債と優先出資証券の両方を発行することができます。",
    difficulty: "hard"
  },
  {
    id: "q6",
    subject: "不動産投資の基礎",
    unit: "TMK（特定目的会社）",
    question: "TMKの業務範囲は資産流動化法によって制限されている。",
    choices: ["正しい", "誤り"],
    answer: 0,
    explanation: "TMKは資産流動化法により、特定資産の流動化に関する業務に限定されています。",
    difficulty: "medium"
  },

  // 不動産ファイナンスの応用
  {
    id: "q7",
    subject: "不動産ファイナンスの応用",
    unit: "証券化の仕組み",
    question: "不動産証券化において、オリジネーターとは何を指すか？",
    choices: ["投資家", "不動産の原所有者", "証券会社", "信用格付機関"],
    answer: 1,
    explanation: "オリジネーターは証券化の対象となる不動産を最初に所有していた者を指します。",
    difficulty: "medium"
  },
  {
    id: "q8",
    subject: "不動産ファイナンスの応用",
    unit: "証券化の仕組み",
    question: "SPV（特別目的事業体）の主な目的は何か？",
    choices: ["投資収益の最大化", "倒産隔離の実現", "税務負担の軽減", "流動性の向上"],
    answer: 1,
    explanation: "SPVの主目的は倒産隔離により、オリジネーターの経営状況から投資家を保護することです。",
    difficulty: "hard"
  },
  {
    id: "q9",
    subject: "不動産ファイナンスの応用",
    unit: "リスク評価",
    question: "不動産投資におけるテナントリスクとは？",
    choices: ["金利変動リスク", "空室リスク", "自然災害リスク", "インフレリスク"],
    answer: 1,
    explanation: "テナントリスクは主に空室リスクや賃料不払いリスクなど、テナントに関連するリスクを指します。",
    difficulty: "easy"
  },
  {
    id: "q10",
    subject: "不動産ファイナンスの応用",
    unit: "リスク評価",
    question: "不動産の流動性リスクを軽減する方法として適切でないものは？",
    choices: ["小口化・証券化", "立地の分散", "保険の活用", "レバレッジの活用"],
    answer: 3,
    explanation: "レバレッジの活用は流動性リスクを軽減するのではなく、むしろリスクを増大させる可能性があります。",
    difficulty: "hard"
  },

  // 税務・会計
  {
    id: "q11",
    subject: "税務・会計",
    unit: "不動産所得税",
    question: "不動産所得の計算において、減価償却費は経費として計上できる。",
    choices: ["正しい", "誤り"],
    answer: 0,
    explanation: "減価償却費は不動産所得の計算上、必要経費として計上することができます。",
    difficulty: "easy"
  },
  {
    id: "q12",
    subject: "税務・会計",
    unit: "不動産所得税",
    question: "青色申告の承認を受けた場合の特別控除額は？",
    choices: ["35万円", "55万円", "65万円", "75万円"],
    answer: 2,
    explanation: "青色申告特別控除額は最大65万円です（電子申告等の要件を満たす場合）。",
    difficulty: "medium"
  },
  {
    id: "q13",
    subject: "税務・会計",
    unit: "法人税",
    question: "REITが一定の要件を満たす場合、配当等の額を損金算入できる。",
    choices: ["正しい", "誤り"],
    answer: 0,
    explanation: "REITは導管性要件を満たす場合、投資家への配当を損金算入でき、実質的に法人税が課されません。",
    difficulty: "medium"
  },
  {
    id: "q14",
    subject: "税務・会計",
    unit: "法人税",
    question: "TMKの特定資産からの収益の配当は損金算入される。",
    choices: ["正しい", "誤り"],
    answer: 0,
    explanation: "TMKは導管性の観点から、特定資産からの収益については配当を損金算入できます。",
    difficulty: "hard"
  },
  {
    id: "q15",
    subject: "税務・会計",
    unit: "消費税",
    question: "居住用賃貸住宅の家賃には消費税が課税される。",
    choices: ["正しい", "誤り"],
    answer: 1,
    explanation: "居住用賃貸住宅の家賃は消費税の非課税取引です。",
    difficulty: "easy"
  }
];

export const subjects: Subject[] = [
  {
    id: "real-estate-basics",
    name: "不動産投資の基礎",
    description: "不動産投資における基本的な法律・制度・仕組みを学習",
    units: [
      {
        id: "financial-instruments-law",
        name: "金融商品取引法",
        description: "有価証券の定義と規制について",
        subjectId: "real-estate-basics",
        questions: dummyQuestions.filter(q => q.unit === "金融商品取引法"),
        dueCards: 2,
        newCards: 0
      },
      {
        id: "trust-mechanism",
        name: "信託の仕組み",
        description: "不動産信託の基本構造と仕組み",
        subjectId: "real-estate-basics",
        questions: dummyQuestions.filter(q => q.unit === "信託の仕組み"),
        dueCards: 1,
        newCards: 1
      },
      {
        id: "tmk",
        name: "TMK（特定目的会社）",
        description: "資産流動化法に基づく特定目的会社",
        subjectId: "real-estate-basics",
        questions: dummyQuestions.filter(q => q.unit === "TMK（特定目的会社）"),
        dueCards: 0,
        newCards: 2
      }
    ],
    totalQuestions: 6,
    completedQuestions: 3
  },
  {
    id: "real-estate-finance-advanced",
    name: "不動産ファイナンスの応用",
    description: "証券化・リスク評価・金融工学の応用",
    units: [
      {
        id: "securitization",
        name: "証券化の仕組み",
        description: "不動産証券化の構造とプレーヤー",
        subjectId: "real-estate-finance-advanced",
        questions: dummyQuestions.filter(q => q.unit === "証券化の仕組み"),
        dueCards: 1,
        newCards: 1
      },
      {
        id: "risk-evaluation",
        name: "リスク評価",
        description: "不動産投資におけるリスクの種類と評価",
        subjectId: "real-estate-finance-advanced",
        questions: dummyQuestions.filter(q => q.unit === "リスク評価"),
        dueCards: 2,
        newCards: 0
      }
    ],
    totalQuestions: 4,
    completedQuestions: 1
  },
  {
    id: "tax-accounting",
    name: "税務・会計",
    description: "不動産投資における税務・会計処理",
    units: [
      {
        id: "real-estate-income-tax",
        name: "不動産所得税",
        description: "個人の不動産所得に関する税務",
        subjectId: "tax-accounting",
        questions: dummyQuestions.filter(q => q.unit === "不動産所得税"),
        dueCards: 0,
        newCards: 2
      },
      {
        id: "corporate-tax",
        name: "法人税",
        description: "不動産投資法人の税務処理",
        subjectId: "tax-accounting",
        questions: dummyQuestions.filter(q => q.unit === "法人税"),
        dueCards: 1,
        newCards: 1
      },
      {
        id: "consumption-tax",
        name: "消費税",
        description: "不動産取引における消費税",
        subjectId: "tax-accounting",
        questions: dummyQuestions.filter(q => q.unit === "消費税"),
        dueCards: 0,
        newCards: 1
      }
    ],
    totalQuestions: 5,
    completedQuestions: 2
  }
];