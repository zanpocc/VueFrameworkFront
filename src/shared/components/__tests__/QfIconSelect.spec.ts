import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import QfIconSelect from '../QfIconSelect.vue';

function mountSelect(modelValue = 'Monitor') {
  return mount(QfIconSelect, {
    props: { modelValue },
    global: {
      plugins: [ElementPlus],
    },
  });
}

describe('QfIconSelect', () => {
  it('renders common Element Plus icon names', () => {
    const wrapper = mountSelect();
    const labels = wrapper
      .findAllComponents({ name: 'ElOption' })
      .map((option) => option.props('label'));

    expect(labels).toContain('Monitor');
    expect(labels).toContain('Setting');
    expect(labels).toContain('Bell');
  });

  it('emits selected icon name', async () => {
    const wrapper = mountSelect();
    const select = wrapper.findComponent({ name: 'ElSelect' });

    select.vm.$emit('update:modelValue', 'Bell');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Bell']);
  });

  it('allows clearing icon value', async () => {
    const wrapper = mountSelect('Bell');
    const select = wrapper.findComponent({ name: 'ElSelect' });

    select.vm.$emit('update:modelValue', '');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
  });
});
