import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import QfCard from '../QfCard.vue';
import QfPageHeader from '../QfPageHeader.vue';
import QfPageShell from '../QfPageShell.vue';
import QfPageToolbar from '../QfPageToolbar.vue';
import QfMetricCard from '../QfMetricCard.vue';

describe('Qf UI primitives', () => {
  it('provides a stable page shell for business pages', () => {
    const wrapper = mount(QfPageShell, {
      slots: { default: '<div class="content">内容</div>' },
    });

    expect(wrapper.classes()).toContain('qf-page-shell');
    expect(wrapper.find('.content').exists()).toBe(true);
  });

  it('renders page header copy and action slot', () => {
    const wrapper = mount(QfPageHeader, {
      props: { title: '用户管理', description: '维护用户信息' },
      slots: { actions: '<button>新增</button>' },
    });

    expect(wrapper.find('h1').text()).toBe('用户管理');
    expect(wrapper.find('p').text()).toBe('维护用户信息');
    expect(wrapper.find('button').text()).toBe('新增');
  });

  it('keeps page toolbar content composable', () => {
    const wrapper = mount(QfPageToolbar, {
      slots: { default: '<button>查询</button>' },
    });

    expect(wrapper.classes()).toContain('qf-page-toolbar');
    expect(wrapper.text()).toContain('查询');
  });

  it('supports card headings, actions and body content', () => {
    const wrapper = mount(QfCard, {
      props: { title: '任务概览', description: '最近任务' },
      slots: { actions: '<button>刷新</button>', default: '<span>内容</span>' },
      global: { plugins: [ElementPlus] },
    });

    expect(wrapper.find('h2').text()).toBe('任务概览');
    expect(wrapper.find('p').text()).toBe('最近任务');
    expect(wrapper.text()).toContain('刷新');
    expect(wrapper.text()).toContain('内容');
  });

  it('keeps metric cards readable and exposes state text', () => {
    const wrapper = mount(QfMetricCard, {
      props: {
        label: '需人工处理',
        value: 3,
        caption: '失败或进入人工介入的异步任务',
        tone: 'danger',
        loading: false,
      },
      global: { plugins: [ElementPlus] },
    });

    expect(wrapper.classes()).toContain('qf-metric-card--danger');
    expect(wrapper.find('.qf-metric-card__label').text()).toBe('需人工处理');
    expect(wrapper.find('.qf-metric-card__value').text()).toBe('3');
    expect(wrapper.find('.qf-metric-card__caption').text()).toContain('失败');
  });
});
