import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraitConditionComponent } from './trait-condition.component';

describe('TraitConditionComponent', () => {
  let component: TraitConditionComponent;
  let fixture: ComponentFixture<TraitConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TraitConditionComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TraitConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
