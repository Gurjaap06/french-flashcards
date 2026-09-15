// ==========================================
// BoliForge Infinite Listening Quiz
// Clean • Fast • Infinite
// ==========================================

const QuizEngine = (() => {

    const state = {
        current: 0,
        options: [],
        streak: 0,
        locked: false,
        difficulty: "easy"
    };

    let playBtn, optionsEl, feedbackEl, nextBtn;

    function init(){

        playBtn = document.getElementById("playQuizAudio");
        optionsEl = document.getElementById("quizOptions");
        feedbackEl = document.getElementById("quizFeedback");
        nextBtn = document.getElementById("nextQuestion");

        if(!playBtn) return;

        createHUD();

        playBtn.addEventListener("click", () => {
            speakFrench(generateFrenchNumber(state.current).written);
        });

        document.addEventListener("keydown", keyboardControls);
        nextBtn?.addEventListener("click", nextQuestion);

        nextQuestion();

    }

    // ---------------------------------------
    // HUD
    // ---------------------------------------

    function createHUD(){

        const hud=document.createElement("div");

        hud.className="quiz-hud";

        hud.innerHTML=`
            <div class="hud-item">
                🔥 Streak:
                <span id="streakValue">0</span>
            </div>
        `;

        playBtn.parentElement.insertBefore(hud,playBtn);

    }

    // ---------------------------------------
    // Next Question
    // ---------------------------------------

    function nextQuestion(){

        state.locked=false;

        feedbackEl.innerHTML="";

        state.current=randomFromPool();

        state.options=createOptions(state.current);

        renderOptions();

        setTimeout(()=>{
            speakFrench(generateFrenchNumber(state.current).written);
        },250);

    }

    // ---------------------------------------
    // Number Pools
    // ---------------------------------------

    function randomFromPool(){

        const pool=QUIZ_POOLS[state.difficulty];

        return pool[Math.floor(Math.random()*pool.length)];

    }

    function updateDifficulty(){

        if(state.streak>=15)
            state.difficulty="expert";

        else if(state.streak>=10)
            state.difficulty="hard";

        else if(state.streak>=5)
            state.difficulty="medium";

        else
            state.difficulty="easy";

    }

    // ---------------------------------------
    // Smart Distractors
    // ---------------------------------------

    function createOptions(correct){

        const set=new Set([correct]);

        while(set.size<4){

            let candidate;

            const roll=Math.random();

            if(roll<0.35){

                candidate=swapDigits(correct);

            }else if(roll<0.7){

                candidate=correct+randomOffset();

            }else{

                candidate=randomFromPool();

            }

            if(candidate>=0 && candidate<=9999){

                set.add(candidate);

            }

        }

        return shuffle([...set]);

    }

    function swapDigits(n){

        const s=String(n);

        if(s.length!==2)
            return n+1;

        return Number(s[1]+s[0]);

    }

    function randomOffset(){

        const offsets=[-10,-9,-5,-2,2,5,9,10];

        return offsets[Math.floor(Math.random()*offsets.length)];

    }

    // ---------------------------------------
    // Render
    // ---------------------------------------

    function renderOptions(){

        optionsEl.innerHTML="";

        state.options.forEach((value,index)=>{

            const btn=document.createElement("button");

            btn.className="quiz-option";

            btn.innerHTML=`
                <span class="option-key">${index+1}</span>
                <strong>${value}</strong>
            `;

            btn.onclick=()=>answer(value);

            optionsEl.appendChild(btn);

        });

    }

    // ---------------------------------------
    // Answer
    // ---------------------------------------

    function answer(value){

        if(state.locked)
            return;

        state.locked=true;

        const buttons=[...document.querySelectorAll(".quiz-option")];

        buttons.forEach(btn=>btn.disabled=true);

        buttons.forEach(btn=>{

            const num=Number(btn.querySelector("strong").textContent);

            if(num===state.current)
                btn.classList.add("correct");

            if(num===value && value!==state.current)
                btn.classList.add("wrong");

        });

        if(value===state.current){

            state.streak++;

            feedbackEl.innerHTML=`
                <div class="feedback-good">
                    ✅ Correct
                    <small>${generateFrenchNumber(state.current).written}</small>
                </div>
            `;

        }else{

            state.streak=0;

            feedbackEl.innerHTML=`
                <div class="feedback-bad">
                    ❌ ${state.current}
                    <small>${generateFrenchNumber(state.current).written}</small>
                </div>
            `;

        }

        document.getElementById("streakValue").textContent=state.streak;

        updateDifficulty();

        setTimeout(nextQuestion,1400);

    }

    // ---------------------------------------
    // Keyboard
    // ---------------------------------------

    function keyboardControls(e){

        if(state.locked)
            return;

        const map={
            "1":0,
            "2":1,
            "3":2,
            "4":3
        };

        if(map[e.key]!==undefined){

            const btn=document.querySelectorAll(".quiz-option")[map[e.key]];

            btn?.click();

        }

        if(e.key==="p")
            speakFrench(generateFrenchNumber(state.current).written);

    }

    // ---------------------------------------

    function shuffle(arr){

        for(let i=arr.length-1;i>0;i--){

            const j=Math.floor(Math.random()*(i+1));

            [arr[i],arr[j]]=[arr[j],arr[i]];

        }

        return arr;

    }

    return{ init };

})();

// Compatibility
function initQuiz(){

    QuizEngine.init();

}
