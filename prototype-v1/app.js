const questions = [
  {
    unit: "运动科学 · 动作平面",
    text: "哑铃侧平举主要发生在哪个动作平面？",
    choices: { A: "矢状面", B: "额状面", C: "水平面", D: "多平面" },
    answer: "B",
    reason: "侧平举以肩关节外展为主，外展主要发生在额状面。",
    visual: {
      src: "./assets/anatomical-planes.svg",
      alt: "解剖学三大运动平面示意图",
      title: "先看主要动作方向",
      points: ["屈曲、伸展：矢状面", "外展、内收：额状面", "旋转、水平移动：水平面"],
    },
    wrongReasons: {
      A: "矢状面主要对应屈曲和伸展，不是肩外展。",
      C: "水平面主要对应旋转、水平内收和水平外展。",
      D: "这道题问主要动作平面，应按肩外展判断为额状面。",
    },
  },
  {
    unit: "运动科学 · 生物力学",
    text: "其他条件不变时，哑铃离肘关节越远，肘关节承受的力矩会怎样变化？",
    choices: { A: "减小", B: "不变", C: "增大", D: "先减小后增大" },
    answer: "C",
    reason: "力矩等于力乘以垂直力臂；哑铃离关节越远，力臂越大，力矩越大。",
    visual: {
      src: "./assets/biomechanics-torque.svg",
      alt: "力臂与力矩示意图",
      title: "重量不变，还要看力臂",
      points: ["先找关节轴", "再找外部阻力线", "垂直距离越大，外部力矩越大"],
    },
    wrongReasons: {
      A: "距离增大意味着力臂增大，不会使力矩减小。",
      B: "外力虽然不变，但力臂改变，所以力矩会改变。",
      D: "题干没有给出方向变化，不能判断为先减小后增大。",
    },
  },
];

let currentQuestion = 0;
const choicesEl = document.querySelector("#choices");
const resultEl = document.querySelector("#answerResult");
const questionTextEl = document.querySelector("#questionText");
const questionUnitEl = document.querySelector("#questionUnit");
const questionCountEl = document.querySelector("#questionCount");
const quizActions = document.querySelector("#quizActions");
const contextImageEl = document.querySelector("#contextImage");
const contextTitleEl = document.querySelector("#contextTitle");
const contextPointsEl = document.querySelector("#contextPoints");

function buildPrompt(question, selected) {
  const options = Object.entries(question.choices).map(([key, value]) => `${key}. ${value}`).join("\n");
  return `我正在复习 NSCA-CPT，请用自然、直接的中文解释这道题。\n\n题目：${question.text}\n${options}\n\n我选择了：${selected}. ${question.choices[selected]}\n正确答案：${question.answer}. ${question.choices[question.answer]}\n\n请重点说明：\n1. 为什么正确答案是对的？\n2. 为什么我选择的答案不对？\n3. 两者最关键的区别是什么？\n4. 下次应该抓住哪个关键词？`;
}

function renderQuestion() {
  const question = questions[currentQuestion];
  questionTextEl.textContent = question.text;
  questionUnitEl.textContent = question.unit;
  questionCountEl.textContent = `${18 + currentQuestion} / 50`;
  contextImageEl.src = question.visual.src;
  contextImageEl.alt = question.visual.alt;
  contextTitleEl.textContent = question.visual.title;
  contextPointsEl.innerHTML = question.visual.points.map((point) => `<li>${point}</li>`).join("");
  resultEl.classList.add("hidden");
  resultEl.innerHTML = "";
  choicesEl.innerHTML = "";

  Object.entries(question.choices).forEach(([letter, text]) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.dataset.choice = letter;
    button.innerHTML = `<span class="choice-letter">${letter}</span><span>${text}</span>`;
    button.addEventListener("click", () => answer(letter));
    choicesEl.appendChild(button);
  });
}

function answer(selected) {
  const question = questions[currentQuestion];
  const correct = selected === question.answer;
  choicesEl.querySelectorAll(".choice").forEach((button) => {
    button.disabled = true;
    const letter = button.dataset.choice;
    if (letter === question.answer) button.classList.add("correct");
    else if (letter === selected) button.classList.add("wrong");
    else button.classList.add("dim");
  });

  const prompt = buildPrompt(question, selected);
  resultEl.innerHTML = `
    <div class="result-heading">
      <span class="status ${correct ? "correct" : "wrong"}">${correct ? "答对了" : "答错了"}</span>
      <strong>正确答案：${question.answer}. ${question.choices[question.answer]}</strong>
    </div>
    <p><strong>为什么：</strong>${question.reason}</p>
    ${correct ? "" : `<p><strong>你选的 ${selected} 为什么不对：</strong>${question.wrongReasons[selected]}</p>`}
    <div class="ai-row">
      <div class="ai-copy"><strong>需要更详细的解释？</strong><small>提示词已包含正确答案和你的选择。</small></div>
      <div class="ai-actions">
        <a class="ai-button" href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" data-prompt="${encodeURIComponent(prompt)}">复制并打开 Gemini</a>
        <details class="provider"><summary>其他 AI</summary><div class="provider-menu"><button data-provider="https://chat.deepseek.com/" data-prompt="${encodeURIComponent(prompt)}">DeepSeek</button><button data-provider="https://www.doubao.com/chat/" data-prompt="${encodeURIComponent(prompt)}">豆包</button><button data-prompt="${encodeURIComponent(prompt)}">仅复制</button></div></details>
      </div>
    </div>`;
  resultEl.classList.remove("hidden");
}

async function copyPrompt(encodedPrompt) {
  const prompt = decodeURIComponent(encodedPrompt || "");
  try { await navigator.clipboard.writeText(prompt); }
  catch { window.prompt("复制下面的提示词：", prompt); }
}

function switchScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === name));
  document.querySelectorAll("[data-nav]").forEach((button) => button.classList.toggle("active", button.dataset.nav === name));
  quizActions.classList.toggle("hidden", name !== "quiz");
  window.scrollTo({ top: 0, behavior: "auto" });
}

document.addEventListener("click", async (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) { event.preventDefault(); switchScreen(nav.dataset.nav); return; }

  const promptTarget = event.target.closest("[data-prompt]");
  if (promptTarget) {
    await copyPrompt(promptTarget.dataset.prompt);
    if (promptTarget.dataset.provider) window.open(promptTarget.dataset.provider, "_blank", "noopener");
  }
});

document.querySelector("#nextButton").addEventListener("click", () => {
  currentQuestion = (currentQuestion + 1) % questions.length;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.querySelector("#prevButton").addEventListener("click", () => {
  currentQuestion = (currentQuestion - 1 + questions.length) % questions.length;
  renderQuestion();
});
document.querySelector("#searchInput").addEventListener("input", (event) => {
  const hasTerm = event.target.value.trim().length > 0;
  document.querySelector("#searchEmpty").classList.toggle("hidden", hasTerm);
  document.querySelector("#searchResults").classList.toggle("hidden", !hasTerm);
});

renderQuestion();
