import { scenario1_theft } from './scenario1-theft';
import { scenario2_murder } from './scenario2-murder';
import { scenario3_missing } from './scenario3-missing';
import { scenario4_fraud } from './scenario4-fraud';
import { scenario5_identity } from './scenario5-identity';

// TODO: Add more scenarios
// - Scenario 6+: Additional mysteries

export const SCENARIOS = {
  [scenario1_theft.id]: scenario1_theft,
  [scenario2_murder.id]: scenario2_murder,
  [scenario3_missing.id]: scenario3_missing,
  [scenario4_fraud.id]: scenario4_fraud,
  [scenario5_identity.id]: scenario5_identity,
};

export const AVAILABLE_SCENARIOS = Object.values(SCENARIOS);
