import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";
export declare type RouterState = Record<string, unknown> & {
    session: Session;
};
