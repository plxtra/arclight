import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StockChartPageComponent } from './stock-chart.page';

describe('StockChartPage', () => {
  let component: StockChartPageComponent;
  let fixture: ComponentFixture<StockChartPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), StockChartPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(StockChartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
