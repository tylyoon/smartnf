// A period meal is edited from its snapshot, independently of the candidate pool.
export function snapshotPlate(parts){
 if(!Array.isArray(parts)||parts.length>30)throw Error('편집할 끼니의 요리 목록을 확인해 주세요.');
 return parts.map(part=>{
  if(!part||typeof part.name!=='string'||!Array.isArray(part.ingredients))throw Error('편집할 요리의 재료를 확인해 주세요.');
  const servings=Number(part.servings);
  const role=part.role||part.combinationType;
  return {...(['main','soup','bowl','staple','side'].includes(role)?{combinationType:role}:{}),name:part.name,servings:Number.isFinite(servings)&&servings>0?servings:1,portions:structuredClone(part.ingredients)};
 });
}
