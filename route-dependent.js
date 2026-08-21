(function(){
  const DATA={
    'hawaiian-airlines':{
      label:'Route-dependent pricing',
      note:'Hawaiian treats board bags as checked baggage, but overweight limits and charges differ by itinerary. International rules also use route-specific excess-baggage schedules.',
      reviewed:'Aug 18, 2026',
      source:'https://www.hawaiianairlines.com/legal/domestic-contract-of-carriage/rule-18',
      rows:[
        ['Within Hawaii','Up to 50 lb: checked-bag allowance/fee applies','51–70 lb: $35; 71–100 lb: $70','115 linear in / 292 cm max'],
        ['Hawaii ↔ Mainland U.S.','Up to 50 lb: checked-bag allowance/fee applies','51–70 lb: $100; 71–100 lb: $200','115 linear in / 292 cm max'],
        ['International on Hawaiian','Included in free baggage allowance; excess uses route schedule','Varies by route / allowance','100 lb max generally; 70 lb max to Australia, New Zealand, French Polynesia & Cook Islands'],
        ['USA ↔ Japan / Korea / Tahiti / Rarotonga / Pago Pago','International excess-baggage rules apply','Varies by itinerary','Stopovers over 24 hours can trigger point-to-point charges']
      ]
    },
    'philippine-airlines':{
      label:'Route-dependent pricing',
      note:'PAL surfboard charges depend on the baggage system, origin/destination, dimensions and whether the board is within the free baggage allowance. PAL publishes route-specific sports-equipment and excess-baggage schedules.',
      reviewed:'Aug 18, 2026',
      source:'https://www.philippineairlines.com/ph/en/mypal-travel-boost/mypal-baggage-plus/sports-equipment.html',
      rows:[
        ['Philippine domestic','Sports-equipment add-on available above free allowance','USD 25 equivalent for up to 15 kg add-on','Verify current domestic allowance and size rules'],
        ['Philippines ↔ Honolulu / Los Angeles / San Francisco / Seattle / New York','PAL sports-equipment add-on schedule','USD 80 per sector listed for eligible sports equipment','Surfboard excess/oversize rules can still apply depending on allowance and dimensions'],
        ['Philippines ↔ Japan','Route-specific sports/excess-baggage schedule','USD 50 sports-equipment add-on listed for Japan routes','Piece-system excess baggage may apply when outside allowance'],
        ['Other international routes','Weight- or piece-system rules vary by destination','Varies by route','Check exact itinerary; connecting segments can have different allowances']
      ]
    },
    'american-airlines':{
      label:'Varies by route / fare',
      note:'American charges water-sports boards at the standard checked-bag fee for the destination up to 50 lb, so the amount depends on itinerary and fare. Oversize fees are waived for qualifying water-sports boards.',
      reviewed:'Aug 18, 2026',
      source:'https://www.aa.com/pubcontent/en_US/travel-info/baggage/specialty-and-sports.html',
      rows:[
        ['Most routes','1 board bag can contain multiple boards and counts as 1 checked item','Standard checked-bag fee for your destination','Up to 50 lb / 23 kg at standard bag fee; overweight fee applies above 50 lb'],
        ['Travel from Madrid (MAD)','Special checked-item side-length restriction','Standard checked-bag fee for destination','Maximum length of any side: 43 in / 110 cm'],
        ['Any itinerary with another operating carrier','Operating-carrier rules may differ','Check each carrier','Codeshare/connection baggage rules can differ']
      ]
    }
  };
  window.BBF_ROUTE_DEPENDENT=DATA;
  const slug=document.body?.dataset?.slug;
  if(!slug||!DATA[slug]) return;
  const d=DATA[slug];
  document.body.classList.add('route-dependent-airline');
  const fee=document.getElementById('fee');
  if(fee) fee.innerHTML='<span class="route-varies">Varies by route / fare</span><small class="route-varies-sub">See route table below</small>';
  const facts=document.getElementById('facts');
  const anchor=facts?.nextElementSibling || facts;
  if(!facts) return;
  const section=document.createElement('section');
  section.className='section route-policy-section';
  section.id='route-pricing';
  section.innerHTML=`<details class="route-policy-details"><summary><span><strong>${d.label}</strong><small>Open route-specific surfboard rules</small></span><span class="route-chevron">⌄</span></summary><div class="route-policy-body"><p>${d.note}</p><div class="route-table-wrap"><table class="route-table"><thead><tr><th>Route / itinerary</th><th>Surfboard treatment</th><th>Fee / pricing basis</th><th>Key limit / note</th></tr></thead><tbody>${d.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="route-policy-foot"><span>Route table reviewed ${d.reviewed}</span><a href="${d.source}" target="_blank" rel="noopener">Official airline policy ↗</a></div></div></details>`;
  // Put below the verify-before-you-fly strip when possible.
  const verify=facts.parentElement?.querySelector('.verify, .verify-strip, .note');
  if(verify && verify.parentNode) verify.insertAdjacentElement('afterend',section); else facts.insertAdjacentElement('afterend',section);
})();
