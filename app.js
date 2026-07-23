const storageKey = "nsca-cpt-review-state-v1";
const dailyGoalQuestions = 150;
const levelXp = 120;
const questionMilestones = [
  { count: 25, xp: 20, label: "热身完成" },
  { count: 50, xp: 35, label: "进入节奏" },
  { count: 100, xp: 60, label: "冲刺阶段" },
  { count: 150, xp: 120, label: "今日打卡完成" },
];

const unitExamGuides = {
  "exercise_science": {
    "mustKnow": [
      "平面口诀：屈伸=矢状面；外展/内收=额状面；旋转=水平面。",
      "肌肉题先看动作方向，再判断主动肌、协同肌、拮抗肌。",
      "供能系统看时间：短爆发 ATP-PC，几十秒糖酵解，长时间有氧。",
      "异常健康风险和进食障碍：不要诊断，及时转介。"
    ],
    "examAngles": [
      "给动作阶段，问平面、关节动作或主要肌肉。",
      "给项目时长，问主导供能系统。",
      "给生理现象，问神经、心肺、激素或代谢概念。"
    ],
    "traps": [
      "“神经性贪食症”考进食障碍，不是神经肌肉。",
      "不要用“上升=向心”硬套；看目标肌肉是在缩短还是变长。"
    ],
    "images": [
      "./assets/diagrams/anatomical-planes.svg",
      "./assets/diagrams/energy-systems.svg",
      "./assets/diagrams/muscle-anterior.svg",
      "./assets/diagrams/muscle-posterior.svg"
    ]
  },
  "assessment": {
    "mustKnow": [
      "咨询先筛风险，再做测试，不是先上强度。",
      "可靠性=结果稳；效度=测得准；客观性=不同测试者结果一致。",
      "测试顺序：安静指标和低疲劳先做，高疲劳测试放最后。",
      "1RM 只适合技术稳定、风险可控的客户。"
    ],
    "examAngles": [
      "问某测试测什么能力。",
      "问测试结果为什么不可靠。",
      "问客户目标对应哪个测试。"
    ],
    "traps": [
      "同一个测试前后条件变了，可靠性就会下降。",
      "柔韧性、敏捷、功率、有氧能力不要混为一谈。"
    ],
    "images": [
      "./assets/diagrams/assessment-flow.svg",
      "./assets/diagrams/body-composition.svg"
    ]
  },
  "technique_safety": {
    "mustKnow": [
      "卧推五点接触：头、肩背、臀、左脚、右脚。",
      "深蹲/硬拉：杠铃越远离身体，腰背力矩越大。",
      "保护员负责安全，不替运动员发力。",
      "动态拉伸用于热身；静态拉伸和 PNF 更偏柔韧性。"
    ],
    "examAngles": [
      "问动作错误该怎么纠正。",
      "问哪些动作需要保护。",
      "问握法、呼吸、拉伸方式和器械使用。"
    ],
    "traps": [
      "“早安式”是髋铰链动作，不是问候语。",
      "钩握不是普通正握；拇指压在食指和中指下。"
    ],
    "images": [
      "./assets/diagrams/bench-five-points.svg",
      "./assets/diagrams/pnf-stretch.svg",
      "./assets/diagrams/spotting-map.svg"
    ]
  },
  "program_design": {
    "mustKnow": [
      "目标决定变量：力量、肌肥大、肌耐力、功率的安排不同。",
      "大动作和爆发力动作通常放前面。",
      "强度越高，次数越少，休息越长。",
      "增强式训练靠牵张-缩短周期：离心、转换、向心。"
    ],
    "examAngles": [
      "给目标，选负荷、次数、组数、休息。",
      "给动作列表，排训练顺序。",
      "问周期化、超负荷和恢复安排。"
    ],
    "traps": [
      "功率训练不是只加重量；速度和质量很重要。",
      "辅助动作不应该抢在主要大动作前消耗太多体力。"
    ],
    "images": [
      "./assets/diagrams/program-variables.svg",
      "./assets/diagrams/plyometric-cycle.svg"
    ]
  },
  "nutrition": {
    "mustKnow": [
      "热量：碳水 4，蛋白质 4，脂肪 9 kcal/g。",
      "碳水支持高强度训练；蛋白质支持修复和合成。",
      "补液看出汗、环境、体重变化和训练强度。",
      "饮食处方、进食障碍、疾病营养：转介营养专业人员。"
    ],
    "examAngles": [
      "算宏量营养素热量和比例。",
      "问私人教练能不能给某种营养建议。",
      "识别脱水、补液和进食障碍风险。"
    ],
    "traps": [
      "“少吃一点”不是专业减重方案。",
      "口渴感不够可靠，不能单独判断补液需求。"
    ],
    "images": [
      "./assets/diagrams/nutrition-macros.svg",
      "./assets/diagrams/hydration-warning.svg"
    ]
  },
  "facility_management": {
    "mustKnow": [
      "政策=规则；程序=执行步骤。",
      "风险管理=预防、记录、应急、培训。",
      "器械布局要留通道，减少碰撞和绊倒。",
      "急救计划要写清人员、设备、电话和路线。"
    ],
    "examAngles": [
      "问场馆谁能用、什么时候能用、如何管理。",
      "问事故后记录和责任。",
      "问应急流程和安全布局。"
    ],
    "traps": [
      "有规则不等于有执行程序。",
      "私人教练不能诊断、治疗或开医疗处方。"
    ],
    "images": [
      "./assets/diagrams/facility-layout.svg",
      "./assets/diagrams/facility-safety.svg"
    ]
  },
  "practical_video": {
    "mustKnow": [
      "先看动作阶段，再看关节方向。",
      "判断肌肉时看谁完成主要动作，谁负责稳定。",
      "看握法、站姿、脊柱位置和膝盖方向。",
      "视频题不要只看器械名，要看实际动作。"
    ],
    "examAngles": [
      "根据画面判断主动肌或拮抗肌。",
      "判断动作错误和纠正方法。",
      "判断保护员手位和安全风险。"
    ],
    "traps": [
      "膝内扣常提示下肢控制问题。",
      "耸肩、塌腰、杠铃离身体远，都是常见错误。"
    ],
    "images": [
      "./assets/diagrams/video-checklist.svg",
      "./assets/diagrams/muscle-anterior.svg",
      "./assets/diagrams/muscle-posterior.svg"
    ]
  }
};

const unitGuideImageMeta = {
  "./assets/diagrams/anatomical-planes.svg": ["解剖平面", "用来判断屈伸、外展内收、旋转和水平面动作。"],
  "./assets/diagrams/biomechanics-torque.svg": ["力臂与力矩", "用来理解外部阻力线、关节轴、阻力臂和动作难点。"],
  "./assets/diagrams/assessment-quality.svg": ["测试质量", "区分有效性、可靠性、客观性和特异性。"],
  "./assets/diagrams/energy-systems.svg": ["供能系统", "按运动强度和持续时间判断ATP-PC、糖酵解和有氧氧化。"],
  "./assets/diagrams/facility-safety.svg": ["场馆安全", "把风险筛查、监督、设备环境和应急计划连起来记。"],
  "./assets/diagrams/muscle-anterior.svg": ["前视肌群解剖图", "中文标注前视解剖图，辅助定位胸大肌、腹直肌、髂腰肌、股四头肌、胫骨前肌等。来源：OpenStax Anatomy and Physiology 原图，GnolizX 中文派生，CC BY 4.0。"],
  "./assets/diagrams/muscle-posterior.svg": ["后视肌群解剖图", "中文标注后视解剖图，辅助定位斜方肌、背阔肌、臀大肌、腘绳肌、腓肠肌等。来源：OpenStax Anatomy and Physiology 原图，GnolizX 中文派生，CC BY 4.0。"],
  "./assets/diagrams/nutrition-basics.svg": ["营养功能", "快速区分碳水、蛋白质、脂肪、水电解质和微量营养素。"],
  "./assets/diagrams/skeleton-upper-body.svg": ["骨骼定位速查", "中文标注骨骼图，辅助定位颅骨、脊柱、锁骨、肩胛骨、胸骨、肋骨、骨盆、肱骨、尺桡骨等。来源：Wikimedia Commons / LadyofHats，GnolizX 中文翻译，Public domain。"],
  "./assets/diagrams/training-variables.svg": ["训练变量", "区分强度值、volume-load和repetition-volume。"]
};

const unitDeepGuides = {
  "exercise_science": {
    "images": [
      "./assets/diagrams/anatomical-planes.svg",
      "./assets/diagrams/biomechanics-torque.svg",
      "./assets/diagrams/energy-systems.svg",
      "./assets/diagrams/muscle-anterior.svg",
      "./assets/diagrams/muscle-posterior.svg"
    ],
    "subunits": [
      {
        "title": "运动平面",
        "points": [
          "屈曲/伸展：矢状面。",
          "外展/内收/侧屈：额状面。",
          "旋转/水平动作：水平面。",
          "先看关节动作，再选平面。"
        ]
      },
      {
        "title": "肌肉角色",
        "points": [
          {
            "text": "主动肌：完成主要动作。",
            "images": ["./assets/diagrams/muscle-anterior.svg", "./assets/diagrams/muscle-posterior.svg"]
          },
          "协同肌：帮主动肌一起发力。",
          {
            "text": "拮抗肌：做相反动作，常用来控制动作速度。",
            "images": ["./assets/diagrams/muscle-anterior.svg", "./assets/diagrams/muscle-posterior.svg"]
          },
          "稳定肌：固定姿势或关节。"
        ]
      },
      {
        "title": "肌肉解剖速查",
        "points": [
          {
            "text": "前侧肌群：胸大肌、三角肌前束、肱二头肌、腹直肌、股四头肌。",
            "images": ["./assets/diagrams/muscle-anterior.svg"]
          },
          {
            "text": "后侧肌群：斜方肌、背阔肌、竖脊肌、臀大肌、腘绳肌、腓肠肌。",
            "images": ["./assets/diagrams/muscle-posterior.svg"]
          },
          "记肌肉不要背一堆名字，先记它跨过哪个关节、能把关节拉向哪里。"
        ]
      },
      {
        "title": "收缩类型",
        "points": [
          "向心：目标肌缩短，通常是克服阻力的阶段。",
          "离心：目标肌被拉长，但仍在用力控制阻力。",
          "等长：关节角度不变，肌肉长度基本不变。",
          "不要用“上升/下降”硬背；永远看目标肌是在缩短、拉长，还是不变。"
        ]
      },
      {
        "title": "拮抗肌判断",
        "points": [
          "先找本题问的动作：屈、伸、外展、内收或旋转。",
          "主动肌让动作发生；拮抗肌做相反动作。",
          "肘屈曲：肱二头肌主动，肱三头肌拮抗。",
          "膝伸展：股四头肌主动，腘绳肌拮抗。"
        ]
      },
      {
        "title": "供能系统",
        "points": [
          "ATP-PC：0-10 秒爆发。",
          "糖酵解：高强度几十秒。",
          "有氧氧化：持续时间长。",
          "时间和强度是判断关键。"
        ]
      },
      {
        "title": "力臂力矩",
        "points": [
          "力矩=让关节转动的力。",
          "阻力线离关节越远，力矩越大。",
          "侧平举到水平位最难。",
          "负重离身体远，腰髋压力大。"
        ]
      }
    ]
  },
  "assessment": {
    "images": [
      "./assets/diagrams/assessment-flow.svg",
      "./assets/diagrams/body-composition.svg"
    ],
    "subunits": [
      {
        "title": "咨询顺序",
        "points": [
          "先问目标。",
          "再筛健康风险。",
          "确认运动史和限制。",
          "有红旗症状就转介。"
        ]
      },
      {
        "title": "测试质量",
        "points": [
          "可靠性：结果稳定。",
          "效度：测得准。",
          "客观性：换人测也一致。",
          "特异性：贴近目标能力。"
        ]
      },
      {
        "title": "测试顺序",
        "points": [
          "安静指标先做。",
          "低疲劳测试靠前。",
          "力量/功率放中间。",
          "有氧等高疲劳放最后。"
        ]
      },
      {
        "title": "常考测试",
        "points": [
          "纵跳：下肢功率。",
          "T 测试：敏捷变向。",
          "坐位体前屈：柔韧性。",
          "1RM：最大力量。"
        ]
      }
    ]
  },
  "technique_safety": {
    "images": [
      "./assets/diagrams/bench-five-points.svg",
      "./assets/diagrams/pnf-stretch.svg",
      "./assets/diagrams/spotting-map.svg"
    ],
    "subunits": [
      {
        "title": "卧推安全",
        "points": [
          "五点接触：头、肩背、臀、双脚。",
          "肩胛稳定。",
          "下放可控。",
          "保护员看杠铃和手腕。"
        ]
      },
      {
        "title": "髋铰链",
        "points": [
          "髋向后折。",
          "脊柱保持中立。",
          "负重贴近身体。",
          "主要用臀大肌、腘绳肌、竖脊肌。"
        ]
      },
      {
        "title": "拉伸方式",
        "points": [
          "动态：热身。",
          "静态：保持末端位置。",
          "PNF：拉伸加收缩。",
          "弹震：风险更高。"
        ]
      },
      {
        "title": "动作阶段",
        "points": [
          "向心：目标肌缩短，动作在克服阻力。",
          "离心：目标肌变长，动作在控制阻力。",
          "等长：姿势停住，关节角度基本不变。",
          "例：深蹲下蹲时股四头肌离心，站起时股四头肌向心。"
        ]
      },
      {
        "title": "握法",
        "points": [
          "正握：手掌向下/向后。",
          "反握：手掌向上/向前。",
          "正反握：常用于大重量硬拉。",
          "钩握：拇指压在食指和中指下。"
        ]
      }
    ]
  },
  "program_design": {
    "images": [
      "./assets/diagrams/program-variables.svg",
      "./assets/diagrams/plyometric-cycle.svg"
    ],
    "subunits": [
      {
        "title": "目标变量",
        "points": [
          "力量：重、少、休息长。",
          "肌肥大：训练量足。",
          "肌耐力：轻、中重量，高次数。",
          "功率：速度优先。"
        ]
      },
      {
        "title": "动作顺序",
        "points": [
          "爆发力动作先做。",
          "多关节大动作靠前。",
          "辅助动作靠后。",
          "技术难的动作不要放疲劳后。"
        ]
      },
      {
        "title": "增强式",
        "points": [
          "先离心预拉长。",
          "转换期越短越好。",
          "向心阶段快速发力。",
          "质量下降就该停止。"
        ]
      },
      {
        "title": "周期化",
        "points": [
          "宏周期：大目标。",
          "中周期：阶段目标。",
          "微周期：通常一周。",
          "目的：安排压力和恢复。"
        ]
      }
    ]
  },
  "nutrition": {
    "images": [
      "./assets/diagrams/nutrition-macros.svg",
      "./assets/diagrams/hydration-warning.svg"
    ],
    "subunits": [
      {
        "title": "热量计算",
        "points": [
          "碳水：4 kcal/g。",
          "蛋白质：4 kcal/g。",
          "脂肪：9 kcal/g。",
          "比例=该营养素热量/总热量。"
        ]
      },
      {
        "title": "补液",
        "points": [
          "口渴感不够可靠。",
          "看体重变化。",
          "看温度和湿度。",
          "看训练时长和强度。"
        ]
      },
      {
        "title": "营养职责",
        "points": [
          "可以讲一般营养知识。",
          "不能开治疗饮食处方。",
          "进食障碍要转介。",
          "补剂先看安全、合法、证据。"
        ]
      },
      {
        "title": "高频风险",
        "points": [
          "低能量摄入会影响恢复。",
          "铁不足会影响耐力。",
          "脱水会影响体温调节。",
          "极端减重不适合运动表现。"
        ]
      }
    ]
  },
  "facility_management": {
    "images": [
      "./assets/diagrams/facility-layout.svg",
      "./assets/diagrams/facility-safety.svg"
    ],
    "subunits": [
      {
        "title": "政策程序",
        "points": [
          "政策：规则。",
          "程序：执行步骤。",
          "规则要能落地。",
          "记录要留痕。"
        ]
      },
      {
        "title": "场馆布局",
        "points": [
          "阻力器械至少间隔 61 cm，最好 91 cm。",
          "主要走道至少 91 cm，能让轮椅通过。",
          "循环训练走道约 1.2-2.1 m。",
          "架子/平台之间约 0.9-1.2 m。"
        ]
      },
      {
        "title": "安全缓冲区",
        "points": [
          "自由重量区避免无关人员穿行。",
          "落杠区和行走区要分开。",
          "地面、线缆、垫子不能制造绊倒风险。",
          "器械之间留空间，是为了监督、进出和紧急处理。"
        ]
      },
      {
        "title": "应急计划",
        "points": [
          "谁负责。",
          "设备在哪里。",
          "电话打给谁。",
          "救援路线怎么走。"
        ]
      },
      {
        "title": "职责边界",
        "points": [
          "不诊断。",
          "不治疗。",
          "不开医疗处方。",
          "发现风险要转介。"
        ]
      }
    ]
  },
  "practical_video": {
    "images": [
      "./assets/diagrams/video-checklist.svg",
      "./assets/diagrams/muscle-anterior.svg",
      "./assets/diagrams/muscle-posterior.svg"
    ],
    "subunits": [
      {
        "title": "看视频顺序",
        "points": [
          "先看动作阶段。",
          "再看关节方向。",
          "再看主要肌肉。",
          "最后看错误和风险。"
        ]
      },
      {
        "title": "常见错误",
        "points": [
          "膝内扣。",
          "耸肩。",
          "塌腰。",
          "杠铃离身体太远。"
        ]
      },
      {
        "title": "常见肌群",
        "points": [
          "推：胸大肌、三角肌前束、肱三头肌。",
          "拉：背阔肌、斜方肌、菱形肌。",
          "蹲：股四头肌、臀大肌。",
          "髋铰链：臀大肌、腘绳肌、竖脊肌。"
        ]
      },
      {
        "title": "保护判断",
        "points": [
          "看动作风险。",
          "看是否过头或大重量。",
          "看失败时能否安全脱离。",
          "保护员不要挡住动作路径。"
        ]
      }
    ]
  }
};

const unitGuideAddenda = {};

const state = {
  syllabus: [],
  questions: [],
  materials: [],
  activeUnit: "all",
  mode: "sequential",
  view: "quiz",
  queue: [],
  index: 0,
  answeredChoice: null,
  progress: {
    attempts: {},
    wrong: {},
    game: {},
  },
};

const els = {
  totalQuestions: document.querySelector("#totalQuestions"),
  wrongCount: document.querySelector("#wrongCount"),
  accuracy: document.querySelector("#accuracy"),
  levelBadge: document.querySelector("#levelBadge"),
  totalXp: document.querySelector("#totalXp"),
  streakText: document.querySelector("#streakText"),
  dailyGoalText: document.querySelector("#dailyGoalText"),
  dailyGoalFill: document.querySelector("#dailyGoalFill"),
  comboText: document.querySelector("#comboText"),
  bestComboText: document.querySelector("#bestComboText"),
  unitNav: document.querySelector("#unitNav"),
  unitSelect: document.querySelector("#unitSelect"),
  modeSelect: document.querySelector("#modeSelect"),
  questionUnit: document.querySelector("#questionUnit"),
  questionProgress: document.querySelector("#questionProgress"),
  instantFeedback: document.querySelector("#instantFeedback"),
  rewardToast: document.querySelector("#rewardToast"),
  questionText: document.querySelector("#questionText"),
  questionImage: document.querySelector("#questionImage"),
  choiceList: document.querySelector("#choiceList"),
  resultPanel: document.querySelector("#resultPanel"),
  prevBtn: document.querySelector("#prevBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  focusTitle: document.querySelector("#focusTitle"),
  focusPoints: document.querySelector("#focusPoints"),
  notesGrid: document.querySelector("#notesGrid"),
  wrongList: document.querySelector("#wrongList"),
  bankList: document.querySelector("#bankList"),
  materialsList: document.querySelector("#materialsList"),
  searchInput: document.querySelector("#searchInput"),
  cloudSyncBtn: document.querySelector("#cloudSyncBtn"),
  resetProgressBtn: document.querySelector("#resetProgressBtn"),
  reviewWrongBtn: document.querySelector("#reviewWrongBtn"),
};

let lastImageZoomTrigger = null;

function escapeAttribute(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}

function buildQuestionSearchPrompt(question, selectedChoice) {
  const choices = Object.entries(question.choices)
    .map(([label, text]) => `${label}. ${text}`)
    .join("\n");
  return [
    "我正在复习 NSCA-CPT。请用自然、直接的中文帮我理解这道题。",
    "",
    `题目：${question.question}`,
    choices,
    selectedChoice ? `我选择了：${selectedChoice}. ${question.choices[selectedChoice]}` : "",
    `正确答案：${question.answer}. ${question.choices[question.answer]}`,
    "",
    "请重点回答：",
    "1. 为什么正确答案是对的？",
    "2. 为什么我选择的答案不对？",
    "3. 两个选项最关键的区别是什么？",
    "4. 下次遇到类似题，我应该抓住哪个关键词或判断步骤？",
    "请控制长度，不要使用生硬的英文直译。",
  ].filter(Boolean).join("\n");
}

const DIFY_COACH_URL_KEY = "nsca-cpt:dify-coach-url";

function getDifyCoachUrl() {
  try {
    return localStorage.getItem(DIFY_COACH_URL_KEY) || "";
  } catch {
    return "";
  }
}

function configureDifyCoach() {
  const currentUrl = getDifyCoachUrl();
  const value = window.prompt(
    "粘贴 Dify 已发布的 Web App 地址。留空可取消连接。",
    currentUrl,
  );
  if (value === null) return;

  const trimmed = value.trim();
  if (!trimmed) {
    localStorage.removeItem(DIFY_COACH_URL_KEY);
  } else {
    try {
      const url = new URL(trimmed);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      localStorage.setItem(DIFY_COACH_URL_KEY, url.toString());
    } catch {
      window.alert("请输入以 http:// 或 https:// 开头的 Dify Web App 地址。");
      return;
    }
  }

  if (state.answeredChoice) renderAnswer(state.answeredChoice);
}

function renderAnswerSearchTools(question, selectedChoice) {
  const prompt = buildQuestionSearchPrompt(question, selectedChoice);
  const kimiWebUrl = "https://www.kimi.com/?chat_enter_method=new_chat";
  const geminiWebUrl = "https://gemini.google.com/";
  const geminiAndroidIntent = `intent://gemini.google.com/#Intent;scheme=https;package=com.google.android.apps.bard;S.browser_fallback_url=${encodeURIComponent(geminiWebUrl)};end`;
  const difyCoachUrl = getDifyCoachUrl();
  const primaryAction = difyCoachUrl
    ? `<a class="ai-primary-button" href="${escapeAttribute(difyCoachUrl)}" target="_blank" rel="noopener noreferrer" data-copy-prompt="${escapeAttribute(prompt)}">复制并打开 AI 教练</a>`
    : `<a class="ai-primary-button" href="${kimiWebUrl}" target="_blank" rel="noopener noreferrer" data-copy-prompt="${escapeAttribute(prompt)}">复制并打开 Kimi K3</a>`;
  return `
    <section class="answer-search-panel" aria-label="用 AI 继续追问">
      <div>
        <strong>需要更详细的解释？</strong>
        <span>${difyCoachUrl ? "AI 教练会结合 NSCA 知识库回答。" : "提示词已包含正确答案和你的选择。"}</span>
      </div>
      <div class="answer-search-actions">
        ${primaryAction}
        <details class="ai-provider-menu">
          <summary aria-label="选择其他 AI">其他 AI</summary>
          <div>
            ${difyCoachUrl
              ? `<button type="button" data-configure-dify>更换 Dify 地址</button>
                 <a href="${kimiWebUrl}" target="_blank" rel="noopener noreferrer" data-copy-prompt="${escapeAttribute(prompt)}">Kimi K3</a>
                 <a href="${geminiAndroidIntent}" data-copy-prompt="${escapeAttribute(prompt)}">Gemini</a>`
              : `<button type="button" data-configure-dify>连接 Dify AI 教练</button>
                 <a href="${geminiAndroidIntent}" data-copy-prompt="${escapeAttribute(prompt)}">Gemini</a>`}
            <a href="https://chat.deepseek.com/" target="_blank" rel="noopener noreferrer" data-copy-prompt="${escapeAttribute(prompt)}">DeepSeek</a>
            <a href="https://www.doubao.com/chat/" target="_blank" rel="noopener noreferrer" data-copy-prompt="${escapeAttribute(prompt)}">豆包</a>
            <button type="button" data-copy-prompt="${escapeAttribute(prompt)}">仅复制提示词</button>
          </div>
        </details>
      </div>
    </section>
  `;
}

async function copyPromptAndOpen(button) {
  const promptText = button.dataset.copyPrompt || "";
  try {
    await navigator.clipboard.writeText(promptText);
    if (button.tagName === "BUTTON") button.textContent = "已复制";
  } catch (error) {
    window.prompt("复制下面这段内容到 AI：", promptText);
  }
}

function renderZoomableImage({ src, title, caption = "", alt = title || "辅助理解图" }) {
  const label = title || alt || "辅助理解图";
  return `
    <button
      class="image-zoom-button"
      type="button"
      aria-label="放大查看：${escapeAttribute(label)}"
      data-zoom-src="${escapeAttribute(src)}"
      data-zoom-title="${escapeAttribute(label)}"
      data-zoom-caption="${escapeAttribute(caption)}"
      data-zoom-alt="${escapeAttribute(alt)}"
    >
      <img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" />
      <span class="image-zoom-hint" aria-hidden="true">点击放大</span>
    </button>
  `;
}

function ensureImageZoomModal() {
  let modal = document.querySelector("#imageZoomModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "imageZoomModal";
  modal.className = "image-zoom-modal hidden";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "imageZoomTitle");
  modal.innerHTML = `
    <div class="image-zoom-dialog" role="document">
      <div class="image-zoom-header">
        <h2 id="imageZoomTitle"></h2>
        <button class="image-zoom-close" type="button" aria-label="关闭图片放大视图" data-zoom-close>×</button>
      </div>
      <div class="image-zoom-canvas">
        <img id="imageZoomImg" alt="" />
      </div>
      <p id="imageZoomCaption" class="image-zoom-caption"></p>
    </div>
  `;
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-zoom-close]")) closeImageZoom();
  });
  document.body.appendChild(modal);
  return modal;
}

function openImageZoom({ src, title, caption, alt }, trigger) {
  const modal = ensureImageZoomModal();
  lastImageZoomTrigger = trigger;
  modal.querySelector("#imageZoomTitle").textContent = title || alt || "辅助理解图";
  modal.querySelector("#imageZoomCaption").textContent = caption || "放大查看这张图，配合对应考点理解。";
  const image = modal.querySelector("#imageZoomImg");
  image.src = src;
  image.alt = alt || title || "辅助理解图";
  modal.classList.remove("hidden");
  document.body.classList.add("image-zoom-open");
  modal.querySelector("[data-zoom-close]").focus();
}

function closeImageZoom() {
  const modal = document.querySelector("#imageZoomModal");
  if (!modal || modal.classList.contains("hidden")) return;
  modal.classList.add("hidden");
  document.body.classList.remove("image-zoom-open");
  modal.querySelector("#imageZoomImg").removeAttribute("src");
  lastImageZoomTrigger?.focus();
  lastImageZoomTrigger = null;
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function previousDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  const prevMonth = String(date.getMonth() + 1).padStart(2, "0");
  const prevDay = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${prevMonth}-${prevDay}`;
}

function ensureProgressShape() {
  state.progress ||= {};
  state.progress.attempts ||= {};
  state.progress.wrong ||= {};
  state.progress.game ||= {};
  state.progress.game.totalXp ||= 0;
  state.progress.game.streak ||= 0;
  state.progress.game.bestCombo ||= 0;
  state.progress.game.currentCombo ||= 0;
  state.progress.game.daily ||= {};

  const today = todayKey();
  state.progress.game.daily[today] ||= { xp: 0, answered: 0, correct: 0, goalAwarded: false };
  state.progress.game.daily[today].milestones ||= [];
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      state.progress = JSON.parse(raw);
    }
  } catch {
    state.progress = { attempts: {}, wrong: {}, game: {} };
  }
  ensureProgressShape();
}

function saveProgress() {
  state.progress._updatedAt = new Date().toISOString();
  localStorage.setItem(storageKey, JSON.stringify(state.progress));
  window.NSCACloudSync?.queueSave(state.progress);
}

function updateCloudStatus({ value, message }) {
  if (!els.cloudSyncBtn) return;
  const labels = {
    unconfigured: "云同步",
    "signed-out": "云同步",
    syncing: "同步中",
    "email-sent": "检查邮箱",
    synced: "已同步",
    error: "同步失败",
  };
  els.cloudSyncBtn.textContent = labels[value] || "云同步";
  els.cloudSyncBtn.dataset.status = value;
  els.cloudSyncBtn.title = message || "跨设备同步学习进度";
}

async function handleCloudSync() {
  const cloud = window.NSCACloudSync;
  if (!cloud?.isConfigured()) {
    window.alert("云同步尚未连接数据库。完成 Supabase 配置后即可在手机、平板和电脑之间同步进度。");
    return;
  }

  if (cloud.isSignedIn()) {
    const synced = await cloud.syncNow();
    if (!synced) window.alert("同步失败，请检查网络后重试。");
    return;
  }

  const email = window.prompt("输入你的邮箱。Supabase 会发送一次性登录链接：");
  if (!email) return;
  try {
    await cloud.sendMagicLink(email.trim());
    window.alert("登录链接已发送。请在这台设备上打开邮件中的链接，之后会自动同步。");
  } catch (error) {
    window.alert(`登录邮件发送失败：${error.message}`);
  }
}

async function startCloudSync() {
  const cloud = window.NSCACloudSync;
  if (!cloud) return;
  await cloud.init({
    getProgress: () => state.progress,
    setProgress: (progress) => {
      state.progress = progress;
      ensureProgressShape();
      localStorage.setItem(storageKey, JSON.stringify(state.progress));
      buildQueue();
      renderAll();
    },
    onStatus: updateCloudStatus,
  });
}

async function loadData() {
  if (window.NSCA_APP_DATA) {
    state.syllabus = window.NSCA_APP_DATA.syllabus;
    state.questions = window.NSCA_APP_DATA.questions;
    state.materials = window.NSCA_APP_DATA.materials;
    return;
  }

  try {
    const [syllabus, questions, materials] = await Promise.all([
      fetch("./data/syllabus.json").then((res) => res.json()),
      fetch("./data/questions.json").then((res) => res.json()),
      fetch("./data/materials.json").then((res) => res.json()),
    ]);
    state.syllabus = syllabus;
    state.questions = questions;
    state.materials = materials;
  } catch (error) {
    await loadEmbeddedData();
    if (!window.NSCA_APP_DATA) throw error;
    state.syllabus = window.NSCA_APP_DATA.syllabus;
    state.questions = window.NSCA_APP_DATA.questions;
    state.materials = window.NSCA_APP_DATA.materials;
  }
}

function loadEmbeddedData() {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-embedded-data="true"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "./data.js";
    script.dataset.embeddedData = "true";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function unitTitle(unitId) {
  if (unitId === "all") return "全部单元";
  return state.syllabus.find((unit) => unit.id === unitId)?.title || unitId;
}

function questionsForUnit(unitId) {
  if (unitId === "all") return state.questions;
  return state.questions.filter((question) => question.unit === unitId);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQueue(keepQuestionId = null) {
  let base = questionsForUnit(state.activeUnit);

  if (state.mode === "curated") {
    base = base.filter((question) => question.type === "curated");
  }

  if (state.mode === "wrong") {
    const wrongIds = new Set(Object.keys(state.progress.wrong));
    base = base.filter((question) => wrongIds.has(question.id));
  }

  state.queue = state.mode === "random" ? shuffle(base) : [...base];
  state.index = 0;
  if (keepQuestionId) {
    const nextIndex = state.queue.findIndex((question) => question.id === keepQuestionId);
    state.index = nextIndex >= 0 ? nextIndex : 0;
  }
  state.answeredChoice = null;
}

function currentQuestion() {
  return state.queue[state.index] || null;
}

function renderGameStats() {
  ensureProgressShape();
  const game = state.progress.game;
  const today = todayKey();
  const todayProgress = game.daily[today] || { xp: 0, answered: 0, correct: 0 };
  const level = Math.floor(game.totalXp / levelXp) + 1;
  const progress = Math.min(100, Math.round((todayProgress.answered / dailyGoalQuestions) * 100));

  els.levelBadge.textContent = `Lv.${level}`;
  els.totalXp.textContent = `${game.totalXp} XP`;
  els.streakText.textContent = `连续 ${game.streak || 0} 天`;
  els.dailyGoalText.textContent = `${Math.min(todayProgress.answered, dailyGoalQuestions)} / ${dailyGoalQuestions} 题`;
  els.dailyGoalFill.style.width = `${progress}%`;
  els.comboText.textContent = `连答 ${game.currentCombo || 0}`;
  els.bestComboText.textContent = `最佳 ${game.bestCombo || 0}`;
}

function updateStats() {
  const attempts = Object.values(state.progress.attempts);
  const totalAttempts = attempts.reduce((sum, item) => sum + (item.count || 0), 0);
  const correctAttempts = attempts.reduce((sum, item) => sum + (item.correct || 0), 0);
  const accuracy = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  els.totalQuestions.textContent = state.questions.length.toString();
  els.wrongCount.textContent = Object.keys(state.progress.wrong).length.toString();
  els.accuracy.textContent = `${accuracy}%`;
  renderGameStats();
}

function recordGameProgress(correct) {
  ensureProgressShape();
  const game = state.progress.game;
  const today = todayKey();
  const yesterday = previousDateKey(today);
  const todayProgress = game.daily[today];

  if (game.lastStudyDate !== today) {
    game.streak = game.lastStudyDate === yesterday ? (game.streak || 0) + 1 : 1;
    game.lastStudyDate = today;
  }

  game.currentCombo = correct ? (game.currentCombo || 0) + 1 : 0;
  game.bestCombo = Math.max(game.bestCombo || 0, game.currentCombo || 0);

  const baseXp = correct ? 10 : 3;
  const comboBonus = correct && game.currentCombo >= 3 ? Math.min(10, Math.floor(game.currentCombo / 3) * 2) : 0;
  let milestoneBonus = 0;
  let milestoneLabel = "";

  todayProgress.answered += 1;
  todayProgress.correct += correct ? 1 : 0;
  todayProgress.xp += baseXp + comboBonus;
  todayProgress.milestones ||= [];

  const reachedMilestone = questionMilestones.find(
    (milestone) => todayProgress.answered >= milestone.count && !todayProgress.milestones.includes(milestone.count),
  );
  if (reachedMilestone) {
    milestoneBonus = reachedMilestone.xp;
    milestoneLabel = reachedMilestone.label;
    todayProgress.milestones.push(reachedMilestone.count);
    todayProgress.xp += milestoneBonus;
    if (reachedMilestone.count === dailyGoalQuestions) todayProgress.goalAwarded = true;
  }

  const earnedXp = baseXp + comboBonus + milestoneBonus;
  game.totalXp += earnedXp;

  return {
    earnedXp,
    baseXp,
    comboBonus,
    milestoneBonus,
    milestoneLabel,
    combo: game.currentCombo,
    dailyXp: todayProgress.xp,
    dailyAnswered: todayProgress.answered,
    remainingQuestions: Math.max(0, dailyGoalQuestions - todayProgress.answered),
    goalReached: todayProgress.answered >= dailyGoalQuestions && milestoneLabel === "今日打卡完成",
  };
}

function renderUnitControls() {
  const counts = new Map();
  state.questions.forEach((question) => counts.set(question.unit, (counts.get(question.unit) || 0) + 1));

  const allCount = state.questions.length;
  const navItems = [{ id: "all", title: "全部单元", count: allCount }, ...state.syllabus.map((unit) => ({
    id: unit.id,
    title: unit.title,
    count: counts.get(unit.id) || 0,
  }))];

  els.unitNav.innerHTML = "";
  els.unitSelect.innerHTML = "";

  navItems.forEach((unit) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `unit-button ${unit.id === state.activeUnit ? "active" : ""}`;
    button.dataset.unit = unit.id;
    button.innerHTML = `<strong>${unit.title}</strong><span>${unit.count} 题</span>`;
    button.addEventListener("click", () => {
      state.activeUnit = unit.id;
      els.unitSelect.value = unit.id;
      buildQueue();
      renderAll();
    });
    els.unitNav.appendChild(button);

    const option = document.createElement("option");
    option.value = unit.id;
    option.textContent = `${unit.title} (${unit.count})`;
    els.unitSelect.appendChild(option);
  });

  els.unitSelect.value = state.activeUnit;
}

function renderFocusPanel() {
  const unit = state.syllabus.find((item) => item.id === (state.activeUnit === "all" ? currentQuestion()?.unit : state.activeUnit));
  els.focusTitle.textContent = unit ? unit.title : "单元重点";
  els.focusPoints.innerHTML = "";
  (unit?.keyPoints || []).slice(0, 6).forEach((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    els.focusPoints.appendChild(li);
  });
}

function renderQuestion() {
  const question = currentQuestion();
  const questionCard = document.querySelector(".question-card");
  questionCard?.classList.remove("answered-correct", "answered-wrong");
  els.choiceList.innerHTML = "";
  els.resultPanel.classList.add("hidden");
  els.resultPanel.innerHTML = "";
  els.instantFeedback.className = "instant-feedback hidden";
  els.instantFeedback.textContent = "";
  els.rewardToast.className = "reward-toast hidden";
  els.rewardToast.textContent = "";

  if (!question) {
    els.questionUnit.textContent = unitTitle(state.activeUnit);
    els.questionProgress.textContent = "0 / 0";
    els.questionText.textContent = state.mode === "wrong" ? "当前没有错题。" : "当前筛选条件下没有题目。";
    els.questionImage.classList.add("hidden");
    els.prevBtn.disabled = true;
    els.nextBtn.disabled = true;
    renderFocusPanel();
    return;
  }

  els.questionUnit.textContent = `${question.unitTitle} · ${question.type === "curated" ? "重点题" : "题库题"}`;
  els.questionProgress.textContent = `${state.index + 1} / ${state.queue.length}`;
  els.questionText.textContent = question.question;
  els.prevBtn.disabled = state.index === 0;
  els.nextBtn.disabled = state.index >= state.queue.length - 1;

  if (question.image) {
    els.questionImage.src = question.image;
    els.questionImage.alt = question.question;
    els.questionImage.classList.remove("hidden");
  } else {
    els.questionImage.classList.add("hidden");
  }

  Object.entries(question.choices).forEach(([label, text]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.innerHTML = `<span class="letter">${label}</span><span>${text}</span>`;
    button.addEventListener("click", () => answerQuestion(label));
    els.choiceList.appendChild(button);
  });

  renderFocusPanel();
}

function answerQuestion(choice) {
  const question = currentQuestion();
  if (!question) return;
  const correct = choice === question.answer;
  const existing = state.progress.attempts[question.id] || { count: 0, correct: 0 };
  existing.count += 1;
  existing.correct += correct ? 1 : 0;
  existing.lastChoice = choice;
  existing.lastAt = new Date().toISOString();
  state.progress.attempts[question.id] = existing;

  if (!correct) {
    state.progress.wrong[question.id] = {
      id: question.id,
      lastChoice: choice,
      lastAt: existing.lastAt,
      unit: question.unit,
    };
  }

  state.answeredChoice = choice;
  const reward = recordGameProgress(correct);
  saveProgress();
  showInstantFeedback(correct, question, reward);
  renderAnswer(choice);
  updateStats();
  renderWrongList();
}

function showInstantFeedback(correct, question, reward) {
  const questionCard = document.querySelector(".question-card");
  questionCard?.classList.remove("answered-correct", "answered-wrong");
  void questionCard?.offsetWidth;
  questionCard?.classList.add(correct ? "answered-correct" : "answered-wrong");

  const rewardParts = [`+${reward.earnedXp} XP`];
  if (reward.comboBonus) rewardParts.push(`连答奖励 +${reward.comboBonus}`);
  if (reward.milestoneBonus) rewardParts.push(`${reward.milestoneLabel} +${reward.milestoneBonus}`);
  const comboText = reward.combo >= 2 ? ` · ${reward.combo} 连答` : "";
  const progressText = reward.remainingQuestions
    ? `今日已完成 ${reward.dailyAnswered}/${dailyGoalQuestions} 题，还差 ${reward.remainingQuestions} 题。`
    : `今日已完成 ${dailyGoalQuestions}/${dailyGoalQuestions} 题。`;

  els.instantFeedback.className = `instant-feedback ${correct ? "correct" : "wrong"}`;
  els.instantFeedback.innerHTML = correct
    ? `<strong>答对了</strong><span>${rewardParts.join(" · ")}${comboText}。${progressText}</span>`
    : `<strong>答错了</strong><span>${rewardParts.join(" · ")}。正确答案是 ${question.answer}：${question.choices[question.answer]}。${progressText}</span>`;

  els.rewardToast.className = `reward-toast ${reward.goalReached ? "goal" : correct ? "correct" : "wrong"}`;
  els.rewardToast.innerHTML = reward.goalReached
    ? `<strong>今日打卡完成</strong><span>150 题已完成，今日 ${reward.dailyXp} XP。继续刷错题可以巩固薄弱点。</span>`
    : correct
      ? `<strong>${reward.milestoneLabel || (reward.combo >= 3 ? "连答加成" : "知识点命中")}</strong><span>${reward.dailyAnswered}/${dailyGoalQuestions} 题，今日 ${reward.dailyXp} XP。</span>`
      : `<strong>错题已记录</strong><span>${reward.dailyAnswered}/${dailyGoalQuestions} 题。这题已经进错题本，读完解析再回来拿分。</span>`;
}

const planeExplanationHints = [
  {
    pattern: /矢状面/,
    text: "判断依据：矢状面把身体分成左、右两半，常见动作是屈曲和伸展，比如深蹲、硬拉、弯举、卷腹。题干如果主要是前后方向的屈伸，通常选矢状面。"
  },
  {
    pattern: /额状面|冠状面/,
    text: "判断依据：额状面把身体分成前、后两半，常见动作是外展、内收和侧屈，比如侧平举、侧弓步、开合跳。题干如果主要是左右方向移动，通常选额状面。"
  },
  {
    pattern: /水平面|水平\)面|横切|横断面|横断/,
    text: "判断依据：水平面把身体分成上、下两部分，常见动作是旋转、水平内收和水平外展，比如躯干旋转、胸飞鸟、反向飞鸟。题干如果主要是绕纵轴转动，通常选水平面。"
  }
];

const muscleFunctionHints = [
  ["胸大肌", "主要功能：肩水平内收、肩内收和肩内旋；锁骨部还会辅助肩屈，所以卧推、推胸、夹胸都会用到它。"],
  ["胸小肌", "主要功能：肩胛骨前引、下压和前倾，更多是肩胛带稳定肌，不是主要推举发力肌。"],
  ["三角肌前束", "主要功能：肩屈、肩水平内收和肩内旋，常在卧推、推举、前平举中参与。"],
  ["三角肌中束", "主要功能：肩外展，典型动作是侧平举。"],
  ["三角肌后束", "主要功能：肩伸、肩水平外展和肩外旋，常见于划船、反向飞鸟。"],
  ["背阔肌", "主要功能：肩伸、肩内收和肩内旋，典型动作是引体向上、下拉、划船。"],
  ["斜方肌", "主要功能：控制肩胛骨上提、后缩、下压和上旋；上束、中束、下束功能不同。"],
  ["菱形肌", "主要功能：肩胛骨后缩和下旋，常在划船、肩胛稳定题中出现。"],
  ["前锯肌", "主要功能：肩胛骨前引和上旋，帮助推的末端动作和肩胛稳定。"],
  ["肱二头肌", "主要功能：屈肘和前臂旋后，也会轻微辅助肩屈；拉类动作常见。"],
  ["肱三头肌", "主要功能：伸肘；长头还能辅助肩伸和肩内收，所以推胸、卧推、臂屈伸会用到它。"],
  ["腹直肌", "主要功能：躯干屈曲和骨盆后倾，典型动作是卷腹。"],
  ["腹外斜肌", "主要功能：躯干旋转、侧屈和抗旋；与腹内斜肌共同维持核心稳定。"],
  ["腹内斜肌", "主要功能：躯干旋转、侧屈和抗旋；与腹外斜肌共同维持核心稳定。"],
  ["竖脊肌", "主要功能：脊柱伸展和抗屈曲，硬拉、早安式、俯身划船都需要它稳定躯干。"],
  ["臀大肌", "主要功能：髋伸和髋外旋，是深蹲、硬拉、臀推、冲刺起跳的重要发力肌。"],
  ["臀中肌", "主要功能：髋外展和骨盆稳定，单腿支撑、侧向移动和步态控制常考。"],
  ["髂腰肌", "主要功能：髋屈，常见于抬腿、跑步摆腿阶段。"],
  ["股四头肌", "主要功能：伸膝；其中股直肌还会辅助髋屈，深蹲、腿举、腿屈伸常考。"],
  ["腘绳肌", "主要功能：髋伸和膝屈，硬拉、早安式、腿弯举、冲刺后链发力常考。"],
  ["股二头肌", "主要功能：膝屈和髋伸，是腘绳肌的一部分，偏后链动作常见。"],
  ["腓肠肌", "主要功能：踝跖屈，并辅助膝屈；站姿提踵更强调它。"],
  ["比目鱼肌", "主要功能：踝跖屈；膝屈位提踵更强调它。"],
  ["胫骨前肌", "主要功能：踝背屈和足内翻，常用于步态、足踝控制题。"]
];

function buildExplanationAddenda(choiceText) {
  return "";
}

function renderExplanationImages(question) {
  if (!question.showExplanationImages) return "";
  const images = question.explanationImages || [];
  if (!images.length) return "";

  const cards = images
    .map((image) => `
      <figure class="diagram-card">
        ${renderZoomableImage({
          src: image.src,
          title: image.title,
          caption: image.caption,
          alt: image.alt || image.title || "解剖示意图",
        })}
        <figcaption>
          <strong>${image.title}</strong>
          <span>${image.caption}</span>
          ${image.source ? `<small>${image.source}</small>` : ""}
        </figcaption>
      </figure>
    `)
    .join("");

  return `
    <section class="diagram-panel" aria-label="辅助理解图">
      <h4>辅助理解图</h4>
      <div class="diagram-grid">${cards}</div>
    </section>
  `;
}

function renderAnswer(choice) {
  const question = currentQuestion();
  if (!question) return;
  const buttons = [...els.choiceList.querySelectorAll(".choice-button")];
  buttons.forEach((button) => {
    const label = button.querySelector(".letter").textContent;
    button.disabled = true;
    if (label === question.answer) button.classList.add("correct");
    if (label === choice && choice !== question.answer) button.classList.add("wrong");
    if (label !== question.answer && label !== choice) button.classList.add("dimmed");
  });

  const correct = choice === question.answer;
  const correctText = question.choices[question.answer];
  const correctExplanation = question.explanations?.[question.answer] || "它最符合题干所考的判断标准。";
  const selectedExplanation = question.explanations?.[choice] || "它不符合题干所考的判断标准。";

  els.resultPanel.innerHTML = `
    <div class="result-heading">
      <span class="result-status ${correct ? "correct" : "wrong"}">${correct ? "答对了" : "答错了"}</span>
      <strong>正确答案：${question.answer}. ${correctText}</strong>
    </div>
    ${renderExplanationImages(question)}
    <div class="answer-reasons">
      <p><strong>为什么：</strong>${correctExplanation}</p>
      ${correct ? "" : `<p><strong>你选的 ${choice} 为什么不对：</strong>${selectedExplanation}</p>`}
    </div>
    ${renderAnswerSearchTools(question, choice)}
  `;
  els.resultPanel.classList.remove("hidden");
}

function renderGuideList(title, items) {
  if (!items?.length) return "";
  return `
    <section class="guide-block">
      <h4>${title}</h4>
      <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
    </section>
  `;
}

function renderGuideImages(images = []) {
  if (!images.length) return "";
  return `
    <section class="guide-block guide-visuals">
      <h4>辅助理解图</h4>
      <div class="unit-image-grid">
        ${images
          .map((src) => {
            const [title, caption] = unitGuideImageMeta[src] || ["辅助图", "用于辅助理解本单元考点。"];
            return `
              <figure class="unit-figure">
            ${renderZoomableImage({ src, title, caption })}
                <figcaption>
                  <strong>${title}</strong>
                  <span>${caption}</span>
                </figcaption>
              </figure>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function guideImagesForPoint(point) {
  const rules = [
    [/平面|屈曲|伸展|外展|内收|旋转|水平内收|水平外展|关节动作/, "./assets/diagrams/anatomical-planes.svg"],
    [/ATP-PC|糖酵解|有氧氧化|供能系统|供能|运动时间|持续时间|无氧能力|高强度间歇/, "./assets/diagrams/energy-systems.svg"],
    [/有效性|可靠性|客观性|特异性|测试质量|测试是否/, "./assets/diagrams/assessment-quality.svg"],
    [/强度值|volume-load|repetition-volume|训练量|次数 x 组数|%1RM|负荷|训练变量/, "./assets/diagrams/training-variables.svg"],
    [/力臂|力矩|杠杆|机械优势|阻力线|重力线|阻力臂|关节轴|支点|外部力矩|内部力矩/, "./assets/diagrams/biomechanics-torque.svg"],
    [/碳水|蛋白质|脂肪|水分|电解质|铁|钙|维生素|热量|营养素/, "./assets/diagrams/nutrition-basics.svg"],
 [/场馆|应急|AED|急救|监督|政策|程序|法律责任|风险管理|设备维护|器材维护|空间|镜子|地面|净空|落杠|碰撞|倾倒|走道|间隔|缓冲区/, "./assets/diagrams/facility-safety.svg"],
    [/骨骼|肩胛|胸骨|肋骨|骨盆|脊柱|髋|膝|踝|落地|膝内扣|腰椎/, "./assets/diagrams/skeleton-upper-body.svg"],
 [/主动肌|协同肌|拮抗肌|稳定肌|胸大肌|三角肌|股四头肌|肱二头肌|肱三头肌|前侧/, "./assets/diagrams/muscle-anterior.svg"],
 [/主动肌|协同肌|拮抗肌|稳定肌|背阔肌|斜方肌|腘绳肌|臀大肌|后侧|竖脊肌/, "./assets/diagrams/muscle-posterior.svg"]
  ];
  return [...new Set(rules.filter(([pattern]) => pattern.test(point)).map(([, src]) => src))].slice(0, 2);
}

function renderInlineGuideImages(images = []) {
  if (!images.length) return "";
  return `
    <div class="point-image-grid">
      ${images
        .map((src) => {
          const [title, caption] = unitGuideImageMeta[src] || ["辅助图", "用于辅助理解这一条考点。"];
          return `
            <figure class="point-figure">
            ${renderZoomableImage({ src, title, caption })}
              <figcaption><strong>${title}</strong><span>${caption}</span></figcaption>
            </figure>
          `;
        })
        .join("")}
    </div>
  `;
}

function normalizeGuidePoint(point) {
  if (typeof point === "string") return { text: point, images: guideImagesForPoint(point) };
  return { text: point.text, images: point.images || guideImagesForPoint(point.text || "") };
}

function renderGuidePoint(point) {
  const normalized = normalizeGuidePoint(point);
  return `
    <li class="guide-point">
      <span>${normalized.text}</span>
      ${renderInlineGuideImages(normalized.images)}
    </li>
  `;
}

function renderGuideSubunits(subunits = []) {
  if (!subunits.length) return "";
  return `
    <section class="guide-block guide-subunits" aria-label="小单元考点">
      ${subunits
        .map((subunit, index) => `
          <details class="subunit-card" ${index < 2 ? "open" : ""}>
            <summary>${subunit.title}</summary>
            <ul>${subunit.points.map(renderGuidePoint).join("")}</ul>
          </details>
        `)
        .join("")}
    </section>
  `;
}

function renderUnitGuide(unit) {
  const deepGuide = unitDeepGuides[unit.id];
  if (deepGuide) {
    const addenda = unitGuideAddenda[unit.id] || [];
    return `
      ${renderGuideSubunits([...deepGuide.subunits, ...addenda])}
    `;
  }
  const guide = unitExamGuides[unit.id];
  if (!guide) {
    return `
      ${renderGuideList("必会考点", unit.keyPoints)}
      ${renderGuideList("高频考法", unit.examFocus)}
    `;
  }
  return `
    ${renderGuideList("必会考点", guide.mustKnow)}
    ${renderGuideList("考场问法", guide.examAngles)}
    ${renderGuideList("易错提醒", guide.traps)}
    ${renderGuideImages(guide.images)}
  `;
}

function renderNotes() {
  els.notesGrid.innerHTML = "";
  state.syllabus.forEach((unit, index) => {
    const card = document.createElement("section");
    card.className = "note-card unit-guide-card";
    card.innerHTML = `
      <details class="unit-guide-details" ${index === 0 ? "open" : ""}>
        <summary class="unit-guide-summary">
          <span class="unit-guide-kicker">单元考点图解</span>
          <strong>${unit.title}</strong>
        </summary>
        ${renderUnitGuide(unit)}
        <details class="source-details">
          <summary>资料来源</summary>
          <div class="source-list">
            ${unit.sourceFiles.map((source) => `<span class="pill">${source}</span>`).join("")}
          </div>
        </details>
      </details>
    `;
    els.notesGrid.appendChild(card);
  });
}

function questionById(id) {
  return state.questions.find((question) => question.id === id);
}

function openQuestion(id) {
  const question = questionById(id);
  if (!question) return;
  state.activeUnit = question.unit;
  state.mode = "sequential";
  els.modeSelect.value = state.mode;
  els.unitSelect.value = state.activeUnit;
  buildQueue(id);
  switchView("quiz");
  renderAll();
}

function removeWrong(id) {
  delete state.progress.wrong[id];
  saveProgress();
  updateStats();
  renderWrongList();
  if (state.mode === "wrong") {
    buildQueue(currentQuestion()?.id);
    renderQuestion();
  }
}

function renderWrongList() {
  const wrongIds = Object.keys(state.progress.wrong);
  els.wrongList.innerHTML = "";
  if (!wrongIds.length) {
    els.wrongList.innerHTML = '<div class="list-item"><h3>暂无错题</h3><p>答错的题会自动收纳到这里。</p></div>';
    return;
  }

  wrongIds
    .map((id) => questionById(id))
    .filter(Boolean)
    .forEach((question) => {
      const wrong = state.progress.wrong[question.id];
      const item = document.createElement("article");
      item.className = "list-item";
      item.innerHTML = `
        <h3>${question.question}</h3>
        <p>${question.unitTitle} · 上次选择 ${wrong.lastChoice} · 正确答案 ${question.answer}</p>
        <p>来源：${question.source}</p>
        <div class="item-actions">
          <button class="primary-button" type="button" data-open="${question.id}">重做</button>
          <button class="secondary-button" type="button" data-remove="${question.id}">移出错题本</button>
        </div>
      `;
      els.wrongList.appendChild(item);
    });
}

function renderBank() {
  const term = els.searchInput.value.trim().toLowerCase();
  const filtered = state.questions.filter((question) => {
    if (state.activeUnit !== "all" && question.unit !== state.activeUnit) return false;
    if (!term) return true;
    const haystack = [
      question.question,
      question.unitTitle,
      question.source,
      ...Object.values(question.choices),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  els.bankList.innerHTML = "";
  filtered.slice(0, 120).forEach((question) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <h3>${question.question}</h3>
      <p>${question.unitTitle} · 答案 ${question.answer} · ${question.type === "curated" ? "重点题" : "题库题"}</p>
      <p>来源：${question.source}</p>
      <div class="item-actions">
        <button class="primary-button" type="button" data-open="${question.id}">开始此题</button>
      </div>
    `;
    els.bankList.appendChild(item);
  });

  if (filtered.length > 120) {
    const more = document.createElement("div");
    more.className = "list-item";
    more.innerHTML = `<p>已显示前 120 条，共 ${filtered.length} 条。</p>`;
    els.bankList.appendChild(more);
  }
}

function renderMaterials() {
  els.materialsList.innerHTML = "";
  state.materials.forEach((item) => {
    const row = document.createElement("article");
    row.className = "material-item";
    let status = "可读";
    if (item.kind === "partial-download") status = item.usable ? "未完成视频" : "空占位";
    if (item.textExtractable === false) status = "扫描件";
    if (item.error) status = "读取失败";
    row.innerHTML = `
      <div>
        <strong>${item.file}</strong>
        <span class="pill">${item.pages ? `${item.pages} 页` : `${item.bytes || 0} bytes`}</span>
      </div>
      <span class="status pill">${status}</span>
    `;
    els.materialsList.appendChild(row);
  });
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${view}View`);
  });
}

function renderAll() {
  renderUnitControls();
  renderQuestion();
  renderNotes();
  renderWrongList();
  renderBank();
  renderMaterials();
  updateStats();
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  els.unitSelect.addEventListener("change", () => {
    state.activeUnit = els.unitSelect.value;
    buildQueue();
    renderAll();
  });

  els.modeSelect.addEventListener("change", () => {
    state.mode = els.modeSelect.value;
    buildQueue();
    renderAll();
  });

  els.prevBtn.addEventListener("click", () => {
    if (state.index > 0) {
      state.index -= 1;
      state.answeredChoice = null;
      renderQuestion();
    }
  });

  els.nextBtn.addEventListener("click", () => {
    if (state.index < state.queue.length - 1) {
      state.index += 1;
      state.answeredChoice = null;
      renderQuestion();
    }
  });

  els.searchInput.addEventListener("input", renderBank);
  els.cloudSyncBtn?.addEventListener("click", handleCloudSync);

  els.resetProgressBtn.addEventListener("click", () => {
    if (!confirm("清空当前浏览器保存的做题记录和错题本？")) return;
    state.progress = { attempts: {}, wrong: {} };
    saveProgress();
    buildQueue();
    renderAll();
  });

  els.reviewWrongBtn.addEventListener("click", () => {
    state.mode = "wrong";
    els.modeSelect.value = "wrong";
    buildQueue();
    switchView("quiz");
    renderAll();
  });

  document.body.addEventListener("click", (event) => {
    const zoomButton = event.target.closest("[data-zoom-src]");
    if (zoomButton) {
      openImageZoom({
        src: zoomButton.dataset.zoomSrc,
        title: zoomButton.dataset.zoomTitle,
        caption: zoomButton.dataset.zoomCaption,
        alt: zoomButton.dataset.zoomAlt,
      }, zoomButton);
      return;
    }

    const openButton = event.target.closest("[data-open]");
    if (openButton) openQuestion(openButton.dataset.open);

    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) removeWrong(removeButton.dataset.remove);

    const configureDifyButton = event.target.closest("[data-configure-dify]");
    if (configureDifyButton) {
      configureDifyCoach();
      return;
    }

    const copyPromptButton = event.target.closest("[data-copy-prompt]");
    if (copyPromptButton) copyPromptAndOpen(copyPromptButton);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeImageZoom();
  });
}

async function init() {
  loadProgress();
  await loadData();
  buildQueue();
  bindEvents();
  renderAll();
  await startCloudSync();
}

init().catch((error) => {
  document.body.innerHTML = `
    <main class="view active">
      <section class="question-card">
        <h2>数据加载失败</h2>
        <p>${error.message}</p>
      </section>
    </main>
  `;
});

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
