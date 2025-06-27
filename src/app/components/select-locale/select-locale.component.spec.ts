import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectLocaleComponent } from './select-locale.component';

describe('SelectLocaleComponent', () => {
  let component: SelectLocaleComponent;
  let fixture: ComponentFixture<SelectLocaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SelectLocaleComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SelectLocaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
