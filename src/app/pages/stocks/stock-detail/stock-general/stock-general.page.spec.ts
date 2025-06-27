import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StockGeneralPageComponent } from './stock-general.page';

describe('StockGeneralPage', () => {
  let component: StockGeneralPageComponent;
  let fixture: ComponentFixture<StockGeneralPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), StockGeneralPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(StockGeneralPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
