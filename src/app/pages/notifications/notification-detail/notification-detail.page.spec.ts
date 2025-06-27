import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationDetailPageComponent } from './notification-detail.page';

describe('NotificationDetailPage', () => {
  let component: NotificationDetailPageComponent;
  let fixture: ComponentFixture<NotificationDetailPageComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
