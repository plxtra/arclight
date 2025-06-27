import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConnectionRetryModalComponent } from './connection-retry-modal.component';

describe('ConnectionRetryModalComponent', () => {
  let component: ConnectionRetryModalComponent;
  let fixture: ComponentFixture<ConnectionRetryModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), ConnectionRetryModalComponent]
}).compileComponents();

    fixture = TestBed.createComponent(ConnectionRetryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
