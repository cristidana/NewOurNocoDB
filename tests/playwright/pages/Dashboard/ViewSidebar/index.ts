import { expect, Locator } from '@playwright/test';
import { DashboardPage } from '..';
import BasePage from '../../Base';

export class ViewSidebarPage extends BasePage {
  readonly project: any;

  readonly dashboard: DashboardPage;
  readonly createGalleryButton: Locator;
  readonly createGridButton: Locator;
  readonly createFormButton: Locator;
  readonly createKanbanButton: Locator;
  readonly createMapButton: Locator;

  readonly erdButton: Locator;
  readonly apiSnippet: Locator;
  readonly webhookButton: Locator;

  constructor(dashboard: DashboardPage) {
    super(dashboard.rootPage);
    this.dashboard = dashboard;

    this.createGalleryButton = this.get().locator('.nc-create-gallery-view:visible');
    this.createGridButton = this.get().locator('.nc-create-grid-view:visible');
    this.createFormButton = this.get().locator('.nc-create-form-view:visible');
    this.createKanbanButton = this.get().locator('.nc-create-kanban-view:visible');

    this.erdButton = this.get().locator('.nc-view-sidebar-erd');
    this.apiSnippet = this.get().locator('.nc-view-sidebar-api-snippet');
    this.webhookButton = this.get().locator('.nc-view-sidebar-webhook');
  }

  get() {
    return this.dashboard.get().locator('.nc-view-sidebar');
  }

  async isVisible() {
    return await this.get().isVisible();
  }

  async verifyVisibility({ isVisible }: { isVisible: boolean }) {
    if (isVisible) {
      await expect(this.get()).toBeVisible();
    } else {
      await expect(this.get()).not.toBeVisible();
    }
  }

  async changeBetaFeatureToggleValue() {
    await this.dashboard.rootPage.evaluate(_ => {
      window.localStorage.setItem('betaFeatureToggleState', 'true');
    });
    await this.rootPage.goto(this.rootPage.url());
  }

  private async createView({ title, locator }: { title: string; locator: Locator }) {
    await this.rootPage.waitForTimeout(1000);
    await locator.click();
    await this.rootPage.locator('input[id="form_item_title"]:visible').waitFor({ state: 'visible' });
    await this.rootPage.locator('input[id="form_item_title"]:visible').fill(title);
    const submitAction = () =>
      this.rootPage.locator('.ant-modal-content').locator('button.ant-btn.ant-btn-primary').click();
    await this.waitForResponse({
      httpMethodsToMatch: ['POST'],
      requestUrlPathToMatch: '/api/v1/db/meta/tables/',
      uiAction: submitAction,
      responseJsonMatcher: json => json.title === title,
    });
    await this.verifyToast({ message: 'View created successfully' });
    // Todo: Wait for view to be rendered
    await this.rootPage.waitForTimeout(1000);
  }

  async createGalleryView({ title }: { title: string }) {
    await this.createView({ title, locator: this.createGalleryButton });
  }

  async createGridView({ title }: { title: string }) {
    await this.createView({ title, locator: this.createGridButton });
  }

  async createFormView({ title }: { title: string }) {
    await this.createView({ title, locator: this.createFormButton });
  }

  async openView({ title }: { title: string }) {
    await this.get().waitFor({ state: 'visible' });
    await this.get().locator(`[data-testid="view-sidebar-view-${title}"]`).waitFor({ state: 'visible' });
    await this.get().locator(`[data-testid="view-sidebar-view-${title}"]`).click();
  }

  async createKanbanView({ title }: { title: string }) {
    await this.createView({ title, locator: this.createKanbanButton });
  }

  async createMapView({ title }: { title: string }) {
    await this.createView({ title, locator: this.createMapButton });
  }

  // Todo: Make selection better
  async verifyView({ title, index }: { title: string; index: number }) {
    // flicker while page loading
    await this.get()
      .locator('[data-testid="view-item"]')
      .nth(index)
      .locator('[data-testid="sidebar-view-title"]')
      .waitFor({ state: 'visible' });

    await expect(
      this.get().locator('[data-testid="view-item"]').nth(index).locator('[data-testid="sidebar-view-title"]')
    ).toHaveText(title, { ignoreCase: true });
  }

  async verifyViewNotPresent({ title, index }: { title: string; index: number }) {
    const viewList = this.get().locator(`.nc-views-menu`).locator('.ant-menu-title-content');
    if ((await viewList.count()) <= index) {
      return true;
    }

    return await expect(
      this.get().locator(`.nc-views-menu`).locator('.ant-menu-title-content').nth(index)
    ).not.toHaveText(title);
  }

  async reorderViews({ sourceView, destinationView }: { sourceView: string; destinationView: string }) {
    await this.dashboard
      .get()
      .locator(`[data-testid="view-sidebar-drag-handle-${sourceView}"]`)
      .dragTo(this.get().locator(`[data-testid="view-sidebar-view-${destinationView}"]`));
  }

  async deleteView({ title }: { title: string }) {
    await this.get().locator(`[data-testid="view-sidebar-view-${title}"]`).hover();
    await this.get()
      .locator(`[data-testid="view-sidebar-view-${title}"]`)
      .locator('.nc-view-sidebar-node-context-btn')
      .click();

    await this.rootPage
      .locator(`[data-testid="view-sidebar-view-actions-${title}"]`)
      .locator('.nc-view-delete-icon')
      .click();

    await this.rootPage.locator('button:has-text("Delete View"):visible').click();
  }

  async renameView({ title, newTitle }: { title: string; newTitle: string }) {
    await this.get().locator(`[data-testid="view-sidebar-view-${title}"]`).dblclick();
    await this.get().locator(`[data-testid="view-sidebar-view-${title}"]`).locator('input').fill(newTitle);
    await this.get().press('Enter');
    await this.verifyToast({ message: 'View renamed successfully' });
  }

  async copyView({ title }: { title: string }) {
    await this.get().locator(`[data-testid="view-sidebar-view-${title}"]`).hover();
    await this.get()
      .locator(`[data-testid="view-sidebar-view-${title}"]`)
      .locator('.nc-view-sidebar-node-context-btn')
      .click();

    await this.rootPage
      .locator(`[data-testid="view-sidebar-view-actions-${title}"]`)
      .locator('.nc-view-copy-icon')
      .click();
    const submitAction = () =>
      this.rootPage.locator('.ant-modal-content').locator('button:has-text("Create View"):visible').click();
    await this.waitForResponse({
      httpMethodsToMatch: ['POST'],
      requestUrlPathToMatch: '/api/v1/db/meta/tables/',
      uiAction: submitAction,
    });
    // await this.verifyToast({ message: 'View created successfully' });
  }

  async changeViewIcon({ title, icon, iconDisplay }: { title: string; icon: string; iconDisplay?: string }) {
    await this.rootPage.waitForTimeout(1000);
    await this.get().locator(`[data-testid="view-sidebar-view-${title}"] .nc-view-icon`).click();

    await this.rootPage.locator('.emoji-mart-search').type(icon);
    const emojiList = this.rootPage.locator('[id="emoji-mart-list"]');
    await emojiList.locator('button').first().click();
    await expect(
      this.get()
        .locator(`[data-testid="view-sidebar-view-${title}"]`)
        .locator(`.nc-table-icon:has-text("${iconDisplay}")`)
    ).toHaveCount(1);
  }

  async verifyTabIcon({ title, icon }: { title: string; icon: string }) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await expect(
      this.rootPage.locator(
        `[data-testid="nc-tab-title"]:has-text("${title}") [data-testid="nc-tab-icon-emojione:${icon}"]`
      )
    ).toBeVisible();
  }

  async validateRoleAccess(param: { role: string }) {
    const count = param.role.toLowerCase() === 'creator' ? 1 : 0;
    await expect(this.createGridButton).toHaveCount(count);
    await expect(this.createGalleryButton).toHaveCount(count);
    await expect(this.createFormButton).toHaveCount(count);
    await expect(this.createKanbanButton).toHaveCount(count);

    // await this.openDeveloperTab({});
    // await expect(this.erdButton).toHaveCount(1);
    // await expect(this.apiSnippet).toHaveCount(1);
    // await expect(this.webhookButton).toHaveCount(count);
  }

  // async openDeveloperTab({ option }: { option?: string }) {
  //   await this.get().locator('.nc-tab').nth(1).click();
  //   if (option === 'ERD') {
  //     await this.get().locator('.nc-view-action-erd.button').click();
  //   } else if (option?.toLowerCase() === 'webhook') {
  //     await this.get().locator('.nc-view-sidebar-webhook').click();
  //   }
  // }
  //
  // async openViewsTab() {
  //   await this.get().locator(',nc-tab').nth(0).click();
  // }
}
