import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import { router } from './router';
import { permissionDirective } from './permissions/directive';
import './assets/tokens/index.css';
import './styles/base.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.directive('permission', permissionDirective);
app.mount('#app');
