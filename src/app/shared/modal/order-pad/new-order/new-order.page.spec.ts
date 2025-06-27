import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NewOrderPageComponent } from './new-order.page';

describe('NewOrderPage', () => {
  let component: NewOrderPageComponent;
  let fixture: ComponentFixture<NewOrderPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), NewOrderPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(NewOrderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
