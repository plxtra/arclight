import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StandardSecurityControlComponent } from './standard-security-control.component';

describe('StandardSecurityControlComponent', () => {
  let component: StandardSecurityControlComponent;
  let fixture: ComponentFixture<StandardSecurityControlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), StandardSecurityControlComponent]
}).compileComponents();

    fixture = TestBed.createComponent(StandardSecurityControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
