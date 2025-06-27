import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CancelOrderPageComponent } from './cancel-order.page';

describe('CancelOrderPage', () => {
  let component: CancelOrderPageComponent;
  let fixture: ComponentFixture<CancelOrderPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), CancelOrderPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(CancelOrderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
