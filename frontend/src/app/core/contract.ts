import { Clause } from "./clause";

export interface Contract {
  id: string;
  title: string;
  text: string;
  clauses: Clause[];
}