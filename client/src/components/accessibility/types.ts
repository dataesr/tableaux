export type rgaa_tests_list_type = {
  thematiqueId: number;
  thematique: string;
  critereId: number;
  title: string;
  testId: number;
  description: string;
  status: "ok" | "fail" | "initial";
  comment?: string;
  date?: string;
}[];
