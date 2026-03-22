import { scenario1_theft } from './scenario1-theft';

// TODO: Add more scenarios
// - Scenario 2: Murder mystery
// - Scenario 3: Missing person
// - Scenario 4: Corporate fraud
// - Scenario 5: Secret identity

export const SCENARIOS = {
  [scenario1_theft.id]: scenario1_theft,
};

export const AVAILABLE_SCENARIOS = Object.values(SCENARIOS);
