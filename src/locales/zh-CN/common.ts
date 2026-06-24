// 通用按钮 / toast / placeholder / 校验 —— 跨业务模块复用的原子文案。
// 新增同名 key 时，必须同步加到 en-US/common.ts，否则缺失语种回落到 zh-CN。
export default {
  button: {
    add: '新增',
    create: '创建',
    edit: '编辑',
    update: '更新',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    confirm: '确定',
    submit: '提交',
    reset: '重置',
    search: '查询',
    refresh: '刷新',
    export: '导出',
    import: '导入',
    detail: '详情',
    enable: '启用',
    disable: '禁用',
    all: '全部',
    more: '更多',
    authorize: '授权',
    resetPassword: '重置密码',
  },
  status: {
    enabled: '启用',
    disabled: '禁用',
  },
  placeholder: {
    input: '请输入',
    select: '请选择',
    search: '请输入关键字',
  },
  toast: {
    success: '操作成功',
    fail: '操作失败',
    saved: '保存成功',
    deleted: '删除成功',
    networkError: '网络异常，请稍后再试',
    unauthorized: '未登录或登录已过期',
    forbidden: '没有权限执行该操作',
  },
  validation: {
    required: '此项必填',
    email: '邮箱格式不正确',
    minLength: '至少 {min} 个字符',
  },
  empty: {
    default: '暂无数据',
  },
};
