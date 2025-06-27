import { TraitOperator } from "./trait-operator.type";
import { TraitSearchMethod } from "./trait-search-method.type";

export interface TraitCriteriaModel {
  operator: TraitOperator;
  arg1: string;
  arg2: string;
  as: TraitSearchMethod;
  ignoreCase: boolean;
}
