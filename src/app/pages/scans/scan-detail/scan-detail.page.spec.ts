import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScanDetailPageComponent } from './scan-detail.page';

describe('ScanDetailPage', () => {
  let component: ScanDetailPageComponent;
  let fixture: ComponentFixture<ScanDetailPageComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
