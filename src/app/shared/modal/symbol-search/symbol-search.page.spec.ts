import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SymbolSearchPageComponent } from './symbol-search.page';

describe('SymbolSearchPage', () => {
  let component: SymbolSearchPageComponent;
  let fixture: ComponentFixture<SymbolSearchPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), SymbolSearchPageComponent]
}).compileComponents();

    fixture = TestBed.createComponent(SymbolSearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
