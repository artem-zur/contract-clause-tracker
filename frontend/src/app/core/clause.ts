export enum ClauseTypeCode {
  LimitationOfLiability = 'LIMITATION_OF_LIABILITY',
  TerminationForConvenience = 'TERMINATION_FOR_CONVENIENCE',
  NonCompete = 'NON_COMPETE'
}

export interface ClauseType {
  id: string;
  name: string;
  code: ClauseTypeCode;
}

export interface Clause {
  id: string;
  contractId: string;     
  clauseTypeId: string;   
  startIndex: number;     
  endIndex: number;       
  textSnippet: string;    
  clauseType?: ClauseType;
}