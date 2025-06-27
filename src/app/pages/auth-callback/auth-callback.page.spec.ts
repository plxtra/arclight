import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AuthCallbackPageComponent } from './auth-callback.page';

describe('AuthenticationCallbackPage', () => {
  let component: AuthCallbackPageComponent;
  let fixture: ComponentFixture<AuthCallbackPageComponent>;

  beforeEach(waitForAsync () => {
    fixture = TestBed.createComponent(AuthCallbackPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
