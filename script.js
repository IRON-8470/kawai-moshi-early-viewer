/*
 * 河合塾 模試結果リンク案内
 * 模試コード：年度2桁 + 模試分類3桁 + 実施回1桁 + 学年区分3桁
 */

const GRADE_CODES = {
  1: "031", // 高校1年
  2: "032", // 高校2年
  3: "011"  // 高校3年・高卒
};

const EXAM_TYPES = {
  1: [
    { value: "high1", label: "全統高1模試", eventCode: "656", answerPdf: true }
  ],
  2: [
    { value: "high2", label: "全統高2模試", eventCode: "649", answerPdf: true },
    { value: "descriptiveHigh2", label: "全統記述高2模試", eventCode: "654", answerPdf: true },
    { value: "commonHigh2", label: "全統共通テスト高2模試", eventCode: "651", answerPdf: false }
  ],
  3: [
    { value: "common", label: "全統共通テスト模試", eventCode: "606", answerPdf: false },
    { value: "descriptive", label: "全統記述模試", eventCode: "612", answerPdf: true }
  ]
};

const yearInput = document.getElementById("year");
const gradeSelect = document.getElementById("grade");
const examSelect = document.getElementById("exam");
const roundInput = document.getElementById("round");
const form = document.getElementById("generator-form");
const generateButton = document.getElementById("generate-button");
const formError = document.getElementById("form-error");
const results = document.getElementById("results");
const selectedSummary = document.getElementById("selected-summary");
const linkList = document.getElementById("link-list");

function clearResults() {
  results.hidden = true;
  linkList.replaceChildren();
  formError.textContent = "";
}

function updateExamOptions() {
  const grade = Number(gradeSelect.value);
  examSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = grade ? "選択してください" : "先に学年を選択してください";
  examSelect.appendChild(placeholder);

  const exams = EXAM_TYPES[grade] || [];
  for (const exam of exams) {
    const option = document.createElement("option");
    option.value = exam.value;
    option.textContent = exam.label;
    examSelect.appendChild(option);
  }
  examSelect.disabled = exams.length === 0;

  clearResults();
  updateButtonState();
}

function getSelectedExam() {
  const grade = Number(gradeSelect.value);
  return (EXAM_TYPES[grade] || []).find((exam) => exam.value === examSelect.value) || null;
}

function isValidInput() {
  const year = Number(yearInput.value);
  const grade = Number(gradeSelect.value);
  const round = Number(roundInput.value);

  return Number.isInteger(year) && year >= 2000 && year <= 2099 &&
    Boolean(GRADE_CODES[grade]) &&
    Boolean(getSelectedExam()) &&
    Number.isInteger(round) && round >= 1 && round <= 9;
}

function updateButtonState() {
  generateButton.disabled = !isValidInput();
}

function getVersion(year, grade, examValue) {
  if (year >= 2026) return "v10";

  const special2025 =
    year === 2025 &&
    grade === 2 &&
    (examValue === "descriptiveHigh2" || examValue === "commonHigh2");

  return special2025 ? "v10" : "v6";
}

function createMoshiCode(year, grade, exam, round) {
  return String(year).slice(-2) +
    exam.eventCode +
    String(round) +
    GRADE_CODES[grade];
}

function createPdfUrl(version, endpoint, code) {
  const url = new URL("https://moshi-navi.kawai-juku.ac.jp/zigs_index/");
  url.searchParams.set("p", `${version}.${endpoint}`);
  url.searchParams.set("moshi_code", code);
  return url.toString();
}

function appendPdfLink(label, description, url) {
  const anchor = document.createElement("a");
  anchor.className = "pdf-link";
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";

  const title = document.createElement("span");
  title.textContent = label;

  const hint = document.createElement("small");
  hint.textContent = description;

  anchor.append(title, hint);
  linkList.appendChild(anchor);
}

yearInput.addEventListener("input", () => {
  clearResults();
  updateButtonState();
});
gradeSelect.addEventListener("change", updateExamOptions);
examSelect.addEventListener("change", () => {
  clearResults();
  updateButtonState();
});
roundInput.addEventListener("input", () => {
  clearResults();
  updateButtonState();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearResults();

  if (!isValidInput()) {
    formError.textContent = "入力内容を確認してください。";
    updateButtonState();
    return;
  }

  const year = Number(yearInput.value);
  const grade = Number(gradeSelect.value);
  const round = Number(roundInput.value);
  const exam = getSelectedExam();
  const version = getVersion(year, grade, exam.value);
  const code = createMoshiCode(year, grade, exam, round);

  selectedSummary.textContent =
    `${year}年度・${exam.label}・第${round}回`;

  appendPdfLink(
    "個人成績表 PDF",
    "個人成績表を開く",
    createPdfUrl(version, "download_kojin_seiseki_pdf_file", code)
  );

  if (exam.answerPdf) {
    appendPdfLink(
      "答案 PDF",
      "答案を開く",
      createPdfUrl(version, "download_touan_pdf_file", code)
    );
  }

  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

// 入力された条件からコードを算出し、提示された既知のコードと照合する。
const knownChecks = [
  [2026, 3, "common", 1, "266061011"],
  [2026, 3, "descriptive", 1, "266121011"],
  [2026, 3, "common", 2, "266062011"],
  [2026, 3, "descriptive", 2, "266122011"],
  [2026, 3, "common", 3, "266063011"],
  [2025, 2, "high2", 1, "256491032"],
  [2025, 2, "descriptiveHigh2", 1, "256541032"],
  [2025, 2, "commonHigh2", 1, "256511032"],
  [2024, 1, "high1", 1, "246561031"]
];

for (const [year, grade, examValue, round, expected] of knownChecks) {
  const exam = EXAM_TYPES[grade].find((item) => item.value === examValue);
  const actual = createMoshiCode(year, grade, exam, round);
  if (actual !== expected) {
    console.error("模試コードの照合に失敗しました。", { expected, actual });
  }
}
