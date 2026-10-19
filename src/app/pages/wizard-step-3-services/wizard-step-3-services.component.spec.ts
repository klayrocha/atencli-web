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

  it('reveals all selected items when validation fails, clearing text filters', async () => {
    component.changeSearch('oculto');
    component.exclusionInput = 'Consulta'; component.addExclusion();
    await component.saveConfiguration();
    expect(component.showSelectedOnly).toBeTrue();
    expect(component.searchTerm).toBe('');
    expect(component.excludedTerms).toEqual([]);
    expect(component.pagedServices).toContain(service);
    expect(wizard.saveServices).not.toHaveBeenCalled();
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

describe('Service search and exclusions', () => {
  let page: WizardStep3ServicesComponent;
  beforeEach(() => {
    page = new WizardStep3ServicesComponent({} as Router, {} as WizardService);
    page.allServices = ['Avaliação infantil', 'Avaliação adulto', 'Limpeza', 'Consulta'].map((name, id) => ({
      id, name, category: 'Odontologia', icon: '', enabled: true,
      suggestedPrice: 100, practicePrice: 50, insurancePrice: 30, duration: 30,
    }));
    page.configurationChanges.markSaved();
  });
  it('searches names and areas ignoring accents and case and resets pagination', () => {
    page.currentPage.set(3);
    page.changeSearch(' AVALIACAO ');
    expect(page.filteredServices.map(s => s.id)).toEqual([0, 1]);
    expect(page.currentPage()).toBe(1);
    page.changeSearch('odonto');
    expect(page.filteredServices.length).toBe(4);
    expect(page.configurationChanges.hasChanges()).toBeFalse();
  });
  it('combines search and multiple removable exclusions without changing form data', () => {
    page.changeSearch('avaliação');
    page.exclusionInput = 'infantil'; page.addExclusion();
    expect(page.filteredServices.map(s => s.id)).toEqual([1]);
    page.exclusionInput = 'adulto'; page.addExclusion();
    expect(page.filteredServices.length).toBe(0);
    page.removeExclusion('infantil');
    expect(page.filteredServices.map(s => s.id)).toEqual([0]);
    expect(page.allServices[0].practicePrice).toBe(50);
    expect(page.selectedServices.length).toBe(4);
    expect(page.configurationChanges.hasChanges()).toBeFalse();
  });
  it('ignores empty or equivalent exclusion tags', () => {
    for (const term of ['  ', 'Avaliação', ' AVALIACAO ']) {
      page.exclusionInput = term; page.addExclusion();
    }
    expect(page.excludedTerms).toEqual(['Avaliação']);
    expect(page.filteredServices.map(s => s.id)).toEqual([2, 3]);
  });
  it('paginates the filtered list and selects only its visible page', () => {
    page.allServices.forEach(s => s.enabled = false);
    page.pageSize = 1;
    page.changeSearch('avaliação');
    expect(page.totalPages()).toBe(2);
    page.currentPage.set(2); page.togglePageSelection();
    expect(page.selectedServices.map(s => s.id)).toEqual([1]);
    page.changeSearch('inexistente');
    expect(page.totalPages()).toBe(1);
    expect(page.pagedServices).toEqual([]);
  });
  it('shows the current page and at most three following pages, including the end of the list', () => {
    page.allServices = Array.from({length: 100}, (_, id) => ({ ...page.allServices[0], id }));
    expect(page.pagesArray).toEqual([1, 2, 3, 4]);
    page.currentPage.set(5);
    expect(page.pagesArray).toEqual([5, 6, 7, 8]);
    page.currentPage.set(9);
    expect(page.pagesArray).toEqual([9, 10]);
    page.currentPage.set(10);
    expect(page.pagesArray).toEqual([10]);
    page.changeSearch('inexistente');
    expect(page.pagesArray).toEqual([1]);
  });

  it('filters selected items and keeps pagination valid after deselecting the last page', () => {
    page.allServices[0].enabled = false;
    page.changeSelectedOnly(true);
    expect(page.filteredServices.map(s => s.id)).toEqual([1, 2, 3]);
    page.pageSize = 1;
    page.currentPage.set(3);
    page.toggleService(page.pagedServices[0]);
    expect(page.currentPage()).toBe(2);
    expect(page.pagedServices.map(s => s.id)).toEqual([2]);
    page.clearFilters();
    expect(page.showSelectedOnly).toBeFalse();
    expect(page.filteredServices.length).toBe(4);
  });

});
