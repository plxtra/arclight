import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ScansPageComponent } from './scans.page';

describe('AlertsPage', () => {
  let component: ScansPageComponent;
  let fixture: ComponentFixture<ScansPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), ScansPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(ScansPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
