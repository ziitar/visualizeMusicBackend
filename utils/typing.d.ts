declare type TupleToUnion<T extends any[]> = T extends [infer F, ...infer R]
  ? F | TupleToUnion<R>
  : never;
