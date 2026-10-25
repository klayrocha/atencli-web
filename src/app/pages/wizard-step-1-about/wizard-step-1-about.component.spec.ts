import { Router } from '@angular/router';
import { WizardService } from '../wizard-shared/wizard.service';
import { WizardStep1AboutComponent } from './wizard-step-1-about.component';

describe('Clinic type removal', () => {
  beforeEach(() => sessionStorage.removeItem('wizard_step1_draft'));
  afterEach(() => sessionStorage.removeItem('wizard_step1_draft'));

  async function setup(fail = false) {
    const api = {
      getStates: async () => [], getHealthPlans: async () => [],
      getClientTypes: async () => [{ id: '1', name: 'Medicina' }, { id: '2', name: 'Odontologia' }],
      getAbout: async () => ({ typeClientId: 1, typeClientIds: [1, 2] }),
      getClientHealthPlans: async () => ({ healthPlans: [] }),
      getClientSpecialties: async () => {
        if (fail) throw new Error('offline');
        return { specialties: [{ id: 10, name: 'Cardiologia' }] };
      },
      getSpecialtiesByTypeClients: async () => [{ id: '10', name: 'Cardiologia', typeClientId: 1 }],
    };
    const component = new WizardStep1AboutComponent({} as Router, api as unknown as WizardService);
    await component.ngOnInit();
    return component;
  }

  it('keeps the type with selected specialties and allows removing an empty type', async () => {
    const component = await setup();
    component.onClinicTypesChange([]);
    expect(component.clinicTypeIds).toEqual(['1']);
    expect(component.clinicTypeError()).toContain('especialidades');
    component.onClinicTypesChange(['1', '2']);
    expect(component.clinicTypeError()).toBe('');
    component.onClinicTypesChange(['1']);
    expect(component.clinicTypeIds).toEqual(['1']);
  });

  it('prevents removal when specialties could not be checked', async () => {
    const component = await setup(true);
    component.onClinicTypesChange([]);
    expect(component.clinicTypeIds).toEqual(['1', '2']);
    expect(component.clinicTypeError()).toContain('Recarregue');
  });
});
