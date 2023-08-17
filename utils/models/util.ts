import { ResultSetHeader, RowDataPacket } from "npm:mysql2@3.6.0";
import { formatDBValue, hump, isEmptyObject, underline } from "../util.ts";
import { db } from "../../dbs/index.ts";

export class Model {
  constructor(table: string, fields: string[]) {
    this.table = table;
    this.fields = fields.concat(["created_at", "updated_at"]);
    this.query = queryFactory(this);
    this.deleteFn = deleteFactory(this);
    this.create = createFactory(this);
    this.update = updateFactory(this);
    this.getFields = getFieldsFactory(this);
  }
  table: string;
  fields: string[];
  query: ReturnType<typeof queryFactory>;
  deleteFn: ReturnType<typeof deleteFactory>;
  create: ReturnType<typeof createFactory>;
  getFields: ReturnType<typeof getFieldsFactory>;
  update: ReturnType<typeof updateFactory>;
}

function recordToArrays(fieldsAndValues: Record<string, any>) {
  const keys = Object.keys(fieldsAndValues).map((item) => underline(item)),
    values = Object.values(fieldsAndValues).map((item) => formatDBValue(item));
  return [keys, values];
}

export function queryFactory(model: Model) {
  async function query(
    fieldsAndValues: Record<string, any>,
    type: "include" | "exclude" = "include",
    fields = model.fields,
  ) {
    const selectFields = getFieldsFactory(model)(type, fields);
    if (isEmptyObject(fieldsAndValues)) {
      return await db.execute<RowDataPacket[]>(
        `select ${selectFields.join(",")} from ${model.table}`,
      );
    } else {
      const [keys, values] = recordToArrays(fieldsAndValues);
      return await db.execute<RowDataPacket[]>(
        `select ${selectFields.join(",") || "*"} from ${model.table} where ${
          keys.map((item) => item + " = ?").join(" and ")
        }`,
        values,
      );
    }
  }
  return query;
}

export function deleteFactory(model: Model) {
  async function deleteWithWhere(fieldsAndValues: Record<string, any>) {
    if (isEmptyObject(fieldsAndValues)) {
      throw new Error("查询条件不能为空");
    }
    const [keys, values] = recordToArrays(fieldsAndValues);
    return await db.execute<ResultSetHeader>(
      `
        delete from ${model.table} where ${
        keys.map((item) => item + " = ?").join(" and ")
      }
    `,
      values,
    );
  }

  return deleteWithWhere;
}

export function createFactory(model: Model) {
  async function create(fieldsAndValues: Record<string, any>) {
    const [keys, values] = recordToArrays(fieldsAndValues);
    return await db.execute<ResultSetHeader>(
      `
        insert into ${model.table} (${keys.join(", ")}) values (${
        keys.map((_) => "?").join(", ")
      })
    `,
      values,
    );
  }
  return create;
}

export function updateFactory(model: Model) {
  async function update(
    fieldsAndValues: Record<string, any>,
    wheres: Record<string, any>,
  ) {
    if (isEmptyObject(fieldsAndValues)) {
      throw new Error("查询条件不能为空");
    }
    const [keys, values] = recordToArrays(fieldsAndValues);
    const [whereKeys, whereValue] = recordToArrays(wheres);
    return await db.execute<ResultSetHeader>(
      `
          update ${model.table} set ${
        keys.map((item) => item + " = ?").join(", ") +
        " , updated_at = current_timestamp()"
      } where ${whereKeys.map((item) => item + " = ?").join(" and ")}
      `,
      values.concat(whereValue),
    );
  }
  return update;
}

export function getFieldsFactory(model: Model) {
  function fields(
    type: "include" | "exclude" = "include",
    fields = model.fields,
  ) {
    let selectFields = fields.map((item) => underline(item));
    if (type === "exclude") {
      selectFields = model.fields.filter((item) =>
        !selectFields.includes(item)
      );
    }
    return selectFields.map((item) =>
      `${model.table}.${item} as ${hump(item)}`
    );
  }
  return fields;
}
