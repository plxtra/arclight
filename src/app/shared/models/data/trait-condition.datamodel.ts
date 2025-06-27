import { TraitCriteriaModel } from "../scans/trait-criteria.model";
import { TraitMeets } from "../scans/trait-meets.type";
import { TraitStyle } from "../scans/trait-style.type";

export interface TraitConditionDataModel {
  fieldId: string;
  fieldDisplay: string;
  fieldStyle: TraitStyle;
  meets: TraitMeets;
  criteria: TraitCriteriaModel[];
}
