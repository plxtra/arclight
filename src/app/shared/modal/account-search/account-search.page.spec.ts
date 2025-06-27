import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AccountSearchPageComponent } from './account-search.page';

describe('AccountSearchPage', () => {
  let component: AccountSearchPageComponent;
  let fixture: ComponentFixture<AccountSearchPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), AccountSearchPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(AccountSearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
