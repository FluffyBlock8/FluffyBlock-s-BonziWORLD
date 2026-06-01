/* Simple typewriter and speech-bubble helpers */
(function(){
  function typeWriter(el, text, speed, cb){
    el.textContent = '';
    var i = 0;
    el.parentNode && el.parentNode.classList.add('typing');
    var t = setInterval(function(){
      el.textContent += text.charAt(i);
      i++;
      if(i >= text.length){
        clearInterval(t);
        el.parentNode && el.parentNode.classList.remove('typing');
        if(cb) cb();
      }
    }, speed);
    return t;
  }

  function createSpeechBubble(text, side){
    var wrap = document.createElement('div');
    wrap.className = 'speech-bubble ' + (side === 'right' ? 'right' : 'left') + ' typewriter';
    var span = document.createElement('span');
    span.className = 'tw-text';
    wrap.appendChild(span);
    // start typing a tick later so the pop animation shows
    setTimeout(function(){ typeWriter(span, text, 30); }, 60);
    return wrap;
  }

  window.showSpeechMessage = function(text, side){
    var container = document.getElementById('chat_messages');
    if(!container) return null;
    var el = createSpeechBubble(text, side);
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  };

  document.addEventListener('DOMContentLoaded', function(){
    var input = document.getElementById('chat_message');
    var sendBtn = document.getElementById('chat_send');
    if(sendBtn && input){
      sendBtn.addEventListener('click', function(){
        var txt = input.value && input.value.trim();
        if(!txt) return;
        showSpeechMessage(txt, 'right');
        input.value = '';
      });
    }
    // optionally expose a quick test when pressing T
    document.addEventListener('keydown', function(e){
      if(e.key === 'T' && e.ctrlKey){
        showSpeechMessage('This is a test speech bubble!', 'left');
      }
    });
  });

})();
