export type LabelField = {
  heading: string;
  value: string;
};

export type StudentRecord = {
  fields: LabelField[];
  sourceRow: number;
};
