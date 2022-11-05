import { ColumnType, UITypes } from 'nocodb-sdk';
import Noco from '../Noco';
import { NcUpgraderCtx } from './NcUpgrader';
import { MetaTable } from '../utils/globals';
// import NcConnectionMgrv2 from '../utils/common/NcConnectionMgrv2';
import Project from '../models/Project';
import Storage from '../models/Storage';

export default async function (ctx: NcUpgraderCtx) {
  const ncMeta = ctx.ncMeta;
  await migrateAttachments(ncMeta);
}

async function migrateAttachments(ncMeta = Noco.ncMeta) {
  const attachmentColumns: (ColumnType & { project_id?: string })[] =
    await ncMeta.metaList2(null, null, MetaTable.COLUMNS, {
      condition: {
        uidt: UITypes.Attachment,
      },
    });
  const updateActions = [];
  for (const attachmentColumn of attachmentColumns) {
    const { column_name, project_id, fk_model_id } = attachmentColumn;
    updateActions.push(
      updateAttachement(ncMeta, project_id, fk_model_id, column_name)
    );
  }
  await Promise.all(updateActions);
}

async function updateAttachement(
  ncMeta = Noco.ncMeta,
  projectId: string,
  modelId: string,
  columnName: string
) {
  const project = await Project.getWithInfo(projectId, ncMeta);

  const base = project.bases[0];

  // TODO: handle attachment data in external dbs
  // const knex = NcConnectionMgrv2.get(base);

  const table = await ncMeta
    .knex(MetaTable.MODELS)
    .where({ id: modelId })
    .first();

  const primaryKeys = [];

  const columns: (ColumnType & { project_id?: string })[] = await ncMeta
    .knex(MetaTable.COLUMNS)
    .where({
      fk_model_id: modelId,
    });

  for (const column of columns) {
    if (column.pk) {
      primaryKeys.push(column.column_name);
    }
  }

  const data = (await ncMeta
    .knex(table.table_name)
    .select([columnName, ...primaryKeys])) as any;

  for (const row of data) {
    if (!row[columnName]) continue;
    const attachmentObjs = JSON.parse(row[columnName]);
    const updatedAttachmentObjs = await Promise.all(
      attachmentObjs.map(async (attachmentObj) => {
        const storage = await Storage.insert(
          {
            base_id: base.id,
            project_id: projectId,
            source: 'TODO',
            meta: JSON.stringify(attachmentObj),
          },
          ncMeta
        );
        return { storageId: storage.id, ...attachmentObj };
      })
    );
    const where = {};
    for (let i = 0; i < primaryKeys.length; i++) {
      where[primaryKeys[i]] = row[primaryKeys[i]];
    }
    await ncMeta
      .knex(table.table_name)
      .where(where)
      .update({ [columnName]: JSON.stringify(updatedAttachmentObjs) });
  }
}
