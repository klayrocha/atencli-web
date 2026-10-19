import { Router } from '@angular/router';
import { WizardService } from '../wizard-shared/wizard.service';
import { ServiceItem, WizardStep3ServicesComponent } from './wizard-step-3-services.component';

describe('WizardStep3ServicesComponent prices', () => {
  let component: WizardStep3ServicesComponent;
  let wizard: jasmine.SpyObj<WizardService>;
  let service: ServiceItem;

  beforeEach(async () => {
    wizard = jasmine.createSpyObj<WizardService>('WizardService', ['saveServices', 'getAbout', 'getServicesByTypeClients', 'getClientServices', 'getClientTypes']);
    wizard.saveServices.and.resolveTo();
    wizard.getAbout.and.resolveTo({ typeClientId: 1 } as Awaited<ReturnType<WizardService['getAbout']>>);
    wizard.getServicesByTypeClients.and.resolveTo([]);
    wizard.getClientServices.and.resolveTo({ clientUuid: 'test', services: [] });
    wizard.getClientTypes.and.resolveTo([]);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    component = new WizardStep3ServicesComponent(router, wizard);
    service = {
      id: 42, name: 'Consulta', icon: 'pi-briefcase', category: 'Serviço',
      suggestedPrice: 200, practicePrice: null, insurancePrice: null,
      duration: 30, enabled: true,
    };
    await component.ngOnInit();
    component.allServices = [service];
  });

  it('blocks an empty price even when the clinic does not accept health plans', async () => {
    component.acceptsHealthPlan = false;
    await component.goNext();
    expect(wizard.saveServices).not.toHaveBeenCalled();
    expect(component.isServiceInvalid(service)).toBeTrue();
    expect(service.practicePrice).toBeNull();
  });

  it('sends an explicit zero for a free service without health plans', async () => {
    component.acceptsHealthPlan = false;
    service.practicePrice = 0;
    await component.goNext();
    expect(wizard.saveServices).toHaveBeenCalledWith([
      { serviceId: 42, price: 0, planPrice: null, durationMinutes: 30 },
    ]);
  });

  it('requires an explicit health plan price when the clinic accepts health plans', async () => {
    service.practicePrice = 0;
    await component.goNext();
    expect(wizard.saveServices).not.toHaveBeenCalled();
    service.insurancePrice = 0;
    await component.goNext();
    expect(wizard.saveServices).toHaveBeenCalledWith([
      { serviceId: 42, price: 0, planPrice: 0, durationMinutes: 30 },
    ]);
  });

  it('blocks saving after a previously filled price is cleared', async () => {
    service.practicePrice = 0;
    service.insurancePrice = 0;
    expect(component.canSave).toBeTrue();
    service.practicePrice = null;
    await component.goNext();
    expect(wizard.saveServices).not.toHaveBeenCalled();
  });

  for (const invalidPrice of [-1, NaN, Infinity]) {
    it(`rejects invalid price ${invalidPrice}`, async () => {
      service.practicePrice = invalidPrice;
      service.insurancePrice = 0;
      await component.goNext();
      expect(wizard.saveServices).not.toHaveBeenCalled();
      service.practicePrice = 0;
      service.insurancePrice = invalidPrice;
      await component.goNext();
      expect(wizard.saveServices).not.toHaveBeenCalled();
    });
  }
});
