import { Directive, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Alteration, FieldDefinition, VaildationDefinition } from "../shared/types/field-management.types";
import { MultiSheetTemplateDirective } from "./multi-sheet.template";

@Directive()
export abstract class FormTemplateDirective extends MultiSheetTemplateDirective implements OnInit {
  public ionicForm: FormGroup = new FormGroup({});
  public inputFields: FieldDefinition[] = [];
  public confirmField: FieldDefinition | undefined;
  public validations: VaildationDefinition[] = [];
  public saveErrors: string[] = [];
  public alteration: Alteration | undefined = undefined;

  public get doingCreate(): boolean {
    return (this.alteration === "create");
  }

  public get doingUpdate(): boolean {
    return (this.alteration === "update");
  }

  public get doingDelete(): boolean {
    return (this.alteration === "delete");
  }

  public get hasSaveErrors(): boolean {
    return (this.saveErrors.length > 0);
  }

  ngOnInit() {
    this.alteration = this.resolveAlteration();
    if (this.alteration === undefined)
      throw Error("Alter action cannot be determined");

    this.resolveInputFields();
    this.resolveValidations();

    this.inputFields.forEach(x => {
      const ctrl = new FormControl('', x.validators);
      this.ionicForm.addControl(x.id, ctrl);
      if (this.doingDelete || !x.enabled)
        ctrl.disable();
    });

    if (this.doingDelete) {
      this.confirmField = {
        id: 'confirm',
        type: 'Text',
        label: 'Delete confirmation',
        placeholder: 'Type DELETE to confrim',
        validators: [(control) => Validators.required(control), () => Validators.pattern("DELETE")],
        visible: true,
        enabled: true,
      };
      this.validations.push(
        { fieldId: 'confirm', type: 'required', message: 'You must confirm the deletion.' },
        { fieldId: 'confirm', type: 'pattern', message: 'You must confirm the deletion.' },
      );
      this.ionicForm.addControl(this.confirmField.id, new FormControl('', this.confirmField.validators))
    }

    this.resolveFieldValues();
  }

  public isFieldValid(field: string): boolean {
    const fld = this.ionicForm.get(field);
    return (fld?.valid || fld?.disabled) ?? false;
  }

  protected addSaveError(error: string) {
    this.saveErrors.push(error);
  }

  protected clearSaveErrors() {
    this.saveErrors = [];
  }
  protected abstract resolveAlteration(): Alteration | undefined;
  protected abstract resolveInputFields(): void;
  protected abstract resolveValidations(): void;
  protected abstract resolveFieldValues(): void;
}
