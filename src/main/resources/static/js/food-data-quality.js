'use strict';
(()=>{
 let promise;
 function validate(data){if(data?.schema_version!==1||!Array.isArray(data.health_source_holds)||!data.recipe_quality||!/^quality-[a-f0-9]{16}$/.test(data.version))throw Error('자료 검토 상태를 확인할 수 없습니다.');return data;}
 const read=()=>promise||(promise=fetch('/js/data/healthcare-quality-v1.json',{credentials:'same-origin',cache:'no-store'}).then(r=>{if(!r.ok)throw Error('자료 검토 상태를 불러오지 못했습니다.');return r.json();}).then(validate).catch(e=>{promise=null;throw e;}));
 function recipe(data,id){const q=data.recipe_quality[String(id)];if(!q||!['hold','source_display_only'].includes(q.status))throw Error('레시피의 원문 검토 상태를 확인할 수 없습니다.');return q;}
 function allowed(data,id){return recipe(data,id).status==='source_display_only';}
 window.SmartNFFoodDataQuality={read,validate,recipe,allowed};
})();
