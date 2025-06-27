import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OpenOrdersControlComponent } from './open-orders-control.component';

describe('OpenOrdersControlComponent', () => {
  let component: OpenOrdersControlComponent;
  let fixture: ComponentFixture<OpenOrdersControlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), OpenOrdersControlComponent]
}).compileComponents();

    fixture = TestBed.createComponent(OpenOrdersControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
