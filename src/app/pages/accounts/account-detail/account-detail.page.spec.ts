import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AccountDetailPageComponent } from './account-detail.page';

describe('AccountDetailPage', () => {
  let component: AccountDetailPageComponent;
  let fixture: ComponentFixture<AccountDetailPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), AccountDetailPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(AccountDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
