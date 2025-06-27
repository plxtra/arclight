import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OpenOrdersPageComponent } from './open-orders.page';

describe('OpenOrdersPage', () => {
  let component: OpenOrdersPageComponent;
  let fixture: ComponentFixture<OpenOrdersPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), OpenOrdersPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(OpenOrdersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
