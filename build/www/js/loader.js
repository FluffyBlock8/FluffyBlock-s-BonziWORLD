/* Simple asset preloader with progress UI */
(function(){
  var manifest = [
    './img/logon/bonzicircle.png',
    './img/error/logo.png',
    './img/ban/logo.png',
    './css/style.min.css'
  ];

  function updateProgress(loaded, total){
    var pct = Math.round((loaded/total)*100);
    var el = document.getElementById('loaderPercent');
    var fill = document.getElementById('loaderBarFill');
    if(el) el.textContent = pct + '%';
    if(fill) fill.style.width = pct + '%';
  }

  function hideOverlay(){
    var overlay = document.getElementById('loaderOverlay');
    if(!overlay) return;
    overlay.classList.add('hidden');
    setTimeout(function(){ overlay.parentNode && overlay.parentNode.removeChild(overlay); }, 600);
  }

  function loadImage(src, cb){
    var img = new Image();
    img.onload = function(){ cb(null, src); };
    img.onerror = function(){ cb(new Error('error')); };
    img.src = src;
  }

  function fetchAsset(url, cb){
    fetch(url, {method:'GET', cache:'force-cache'}).then(function(resp){
      if(!resp.ok) throw new Error('bad');
      return resp.blob();
    }).then(function(){ cb(null, url)}).catch(function(){ cb(new Error('err')); });
  }

  function start(){
    var total = manifest.length; var loaded = 0;
    if(total === 0){ updateProgress(1,1); hideOverlay(); return; }
    manifest.forEach(function(url){
      var isImg = /\.(png|jpg|jpeg|gif|webp|svg)$/.test(url);
      var loader = isImg ? loadImage : fetchAsset;
      loader(url, function(err){ loaded++; updateProgress(loaded, total); if(loaded>=total) setTimeout(hideOverlay, 250); });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else start();

})();
