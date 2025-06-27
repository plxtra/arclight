import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AmendOrderPageComponent } from './amend-order.page';

describe('AmendOrderPage', () => {
  let component: AmendOrderPageComponent;
  let fixture: ComponentFixture<AmendOrderPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), AmendOrderPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(AmendOrderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
