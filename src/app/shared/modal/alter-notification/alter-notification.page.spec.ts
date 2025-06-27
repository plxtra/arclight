import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlterNotificationPageComponent } from './alter-notification.page';

describe('AlterNotificationPage', () => {
  let component: AlterNotificationPageComponent;
  let fixture: ComponentFixture<AlterNotificationPageComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlterNotificationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
