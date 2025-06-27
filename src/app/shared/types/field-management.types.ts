import { ValidatorFn } from "@angular/forms";

export type FormControlType = "Text" | "Flag";

export interface FieldDefinition {
  id: string;
  type: FormControlType;
  label: string;
  placeholder: string;
  validators: ValidatorFn[];
  visible: boolean;
  enabled: boolean;
}

export interface VaildationDefinition {
  fieldId: string;
  type: string;
  message: string;
}

export type Alteration = "create" | "update" | "delete";
