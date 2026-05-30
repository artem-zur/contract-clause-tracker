import { Pipe, PipeTransform } from '@angular/core';
import { ClauseTypeCode } from '../core/clause';

const CLAUSE_STYLE_MAP: Record<ClauseTypeCode | 'default', string> = {
  [ClauseTypeCode.LimitationOfLiability]: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  [ClauseTypeCode.TerminationForConvenience]: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  [ClauseTypeCode.NonCompete]: 'bg-teal-50 text-teal-700 ring-teal-600/10',
  'default': 'bg-slate-50 text-slate-700 ring-slate-600/10'
};

@Pipe({
  name: 'clauseStyle',
  standalone: true,
  pure: true
})
export class ClauseStylePipe implements PipeTransform {
  transform(code: string | undefined): string {
    if (!code) return CLAUSE_STYLE_MAP['default'];

    return CLAUSE_STYLE_MAP[code as ClauseTypeCode] || CLAUSE_STYLE_MAP['default'];
  }
}