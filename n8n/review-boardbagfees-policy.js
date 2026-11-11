function reviewBoardBagFeesPolicy(extraction, current, markdown) {
  const oldFacts = current.policy_facts || {};
  const facts = { ...oldFacts };
  const normalize = value => String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const numbers = value => (normalize(value).match(/\d[\d,.]*/g) || [])
    .map(number => number.replace(/,/g, '').replace(/\.$/, ''));
  const source = normalize(markdown);
  const confidence = Number(extraction.confidence) || 0;
  const treatmentScores = {
    included: 5, free_additional_allowance: 5, normal_checked_bag: 4,
    conditional: 3, special_fee: 2, not_accepted: 0
  };
  const labels = ['Terrible', 'Bad', 'Okay', 'Good', 'Very good', 'Excellent'];

  function supported(field, previous) {
    const proposed = extraction[field];
    if (!normalize(proposed) || normalize(proposed) === normalize(previous) || confidence < 0.95) {
      return previous;
    }
    const quote = normalize(extraction.evidence?.[field]);
    if (quote.length < 20 || !source.includes(quote)) return previous;

    const quotedNumbers = new Set(numbers(quote));
    if (!numbers(proposed).every(number => quotedNumbers.has(number))) return previous;

    // Preserve old restrictions unless the cited passage addresses them.
    const nextNumbers = new Set(numbers(proposed));
    if (!numbers(previous).every(number => nextNumbers.has(number) || quotedNumbers.has(number))) {
      return previous;
    }
    if (previous && field !== 'fee_text' && field !== 'baggage_treatment' &&
        normalize(proposed) !== normalize(quote)) return previous;
    return proposed;
  }

  for (const field of ['fee_text', 'max_length_text', 'max_weight_text',
    'boards_per_bag_text', 'route_restrictions', 'other_conditions']) {
    const value = supported(field, oldFacts[field]);
    if (value !== undefined) facts[field] = value;
  }

  const oldTreatment = oldFacts.baggage_treatment;
  const proposedTreatment = supported('baggage_treatment', oldTreatment);
  if (Object.hasOwn(treatmentScores, proposedTreatment) &&
      (proposedTreatment === oldTreatment || facts.fee_text !== oldFacts.fee_text)) {
    facts.baggage_treatment = proposedTreatment;
    if (extraction.has_surfboard_policy === true) facts.has_surfboard_policy = true;
  }

  const score = facts.baggage_treatment !== oldTreatment
    ? treatmentScores[facts.baggage_treatment]
    : current.surf_rating_score;
  const rating = Number.isInteger(score) && labels[score] ? labels[score] : current.surf_rating;
  return {
    p_policy_url: current.policy_url,
    p_airline: current.airline,
    p_facts: facts,
    p_confidence: confidence,
    p_surfboard_treatment: supported('surfboard_treatment', current.surfboard_treatment) ?? null,
    p_size_rule: supported('size_rule', current.size_rule) ?? null,
    p_surf_rating_score: score ?? null,
    p_surf_rating: rating ?? null,
    p_notes: current.agent_notes ?? null
  };
}
