'use strict';
(()=>{
 const footer=document.querySelector('footer.site-footer.compact-footer');if(!footer)return;
 let previous=-1;
 const measure=()=>{const height=Math.ceil(footer.getBoundingClientRect().height);if(height>0&&height!==previous){previous=height;document.documentElement.style.setProperty('--smartnf-footer-height',height+'px');}};
 measure();
 if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(measure);observer.observe(footer);}
 window.addEventListener('resize',measure,{passive:true});window.addEventListener('pageshow',measure);
 window.visualViewport?.addEventListener('resize',measure,{passive:true});
 document.fonts?.ready.then(measure);
})();
