import { expect, test } from '@playwright/test';

test('logs in through the real monolith backend and opens system config', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('请输入账号').fill('admin');
  await page.getByPlaceholder('请输入密码').fill('admin123');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();
  await expect(page.getByRole('button', { name: /新增用户/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /工作台/ })).toBeVisible();

  await page.getByRole('menuitem', { name: /系统管理/ }).click();
  await page.getByRole('menuitem', { name: /系统配置/ }).click();

  await expect(page.getByRole('heading', { name: '系统配置' })).toBeVisible();
  await expect(page.getByText('platform.name')).toBeVisible();
});
