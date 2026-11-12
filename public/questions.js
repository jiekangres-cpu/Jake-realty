// The questionnaires. One set per Meta ad, chosen by /qualify?ad=<id>; anything else gets the default set.
// Each question: key (field name), title, sub (helper text), options [{v: stored value, sub: optional small text}],
// optional skipIf(answers) to hide a question that does not apply.
window.QUESTION_SETS = {
default: [
  {key:'goal', title:'What are you looking to do?', sub:'Pick the closest match.', options:[
    {v:'My First Home (Buy)', sub:'Buying my first home'},
    {v:'Upgrading / Potentially upgrading', sub:'Check my numbers whether upgrading makes sense'},
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
],
cashflow: [
  {key:'age', title:"What's your age?", options:[
    {v:'30 and below'},{v:'31 to 40'},{v:'41 to 50'},{v:'51 and above'}]},
  {key:'own', title:'What do you currently own?', options:[
    {v:'HDB'},{v:'Condominium'},{v:'Landed property'},{v:"Don't currently own a property"}]},
  {key:'income', title:'Total household monthly income?', options:[
    {v:'Below $8,000'},{v:'$8,000 to $13,999'},{v:'$14,000 to $20,000'},{v:'More than $20,000'}]},
  {key:'reason', title:'What was the main reason you bought your current property?', options:[
    {v:'Kids school'},{v:'Size of property'},{v:'Location'}],
    skipIf:a=>a.own==="Don't currently own a property"}
]
};
(function(){
  var ad=new URLSearchParams(location.search).get('ad');
  window.AD_ID=(ad&&window.QUESTION_SETS[ad])?ad:'default';
  window.QUESTIONS=window.QUESTION_SETS[window.AD_ID];
})();

// Optional landing screen shown before the questions for a given ad: the ad graphic, then a short intro.
window.AD_INTROS = {
  cashflow: {img:'ad-cashflow.webp', alt:'Is most of your net worth in property? Two examples with $800k net worth each, one with $600k in property equity and one with $300k, showing how the split between property equity, retirement fund and emergency fund can differ.'}
};
