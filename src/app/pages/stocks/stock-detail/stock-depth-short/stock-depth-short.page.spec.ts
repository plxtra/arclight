import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { StockDepthShortPageComponent } from './stock-depth-short.page';

describe('StockDepthShortPage', () => {
  let component: StockDepthShortPageComponent;
  let fixture: ComponentFixture<StockDepthShortPageComponent>;

  beforeEach(waitForAsync () => {
    fixture = TestBed.createComponent(StockDepthShortPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
