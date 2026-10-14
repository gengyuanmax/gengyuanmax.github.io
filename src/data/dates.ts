// Presentation only; retain the exact source date for sorting and time attributes.
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function formatMonth(date:string):string {
 const match=/^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(date);
 return match&&months[Number(match[2])-1]?`${months[Number(match[2])-1]} ${match[1]}`:date;
}
