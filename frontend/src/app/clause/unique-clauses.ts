import { Pipe, PipeTransform } from '@angular/core';
import { Clause } from '../core/clause';

@Pipe({
  name: 'uniqueClauses',
  standalone: true,
  pure: true
})
export class UniqueClausesPipe implements PipeTransform {
  transform(clauses: Clause[] | undefined): Clause[] {
    if (!clauses || clauses.length === 0) return [];
    
    const seen = new Set<string>();

    return clauses.filter(clause => {
      const code = clause.clauseType?.code;
      
      if (!code || seen.has(code)) return false;
      seen.add(code);

      return true;
    });
  }
}