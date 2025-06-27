import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeekSymbolComponent } from './seek-symbol.component';

describe('SeekSymbolComponent', () => {
  let component: SeekSymbolComponent;
  let fixture: ComponentFixture<SeekSymbolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SeekSymbolComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SeekSymbolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
