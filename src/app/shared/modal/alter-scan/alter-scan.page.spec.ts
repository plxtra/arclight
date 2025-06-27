import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlterScanPageComponent } from './alter-scan.page';

describe('AlterScanPage', () => {
  let component: AlterScanPageComponent;
  let fixture: ComponentFixture<AlterScanPageComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlterScanPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
