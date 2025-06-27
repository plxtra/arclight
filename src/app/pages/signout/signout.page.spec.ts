import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SignoutPageComponent } from './signout.page';

describe('SignoutPage', () => {
  let component: SignoutPageComponent;
  let fixture: ComponentFixture<SignoutPageComponent>;

  beforeEach(waitForAsync () => {
    fixture = TestBed.createComponent(SignoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
