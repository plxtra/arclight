import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StockDetailPage } from './stock-detail.page';

describe('StockDetailPage', () => {
  let component: StockDetailPage;
  let fixture: ComponentFixture<StockDetailPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), StockDetailPage]
}).compileComponents();

    fixture = TestBed.createComponent(StockDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
