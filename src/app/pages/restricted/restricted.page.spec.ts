import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RestrictedPageComponent } from './restricted.page';

describe('RestrictedPage', () => {
  let component: RestrictedPageComponent;
  let fixture: ComponentFixture<RestrictedPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), RestrictedPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(RestrictedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
