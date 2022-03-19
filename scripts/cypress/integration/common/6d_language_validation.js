const { mainPage } = require("../../support/page_objects/mainPage");
const { loginPage } = require("../../support/page_objects/navigation");
const { roles } = require("../../support/page_objects/projectConstants");
import { isTestSuiteActive } from "../../support/page_objects/projectConstants";

export const genTest = (apiType, dbType) => {
    if (!isTestSuiteActive(apiType, dbType)) return;
    describe(`Language support`, () => {
        before(() => {
            //loginPage.signIn(roles.owner.credentials)
            mainPage.toolBarTopLeft(mainPage.HOME).click();
            cy.screenshot("Debug 6d-1", { overwrite: true });
        });

        const langVerification = (idx, lang) => {
            // pick json from the file specified
            it(`Language verification: ${lang} > Projects page`, () => {
                let json = require(`../../../../packages/nc-gui/lang/${lang}`);

                // toggle menu as per index
                cy.get(".nc-menu-translate").click();

                cy.snipActiveMenu("Menu_Translation");

                cy.getActiveMenu().find(".v-list-item").eq(idx).click();

                cy.screenshot("Debug 6d-2", { overwrite: true });

                // basic validations
                // 1. Page title: "My Projects"
                // 2. Button: "New Project"
                // 3. Search box palceholder text: "Search Projects"
                // cy.get("b").contains(json.title.myProject).should("exist");
                cy.get(".nc-project-page-title")
                    .contains(json.title.myProject)
                    .should("exist");
                cy.get(".nc-new-project-menu")
                    .contains(json.title.newProj)
                    .should("exist");
                cy.get(`[placeholder="${json.activity.searchProject}"]`).should(
                    "exist"
                );
            });
        };

        // Index is the order in which menu options appear
        langVerification(0, "da.json");
        langVerification(1, "de.json");
        langVerification(2, "en.json");
        langVerification(3, "es.json");
        langVerification(4, "fa.json");
        langVerification(5, "fi.json");
        langVerification(6, "fr.json");
        langVerification(7, "hr.json");
        langVerification(8, "id.json");
        langVerification(9, "it_IT.json");
        langVerification(10, "iw.json");
        langVerification(11, "ja.json");
        langVerification(12, "ko.json");
        langVerification(13, "lv.json");
        langVerification(14, "nl.json");
        langVerification(15, "no.json");
        langVerification(16, "pt_BR.json");
        langVerification(17, "ru.json");
        langVerification(18, "sl.json");
        langVerification(19, "sv.json");
        langVerification(20, "th.json");
        langVerification(21, "uk.json");
        langVerification(22, "vi.json");
        langVerification(23, "zh_CN.json");
        langVerification(24, "zh_HK.json");
        langVerification(25, "zh_TW.json");
    });
};

/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Raju Udava <sivadstala@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
