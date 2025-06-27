import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StockTradesPageComponent } from './stock-trades.page';

describe('StockTradesPage', () => {
  let component: StockTradesPageComponent;
  let fixture: ComponentFixture<StockTradesPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), StockTradesPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(StockTradesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
