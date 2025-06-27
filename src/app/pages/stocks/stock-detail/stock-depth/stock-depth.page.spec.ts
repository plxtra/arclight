import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StockDepthPageComponent } from './stock-depth.page';

describe('StockDepthPage', () => {
  let component: StockDepthPageComponent;
  let fixture: ComponentFixture<StockDepthPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), StockDepthPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(StockDepthPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
