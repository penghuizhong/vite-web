import { test, expect } from '@playwright/test'

// Unique test user to avoid conflicts
const TEST_EMAIL = `e2e_test_${Date.now()}@example.com`
const TEST_PASSWORD = 'testpassword123'
const TEST_NICKNAME = 'E2E测试用户'

test.describe('用户注册与登录流程', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    // Wait for the app to load
    await page.waitForLoadState('networkidle')
  })

  test('should register a new user successfully and see user info', async ({ page }) => {
    // Step 1: Click the register button in the sidebar (opens modal in login mode)
    await page.getByRole('complementary').getByRole('button', { name: '注册' }).click()

    // Step 2: Switch to register mode
    await page.getByRole('button', { name: '立即注册' }).click()

    // Step 3: Verify auth modal is in register mode
    await expect(page.locator('h2')).toContainText('注册')

    // Step 4: Fill in the registration form
    await page.getByPlaceholder('请输入昵称').fill(TEST_NICKNAME)
    await page.getByPlaceholder('请输入邮箱').fill(TEST_EMAIL)
    await page.getByPlaceholder('请输入密码').fill(TEST_PASSWORD)

    // Step 5: Submit the form (use the form's submit button, not the sidebar button)
    await page.locator('form').getByRole('button', { name: '注册' }).click()

    // Step 6: Wait for the modal to close (successful registration)
    await expect(page.locator('form')).not.toBeVisible({ timeout: 10000 })

    // Step 7: Verify user is logged in - check sidebar shows user info
    await expect(page.getByRole('complementary').getByText(TEST_NICKNAME)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('complementary').getByText(TEST_EMAIL)).toBeVisible()

    // Step 8: Verify logout button is visible
    await expect(page.getByLabel('登出')).toBeVisible()

    console.log(`✅ 注册成功: ${TEST_EMAIL}`)
  })

  test('should login with existing credentials successfully', async ({ page }) => {
    // First, register a user via API to ensure it exists
    const registerResponse = await page.request.post('http://localhost:8000/api/v1/auth/register', {
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        nickname: TEST_NICKNAME,
      },
    })

    // If registration fails with 409 (already exists), that's fine - user exists
    if (registerResponse.status() !== 201 && registerResponse.status() !== 409) {
      throw new Error(`Registration failed with status: ${registerResponse.status()}`)
    }

    // Now logout if already logged in (clear localStorage)
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
    })

    // Reload the page to reset auth state
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Step 1: Click the login button in the sidebar
    await page.getByRole('complementary').getByRole('button', { name: '登录' }).click()

    // Step 2: Verify auth modal is open and in login mode
    await expect(page.locator('h2')).toContainText('登录')

    // Step 3: Fill in the login form
    await page.getByPlaceholder('请输入邮箱').fill(TEST_EMAIL)
    await page.getByPlaceholder('请输入密码').fill(TEST_PASSWORD)

    // Step 4: Submit the form (use the form's submit button)
    await page.locator('form').getByRole('button', { name: '登录' }).click()

    // Step 5: Wait for the modal to close (successful login)
    await expect(page.locator('form')).not.toBeVisible({ timeout: 10000 })

    // Step 6: Verify user is logged in - check sidebar shows user info
    await expect(page.getByRole('complementary').getByText(TEST_NICKNAME)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('complementary').getByText(TEST_EMAIL)).toBeVisible()

    console.log(`✅ 登录成功: ${TEST_EMAIL}`)
  })

  test('should show error on invalid login credentials', async ({ page }) => {
    // Step 1: Click the login button in the sidebar
    await page.getByRole('complementary').getByRole('button', { name: '登录' }).click()

    // Step 2: Fill in wrong credentials
    await page.getByPlaceholder('请输入邮箱').fill('wrong@example.com')
    await page.getByPlaceholder('请输入密码').fill('wrongpassword')

    // Step 3: Submit the form (use the form's submit button)
    await page.locator('form').getByRole('button', { name: '登录' }).click()

    // Step 4: Verify error message is shown
    await expect(page.getByText('登录失败')).toBeVisible({ timeout: 10000 })

    console.log('✅ 错误登录处理正确')
  })

  test('should switch between login and register modes', async ({ page }) => {
    // Step 1: Open auth modal via login button (starts in login mode)
    await page.getByRole('complementary').getByRole('button', { name: '登录' }).click()
    await expect(page.locator('h2')).toContainText('登录')

    // Step 2: Switch to register mode
    await page.getByRole('button', { name: '立即注册' }).click()
    await expect(page.locator('h2')).toContainText('注册')

    // Step 3: Switch back to login mode
    await page.getByRole('button', { name: '立即登录' }).click()
    await expect(page.locator('h2')).toContainText('登录')

    console.log('✅ 模式切换正常')
  })
})
