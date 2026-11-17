  // subtle build-stamp readout, respects reduced motion
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce){
    var el = document.getElementById('stamp');
    var frame = 0;
    setInterval(function(){
      frame = (frame + 1) % 1000;
      el.textContent = 'f' + String(frame).padStart(4,'0');
    }, 1200);
  }
