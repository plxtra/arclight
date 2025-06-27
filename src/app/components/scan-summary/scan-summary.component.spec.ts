import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanSummaryComponent } from './scan-summary.component';

describe('ScanSummaryComponent', () => {
  let component: ScanSummaryComponent;
  let fixture: ComponentFixture<ScanSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ScanSummaryComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(ScanSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
