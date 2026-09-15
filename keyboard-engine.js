// ==========================================
// BoliForge French Keyboard
// Desktop overlay • Native mobile keyboard
// ==========================================

const FrenchKeyboard = (() => {

  let activeInput = null;

  const isMobile = () =>
    window.matchMedia("(max-width:768px)").matches;

  function init(){

    if(isMobile()) return;

    const toggle = document.getElementById("keyboardToggle");
    const keyboard = document.getElementById("frenchKeyboard");
    const close = document.getElementById("keyboardClose");

    if(!toggle || !keyboard) return;

    // Detect any text input or textarea

    document.addEventListener("focusin",(e)=>{

      const target=e.target;

      if(target.matches('input[type="text"], textarea')){

        activeInput=target;

        toggle.classList.remove("hidden");

      }

    });

    document.addEventListener("focusout",(e)=>{

      setTimeout(()=>{

        if(document.activeElement!==activeInput){

          activeInput=null;

          keyboard.classList.add("hidden");

          toggle.classList.add("hidden");

        }

      },120);

    });

    toggle.onclick=()=>{

      keyboard.classList.toggle("hidden");

    };

    close.onclick=()=>{

      keyboard.classList.add("hidden");

    };

    keyboard.querySelectorAll("[data-char]").forEach(btn=>{

      btn.addEventListener("click",()=>{

        insertCharacter(btn.dataset.char);

      });

    });

  }

  function insertCharacter(char){

    if(!activeInput) return;

    const start=activeInput.selectionStart;
    const end=activeInput.selectionEnd;

    const value=activeInput.value;

    activeInput.value=
      value.slice(0,start)+
      char+
      value.slice(end);

    activeInput.focus();

    activeInput.selectionStart=
      activeInput.selectionEnd=start+char.length;

    activeInput.dispatchEvent(
      new Event("input",{bubbles:true})
    );

  }

  return{init};

})();

document.addEventListener("DOMContentLoaded",()=>{
  FrenchKeyboard.init();
});