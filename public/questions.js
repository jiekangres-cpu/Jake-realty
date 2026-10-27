// The questionnaire. Replace these with your own questions; the form builds itself from this list.
// Each question: key (field name), title, sub (helper text), options [{v: stored value, sub: optional small text}]
window.QUESTIONS = [
  {key:'goal', title:'What are you looking to do?', sub:'Pick the closest match.', options:[
    {v:'My First Home (Buy)', sub:'Buying my first home'},
    {v:'Upgrading', sub:'Moving up to a bigger or better home'},
    {v:'Investing in Property', sub:'Rental yield or capital gain'},
    {v:'Just Looking to Sell'}]},
  {key:'current', title:'What do you own today?', sub:'This affects stamp duty, CPF and loan position.', options:[
    {v:'Nothing yet', sub:'Renting or living with family'},
    {v:'HDB, past MOP'},{v:'HDB, not yet MOP'},{v:'Private property'},{v:'More than one property'}]},
  {key:'budget', title:'Roughly what budget are you considering?', sub:'Total purchase price, not loan amount.', options:[
    {v:'Below $1.2M'},{v:'$1.2M to $1.6M'},{v:'$1.6M to $2.0M'},{v:'$2.0M to $3.0M'},{v:'Above $3.0M'}]},
  {key:'income', title:'Household monthly income?', sub:'Combined gross income of everyone on the loan.', options:[
    {v:'Below $8k'},{v:'$8k to $12k'},{v:'$12k to $20k'},{v:'$20k and above'}]},
  {key:'status', title:'Residency status of the buyer(s)?', sub:'ABSD rates depend on this.', options:[
    {v:'Singapore Citizen'},{v:'Permanent Resident'},{v:'Foreigner'},{v:'Mixed (e.g. citizen and PR)'}]},
  {key:'timeline', title:'When do you plan to buy?', sub:'An honest answer helps me tell you whether to act now or keep watching.', options:[
    {v:'Within 3 months'},{v:'3 to 6 months'},{v:'6 to 12 months'},{v:'Just exploring', sub:'No date yet'}]}
];

// Lead tier, mirroring the CRM: A = motivated and urgent, B = motivated not urgent, C = low urgency.
// Edit this if your questions change.
window.scoreLead = function(a){
  const urgent = a.timeline==='Within 3 months' || a.timeline==='3 to 6 months';
  const near = a.timeline==='6 to 12 months';
  const lowBudget = a.budget==='Below $1.2M' && a.goal!=='Just Looking to Sell';
  if(urgent && !lowBudget) return 'A';
  if(urgent || near) return 'B';
  return 'C';
};
