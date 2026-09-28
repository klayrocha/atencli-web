import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { WizardStep8ReviewComponent } from './wizard-step-8-review.component';

describe('Review entry context', () => {
  it('expands settings from the menu and restores the normal onboarding presentation', () => {
    const params = new BehaviorSubject(convertToParamMap({ source: 'menu' }));
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new WizardStep8ReviewComponent(
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      { queryParamMap: params.asObservable() } as ActivatedRoute,
    ));
    expect(component.fromSettingsMenu).toBeTrue();
    expect(component.reviewExpanded).toBeTrue();
    params.next(convertToParamMap({}));
    expect(component.fromSettingsMenu).toBeFalse();
    expect(component.reviewExpanded).toBeFalse();
  });
});
