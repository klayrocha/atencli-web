import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { WizardAssistantComponent } from './wizard-assistant.component';

describe('Floating configuration assistant', () => {
  let events: Subject<NavigationEnd>;
  beforeEach(async () => {
    events = new Subject();
    await TestBed.configureTestingModule({
      imports: [WizardAssistantComponent],
      providers: [{ provide: Router, useValue: { url: '/wizard-step-1-aboult', events } }],
    }).compileComponents();
  });

  it('starts collapsed and collapses again when changing steps', () => {
    const fixture = TestBed.createComponent(WizardAssistantComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bubble')).toBeNull();
    fixture.componentInstance.expanded.set(true);
    events.next(new NavigationEnd(1, '/wizard-step-4-schedule', '/wizard-step-4-schedule'));
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toBeFalse();
    expect(fixture.componentInstance.guidance()?.title).toContain('horários');
  });

  it('opens on mouse hover and closes when the pointer leaves', () => {
    const fixture = TestBed.createComponent(WizardAssistantComponent);
    fixture.detectChanges();
    const aside: HTMLElement = fixture.nativeElement.querySelector('aside');
    aside.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    fixture.detectChanges();
    expect(aside.classList.contains('expanded')).toBeTrue();
    expect(aside.querySelector('.bubble')).not.toBeNull();
    aside.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    fixture.detectChanges();
    expect(aside.querySelector('.bubble')).toBeNull();
  });

  it('opens by tapping the avatar and exposes the guide inside the balloon', () => {
    const fixture = TestBed.createComponent(WizardAssistantComponent);
    fixture.detectChanges();
    const avatar: HTMLButtonElement = fixture.nativeElement.querySelector('.avatar');
    avatar.click(); fixture.detectChanges();
    expect(avatar.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.guide').getAttribute('href')).toContain('primeiros-passos');
    fixture.nativeElement.querySelector('.close').click(); fixture.detectChanges();
    expect(avatar.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the balloon open while keyboard focus moves inside it', () => {
    const fixture = TestBed.createComponent(WizardAssistantComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.onFocusIn();
    component.onPointerLeave();
    expect(component.expanded()).toBeTrue();
    fixture.detectChanges();
    const aside = fixture.nativeElement.querySelector('aside');
    aside.dispatchEvent(new FocusEvent('focusout', { relatedTarget: aside.querySelector('.guide') }));
    expect(component.expanded()).toBeTrue();
    aside.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }));
    expect(component.expanded()).toBeFalse();
  });
});
