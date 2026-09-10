// ==========================================
// 1. データと状態の定義
// ==========================================

// クイズに出る食べ物の英単語（追加・変更OK!）
const QUIZ_DATA = [
  { en: "apple", ja: "りんご", emoji: "🍎" },
  { en: "banana", ja: "ばなな", emoji: "🍌" },
  { en: "carrot", ja: "にんじん", emoji: "🥕" },
  { en: "donut", ja: "ドーナツ", emoji: "🍩" },
  { en: "egg", ja: "たまご", emoji: "🥚" },
  { en: "fish", ja: "さかな", emoji: "🐟" },
  { en: "grape", ja: "ぶどう", emoji: "🍇" },
  { en: "hamburger", ja: "ハンバーガー", emoji: "🍔" },
  { en: "ice cream", ja: "アイスクリーム", emoji: "🍨" },
  { en: "juice", ja: "ジュース", emoji: "🧃" }
];

// ごはんアイコンのリスト
const FOOD_ICONS = ["🍎", "🍌", "🍇", "🍉", "🍩", "🍔", "🍕", "🍰"];

// イーブイの進化先データ (PokeAPIの図鑑番号)
const EVOLUTIONS = [
  { id: 134, name: "シャワーズ" },
  { id: 135, name: "サンダース" },
  { id: 136, name: "ブースター" },
  { id: 196, name: "エーフィ" },
  { id: 197, name: "ブラッキー" },
  { id: 470, name: "リーフィア" },
  { id: 471, name: "グレイシア" },
  { id: 700, name: "ニンフィア" }
];

// アプリの状態（セーブデータ）
let state = {
  partnerId: 133, // 133はイーブイ
  partnerName: "イーブイ",
  exp: 0,
  foodCount: 0
};

// クイズ進行用の変数
let currentQuizIndex = 0;
let currentQuestions = [];
let maxQuestions = 4; // 1回あたりの問題数

// ==========================================
// 2. 初期化と画面描画
// ==========================================

// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderRoom();

  // ボタンのイベントリスナー登録
  document.getElementById("start-quiz-btn").addEventListener("click", startQuiz);
  document.getElementById("close-evolve-btn").addEventListener("click", closeEvolution);
  document.getElementById("reset-evo-btn").addEventListener("click", resetToEevee);
});

// データを読み込む
function loadState() {
  const saved = localStorage.getItem("eeveeEnglishSave");
  if (saved) {
    state = JSON.parse(saved);
  }
}

// データを保存する
function saveState() {
  localStorage.setItem("eeveeEnglishSave", JSON.stringify(state));
}

// 動くポケモンの画像URLを取得する (Showdown GIF API)
function getPokemonImageUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
}

// ルーム画面の描画
function renderRoom() {
  const img = document.getElementById("partner-image");
  img.src = getPokemonImageUrl(state.partnerId);
  document.getElementById("partner-name").textContent = state.partnerName;
  
  // 経験値バーの更新
  document.getElementById("exp-text").textContent = state.exp;
  document.getElementById("exp-bar").style.width = `${state.exp}%`;
  
  // カギ（ごはん）の数
  document.getElementById("key-count").textContent = state.foodCount;
  
  // ごはんリストの描画
  const foodList = document.getElementById("food-list");
  foodList.innerHTML = "";
  
  // 最大8個のごはんマスを用意
  for (let i = 0; i < 8; i++) {
    const foodItem = document.createElement("div");
    foodItem.className = "food-item";
    
    if (i < state.foodCount) {
      // 獲得済みのごはん
      foodItem.textContent = FOOD_ICONS[i % FOOD_ICONS.length];
      foodItem.addEventListener("click", (e) => feedFood(e, foodItem));
    } else {
      // まだロックされている
      foodItem.classList.add("locked");
    }
    foodList.appendChild(foodItem);
  }

  // 進化済みの場合はリセットボタンを表示
  const resetBtn = document.getElementById("reset-evo-btn");
  if (state.partnerId !== 133) {
    resetBtn.classList.remove("hidden");
  } else {
    resetBtn.classList.add("hidden");
  }
}

// ==========================================
// 3. アニメーション＆育成ロジック
// ==========================================

// ごはんをあげる処理
function feedFood(event, element) {
  if (element.classList.contains("eaten")) return;

  // 1. 飛んでいくアニメーション用の要素を作成
  const flyingFood = document.createElement("div");
  flyingFood.textContent = element.textContent;
  flyingFood.className = "flying-food";
  
  // クリックした場所を取得して配置
  const rect = element.getBoundingClientRect();
  flyingFood.style.left = `${rect.left}px`;
  flyingFood.style.top = `${rect.top}px`;
  document.body.appendChild(flyingFood);

  // 状態を「食べた」にする
  element.classList.add("eaten");
  element.innerHTML = "<div class='eaten-mark'>✔</div>";
  
  state.foodCount--;
  saveState();

  // 2. イーブイの位置を取得して移動させる（少し遅延させる）
  setTimeout(() => {
    const partnerRect = document.getElementById("partner-image").getBoundingClientRect();
    flyingFood.style.left = `${partnerRect.left + partnerRect.width / 2 - 20}px`;
    flyingFood.style.top = `${partnerRect.top + partnerRect.height / 2 - 20}px`;
    flyingFood.style.transform = "scale(0.5) rotate(360deg)";
    flyingFood.style.opacity = "0";
  }, 50);

  // 3. 移動完了後の処理
  setTimeout(() => {
    flyingFood.remove(); // 飛んでたごはんを消す
    
    // もぐもぐアニメーション
    const partnerImg = document.getElementById("partner-image");
    partnerImg.classList.add("anim-chew");
    
    const msg = document.getElementById("eating-msg");
    msg.style.opacity = "1";
    msg.style.transform = "translate(-50%, -20px)";
    
    setTimeout(() => {
      partnerImg.classList.remove("anim-chew");
      msg.style.opacity = "0";
      msg.style.transform = "translate(-50%, 0)";
      
      // 経験値アップ (1個につき 25%)
      gainExp(25);
    }, 800);
  }, 550);
}

// 経験値を増やす
function gainExp(amount) {
  state.exp += amount;
  if (state.exp >= 100) {
    state.exp = 100;
    renderRoom(); // 一旦100%を描画
    setTimeout(evolvePartner, 500); // 0.5秒後に進化！
  } else {
    saveState();
    renderRoom();
  }
}

// 進化の演出
function evolvePartner() {
  if (state.partnerId !== 133) return; // イーブイ以外なら進化しない

  // ランダムに進化先を選ぶ
  const evo = EVOLUTIONS[Math.floor(Math.random() * EVOLUTIONS.length)];
  
  state.partnerId = evo.id;
  state.partnerName = evo.name;
  state.exp = 0;
  saveState();

  // 進化オーバーレイを表示
  const overlay = document.getElementById("evolve-overlay");
  const evolveImg = document.getElementById("evolve-image");
  const evolveText = document.getElementById("evolve-text");

  evolveImg.src = getPokemonImageUrl(evo.id);
  evolveText.innerHTML = `おめでとう！<br>${evo.name} に しんかした！`;
  
  overlay.classList.remove("hidden");
}

// 進化画面を閉じる
function closeEvolution() {
  document.getElementById("evolve-overlay").classList.add("hidden");
  renderRoom();
}

// イーブイに戻す（最初からやり直す）
function resetToEevee() {
  if(confirm("イーブイにもどして、もういちど あそぶ？")) {
    state.partnerId = 133;
    state.partnerName = "イーブイ";
    state.exp = 0;
    state.foodCount = 0;
    saveState();
    renderRoom();
  }
}

// ==========================================
// 4. クイズ＆音声認識ロジック
// ==========================================

// クイズ開始
function startQuiz() {
  // 問題をランダムにシャッフルして選ぶ
  const shuffled = [...QUIZ_DATA].sort(() => 0.5 - Math.random());
  currentQuestions = shuffled.slice(0, maxQuestions);
  currentQuizIndex = 0;

  // 画面切り替え
  document.getElementById("room-view").classList.add("hidden");
  document.getElementById("quiz-view").classList.remove("hidden");
  
  showQuestion();
}

// 1問表示する
function showQuestion() {
  const q = currentQuestions[currentQuizIndex];
  
  document.getElementById("quiz-progress-text").textContent = `だい ${currentQuizIndex + 1} もん (${currentQuizIndex + 1}/${maxQuestions})`;
  
  const content = document.getElementById("quiz-content");
  content.innerHTML = `
    <div class="question-emoji">${q.emoji}</div>
    <div class="question-ja">${q.ja}</div>
    <button class="voice-btn" onclick="speakWord('${q.en}')">🔊</button>
    <div class="question-word">${q.en}</div>
    
    <button id="mic-btn" class="mic-btn">🎤</button>
    <p style="color:#888; font-size:0.9rem;">マイクをおして、えいごで いってみよう！</p>
  `;

  document.getElementById("mic-btn").addEventListener("click", () => startListening(q.en));
}

// Web Speech API (音声読み上げ)
function speakWord(word) {
  const ut = new SpeechSynthesisUtterance(word);
  ut.lang = 'en-US';
  ut.rate = 0.9; // 少しゆっくり
  speechSynthesis.speak(ut);
}

// Web Speech API (音声認識)
function startListening(correctWord) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    alert("ごめんなさい、このブラウザはマイクに対応していません。（SafariかChromeを使ってね）");
    return;
  }

  const micBtn = document.getElementById("mic-btn");
  micBtn.classList.add("listening");

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
    checkAnswer(spokenWord, correctWord);
  };

  recognition.onerror = (event) => {
    micBtn.classList.remove("listening");
    alert("うまく聞き取れなかったみたい。もういちどボタンを押してね！");
  };

  recognition.onend = () => {
    micBtn.classList.remove("listening");
  };
}

// 答え合わせとフィードバック
function checkAnswer(spokenWord, correctWord) {
  const overlay = document.getElementById("feedback-overlay");
  const icon = document.getElementById("feedback-icon");
  const text = document.getElementById("feedback-text");
  
  // 発音の揺れを少しだけ許容する簡単なチェック
  // 例: "apple" と "apples" などを正解扱いにする
  if (spokenWord.includes(correctWord) || correctWord.includes(spokenWord)) {
    // 正解！
    icon.textContent = "⭕";
    icon.style.color = "var(--correct)";
    text.innerHTML = `すごい！<br>「${correctWord}」`;
    text.style.color = "var(--correct)";
    
    // 正解音の代わりに読み上げ
    speakWord("Excellent!");
    
    overlay.classList.remove("hidden");
    
    setTimeout(() => {
      overlay.classList.add("hidden");
      nextQuestion();
    }, 2000);
    
  } else {
    // 不正解...
    icon.textContent = "❌";
    icon.style.color = "var(--incorrect)";
    text.innerHTML = `おしい！<br>キミのこたえ: ${spokenWord}<br>せいかい: ${correctWord}`;
    text.style.color = "var(--text-main)";
    
    overlay.classList.remove("hidden");
    
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 3000); // 3秒見せてもう一度挑戦させる
  }
}

// 次の問題へ、またはクリア
function nextQuestion() {
  currentQuizIndex++;
  
  if (currentQuizIndex < maxQuestions) {
    showQuestion();
  } else {
    // 全問正解！ごはんをゲット
    state.foodCount++;
    saveState();
    
    // お部屋に戻る
    document.getElementById("quiz-view").classList.add("hidden");
    document.getElementById("room-view").classList.remove("hidden");
    renderRoom();
    
    // 戻った直後に褒めるアラート
    setTimeout(() => {
      alert("4もん せいかい！\nごはんを ゲットしたよ！もぐもぐさせてね！");
    }, 500);
  }
}