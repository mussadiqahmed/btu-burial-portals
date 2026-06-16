import { PoolConnection } from 'mysql2/promise';

export interface DesignComponent {
  piece_type: string;
  quantity: number;
}

const PIECE_NAME_LIKE: Record<string, string[]> = {
  kerb_long: ['%Kerb%196%', '%Long Kerb%', '%long kerb%'],
  kerb_short: ['%Kerb%91%', '%Short Kerb%', '%short kerb%'],
  ledger: ['%Ledger%'],
  headstone_big: ['%Headstone%'],
  headstone_small: ['%Headstone%Small%', '%Small%Headstone%'],
  base_big: ['%Base%'],
  base_small: ['%Base%Small%', '%Small%Base%'],
  slab: ['%Slab%'],
  pillar: ['%Pillar%'],
  frame_short: ['%Frame%'],
  offcut: ['%Offcut%'],
};

function familyClause(materialFamily?: string): { sql: string; params: string[] } {
  if (!materialFamily) {
    return { sql: '', params: [] };
  }
  return {
    sql: ' AND (material_family = ? OR material_family IS NULL OR material_family = \'\')',
    params: [materialFamily],
  };
}

async function findInventoryByPieceType(
  connection: PoolConnection,
  pieceType: string,
  materialFamily?: string
): Promise<{ material_id: number; material_name: string; quantity: number } | null> {
  const family = familyClause(materialFamily);
  let query =
    'SELECT material_id, material_name, quantity FROM materials_inventory WHERE piece_type = ?' +
    family.sql +
    ' ORDER BY CASE WHEN material_family = ? THEN 0 ELSE 1 END, quantity DESC LIMIT 1';
    const params: any[] = [pieceType, ...family.params, materialFamily || ''];

  const [rows]: any = await connection.execute(query, params);
  if (rows.length > 0) {
    return rows[0];
  }

  const patterns = PIECE_NAME_LIKE[pieceType];
  if (!patterns) {
    return null;
  }

  for (const likePattern of patterns) {
    let nameQuery =
      'SELECT material_id, material_name, quantity FROM materials_inventory WHERE material_name LIKE ?' +
      family.sql;
    const nameParams: any[] = [likePattern, ...family.params];
    nameQuery += ' ORDER BY CASE WHEN material_family = ? THEN 0 ELSE 1 END, quantity DESC LIMIT 1';
    nameParams.push(materialFamily || '');

    const [nameRows]: any = await connection.execute(nameQuery, nameParams);
    if (nameRows.length > 0) {
      return nameRows[0];
    }
  }

  return null;
}

export async function resolveMaterialsFromDesign(
  connection: PoolConnection,
  designCode: string,
  materialFamily?: string
): Promise<Record<string, number>> {
  const [designs]: any = await connection.execute(
    'SELECT * FROM design_types WHERE code = ?',
    [designCode]
  );

  if (designs.length === 0) {
    throw new Error(`Design code "${designCode}" not found`);
  }

  const design = designs[0];
  const components: DesignComponent[] = typeof design.components === 'string'
    ? JSON.parse(design.components)
    : design.components || [];

  if (components.length === 0) {
    throw new Error(`Design "${designCode}" has no components defined`);
  }

  const materials: Record<string, number> = {};
  const missing: string[] = [];

  for (const comp of components) {
    const item = await findInventoryByPieceType(connection, comp.piece_type, materialFamily);

    if (!item) {
      missing.push(comp.piece_type);
      continue;
    }

    materials[item.material_name] = (materials[item.material_name] || 0) + comp.quantity;
  }

  if (missing.length > 0) {
    throw new Error(
      `No inventory item found for: ${missing.join(', ')}` +
      (materialFamily ? ` (material family: ${materialFamily})` : '') +
      '. Tag materials with piece_type in Inventory, or ensure names match (e.g. Kerb 196 = long kerb, Kerb 91 = short kerb, Ledger).'
    );
  }

  return materials;
}

export async function deductMaterials(
  connection: PoolConnection,
  materials: Record<string, number>
) {
  for (const [name, qty] of Object.entries(materials)) {
    const [updateResult]: any = await connection.execute(
      'UPDATE materials_inventory SET quantity = quantity - ? WHERE material_name = ? AND quantity >= ?',
      [qty, name, qty]
    );
    if (updateResult.affectedRows === 0) {
      const [stock]: any = await connection.execute(
        'SELECT quantity FROM materials_inventory WHERE material_name = ?',
        [name]
      );
      const available = stock[0]?.quantity ?? 0;
      throw new Error(
        `Insufficient stock for "${name}": need ${qty}, have ${available}. Update inventory quantities before creating this order.`
      );
    }
  }
}

export async function restoreMaterials(
  connection: PoolConnection,
  materials: Record<string, number>
) {
  for (const [name, qty] of Object.entries(materials)) {
    await connection.execute(
      'UPDATE materials_inventory SET quantity = quantity + ? WHERE material_name = ?',
      [qty, name]
    );
  }
}
