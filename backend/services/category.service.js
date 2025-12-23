import db from '../utils/db.js';

export function findAll() {
  return db('categories').orderBy('catid', 'asc');
}

export function add(entity) {
  return db('categories').insert(entity).returning('catid');
}

export function findById(id) {
  return db('categories').where('catid', id).first();
}

export function del(id) {
  return db('categories').where('catid', id).del();
}

export function patch(id, entity) {
  return db('categories').where('catid', id).update(entity);
}

// Return categories in a nested tree: parents with `children` array (2 levels)
// Optionally compute product counts per category (and aggregate child counts into parent)
export async function findTree(includeCounts = true) {
  // Detect if parent_id column exists
  const col = await db('information_schema.columns')
    .select('column_name')
    .where({ table_name: 'categories', column_name: 'parent_id' })
    .first();

  if (!col) {
    // parent_id not present: return flat list as parents with empty children
    const list = await db('categories').orderBy('catname');
    return list.map(c => ({ ...c, children: [], count: 0 }));
  }

  // Fetch parent categories (parent_id IS NULL) and children (parent_id NOT NULL)
  // Sort by catid for deterministic ordering
  const parents = await db('categories').select('catid', 'catname').whereNull('parent_id').orderBy('catid');
  const children = await db('categories').select('catid', 'catname', 'parent_id').whereNotNull('parent_id').orderBy('catid');

  // Compute product counts grouped by catid if requested
  const counts = {};
  if (includeCounts) {
    const rows = await db('products').select('catid').count('* as cnt').groupBy('catid');
    rows.forEach(r => { counts[r.catid] = Number(r.cnt); });
  }

  // Build map of parents and attach children
  const map = new Map();
  parents.forEach(p => map.set(p.catid, { catid: p.catid, catname: p.catname, children: [], count: counts[p.catid] || 0 }));

  // Attach children and aggregate counts
  children.forEach(c => {
    const node = { catid: c.catid, catname: c.catname, count: counts[c.catid] || 0 };
    const parentNode = map.get(c.parent_id);
    if (parentNode) {
      parentNode.children.push(node);
      parentNode.count = (parentNode.count || 0) + node.count;
    } else {
      // orphan child: treat as top-level if its parent not found
      map.set(node.catid, { ...node, children: [] });
    }
  });

  // Sort children arrays by catid and return parents sorted by catid
  Array.from(map.values()).forEach(p => {
    if (p.children && p.children.length) {
      p.children.sort((a, b) => (a.catid - b.catid));
    }
  });

  return Array.from(map.values()).sort((a, b) => (a.catid - b.catid));
}