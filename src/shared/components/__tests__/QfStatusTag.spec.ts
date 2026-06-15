import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import QfStatusTag from '../QfStatusTag.vue';

function mountTag(props: {
  status: string;
  mapping?: Record<string, 'success' | 'warning' | 'danger' | 'info'>;
  labelMapping?: Record<string, string>;
  label?: string;
}) {
  return mount(QfStatusTag, {
    props,
    global: {
      plugins: [ElementPlus],
    },
  });
}

describe('QfStatusTag', () => {
  it('renders default Chinese label for known status', () => {
    const wrapper = mountTag({ status: 'ENABLED' });
    expect(wrapper.text()).toContain('启用');
  });

  it('uses custom label when provided', () => {
    const wrapper = mountTag({ status: 'ENABLED', label: '已启用' });
    expect(wrapper.text()).toContain('已启用');
  });

  it('maps ENABLED to success type', () => {
    const wrapper = mountTag({ status: 'ENABLED' });
    const tag = wrapper.find('.el-tag');
    expect(tag.classes()).toContain('el-tag--success');
  });

  it('maps FAILED to danger type', () => {
    const wrapper = mountTag({ status: 'FAILED' });
    const tag = wrapper.find('.el-tag');
    expect(tag.classes()).toContain('el-tag--danger');
  });

  it('maps PENDING to warning type', () => {
    const wrapper = mountTag({ status: 'PENDING' });
    const tag = wrapper.find('.el-tag');
    expect(tag.classes()).toContain('el-tag--warning');
  });

  it('uses info type for unknown status', () => {
    const wrapper = mountTag({ status: 'SOMETHING_ELSE' });
    const tag = wrapper.find('.el-tag');
    expect(tag.classes()).toContain('el-tag--info');
    expect(wrapper.text()).toContain('SOMETHING_ELSE');
  });

  it('custom mapping overrides default', () => {
    const wrapper = mountTag({
      status: 'ENABLED',
      mapping: { ENABLED: 'danger' },
    });
    const tag = wrapper.find('.el-tag');
    expect(tag.classes()).toContain('el-tag--danger');
  });

  it('custom label mapping overrides default label', () => {
    const wrapper = mountTag({
      status: 'ENABLED',
      labelMapping: { ENABLED: '正常' },
    });
    expect(wrapper.text()).toContain('正常');
  });
});
