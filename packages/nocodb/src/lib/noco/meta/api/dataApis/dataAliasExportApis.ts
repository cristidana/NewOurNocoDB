import { Request, Response, Router } from 'express';
import ncMetaAclMw from '../../helpers/ncMetaAclMw';
import {
  extractCsvData,
  getViewAndModelFromRequestByAliasOrId
} from './helpers';

async function csvDataExport(req: Request, res: Response) {
  const { view } = await getViewAndModelFromRequestByAliasOrId(req);

  const { offset, elapsed, data } = await extractCsvData(view, req);

  res.set({
    'Access-Control-Expose-Headers': 'nc-export-offset',
    'nc-export-offset': offset,
    'nc-export-elapsed-time': elapsed,
    'Content-Disposition': `attachment; filename="${view.title}-export.csv"`
  });
  res.send(data);
}

const router = Router({ mergeParams: true });

router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/export/csv',
  ncMetaAclMw(csvDataExport, 'csvDataExport')
);
router.get(
  '/api/v1/db/data/:orgs/:projectName/:tableName/views/:viewName/export/csv',
  ncMetaAclMw(csvDataExport, 'csvDataExport')
);

export default router;
