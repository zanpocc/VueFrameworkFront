import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import { router } from './router';
import { permissionDirective } from './permissions/directive';
import { i18n } from './locales';
import { useLocaleStore } from './stores/locale';
import './assets/tokens/index.css';
import './styles/base.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(ElementPlus);
app.directive('permission', permissionDirective);

// Initialize locale store eagerly so axios Accept-Language is set before the
// first request (router guards may call protected APIs immediately on boot).
useLocaleStore();

app.mount('#app');
