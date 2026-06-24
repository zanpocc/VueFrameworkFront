// zh-CN 文案聚合 —— 按模块拆 namespace。新增 namespace 必须同时在 en-US/index.ts 加同名 export。
import common from './common';
import layout from './layout';
import auth from './auth';
import iam from './iam';

export default {
  common,
  layout,
  auth,
  iam,
};
